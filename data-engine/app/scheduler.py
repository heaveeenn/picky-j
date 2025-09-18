from apscheduler.schedulers.background import BackgroundScheduler
from .news.crawler import main

scheduler = BackgroundScheduler()

# 매일 0시, 6시, 12시, 18시에 실행
scheduler.add_job(main, "cron", hour="0,6,12,18", minute=0, timezone="Asia/Seoul")

# test
# scheduler.add_job(main, "interval", minutes=1)