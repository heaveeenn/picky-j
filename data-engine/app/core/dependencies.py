"""
FastAPI Dependency Injection
싱글톤 패턴으로 서비스 인스턴스 관리
"""

from functools import lru_cache
from .processing_state import ProcessingStateManager


@lru_cache()
def get_processing_state_manager() -> ProcessingStateManager:
    """ProcessingStateManager 싱글톤 인스턴스 반환"""
    return ProcessingStateManager()


@lru_cache()
def get_profile_service():
    """UserProfileService 싱글톤 인스턴스 반환 (processing_manager 주입)"""
    from ..user_logs.profile_service import UserProfileService

    processing_manager = get_processing_state_manager()
    return UserProfileService(processing_manager)