"""
히스토리 처리 상태 관리 시스템
MongoDB를 이용한 사용자별 동시성 제어
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from .database import get_database

logger = logging.getLogger(__name__)


class ProcessingStateManager:
    """사용자별 히스토리 처리 상태 관리"""

    def __init__(self):
        self.database = None
        self.collection = None
        self._initialized = False

    def _ensure_initialized(self):
        """데이터베이스 연결 지연 초기화"""
        if not self._initialized:
            self.database = get_database()
            self.collection = self.database["processing_history"]

            # TTL 인덱스 생성 (20분 후 자동 삭제)
            self.collection.create_index("expires_at", expireAfterSeconds=0)
            # 사용자 ID 인덱스
            self.collection.create_index("user_id", unique=True)

            self._initialized = True

    async def start_history_processing(self, user_id: str) -> bool:
        """
        히스토리 처리 시작
        Returns: True if started successfully, False if already processing
        """
        self._ensure_initialized()

        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=20)  # 20분 타임아웃

        try:
            # processing_history에 상태 저장 (단순화: started_at만 기록)
            result = await self.collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "is_processing": True,
                        "started_at": now,
                        "expires_at": expires_at
                    }
                },
                upsert=True
            )

            logger.info(f"🟢 [상태관리] 히스토리 처리 시작: {user_id} (started_at: {now})")
            print(f"🟢 [상태관리] 히스토리 처리 시작: {user_id} (started_at: {now})")
            return True

        except Exception as e:
            logger.error(f"❌ [에러] 히스토리 처리 시작 실패: {e}")
            print(f"❌ [에러] 히스토리 처리 시작 실패: {e}")
            return False

    async def finish_history_processing(self, user_id: str) -> Optional[datetime]:
        """
        히스토리 처리 완료
        Returns: started_at (누락된 브라우징 데이터 처리용)
        """
        self._ensure_initialized()

        try:
            # 현재 상태 조회
            state = await self.collection.find_one({"user_id": user_id})
            if not state:
                print(f"[경고] 처리 상태를 찾을 수 없음: {user_id}")
                return None

            started_at = state.get("started_at")

            # 상태 삭제
            await self.collection.delete_one({"user_id": user_id})

            logger.info(f"🔵 [상태관리] 히스토리 처리 완료: {user_id} (started_at: {started_at})")
            print(f"🔵 [상태관리] 히스토리 처리 완료: {user_id} (started_at: {started_at})")
            return started_at

        except Exception as e:
            logger.error(f"❌ [에러] 히스토리 처리 완료 실패: {e}")
            print(f"❌ [에러] 히스토리 처리 완료 실패: {e}")
            return None

    async def is_processing_history(self, user_id: str) -> bool:
        """
        현재 히스토리 처리 중인지 확인
        """
        self._ensure_initialized()

        try:
            state = await self.collection.find_one({
                "user_id": user_id,
                "is_processing": True
            })

            is_processing = state is not None
            if is_processing:
                logger.info(f"🟡 [상태확인] 히스토리 처리 중: {user_id}")
                print(f"🟡 [상태확인] 히스토리 처리 중: {user_id}")
            else:
                logger.debug(f"✅ [상태확인] 히스토리 처리 중 아님: {user_id}")

            return is_processing

        except Exception as e:
            logger.error(f"❌ [에러] 히스토리 처리 상태 확인 실패: {e}")
            print(f"❌ [에러] 히스토리 처리 상태 확인 실패: {e}")
            return False

    async def get_processing_state(self, user_id: str) -> Optional[dict]:
        """
        처리 상태 전체 정보 조회
        """
        self._ensure_initialized()

        try:
            return await self.collection.find_one({"user_id": user_id})
        except Exception as e:
            logger.error(f"❌ [에러] 처리 상태 조회 실패: {e}")
            print(f"❌ [에러] 처리 상태 조회 실패: {e}")
            return None

    async def cleanup_expired_states(self):
        """
        만료된 처리 상태 정리 (TTL 백업용)
        """
        self._ensure_initialized()

        try:
            now = datetime.utcnow()
            result = await self.collection.delete_many({
                "expires_at": {"$lt": now}
            })

            if result.deleted_count > 0:
                logger.info(f"🧹 [상태관리] 만료된 처리 상태 {result.deleted_count}개 정리")
                print(f"🧹 [상태관리] 만료된 처리 상태 {result.deleted_count}개 정리")

        except Exception as e:
            logger.error(f"❌ [에러] 만료 상태 정리 실패: {e}")
            print(f"❌ [에러] 만료 상태 정리 실패: {e}")


# Dependency Injection으로 관리되므로 전역 인스턴스 제거