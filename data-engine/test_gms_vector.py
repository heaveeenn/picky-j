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
    
    # 특정 사용자의 브라우징 데이터 샤드에서만 조회
    from app.main import get_collection_name
    collection_name = get_collection_name(user_id, 'browsing')  # 'browsing' 타입 명시
    collection = db[collection_name]
    
    print(f"[정보] 사용자 {user_id}의 샤드 {collection_name}에서 조회")
    cursor = collection.find({"userId": user_id}).sort("savedAt", -1).limit(5)
    recent_data = await cursor.to_list(length=5)
    
    if not recent_data:
        print("[실패] 브라우징 데이터가 없습니다.")
        return
    
    print(f"[성공] {len(recent_data)}개 데이터 조회 완료")
    
    # 텍스트 콘텐츠 추출 및 결합 (순수 의미론적 내용만)
    texts_for_embedding = []
    
    for data in recent_data:
        # 정제된 제목과 내용만 자연스럽게 결합
        combined_text = ""
        
        if 'content' in data:
            content = data['content']
            clean_title = content.get('cleanTitle', '').strip()
            clean_content = content.get('cleanContent', '')[:1500].strip()  # 더 많은 본문 포함
            
            
            if clean_title and clean_content:
                combined_text = f"{clean_title} {clean_content}"
            elif clean_title:
                combined_text = clean_title
            elif clean_content:
                combined_text = clean_content
        
        # 빈 텍스트가 아닌 경우에만 추가
        if combined_text.strip():
            texts_for_embedding.append(combined_text.strip())
        
        print(f"\n[데이터] 데이터 {len(texts_for_embedding)}:")
        print(f"   URL: {data.get('url', 'N/A')}")
        print(f"   도메인: {data.get('domain', 'N/A')}")
        print(f"   단어 수: {data.get('content', {}).get('wordCount', 'N/A')}")
        print(f"   체류시간: {data.get('timeSpent', 'N/A')}초")
        print(f"   스크롤 깊이: {data.get('maxScrollDepth', 'N/A')}%")
        print(f"   사용자 ID: {data.get('userId', 'N/A')}")
        print(f"   방문 횟수: {data.get('visitCount', 'N/A')}")
        print(f"   데이터 타입: {data.get('dataType', 'N/A')}")
        print(f"   시간 카테고리: {data.get('timeCategory', 'N/A')}")
        print(f"   임베딩 텍스트 길이: {len(combined_text)} 문자")
        print(f"   임베딩 텍스트 미리보기: {combined_text[:100]}...")
    
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
            
            # 콘텐츠 정보 (업데이트된 스키마)
            "word_count": data.get("content", {}).get("wordCount"),
            "clean_title": data.get("content", {}).get("cleanTitle"),
            "excerpt": data.get("content", {}).get("excerpt"),
            "author": data.get("content", {}).get("author"),
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