"""
Picky Data Engine - 새로운 간단한 버전
체류시간, 스크롤깊이, 활성상태만 수집하는 서버
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
import hashlib

app = FastAPI(
    title="Picky Data Engine", 
    description="간단한 브라우징 데이터 수집 서버",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"], 
    allow_headers=["*"],
)

# MongoDB 연결
mongo_client = None
database = None

# 중첩된 데이터 모델들
class ContentData(BaseModel):
    """콘텐츠 데이터 (Readability.js 기반)"""
    cleanTitle: str
    cleanContent: str        # 최대 2000자
    excerpt: str
    readingTime: int         # 분
    wordCount: int
    author: str
    language: str
    extractionMethod: str    # 'readability' or 'basic'

class MetaData(BaseModel):
    """페이지 메타데이터 (간소화)"""
    ogTitle: str = ""        # Open Graph 제목 (있을 때만)
    ogDescription: str = ""  # Open Graph 설명 (있을 때만)  
    description: str = ""    # meta description

class BrowsingData(BaseModel):
    """브라우징 데이터 모델"""
    # 기본 페이지 정보
    url: str
    domain: str
    title: str
    
    # 시간 정보 (한국시간)
    timestamp: str
    timestampFormatted: str
    timeCategory: str        # 'morning', 'afternoon', 'evening', 'night'
    dayOfWeek: int          # 0=일요일, 1=월요일...
    
    # 사용자 행동 데이터
    timeSpent: int          # 체류시간(초)
    maxScrollDepth: int     # 최대 스크롤 깊이(%)
    
    # 콘텐츠 데이터
    content: ContentData
    
    # 페이지 메타데이터
    metadata: MetaData
    
    # 사용자 식별
    userId: str             # Google 사용자 ID (이메일)

@app.on_event("startup")
async def startup():
    """앱 시작시 MongoDB 연결"""
    global mongo_client, database
    
    # MongoDB 연결 (로컬 개발용)
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    mongo_client = AsyncIOMotorClient(mongo_url)
    database = mongo_client.picky
    
    print("✅ MongoDB 연결 완료")

@app.on_event("shutdown") 
async def shutdown():
    """앱 종료시 MongoDB 연결 해제"""
    global mongo_client
    
    if mongo_client:
        mongo_client.close()
        print("✅ MongoDB 연결 해제")

@app.get("/")
def root():
    """루트 엔드포인트"""
    return {
        "service": "Picky Data Engine",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    """서버 상태 확인"""
    return {"status": "healthy"}

def get_collection_name(user_id):
    """사용자 ID를 기반으로 샤드된 컬렉션명 반환"""
    # SHA-256으로 일관된 해시 생성 (서버 재시작 시에도 동일한 결과)
    hash_object = hashlib.sha256(user_id.encode())
    hash_int = int(hash_object.hexdigest(), 16)
    shard_id = hash_int % 5
    return f"browsing_data_{shard_id}"

@app.post("/browsing-data")
async def save_browsing_data(data: BrowsingData) -> Dict[str, Any]:
    """브라우징 데이터 저장"""
    try:
        # 사용자 기반 샤드된 컬렉션에 저장
        collection_name = get_collection_name(data.userId)
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
        
        result = await collection.insert_one(save_data)
        
        print(f"📊 데이터 저장: {data.domain} ({data.timeSpent}초, {data.content.wordCount}단어) - 사용자: {data.userId} - 컬렉션: {collection_name} - 방문횟수: {visit_count}")
        
        return {
            "success": True,
            "id": str(result.inserted_id),
            "collection": collection_name,
            "visitCount": visit_count,
            "message": "데이터 저장 완료"
        }
        
    except Exception as e:
        print(f"❌저장 실패: {e}")
        raise HTTPException(status_code=500, detail=f"저장 실패: {str(e)}")

@app.get("/users/{user_id}/data")
async def get_user_data(user_id: str, limit: int = 50) -> Dict[str, Any]:
    """사용자별 브라우징 데이터 조회 (새로 추가)"""
    try:
        collection = database.browsing_data
        
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
        raise HTTPException(status_code=500, detail=f"데이터 조회 실패: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)