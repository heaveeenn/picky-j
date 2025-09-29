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

from recommend_quiz import QuizRecommendationService
from app.core.mysql_db import SessionLocal
from app.users.models import User
from sqlalchemy import text

class QuizRecommendationSender:
    """Java 백엔드로 추천 퀴즈 전송 서비스"""

    def __init__(self, backend_url: str = None):
        if backend_url is None:
            backend_url = os.getenv("BACKEND_URL", "http://backend:8080")
        self.backend_url = backend_url.rstrip("/")
        self.api_endpoint = f"{self.backend_url}/api/recommendations/slots"
        self.recommendation_service = QuizRecommendationService()

    def get_all_users(self) -> List[tuple]:
        """모든 사용자 목록 조회 (user_id, email)"""
        session = SessionLocal()
        try:
            users = session.query(User.id, User.email).all()
            print(f"📋 총 {len(users)}명의 사용자 발견")
            return users
        except Exception as e:
            print(f"❌ 사용자 조회 실패: {e}")
            return []
        finally:
            session.close()

    def get_user_seen_quiz_ids(self, user_id: int, days: int = 30) -> set:
        """사용자가 최근 N일간 추천받은 퀴즈 ID 조회"""
        session = SessionLocal()
        try:
            query = text("""
                SELECT DISTINCT quiz_id
                FROM user_recommendation_slots
                WHERE user_id = :user_id
                AND created_at >= NOW() - INTERVAL :days DAY
                AND quiz_id IS NOT NULL
            """)
            result = session.execute(query, {"user_id": user_id, "days": days})
            seen_ids = {row[0] for row in result.fetchall()}
            print(f"📋 사용자 {user_id}: 최근 {days}일간 추천받은 퀴즈 {len(seen_ids)}개")
            return seen_ids
        except Exception as e:
            print(f"❌ 추천 이력 조회 실패: {e}")
            return set()
        finally:
            session.close()

    async def send_recommendations_for_user(self, user_id: int, user_email: str, limit: int = 3) -> Dict:
        """특정 사용자에 대한 퀴즈 추천 전송"""
        try:
            print(f"👤 사용자 {user_id} ({user_email}) 퀴즈 추천 처리 중...")

            # 1. 이미 추천받은 퀴즈 ID 조회
            seen_quiz_ids = self.get_user_seen_quiz_ids(user_id, days=30)

            # 2. 더 많은 퀴즈를 검색 (중복 제거 위해 여유분 확보)
            search_limit = max(500, limit * 50)  # 최소 500개 또는 요청 개수의 50배

            # 3. 퀴즈 추천 (이메일로 벡터 조회)
            all_recommended_quizzes = await self.recommendation_service.recommend_quizzes_by_user_id(
                user_id=user_email,
                limit=search_limit
            )

            # 4. 해당 이메일로 벡터가 없으면 기본 사용자 벡터 사용
            if not all_recommended_quizzes:
                print(f"⚠️ 사용자 {user_email}의 벡터 없음, 기본 사용자 벡터 사용...")
                try:
                    all_recommended_quizzes = await self.recommendation_service.recommend_quizzes_by_user_id(
                        user_id="dummy-user@picky.com",
                        limit=search_limit
                    )
                    if all_recommended_quizzes:
                        print(f"✅ 기본 사용자 벡터로 {len(all_recommended_quizzes)}개 퀴즈 검색")
                    else:
                        print(f"❌ 기본 사용자 벡터도 없음")
                        return {"user_id": user_id, "success": 0, "failed": 0, "reason": "no_default_recommendations"}
                except Exception as e:
                    print(f"❌ 기본 사용자 벡터 조회 실패: {e}")
                    return {"user_id": user_id, "success": 0, "failed": 0, "reason": "default_vector_error"}

            if not all_recommended_quizzes:
                return {"user_id": user_id, "success": 0, "failed": 0, "reason": "no_recommendations"}

            # 5. 중복 퀴즈 제외 + 낮은 유사도(0.1 미만) 제외
            filtered_quizzes = [
                quiz for quiz in all_recommended_quizzes
                if quiz['id'] not in seen_quiz_ids and quiz['similarity_score'] >= 0.1
            ]

            # 6. 필터링 후 필요한 개수만큼 선택
            recommended_quizzes = filtered_quizzes[:limit]

            if not recommended_quizzes:
                print(f"⚠️ 중복 제거 후 추천할 새로운 퀴즈 없음")
                return {"user_id": user_id, "success": 0, "failed": 0, "reason": "no_new_recommendations"}

            print(f"🔍 전체 {len(all_recommended_quizzes)}개 → 중복 제거 후 {len(filtered_quizzes)}개 → 최종 {len(recommended_quizzes)}개 선택")

            # 7. Java 백엔드로 전송
            success_count = 0

            for i, quiz in enumerate(recommended_quizzes):
                try:
                    # 0.5 이상은 priority 1, 0.1~0.5은 순차적으로 2~10 할당
                    sim = quiz['similarity_score']
                    if sim >= 0.5:
                        priority = 1
                    else:
                        step = 0.4 / 9  # (0.5 - 0.1) / 9
                        bucket = int((sim - 0.1) / step)
                        priority = 10 - bucket

                    request_data = {
                        "userId": user_id,
                        "contentType": "QUIZ",
                        "quizId": quiz['id'],
                        "priority": priority,
                        "reason": f"유사도: {quiz['similarity_score']:.3f}"
                    }

                    response = self.send_to_backend(request_data)
                    if response and response.status_code in [200, 201]:
                        success_count += 1

                except Exception as e:
                    print(f"❌ 퀴즈 ID {quiz['id']} 처리 중 오류: {e}")

            print(f"✅ 사용자 {user_id}: {success_count}/{len(recommended_quizzes)} 전송 성공")
            return {
                "user_id": user_id,
                "success": success_count,
                "failed": len(recommended_quizzes) - success_count,
                "total": len(recommended_quizzes)
            }

        except Exception as e:
            print(f"❌ 사용자 {user_id} 처리 실패: {e}")
            return {"user_id": user_id, "success": 0, "failed": 0, "reason": str(e)}

    async def process_all_users(self):
        """모든 사용자에 대한 퀴즈 추천 처리"""
        print("=" * 60)
        print(f"🚀 자동 퀴즈 추천 시작 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

        users = self.get_all_users()
        if not users:
            print("❌ 처리할 사용자가 없습니다.")
            return

        total_success = 0
        total_failed = 0
        processed_users = 0

        for user_id, user_email in users:
            try:
                result = await self.send_recommendations_for_user(user_id, user_email, limit=3)
                total_success += result.get('success', 0)
                total_failed += result.get('failed', 0)
                processed_users += 1
                await asyncio.sleep(0.5)  # 과부하 방지

            except Exception as e:
                print(f"❌ 사용자 {user_id} ({user_email}) 처리 중 치명적 오류: {e}")
                total_failed += 1

        print("\n" + "=" * 60)
        print(f"📊 자동 퀴즈 추천 완료 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"👥 처리된 사용자: {processed_users}명")
        print(f"✅ 전송 성공: {total_success}개")
        print(f"❌ 전송 실패: {total_failed}개")
        print("=" * 60)

    def send_to_backend(self, data: Dict) -> requests.Response:
        """Java 백엔드로 데이터 전송"""
        try:
            headers = {
                'Content-Type': 'application/json'
            }

            response = requests.post(
                self.api_endpoint,
                json=data,
                headers=headers,
                timeout=10
            )

            print(f"🔍 백엔드 응답: {response.status_code}")
            if response.status_code not in [200, 201]:
                print(f"❌ 백엔드 에러 응답: {response.text}")

            return response

        except requests.exceptions.RequestException as e:
            print(f"❌ 백엔드 연결 실패: {e}")
            return None

    def test_backend_connection(self) -> bool:
        """백엔드 연결 테스트"""
        try:
            test_data = {
                "userId": 1,
                "contentType": "QUIZ",
                "quizId": 999,
                "priority": 5,
                "reason": "연결 테스트"
            }

            response = self.send_to_backend(test_data)

            if response and response.status_code in [200, 201]:
                print(f"✅ Java 백엔드 연결 성공 ({self.api_endpoint})")
                return True
            else:
                print(f"❌ Java 백엔드 연결 실패: {response.status_code if response else '연결 불가'}")
                return False

        except Exception as e:
            print(f"❌ 백엔드 연결 테스트 실패: {e}")
            return False

async def main():
    """메인 함수"""
    print("=" * 60)
    print("🔗 Python 퀴즈 추천 → Java 백엔드 전송")
    print("=" * 60)

    sender = QuizRecommendationSender()

    # 백엔드 연결 테스트
    print("🔍 Java 백엔드 연결 테스트...")
    if not sender.test_backend_connection():
        print("❌ Java 백엔드가 실행되지 않았거나 연결할 수 없습니다.")
        print("💡 Java 백엔드를 먼저 실행해주세요.")
        return 1

    # 전체 사용자 처리
    try:
        await sender.process_all_users()
        print("\n✅ 모든 작업이 성공적으로 완료되었습니다!")
        return 0

    except Exception as e:
        print(f"\n❌ 작업 실패: {e}")
        return 1

if __name__ == "__main__":
    asyncio.run(main())