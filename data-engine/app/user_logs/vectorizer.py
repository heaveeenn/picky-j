"""
사용자 로그 벡터화 모듈
브라우징 데이터를 벡터화하여 사용자 관심사 파악
"""

import uuid
from ..core.database import get_database, get_collection_name, get_url_hash
from ..vectorization.embeddings import embedding_service
from ..vectorization.qdrant_client import QdrantService


class UserLogsVectorizer:
    """사용자 로그 벡터화 서비스"""
    
    def __init__(self):
        self.qdrant_service = QdrantService()
    
    def _prepare_text_for_embedding(self, data: dict) -> str:
        """브라우징 데이터에서 임베딩용 텍스트 추출"""
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
    
    async def vectorize(self, user_id: str, limit: int = 5) -> dict:
        """사용자 브라우징 데이터를 벡터화하여 반환"""
        print(f"[진행중] 사용자 {user_id}의 브라우징 데이터 벡터화 시작...")
        
        # MongoDB에서 사용자 데이터 조회
        database = get_database()
        collection_name = get_collection_name(user_id, 'browsing')
        collection = database[collection_name]
        
        print(f"[정보] 사용자 {user_id}의 샤드 {collection_name}에서 조회")
        cursor = collection.find({"userId": user_id}).sort("savedAt", -1).limit(limit)
        recent_data = await cursor.to_list(length=limit)
        
        if not recent_data:
            print("[실패] 브라우징 데이터가 없습니다.")
            return {"success": False, "message": "브라우징 데이터가 없습니다."}
        
        print(f"[성공] {len(recent_data)}개 데이터 조회 완료")
        
        # 벡터화 결과 생성
        vectorization_results = []
        
        for data in recent_data:
            combined_text = self._prepare_text_for_embedding(data)
            
            if not combined_text.strip():
                continue
            
            # 임베딩 생성
            try:
                vector = await embedding_service.encode(combined_text)
                
                # 벡터화 결과 구성
                vectorization_result = {
                    "vector": vector,
                    "metadata": {
                        "user_id": user_id,
                        "url": data.get('url'),
                        "domain": data.get('domain'),
                        "title": data.get('content', {}).get('cleanTitle', ''),
                        "word_count": data.get('content', {}).get('wordCount', 0),
                        "time_spent": data.get('timeSpent', 0),
                        "scroll_depth": data.get('maxScrollDepth', 0),
                        "saved_at": data.get('savedAt'),
                        "weight": self._calculate_weight(data)
                    }
                }
                
                vectorization_results.append(vectorization_result)
                
                print(f"[벡터화] URL: {data.get('url', 'N/A')}")
                print(f"   벡터 차원: {len(vector)}")
                print(f"   가중치: {vectorization_result['metadata']['weight']:.3f}")
                
            except Exception as e:
                print(f"[에러] 벡터화 실패: {e}")
                continue
        
        if not vectorization_results:
            return {"success": False, "message": "벡터화 가능한 데이터가 없습니다."}
        
        # Qdrant에 저장
        await self._save_to_qdrant(vectorization_results)
        
        return {
            "success": True,
            "message": "사용자 로그 벡터화 완료",
            "vectorized_count": len(vectorization_results),
            "user_id": user_id,
            "results": vectorization_results
        }
    
    def _calculate_weight(self, data: dict) -> float:
        """사용자 행동 기반 가중치 계산"""
        base_weight = 1.0
        
        # 체류시간 기반 가중치 (30초 이상이면 가중치 증가)
        time_spent = data.get('timeSpent', 0)
        if time_spent > 30:
            base_weight += min((time_spent - 30) / 60, 2.0)  # 최대 3.0
        
        # 스크롤 깊이 기반 가중치 (50% 이상이면 가중치 증가)
        scroll_depth = data.get('maxScrollDepth', 0)
        if scroll_depth > 50:
            base_weight += (scroll_depth - 50) / 100  # 최대 0.5 추가
        
        return round(base_weight, 3)
    
    async def _save_to_qdrant(self, vectorization_results: list):
        """Qdrant에 사용자 로그 벡터 저장 (URL 해시 기반 Upsert)"""
        try:
            collection_name = "user_logs"

            # 벡터, 메타데이터, Point ID 분리
            vectors = []
            metadatas = []
            point_ids = []

            for result in vectorization_results:
                vector = result["vector"]
                metadata = result["metadata"]

                # URL 해시 기반 Point ID 생성 (GPT_recommend.md 방식)
                url = metadata.get("url", "")
                url_hash = get_url_hash(url)
                user_id = metadata.get("user_id", "")
                point_id = str(uuid.uuid4())  # UUID로 고유 ID 생성

                # 메타데이터에 URL 해시 추가
                metadata["url_hash"] = url_hash
                metadata["data_source"] = "browsing"  # GPT_recommend.md 스키마

                vectors.append(vector)
                metadatas.append(metadata)
                point_ids.append(point_id)

            # Qdrant에 Upsert 저장 (같은 URL이면 업데이트)
            await self.qdrant_service.save_vectors_with_metadata_and_ids(
                collection_name, vectors, metadatas, point_ids
            )

            print(f"[저장완료] Qdrant 컬렉션 '{collection_name}'에 {len(vectors)}개 벡터 Upsert 저장")

        except Exception as e:
            print(f"[저장실패] Qdrant 저장 실패: {e}")
            raise