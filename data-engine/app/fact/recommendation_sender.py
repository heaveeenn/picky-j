import asyncio
import sys
import os
import requests
from datetime import datetime
from typing import List, Dict
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.mysql_db import SessionLocal
from app.users.models import User

class FactRecommendationSender:
    """Java 백엔드로 FACT 추천 슬롯 생성 요청 서비스"""

    def __init__(self, backend_url: str = None):
        if backend_url is None:
            backend_url = os.getenv("BACKEND_URL", "http://backend:8080")
        self.backend_url = backend_url.rstrip("/")
        self.api_endpoint = f"{self.backend_url}/api/recommendations/slots"

    def get_all_users(self) -> List[tuple]:
        """모든 사용자 목록 조회 (user_id, email)"""
        session = SessionLocal()
        try:
            users = session.query(User.id, User.email).all()
            print(f"📋 [FACT] 총 {len(users)}명의 사용자 발견")
            return users
        except Exception as e:
            print(f"❌ [FACT] 사용자 조회 실패: {e}")
            return []
        finally:
            session.close()

    async def send_request_for_user(self, user_id: int, user_email: str) -> Dict:
        """특정 사용자에 대한 FACT 추천 슬롯 생성 요청"""
        try:
            print(f"👤 사용자 {user_id} ({user_email}) FACT 추천 슬롯 생성 요청 중...")

            request_data = {
                "userId": user_id,
                "contentType": "FACT",
                "priority": 10,  # FACT는 우선순위를 낮게 설정
                "reason": "Scheduled Fact"
            }

            response = self.send_to_backend(request_data)
            if response and response.status_code in [200, 201]:
                print(f"✅ 사용자 {user_id}: FACT 슬롯 생성 요청 성공")
                return {"user_id": user_id, "success": True}
            else:
                print(f"❌ 사용자 {user_id}: FACT 슬롯 생성 요청 실패")
                return {"user_id": user_id, "success": False}

        except Exception as e:
            print(f"❌ 사용자 {user_id} 처리 실패: {e}")
            return {"user_id": user_id, "success": False, "reason": str(e)}

    async def process_all_users(self):
        """모든 사용자에 대한 FACT 추천 슬롯 생성 처리"""
        print("=" * 60)
        print(f"🚀 자동 FACT 추천 슬롯 생성 시작 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

        users = self.get_all_users()
        if not users:
            print("❌ [FACT] 처리할 사용자가 없습니다.")
            return

        success_count = 0
        for user_id, user_email in users:
            try:
                result = await self.send_request_for_user(user_id, user_email)
                if result.get('success'):
                    success_count += 1
                await asyncio.sleep(0.1)  # 과부하 방지

            except Exception as e:
                print(f"❌ [FACT] 사용자 {user_id} ({user_email}) 처리 중 치명적 오류: {e}")

        print("\n" + "=" * 60)
        print(f"📊 자동 FACT 추천 슬롯 생성 완료 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"👥 처리된 사용자: {len(users)}명")
        print(f"✅ 요청 성공: {success_count}개")
        print("=" * 60)

    def send_to_backend(self, data: Dict) -> requests.Response:
        """Java 백엔드로 데이터 전송"""
        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.post(
                self.api_endpoint,
                json=data,
                headers=headers,
                timeout=10
            )
            return response
        except requests.exceptions.RequestException as e:
            print(f"❌ [FACT] 백엔드 연결 실패: {e}")
            return None
