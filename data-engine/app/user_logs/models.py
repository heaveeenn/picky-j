"""
데이터 수집 관련 Pydantic 모델들
"""

from pydantic import BaseModel
from typing import Dict, Optional, List


class ContentData(BaseModel):
    """콘텐츠 데이터 (Readability.js 기반)"""
    cleanTitle: str
    cleanContent: str        # 최대 2000자
    excerpt: str
    wordCount: int
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