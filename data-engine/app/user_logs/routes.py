"""
데이터 수집 관련 API 라우트들
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from .models import BrowsingData, HistoryData
from .services import BrowsingDataService, HistoryDataService

# 라우터 생성
router = APIRouter(
    prefix="/user-logs",
    tags=["user-logs"],
    responses={404: {"description": "Not found"}},
)


@router.post("/browsing-data")
async def save_browsing_data(data: BrowsingData) -> Dict[str, Any]:
    """브라우징 데이터 저장"""
    try:
        result = await BrowsingDataService.save_browsing_data(data)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/history-data")
async def save_history_data(data: HistoryData) -> Dict[str, Any]:
    """히스토리 데이터 저장 (샤딩 적용)"""
    try:
        result = await HistoryDataService.save_history_data(data)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/data")
async def get_user_data(user_id: str, limit: int = 50) -> Dict[str, Any]:
    """사용자별 브라우징 데이터 조회"""
    try:
        result = await HistoryDataService.get_user_data(user_id, limit)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


