from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
from datetime import datetime
from .news.crawler import main
from .news.recommendation_sender import NewsRecommendationSender
from .quiz.recommendation_sender import QuizRecommendationSender
from .fact.recommendation_sender import FactRecommendationSender

scheduler = BackgroundScheduler()

# 뉴스 크롤링: 3시간마다 실행
scheduler.add_job(main, "cron", hour="0,3,6,9,12,15,18,21", minute=0, timezone="Asia/Seoul")

# 뉴스 추천
def run_recommendation_job():
    """뉴스 추천 작업 실행"""
    print(f"🚀 뉴스 추천 작업 시작 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        sender = NewsRecommendationSender()
        asyncio.run(sender.process_all_users())
        print(f"✅ 뉴스 추천 작업 완료 - {datetime.now().strftime('%H:%M:%S')}")
    except Exception as e:
        print(f"❌ 뉴스 추천 작업 실패: {e}")
        import traceback
        traceback.print_exc()

# 뉴스 추천: 10분 간격으로 실행 (0분, 10분, 20분, 30분, 40분, 50분)
scheduler.add_job(run_recommendation_job, "cron", minute="0,10,20,30,40,50", timezone="Asia/Seoul")

# 퀴즈 추천
def run_quiz_recommendation_job():
    """퀴즈 추천 작업 실행"""
    print(f"🧩 퀴즈 추천 작업 시작 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        sender = QuizRecommendationSender()
        asyncio.run(sender.process_all_users())
        print(f"✅ 퀴즈 추천 작업 완료 - {datetime.now().strftime('%H:%M:%S')}")
    except Exception as e:
        print(f"❌ 퀴즈 추천 작업 실패: {e}")
        import traceback
        traceback.print_exc()

# 퀴즈 추천: 10분 간격으로 실행 (5분, 15분, 25분, 35분, 45분, 55분) - 뉴스와 시간 겹치지 않게
scheduler.add_job(run_quiz_recommendation_job, "cron", minute="5,15,25,35,45,55", timezone="Asia/Seoul")

# FACT 추천 슬롯 생성 요청
def run_fact_recommendation_job():
    """FACT 추천 슬롯 생성 작업 실행"""
    print(f"💡 FACT 추천 슬롯 생성 작업 시작 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        sender = FactRecommendationSender()
        asyncio.run(sender.process_all_users())
        print(f"✅ FACT 추천 슬롯 생성 작업 완료 - {datetime.now().strftime('%H:%M:%S')}")
    except Exception as e:
        print(f"❌ FACT 추천 슬롯 생성 작업 실패: {e}")
        import traceback
        traceback.print_exc()

# FACT 추천: 10분 간격으로 실행 (3분, 13분, 23분, ...)
scheduler.add_job(run_fact_recommendation_job, "cron", minute="3,13,23,33,43,53", timezone="Asia/Seoul")


# 스케줄러 로딩 확인
print("=" * 50)
print("📢 SCHEDULER MODULE LOADING...")
print("=" * 50)
print("✅ 뉴스 크롤링: 매일 0시, 6시, 12시, 18시")
print("✅ 뉴스 추천: 10분 간격")
print("✅ 퀴즈 추천: 10분 간격 (5분 오프셋)")
print("✅ FACT 추천 슬롯 생성: 10분 간격 (3분 오프셋)")
print("=" * 50)

# 스케줄러는 lifespan에서 시작됩니다
