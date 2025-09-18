"""
Picky Data Engine - 메인 애플리케이션
기능별로 모듈화된 구조
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import connect_database, close_database
from .core.lifespan import lifespan
from .user_logs.routes import router as user_logs_router
from .news.routes import router as news_router
from .quiz.routes import router as quiz_router


# FastAPI 앱 생성
app = FastAPI(
    title=settings.APP_NAME,
    description="브라우징 데이터 수집, 뉴스 추천, 퀴즈 생성 및 벡터화 서버",
    version=settings.VERSION,
    #lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"], 
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(user_logs_router)
app.include_router(news_router)
app.include_router(quiz_router)


@app.on_event("startup")
async def startup():
    """앱 시작시 초기화"""
    await connect_database()


@app.on_event("shutdown") 
async def shutdown():
    """앱 종료시 정리"""
    await close_database()


@app.get("/")
def root():
    """루트 엔드포인트"""
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": settings.VERSION,
        "description": "기능별로 모듈화된 구조",
        "modules": ["user_logs", "news", "quiz", "vectorization", "summarization"]
    }


@app.get("/health")
def health():
    """서버 상태 확인"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)