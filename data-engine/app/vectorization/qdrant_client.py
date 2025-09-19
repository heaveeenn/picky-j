"""
Qdrant 벡터 데이터베이스 클라이언트
벡터 저장 및 검색 기능
"""

from datetime import datetime
from qdrant_client import QdrantClient
from qdrant_client.http import models
from ..core.config import settings


class QdrantService:
    """Qdrant 벡터 저장소 서비스"""
    
    def __init__(self):
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT
        )
    
    def create_collection_if_not_exists(self, collection_name: str, vector_size: int):
        """컬렉션이 없으면 생성"""
        try:
            # 먼저 컬렉션 존재 여부 확인
            collections = self.client.get_collections()
            existing_collections = [col.name for col in collections.collections]

            if collection_name in existing_collections:
                return  # 이미 존재하므로 생성하지 않음

            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size,  # 벡터 차원
                    distance=models.Distance.COSINE
                )
            )
            print(f"[성공] Qdrant 컬렉션 '{collection_name}' 생성")
        except Exception as e:
            print(f"[정보] 컬렉션 생성 실패: {e}")
    
    async def save_vectors(self, collection_name: str, data_list: list, vectors: list[list[float]]):
        """브라우징 데이터용 벡터를 Qdrant에 저장 (하위호환성 유지)"""
        print(f"\n[진행중] 브라우징 벡터를 Qdrant에 저장 중... (컬렉션: {collection_name})")
        
        if not vectors:
            print("[경고] 저장할 벡터가 없습니다.")
            return
        
        # 컬렉션 생성 (이미 있으면 스킵)
        self.create_collection_if_not_exists(collection_name, len(vectors[0]))
        
        # 벡터 및 메타데이터 업로드
        points = []
        for i, (data, vector) in enumerate(zip(data_list, vectors)):
            payload = self._create_payload_from_data(data)
            
            point = models.PointStruct(
                id=i + 1,  # 또는 data.get("_id") 사용
                vector=vector,
                payload=payload
            )
            points.append(point)
        
        # Qdrant에 업로드
        self.client.upsert(collection_name=collection_name, points=points)
        
        print(f"[성공] 총 {len(vectors)}개 벡터를 Qdrant에 저장 완료!")
        
        # 저장된 벡터 개수 확인
        collection_info = self.client.get_collection(collection_name)
        print(f"[정보] Qdrant 컬렉션 정보: {collection_info.points_count}개 벡터 저장됨")
    
    async def save_vectors_with_metadata(self, collection_name: str, vectors: list[list[float]], metadatas: list[dict]):
        """도메인별 벡터를 메타데이터와 함께 Qdrant에 저장"""
        print(f"\n[진행중] 벡터를 Qdrant에 저장 중... (컬렉션: {collection_name})")
        
        if not vectors or not metadatas:
            print("[경고] 저장할 벡터나 메타데이터가 없습니다.")
            return
        
        if len(vectors) != len(metadatas):
            raise ValueError("벡터와 메타데이터의 개수가 일치하지 않습니다.")
        
        # 컬렉션 생성 (이미 있으면 스킵)
        self.create_collection_if_not_exists(collection_name, len(vectors[0]))
        
        # 벡터 및 메타데이터 업로드
        points = []
        for i, (vector, metadata) in enumerate(zip(vectors, metadatas)):
            # 공통 메타데이터 추가
            payload = {
                **metadata,
                "created_at": datetime.utcnow().isoformat(),
                "embedding_model": "gms-text-embedding-3-small",
                "collection": collection_name
            }
            
            point = models.PointStruct(
                id=i + int(datetime.utcnow().timestamp() * 1000),  # 유니크한 ID 생성
                vector=vector,
                payload=payload
            )
            points.append(point)
        
        # Qdrant에 업로드
        self.client.upsert(collection_name=collection_name, points=points)
        
        print(f"[성공] 총 {len(vectors)}개 벡터를 Qdrant 컬렉션 '{collection_name}'에 저장 완료!")
        
        # 저장된 벡터 개수 확인
        collection_info = self.client.get_collection(collection_name)
        print(f"[정보] Qdrant 컬렉션 정보: {collection_info.points_count}개 벡터 저장됨")
    
    def _create_payload_from_data(self, data: dict) -> dict:
        """브라우징 데이터에서 Qdrant payload 생성"""
        return {
            "browsing_data_id": str(data.get("_id")),
            "url": data.get("url"),
            "title": data.get("title"),
            "domain": data.get("domain"),
            "data_version": data.get("dataVersion", "2.0"),
            "created_at": datetime.utcnow().isoformat(),
            "embedding_model": "gms-text-embedding-3-small",
            
            # 기본 필드들
            "time_category": data.get("timeCategory"),
            "day_of_week": data.get("dayOfWeek"),
            "user_id": data.get("userId"),
            
            # 콘텐츠 정보
            "word_count": data.get("content", {}).get("wordCount"),
            "clean_title": data.get("content", {}).get("cleanTitle"),
            "excerpt": data.get("content", {}).get("excerpt"),
            "language": data.get("content", {}).get("language"),
            "extraction_method": data.get("content", {}).get("extractionMethod"),
            
            # 행동 데이터 (체류시간 사용)
            "time_spent": data.get("timeSpent"),  # 체류시간
            "max_scroll_depth": data.get("maxScrollDepth"),
            "visit_count": data.get("visitCount"),
            "data_type": data.get("dataType"),  # 'browsing' 구분
            
            # 시간 정보
            "timestamp": data.get("timestamp"),
            "timestamp_formatted": data.get("timestampFormatted"),
        }
    
    async def save_vectors_with_metadata_and_ids(self, collection_name: str, vectors: list[list[float]], metadatas: list[dict], point_ids: list[str]):
        """특정 ID로 벡터를 메타데이터와 함께 Qdrant에 저장"""
        print(f"\n[진행중] 벡터를 Qdrant에 저장 중... (컬렉션: {collection_name}, ID 지정)")

        if not vectors or not metadatas or not point_ids:
            print("[경고] 저장할 벡터, 메타데이터 또는 ID가 없습니다.")
            return

        if len(vectors) != len(metadatas) != len(point_ids):
            raise ValueError("벡터, 메타데이터, ID의 개수가 일치하지 않습니다.")

        # 컬렉션 생성 (이미 있으면 스킵)
        self.create_collection_if_not_exists(collection_name, len(vectors[0]))

        # 벡터 및 메타데이터 업로드
        points = []
        for vector, metadata, point_id in zip(vectors, metadatas, point_ids):
            # 공통 메타데이터 추가
            payload = {
                **metadata,
                "created_at": datetime.utcnow().isoformat(),
                "embedding_model": "gms-text-embedding-3-small",  # 모델명 업데이트
                "collection": collection_name
            }

            point = models.PointStruct(
                id=point_id,  # 사용자 지정 ID 사용
                vector=vector,
                payload=payload
            )
            points.append(point)

        # Qdrant에 업로드
        self.client.upsert(collection_name=collection_name, points=points)

        print(f"[성공] 총 {len(vectors)}개 벡터를 Qdrant 컬렉션 '{collection_name}'에 저장 완료!")

    async def get_point(self, collection_name: str, point_id: str) -> dict:
        """특정 ID의 포인트 조회"""
        try:
            result = self.client.retrieve(
                collection_name=collection_name,
                ids=[point_id],
                with_vectors=True,
                with_payload=True
            )

            if result and len(result) > 0:
                point = result[0]
                return {
                    "id": point.id,
                    "vector": point.vector,
                    "payload": point.payload
                }
            return None
        except Exception as e:
            print(f"[실패] 포인트 조회 실패 (collection: {collection_name}, id: {point_id}): {e}")
            return None

    async def get_user_profile(self, collection_name: str, user_id: str) -> dict:
        """메타데이터 필터로 사용자 프로필 조회"""
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue

            points, _ = self.client.scroll(
                collection_name=collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="user_id",
                            match=MatchValue(value=user_id)
                        )
                    ]
                ),
                limit=1,
                with_vectors=True,
                with_payload=True
            )

            if points:
                point = points[0]
                return {
                    "id": point.id,
                    "vector": point.vector,
                    "payload": point.payload
                }
            return None
        except Exception as e:
            print(f"[실패] 사용자 프로필 조회 실패 (collection: {collection_name}, user_id: {user_id}): {e}")
            return None

    def search_similar_vectors(self, collection_name: str, query_vector: list[float], limit: int = 5):
        """유사한 벡터 검색"""
        try:
            search_result = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit
            )
            return search_result
        except Exception as e:
            print(f"[실패] 벡터 검색 실패: {e}")
            return []