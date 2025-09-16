"""
사용자 프로필 벡터 생성 및 관리 서비스
GPT_recommend.md의 증분 갱신 공식 구현
"""

import logging
import numpy as np
from typing import Dict, List, Optional
from ..core.database import get_database, get_collection_name, get_url_hash
from ..vectorization.embeddings import embedding_service
from ..vectorization.qdrant_client import QdrantService

logger = logging.getLogger(__name__)


class UserProfileService:
    """사용자 프로필 벡터 생성 및 관리"""

    def __init__(self):
        self.qdrant_service = QdrantService()

    def _calculate_weight(self, data: dict) -> float:
        """사용자 행동 기반 가중치 계산 (visitCount 가중가중치 문제 해결)"""
        base_weight = 1.0

        # 체류시간 기반 가중치 (30초 이상이면 가중치 증가)
        time_spent = data.get('timeSpent', 0)
        if time_spent > 30:
            base_weight += min((time_spent - 30) / 60, 2.0)  # 최대 3.0

        # 스크롤 깊이 기반 가중치 (50% 이상이면 가중치 증가)
        scroll_depth = data.get('maxScrollDepth', 0)
        if scroll_depth > 50:
            base_weight += (scroll_depth - 50) / 100  # 최대 0.5 추가

        # visitCount는 메타데이터로만 저장, 가중치 계산에서 제외 (가중가중치 문제 방지)
        # 대신 히스토리 데이터의 경우 typedCount 비율을 활용
        if data.get('dataSource') == 'history':
            typed_count = data.get('typedCount', 0)
            visit_count = data.get('visitCount', 1)
            typed_ratio = typed_count / max(visit_count, 1)

            if typed_ratio > 0.3:  # 30% 이상 직접 타이핑
                base_weight += 0.5  # 의도성 보너스

        return round(base_weight, 3)

    def _prepare_text_for_embedding(self, data: dict) -> str:
        """브라우징/히스토리 데이터에서 임베딩용 텍스트 추출"""
        combined_text = ""

        if 'content' in data:
            content = data['content']
            clean_title = content.get('cleanTitle', '').strip()
            clean_content = content.get('cleanContent', '')[:1500].strip()

            if clean_title and clean_content:
                combined_text = f"{clean_title} {clean_content}"
            elif clean_title:
                combined_text = clean_title
            elif clean_content:
                combined_text = clean_content

        return combined_text.strip()

    async def create_initial_profile_from_history(self, user_id: str, limit: int = 500) -> Dict:
        """히스토리 데이터로부터 초기 user_profile 생성"""
        logger.info(f"[프로필 생성] 사용자 {user_id}의 초기 프로필 생성 시작")

        try:
            # MongoDB에서 히스토리 데이터 조회
            database = get_database()
            collection_name = get_collection_name(user_id, 'history')
            collection = database[collection_name]

            logger.info(f"[데이터 조회] 샤드 {collection_name}에서 최대 {limit}개 조회")
            cursor = collection.find({"userId": user_id}).sort("savedAt", -1).limit(limit)
            history_data = await cursor.to_list(length=limit)

            if not history_data:
                return {"success": False, "message": "히스토리 데이터가 없습니다."}

            logger.info(f"[데이터 수집] {len(history_data)}개 히스토리 데이터 수집")

            # 텍스트 추출 및 임베딩 생성
            texts_for_embedding = []
            weights = []
            valid_data = []

            for data in history_data:
                combined_text = self._prepare_text_for_embedding(data)

                if combined_text.strip() and len(combined_text.strip()) > 20:  # 최소 길이 체크
                    texts_for_embedding.append(combined_text)
                    weights.append(self._calculate_weight(data))
                    valid_data.append(data)

            if not texts_for_embedding:
                return {"success": False, "message": "임베딩 가능한 히스토리 데이터가 없습니다."}

            logger.info(f"[임베딩 생성] {len(texts_for_embedding)}개 텍스트 임베딩 시작")

            # 배치 임베딩 생성
            vectors = await embedding_service.encode_batch(texts_for_embedding)

            # GPT_recommend.md 증분 공식: 가중평균으로 프로필 벡터 계산
            profile_vector, total_weight = self._calculate_weighted_average(vectors, weights)

            # user_logs 컬렉션에 개별 로그 저장 (URL 해시 기반)
            await self._save_user_logs_to_qdrant(user_id, valid_data, vectors, weights)

            # user_profiles 컬렉션에 프로필 벡터 저장
            await self._save_user_profile_to_qdrant(user_id, profile_vector, total_weight, len(vectors), weights)

            logger.info(f"[완료] 사용자 {user_id} 프로필 생성 완료 - 총 가중치: {total_weight}")

            return {
                "success": True,
                "message": "초기 사용자 프로필 생성 완료",
                "user_id": user_id,
                "processed_count": len(vectors),
                "total_weight": total_weight,
                "profile_vector_dim": len(profile_vector)
            }

        except Exception as e:
            logger.error(f"[에러] 프로필 생성 실패: {e}")
            return {"success": False, "message": f"프로필 생성 실패: {str(e)}"}

    def _calculate_weighted_average(self, vectors: List[List[float]], weights: List[float]) -> tuple:
        """가중평균으로 프로필 벡터 계산"""
        vectors_array = np.array(vectors)
        weights_array = np.array(weights)

        # 가중평균: (v1*w1 + v2*w2 + ...) / (w1 + w2 + ...)
        weighted_sum = np.sum(vectors_array * weights_array.reshape(-1, 1), axis=0)
        total_weight = np.sum(weights_array)

        profile_vector = weighted_sum / total_weight

        # L2 정규화
        profile_vector = profile_vector / np.linalg.norm(profile_vector)

        return profile_vector.tolist(), float(total_weight)

    async def _save_user_logs_to_qdrant(self, user_id: str, data_list: List[Dict], vectors: List[List[float]], weights: List[float]):
        """user_logs 컬렉션에 개별 로그 벡터 저장 (URL 해시 기반)"""
        try:
            collection_name = "user_logs"

            # 메타데이터 생성
            metadatas = []
            point_ids = []

            for i, (data, weight) in enumerate(zip(data_list, weights)):
                url = data.get('url', '')
                url_hash = get_url_hash(url)

                metadata = {
                    "user_id": user_id,
                    "url": url,
                    "url_hash": url_hash,
                    "weight": weight,  # 가중치는 메타데이터에 저장
                    "domain": data.get('domain', ''),
                    "title": data.get('content', {}).get('cleanTitle', ''),
                    "data_source": data.get('dataType', 'history'),
                    "visit_count": data.get('visitCount', 1),
                    "saved_at": data.get('savedAt')
                }

                # 히스토리 특화 필드 추가
                if data.get('dataType') == 'history':
                    metadata.update({
                        "typed_count": data.get('typedCount', 0),
                        "total_visits": data.get('totalVisits', 0),
                        "direct_visits": data.get('directVisits', 0),
                        "last_visit_time": data.get('lastVisitTime')
                    })

                metadatas.append(metadata)
                point_ids.append(f"{user_id}:url:{url_hash}")

            # Qdrant에 저장 (URL 해시 기반 Upsert)
            await self.qdrant_service.save_vectors_with_metadata_and_ids(
                collection_name, vectors, metadatas, point_ids
            )

            logger.info(f"[저장] user_logs 컬렉션에 {len(vectors)}개 벡터 저장 완료")

        except Exception as e:
            logger.error(f"[에러] user_logs 저장 실패: {e}")
            raise

    async def _save_user_profile_to_qdrant(self, user_id: str, profile_vector: List[float], total_weight: float, log_count: int, weights: List[float]):
        """user_profiles 컬렉션에 프로필 벡터 저장"""
        try:
            collection_name = "user_profiles"

            # 통계 계산
            avg_weight = total_weight / log_count if log_count > 0 else 0.0
            max_weight = max(weights) if weights else 0.0
            min_weight = min(weights) if weights else 0.0

            metadata = {
                "user_id": user_id,
                "weight_sum": total_weight,  # GPT_recommend.md의 W_old
                "log_count": log_count,              # 반영된 로그 개수
                "avg_weight": round(avg_weight, 3),   # 평균 가중치
                "max_weight": max_weight,            # 최대 가중치
                "min_weight": min_weight,            # 최소 가중치
                "created_from": "history_data"
            }

            # point_id는 user_id 자체 사용
            await self.qdrant_service.save_vectors_with_metadata_and_ids(
                collection_name, [profile_vector], [metadata], [user_id]
            )

            logger.info(f"[저장] user_profiles 컬렉션에 {user_id} 프로필 저장 완료")

        except Exception as e:
            logger.error(f"[에러] user_profiles 저장 실패: {e}")
            raise

    async def update_profile_with_new_log(self, user_id: str, new_data: Dict) -> Dict:
        """새로운 브라우징 로그로 프로필 증분 업데이트 (GPT_recommend.md 공식)"""
        logger.info(f"[프로필 업데이트] 사용자 {user_id} 증분 업데이트 시작")

        try:
            # 새 로그 벡터화
            combined_text = self._prepare_text_for_embedding(new_data)
            if not combined_text.strip():
                return {"success": False, "message": "임베딩 가능한 텍스트가 없습니다."}

            v_new = await embedding_service.encode(combined_text)
            w_new = self._calculate_weight(new_data)

            # 기존 프로필 벡터 가져오기
            old_profile = await self.qdrant_service.get_point("user_profiles", user_id)

            if not old_profile:
                # 프로필이 없으면 새로 생성
                return await self.create_initial_profile_from_history(user_id)

            V_old = old_profile["vector"]
            W_old = old_profile["payload"]["weight_sum"]

            # GPT_recommend.md 증분 공식: V_new = (V_old * W_old + v_new * w_new) / (W_old + w_new)
            V_old_array = np.array(V_old)
            v_new_array = np.array(v_new)

            V_new = (V_old_array * W_old + v_new_array * w_new) / (W_old + w_new)
            V_new = V_new / np.linalg.norm(V_new)  # L2 정규화

            # user_logs에 새 로그 저장 (URL 해시 기반)
            url = new_data.get('url', '')
            url_hash = get_url_hash(url)
            point_id = f"{user_id}:url:{url_hash}"

            metadata = {
                "user_id": user_id,
                "url": url,
                "url_hash": url_hash,
                "weight": w_new,
                "domain": new_data.get('domain', ''),
                "title": new_data.get('content', {}).get('cleanTitle', ''),
                "data_source": new_data.get('dataType', 'browsing'),
                "visit_count": new_data.get('visitCount', 1),
                "saved_at": new_data.get('savedAt')
            }

            await self.qdrant_service.save_vectors_with_metadata_and_ids(
                "user_logs", [v_new], [metadata], [point_id]
            )

            # 기존 통계 정보 가져오기
            old_log_count = old_profile["payload"].get("log_count", 0)
            old_avg_weight = old_profile["payload"].get("avg_weight", 0.0)
            old_max_weight = old_profile["payload"].get("max_weight", 0.0)
            old_min_weight = old_profile["payload"].get("min_weight", 0.0)

            # 새로운 통계 계산
            new_log_count = old_log_count + 1
            new_weight_sum = W_old + w_new
            new_avg_weight = new_weight_sum / new_log_count
            new_max_weight = max(old_max_weight, w_new)
            new_min_weight = min(old_min_weight, w_new) if old_min_weight > 0 else w_new

            # user_profiles 업데이트
            updated_metadata = {
                "user_id": user_id,
                "weight_sum": new_weight_sum,  # GPT_recommend.md의 W_old + w_new
                "log_count": new_log_count,
                "avg_weight": round(new_avg_weight, 3),
                "max_weight": new_max_weight,
                "min_weight": new_min_weight,
                "created_from": old_profile["payload"].get("created_from", "history_data"),
                "last_update": new_data.get('savedAt')
            }

            await self.qdrant_service.save_vectors_with_metadata_and_ids(
                "user_profiles", [V_new.tolist()], [updated_metadata], [user_id]
            )

            logger.info(f"[완료] 프로필 증분 업데이트 완료 - 새 가중치: {W_old + w_new}")

            return {
                "success": True,
                "message": "프로필 증분 업데이트 완료",
                "user_id": user_id,
                "old_weight": W_old,
                "new_weight": w_new,
                "total_weight": W_old + w_new
            }

        except Exception as e:
            logger.error(f"[에러] 프로필 업데이트 실패: {e}")
            return {"success": False, "message": f"프로필 업데이트 실패: {str(e)}"}


# 전역 싱글톤
_profile_service = None

def get_profile_service() -> UserProfileService:
    """프로필 서비스 싱글톤 인스턴스 반환"""
    global _profile_service
    if _profile_service is None:
        _profile_service = UserProfileService()
    return _profile_service