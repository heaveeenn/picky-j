from contextlib import asynccontextmanager
from ..scheduler import scheduler

@asynccontextmanager
async def lifespan(app):
    print("🚀 Starting FastAPI with APScheduler")
    scheduler.start()   # 앱 시작 시 스케줄러 실행
    yield
    print("🛑 Shutting down FastAPI, stopping scheduler")
    scheduler.shutdown()