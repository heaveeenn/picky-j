"""
데이터 수집 관련 비즈니스 로직
"""

from typing import Dict, Any
from datetime import datetime
from ..core.database import get_database, get_collection_name
from .models import BrowsingData, HistoryData


class BrowsingDataService:
    """브라우징 데이터 서비스"""
    
    @staticmethod
    async def save_browsing_data(data: BrowsingData) -> Dict[str, Any]:
        """브라우징 데이터 저장"""
        try:
            database = get_database()
            
            # 사용자 기반 샤드된 컬렉션에 저장
            collection_name = get_collection_name(data.userId, 'browsing')
            collection = database[collection_name]
            
            # 동일 URL의 마지막 방문 기록 조회 (성능 최적화를 위한 projection 사용)
            last_visit = await collection.find_one(
                {"userId": data.userId, "url": data.url},
                {"visitCount": 1},  # visitCount 필드만 조회
                sort=[("savedAt", -1)]
            )
            
            # 방문 횟수 계산
            visit_count = last_visit["visitCount"] + 1 if last_visit else 1
            
            # Extension에서 받은 데이터 + 서버 메타데이터 추가
            save_data = data.dict()
            save_data["visitCount"] = visit_count
            save_data["savedAt"] = datetime.utcnow().isoformat()
            save_data["dataVersion"] = "2.0"
            save_data["dataType"] = "browsing"  # 데이터 타입 구분
            
            result = await collection.insert_one(save_data)
            
            print(f"📊 [BROWSING] 데이터 저장: {data.domain} ({data.timeSpent}초 체류, {data.content.wordCount}단어) - 사용자: {data.userId} - 컬렉션: {collection_name} - 방문횟수: {visit_count}")
            
            return {
                "success": True,
                "id": str(result.inserted_id),
                "collection": collection_name,
                "visitCount": visit_count,
                "message": "데이터 저장 완료"
            }
            
        except Exception as e:
            print(f"❌저장 실패: {e}")
            raise Exception(f"저장 실패: {str(e)}")


class HistoryDataService:
    """히스토리 데이터 서비스"""
    
    @staticmethod
    async def save_history_data(data: HistoryData) -> Dict[str, Any]:
        """히스토리 데이터 저장 (샤딩 적용)"""
        try:
            database = get_database()
            
            # 사용자 기반 샤드된 히스토리 컬렉션에 저장
            collection_name = get_collection_name(data.userId, 'history')
            collection = database[collection_name]
            
            # 기존 히스토리 데이터 삭제 (초기 벡터 생성용이므로 최신 데이터만 유지)
            await collection.delete_many({"userId": data.userId})
            print(f"🗑️ 기존 히스토리 데이터 삭제: {data.userId}")
            
            # 각 히스토리 아이템을 개별 문서로 저장
            documents = []
            for item in data.items:
                doc = {
                    "userId": data.userId,
                    "url": item.url,
                    "title": item.title,
                    "visitCount": item.visitCount,
                    "typedCount": item.typedCount,
                    "lastVisitTime": item.lastVisitTime,
                    "visitMethods": item.visitMethods,
                    "totalVisits": item.totalVisits,
                    "directVisits": item.directVisits,
                    
                    # 추출된 콘텐츠
                    "extractedContent": item.content.dict() if item.content else None,
                    
                    # 메타 정보
                    "collectionInfo": {
                        "totalItems": data.totalItems,
                        "collectedAt": data.collectedAt,
                        "timeRange": data.timeRange
                    },
                    
                    # 서버 메타데이터
                    "savedAt": datetime.utcnow().isoformat(),
                    "dataVersion": "1.0",
                    "dataType": "history"
                }
                documents.append(doc)
            
            # 배치 삽입
            if documents:
                result = await collection.insert_many(documents)
                inserted_count = len(result.inserted_ids)
            else:
                inserted_count = 0
            
            print(f"📚 [HISTORY] 데이터 저장: {inserted_count}개 아이템 - 사용자: {data.userId} - 컬렉션: {collection_name}")
            
            return {
                "success": True,
                "collection": collection_name,
                "insertedCount": inserted_count,
                "totalAttempted": data.totalItems,
                "successRate": f"{(inserted_count / data.totalItems * 100):.1f}%" if data.totalItems > 0 else "0%",
                "message": f"히스토리 데이터 {inserted_count}개 저장 완료"
            }
            
        except Exception as e:
            print(f"❌히스토리 저장 실패: {e}")
            raise Exception(f"히스토리 저장 실패: {str(e)}")
    
    
    @staticmethod
    async def get_user_data(user_id: str, limit: int = 50) -> Dict[str, Any]:
        """사용자별 브라우징 데이터 조회"""
        try:
            database = get_database()
            collection_name = get_collection_name(user_id, 'browsing')
            collection = database[collection_name]
            
            # 사용자별 데이터 조회
            cursor = collection.find(
                {"userId": user_id}
            ).sort("savedAt", -1).limit(limit)
            
            data_list = await cursor.to_list(length=limit)
            
            # ObjectId를 문자열로 변환
            for item in data_list:
                item["_id"] = str(item["_id"])
            
            return {
                "success": True,
                "userId": user_id,
                "count": len(data_list),
                "data": data_list
            }
            
        except Exception as e:
            print(f"❌ 데이터 조회 실패: {e}")
            raise Exception(f"데이터 조회 실패: {str(e)}")