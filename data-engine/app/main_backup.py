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
    wordCount: int
    author: str
    language: str
    extractionMethod: str    # 'readability' or 'basic'

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
    timeSpent: int          # 체류 시간(초)
    maxScrollDepth: int     # 최대 스크롤 깊이(%)
    
    # 콘텐츠 데이터
    content: ContentData
    
    # 사용자 식별
    userId: str             # Google 사용자 ID (이메일)

class ExtractedContent(BaseModel):
    """추출된 콘텐츠 데이터"""
    title: str
    content: str
    excerpt: str = ""
    length: int = 0
    wordCount: int = 0

class HistoryItem(BaseModel):
    """히스토리 단일 아이템"""
    url: str
    domain: str
    title: str
    
    # 히스토리 특화 정보
    visitCount: int
    typedCount: int = 0
    lastVisitTime: str      # ISO 날짜 문자열
    visitMethods: List[str] = []
    totalVisits: int = 0
    directVisits: int = 0
    
    # 콘텐츠 데이터 (BrowsingData와 동일한 구조)
    content: Optional[ContentData] = None
    
    # 사용자 식별
    userId: str

class HistoryData(BaseModel):
    """히스토리 데이터 모델"""
    type: str = 'HISTORY_DATA'
    totalItems: int
    collectedAt: str
    timeRange: Dict[str, str]  # start, end
    items: List[HistoryItem]
    userId: str

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

def get_collection_name(user_id, data_type='browsing'):
    """사용자 ID를 기반으로 샤드된 컬렉션명 반환"""
    # SHA-256으로 일관된 해시 생성
    hash_object = hashlib.sha256(user_id.encode())
    hash_int = int(hash_object.hexdigest(), 16)
    shard_id = hash_int % 5
    return f"{data_type}_data_{shard_id}"

@app.post("/browsing-data")
async def save_browsing_data(data: BrowsingData) -> Dict[str, Any]:
    """브라우징 데이터 저장"""
    try:
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
        raise HTTPException(status_code=500, detail=f"저장 실패: {str(e)}")

@app.post("/history-data")
async def save_history_data(data: HistoryData) -> Dict[str, Any]:
    """히스토리 데이터 저장 (샤딩 적용)"""
    try:
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
        raise HTTPException(status_code=500, detail=f"히스토리 저장 실패: {str(e)}")

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