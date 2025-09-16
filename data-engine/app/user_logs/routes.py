"""
데이터 수집 관련 API 라우트들
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from .models import BrowsingData, HistoryData
from .services import BrowsingDataService, HistoryDataService
from .profile_service import get_profile_service

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


@router.post("/users/{user_id}/create-profile")
async def create_user_profile(user_id: str, limit: int = 500) -> Dict[str, Any]:
    """히스토리 데이터로부터 초기 사용자 프로필 생성"""
    try:
        profile_service = get_profile_service()
        result = await profile_service.create_initial_profile_from_history(user_id, limit)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/update-profile")
async def update_user_profile(user_id: str, browsing_data: BrowsingData) -> Dict[str, Any]:
    """새로운 브라우징 데이터로 사용자 프로필 증분 업데이트"""
    try:
        profile_service = get_profile_service()
        # BrowsingData를 dict로 변환
        new_data = browsing_data.dict()
        result = await profile_service.update_profile_with_new_log(user_id, new_data)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

