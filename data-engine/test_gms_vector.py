"""
GMS + LangChain을 활용한 브라우징 데이터 벡터화 테스트
"""

import os
import asyncio
from langchain_openai import OpenAIEmbeddings
from motor.motor_asyncio import AsyncIOMotorClient
import numpy as np
from datetime import datetime
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# GMS 설정
GMS_KEY = os.getenv("GMS_KEY")
GMS_BASE_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"

if not GMS_KEY:
    raise ValueError("GMS_KEY가 .env 파일에 설정되지 않았습니다!")

# LangChain OpenAI Embeddings를 GMS로 설정
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=GMS_KEY,
    openai_api_base=GMS_BASE_URL
)

# MongoDB 연결
async def get_database():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    return client.picky


async def test_browsing_data_vectorization(user_id):
    """특정 사용자의 브라우징 데이터로 벡터화 테스트"""
    
    # MongoDB 연결
    db = await get_database()
    
    print(f"[진행중] 사용자 {user_id}의 브라우징 데이터 조회 중...")
    
    # 특정 사용자의 샤드에서만 조회
    from app.main import get_collection_name
    collection_name = get_collection_name(user_id)
    collection = db[collection_name]
    
    print(f"[정보] 사용자 {user_id}의 샤드 {collection_name}에서 조회")
    cursor = collection.find({"userId": user_id}).sort("savedAt", -1).limit(5)
    recent_data = await cursor.to_list(length=5)
    
    if not recent_data:
        print("[실패] 브라우징 데이터가 없습니다.")
        return
    
    print(f"[성공] {len(recent_data)}개 데이터 조회 완료")
    
    # 텍스트 콘텐츠 추출 및 결합
    texts_for_embedding = []
    
    for data in recent_data:
        # 제목 + 콘텐츠 + 메타데이터를 결합하여 임베딩용 텍스트 생성
        combined_text = ""
        
        # 기본 정보
        combined_text += f"제목: {data.get('title', '')}\n"
        combined_text += f"URL: {data.get('url', '')}\n"
        combined_text += f"도메인: {data.get('domain', '')}\n"
        
        # 콘텐츠 정보 (실제 저장되는 구조)
        if 'content' in data:
            content = data['content']
            combined_text += f"정제된 제목: {content.get('cleanTitle', '')}\n"
            combined_text += f"내용: {content.get('cleanContent', '')[:800]}\n"  # 800자로 제한
            combined_text += f"요약: {content.get('excerpt', '')}\n"
        
        # 메타데이터 (실제 저장되는 구조)
        if 'metadata' in data:
            metadata = data['metadata']
            combined_text += f"설명: {metadata.get('description', '')}\n"
        
        texts_for_embedding.append(combined_text.strip())
        
        print(f"\n[데이터] 데이터 {len(texts_for_embedding)}:")
        print(f"   URL: {data.get('url', 'N/A')}")
        print(f"   도메인: {data.get('domain', 'N/A')}")
        print(f"   단어 수: {data.get('content', {}).get('wordCount', 'N/A')}")
        print(f"   체류시간: {data.get('timeSpent', 'N/A')}초")
        print(f"   스크롤 깊이: {data.get('maxScrollDepth', 'N/A')}%")
        print(f"   사용자 ID: {data.get('userId', 'N/A')}")
        print(f"   방문 횟수: {data.get('visitCount', 'N/A')}")
        print(f"   시간 카테고리: {data.get('timeCategory', 'N/A')}")
        print(f"   임베딩 텍스트 길이: {len(combined_text)} 문자")
    
    # 임베딩 생성
    print("\n[진행중] 브라우징 데이터 임베딩 생성 중...")
    
    try:
        vectors = await embeddings.aembed_documents(texts_for_embedding)
        
        print("[성공] 브라우징 데이터 임베딩 성공!")
        print(f"생성된 벡터 수: {len(vectors)}")
        print(f"벡터 차원: {len(vectors[0])}")
        
        # 유사도 계산 예시
        if len(vectors) >= 2:
            similarity = np.dot(vectors[0], vectors[1]) / (np.linalg.norm(vectors[0]) * np.linalg.norm(vectors[1]))
            print(f"[계산] 첫 번째와 두 번째 데이터 간 유사도: {similarity:.4f}")
        
        # Qdrant에 벡터 저장
        await save_vectors_to_qdrant(recent_data, vectors)
        
        return vectors
        
    except Exception as e:
        print(f"[실패] 브라우징 데이터 임베딩 실패: {e}")
        return None

async def save_vectors_to_qdrant(data_list, vectors):
    """생성된 벡터를 Qdrant에 저장"""
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
    
    print("\n[진행중] 벡터를 Qdrant에 저장 중...")
    
    # Qdrant 클라이언트 연결
    client = QdrantClient(host="localhost", port=6333)
    
    collection_name = "browsing_vectors"
    
    # 컬렉션 생성 (이미 있으면 스킵)
    try:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=len(vectors[0]),  # 벡터 차원
                distance=models.Distance.COSINE
            )
        )
        print(f"[성공] Qdrant 컬렉션 '{collection_name}' 생성")
    except Exception as e:
        print(f"[정보] 컬렉션이 이미 존재하거나 생성 실패: {e}")
    
    # 벡터 및 메타데이터 업로드
    points = []
    for i, (data, vector) in enumerate(zip(data_list, vectors)):
        # 실제 저장되는 데이터 구조에 맞는 payload 구성
        payload = {
            "browsing_data_id": str(data.get("_id")),
            "url": data.get("url"),
            "title": data.get("title"),
            "domain": data.get("domain"),
            "data_version": data.get("dataVersion", "2.0"),
            "created_at": datetime.utcnow().isoformat(),
            "embedding_model": "text-embedding-3-small",
            
            # 기본 필드들
            "time_category": data.get("timeCategory"),
            "day_of_week": data.get("dayOfWeek"),
            "user_id": data.get("userId"),
            
            # 콘텐츠 정보
            "word_count": data.get("content", {}).get("wordCount"),
            "clean_title": data.get("content", {}).get("cleanTitle"),
            "excerpt": data.get("content", {}).get("excerpt"),
            "reading_time": data.get("content", {}).get("readingTime"),
            "author": data.get("content", {}).get("author"),
            "language": data.get("content", {}).get("language"),
            "extraction_method": data.get("content", {}).get("extractionMethod"),
            
            # 메타데이터
            "description": data.get("metadata", {}).get("description"),
            
            # 행동 데이터 (실제 필드명)
            "time_spent": data.get("timeSpent"),
            "max_scroll_depth": data.get("maxScrollDepth"),
            "visit_count": data.get("visitCount"),
            
            # 시간 정보
            "timestamp": data.get("timestamp"),
            "timestamp_formatted": data.get("timestampFormatted"),
        }
        
        point = models.PointStruct(
            id=i + 1,  # 또는 data.get("_id") 사용
            vector=vector,
            payload=payload
        )
        points.append(point)
    
    # Qdrant에 업로드
    client.upsert(collection_name=collection_name, points=points)
    
    print(f"[성공] 총 {len(vectors)}개 벡터를 Qdrant에 저장 완료!")
    
    # 저장된 벡터 개수 확인
    collection_info = client.get_collection(collection_name)
    print(f"[정보] Qdrant 컬렉션 정보: {collection_info.points_count}개 벡터 저장됨")

async def main():
    """메인 테스트 함수"""
    
    print("[시작] GMS + LangChain 브라우징 데이터 벡터화 테스트 시작\n")
    
    # 실제 브라우징 데이터 벡터화
    print("=== 브라우징 데이터 벡터화 ===")
    
    # dummy-user@picky.com 사용자로 테스트
    await test_browsing_data_vectorization(user_id="dummy-user@picky.com")
    
    print("\n[완료] 테스트 완료!")

if __name__ == "__main__":
    asyncio.run(main())