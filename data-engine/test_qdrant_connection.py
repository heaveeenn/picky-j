"""
Qdrant 연결 테스트
"""

from qdrant_client import QdrantClient
from qdrant_client.http import models

def test_qdrant_connection():
    """Qdrant 연결 테스트"""
    
    print("[진행중] Qdrant 연결 시도 중...")
    
    try:
        # Qdrant 클라이언트 생성
        client = QdrantClient(host="localhost", port=6333)
        
        # 서버 정보 확인
        print("[성공] Qdrant 연결 성공!")
        
        # 기존 컬렉션 목록 확인
        collections = client.get_collections()
        print(f"[정보] 기존 컬렉션 수: {len(collections.collections)}")
        
        for collection in collections.collections:
            print(f"   - {collection.name}")
        
        return client
        
    except Exception as e:
        print(f"[실패] Qdrant 연결 실패: {e}")
        print("[정보] 확인사항:")
        print("   1. Docker에서 Qdrant가 실행 중인지 확인")
        print("   2. 포트 6333이 열려있는지 확인")
        print("   3. 명령어: docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant")
        return None

def test_create_collection():
    """테스트 컬렉션 생성"""
    
    client = test_qdrant_connection()
    if not client:
        return
    
    print("\n[진행중] 테스트 컬렉션 생성 중...")
    
    collection_name = "test_collection"
    
    try:
        # 테스트용 컬렉션 생성
        client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=384,  # 테스트용 작은 차원
                distance=models.Distance.COSINE
            )
        )
        print(f"[성공] 컬렉션 '{collection_name}' 생성 성공!")
        
        # 테스트 벡터 추가
        test_vectors = [
            [0.1, 0.2, 0.3] + [0.0] * 381,  # 384차원 벡터
            [0.4, 0.5, 0.6] + [0.0] * 381,
        ]
        
        points = [
            models.PointStruct(
                id=1,
                vector=test_vectors[0],
                payload={"text": "첫 번째 테스트 문서", "category": "test"}
            ),
            models.PointStruct(
                id=2,
                vector=test_vectors[1],
                payload={"text": "두 번째 테스트 문서", "category": "test"}
            )
        ]
        
        client.upsert(collection_name=collection_name, points=points)
        print(f"[성공] {len(points)}개 테스트 벡터 추가 완료!")
        
        # 컬렉션 정보 확인
        collection_info = client.get_collection(collection_name)
        print(f"[정보] 컬렉션 정보:")
        print(f"   - 벡터 수: {collection_info.points_count}")
        print(f"   - 벡터 차원: {collection_info.config.params.vectors.size}")
        print(f"   - 거리 측정: {collection_info.config.params.vectors.distance}")
        
        # 테스트 검색
        search_result = client.query_points(
            collection_name=collection_name,
            query=test_vectors[0],
            limit=2
        ).points
        
        print(f"\n[검색] 테스트 검색 결과:")
        for result in search_result:
            print(f"   - ID: {result.id}, Score: {result.score:.4f}, Text: {result.payload['text']}")
        
    except Exception as e:
        print(f"[실패] 테스트 실패: {e}")

def cleanup_test():
    """테스트 컬렉션 삭제"""
    
    client = test_qdrant_connection()
    if not client:
        return
    
    try:
        client.delete_collection("test_collection")
        print("[삭제] 테스트 컬렉션 삭제 완료")
    except Exception as e:
        print(f"[정보] 테스트 컬렉션 삭제 실패 (없을 수도 있음): {e}")

if __name__ == "__main__":
    print("[시작] Qdrant 연결 테스트 시작\n")
    
    # 1. 기본 연결 테스트
    print("=== 1. 연결 테스트 ===")
    client = test_qdrant_connection()
    
    if client:
        print("\n=== 2. 컬렉션 생성 및 테스트 ===")
        test_create_collection()
        
        print("\n=== 3. 정리 ===")
        cleanup_test()
        
        print("\n[완료] 모든 테스트 완료!")
        print("[정보] 이제 main 테스트를 실행할 수 있습니다:")
        print("   python test_gms_vector.py")
    else:
        print("\n[정보] 먼저 Qdrant Docker를 실행해주세요:")
        print("   docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant")