"""
FastAPI Dependency Injection
싱글톤 패턴으로 서비스 인스턴스 관리
"""

from functools import lru_cache


@lru_cache()
def get_profile_service():
    """UserProfileService 싱글톤 인스턴스 반환"""
    from ..user_logs.profile_service import UserProfileService
    return UserProfileService()