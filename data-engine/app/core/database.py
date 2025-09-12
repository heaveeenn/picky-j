"""
데이터베이스 연결 관리
MongoDB 연결 및 유틸리티 함수들
"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
import hashlib

# 전역 변수
mongo_client = None
database = None


async def connect_database():
    """MongoDB 연결"""
    global mongo_client, database
    
    # MongoDB 연결 (로컬 개발용)
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    mongo_client = AsyncIOMotorClient(mongo_url)
    database = mongo_client.picky
    
    print("✅ MongoDB 연결 완료")


async def close_database():
    """MongoDB 연결 해제"""
    global mongo_client
    
    if mongo_client:
        mongo_client.close()
        print("✅ MongoDB 연결 해제")


def get_collection_name(user_id: str, data_type: str = 'browsing') -> str:
    """사용자 ID를 기반으로 샤드된 컬렉션명 반환"""
    # SHA-256으로 일관된 해시 생성
    hash_object = hashlib.sha256(user_id.encode())
    hash_int = int(hash_object.hexdigest(), 16)
    shard_id = hash_int % 5
    return f"{data_type}_data_{shard_id}"


def get_database():
    """데이터베이스 인스턴스 반환"""
    return database