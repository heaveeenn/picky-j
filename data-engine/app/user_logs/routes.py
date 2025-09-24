"""
데이터 수집 관련 API 라우트들
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from .models import BrowsingData, HistoryData
from .services import BrowsingDataService, HistoryDataService
from .profile_service import UserProfileService
from ..core.dependencies import get_profile_service

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


@router.get("/users/{user_id}/profile-exists")
async def check_user_profile_exists(
    user_id: str,
    profile_service: UserProfileService = Depends(get_profile_service)
) -> Dict[str, Any]:
    """사용자 프로필 벡터 존재 여부 체크"""
    try:
        # 사용자별 고유 Point ID 생성
        profile_point_id = profile_service._get_deterministic_profile_id(user_id)

        # 기존 프로필 존재 여부 확인
        existing_profile = await profile_service.qdrant_service.get_point("user_profiles", profile_point_id)

        if existing_profile:
            return {
                "exists": True,
                "user_id": user_id,
                "point_id": profile_point_id,
                "weight_sum": existing_profile.get("payload", {}).get("weight_sum"),
                "log_count": existing_profile.get("payload", {}).get("log_count"),
                "created_from": existing_profile.get("payload", {}).get("created_from")
            }
        else:
            return {
                "exists": False,
                "user_id": user_id,
                "message": "사용자 프로필이 존재하지 않습니다."
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/create-profile")
async def create_user_profile(
    user_id: str,
    limit: int = 500,
    profile_service: UserProfileService = Depends(get_profile_service)
) -> Dict[str, Any]:
    """히스토리 데이터로부터 초기 사용자 프로필 생성"""
    try:
        result = await profile_service.create_initial_profile_from_history(user_id, limit)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



