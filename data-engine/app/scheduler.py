from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
from datetime import datetime
from .news.crawler import main
from .news.recommendation_sender import BackendRecommendationSender

scheduler = BackgroundScheduler()

# 뉴스 크롤링: 매일 0시, 6시, 12시, 18시에 실행
# scheduler.add_job(main, "cron", hour="0,6,12,18", minute=0, timezone="Asia/Seoul")

# 뉴스 추천
def run_recommendation_job():
    """뉴스 추천 작업 실행"""
    print(f"🚀 뉴스 추천 작업 시작 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        sender = BackendRecommendationSender()
        asyncio.run(sender.process_all_users())
        print(f"✅ 뉴스 추천 작업 완료 - {datetime.now().strftime('%H:%M:%S')}")
    except Exception as e:
        print(f"❌ 뉴스 추천 작업 실패: {e}")
        import traceback
        traceback.print_exc()

# 뉴스 추천: 10분 간격으로 실행 (0분, 10분, 20분, 30분, 40분, 50분)
# scheduler.add_job(run_recommendation_job, "cron", minute="0,10,20,30,40,50", timezone="Asia/Seoul")


# 스케줄러 로딩 확인
print("=" * 50)
print("📢 SCHEDULER MODULE LOADING...")
print("=" * 50)
print("✅ 뉴스 크롤링: 매일 0시, 6시, 12시, 18시")
print("✅ 뉴스 추천: 10분 간격")
print("=" * 50)

# 스케줄러는 lifespan에서 시작됩니다