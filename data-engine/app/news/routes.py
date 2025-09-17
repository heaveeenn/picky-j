"""
뉴스 관련 API 엔드포인트 (추천, 요약 등)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
import time

from .summarization import get_summarization_service
# from .vectorizer import NewsVectorizer  # TODO: Qdrant 저장 재활성화 시 주석 해제

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/news", tags=["news"])

# Pydantic 모델들
class TextSummaryRequest(BaseModel):
    text: str
    max_length: Optional[int] = 100
    min_length: Optional[int] = 30

class TextSummaryResponse(BaseModel):
    summary: str
    processing_time: float

class NewsArticle(BaseModel):
    title: Optional[str] = ""
    content: str
    url: Optional[str] = ""
    source: Optional[str] = ""

class BatchSummarizationRequest(BaseModel):
    articles: List[NewsArticle]
    max_length: Optional[int] = 100
    batch_size: Optional[int] = 10

class BatchSummarizationResponse(BaseModel):
    results: List[dict]
    total_processed: int
    success_count: int
    processing_time: float
    vectorized_count: int = 0
    vectorized_skipped: int = 0

# news_vectorizer = NewsVectorizer()  # TODO: Qdrant 저장 재활성화 시 주석 해제

# 요약 관련 엔드포인트들
@router.post("/summarize/single", response_model=TextSummaryResponse)
async def summarize_single_text(request: TextSummaryRequest):
    """단일 텍스트 요약"""
    try:
        service = get_summarization_service()

        if not service.pipe:
            raise HTTPException(status_code=503, detail="요약 모델이 로드되지 않았습니다.")

        start_time = time.time()

        summary = service.summarize_single(
            text=request.text,
            max_length=request.max_length,
            min_length=request.min_length
        )

        if not summary:
            raise HTTPException(status_code=500, detail="요약 생성에 실패했습니다.")

        processing_time = time.time() - start_time

        return TextSummaryResponse(
            summary=summary,
            processing_time=processing_time
        )

    except Exception as e:
        logger.error(f"요약 API 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize/batch", response_model=BatchSummarizationResponse)
async def summarize_batch_texts(request: BatchSummarizationRequest):
    """배치 뉴스 요약"""
    try:
        service = get_summarization_service()

        if not service.pipe:
            raise HTTPException(status_code=503, detail="요약 모델이 로드되지 않았습니다.")

        start_time = time.time()

        # NewsArticle을 dict로 변환
        articles_dict = [article.dict() for article in request.articles]

        # 배치 요약 실행
        results = await service.summarize_news_articles(articles_dict)

        # Qdrant 저장 임시 중단
        # vectorized_count = 0
        # vectorized_skipped = 0
        # try:
        #     stats = await news_vectorizer.vectorize_and_save_batch(results)
        #     vectorized_count = stats.get("embedded", 0)
        #     vectorized_skipped = stats.get("skipped", 0)
        # except Exception as exc:
        #     logger.error(f"뉴스 벡터화 실패: {exc}")

        processing_time = time.time() - start_time
        success_count = sum(1 for r in results if r.get("summary"))

        return BatchSummarizationResponse(
            results=results,
            total_processed=len(results),
            success_count=success_count,
            processing_time=processing_time,
            # vectorized_count=vectorized_count,
            # vectorized_skipped=vectorized_skipped,
        )

    except Exception as e:
        logger.error(f"배치 요약 API 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summarize/health")
async def summarization_health():
    """요약 서비스 상태 확인"""
    try:
        service = get_summarization_service()
        model_info = service.get_model_info()

        return {
            "status": "healthy" if model_info["is_loaded"] else "unhealthy",
            "model_loaded": model_info["is_loaded"],
            "model_name": model_info["model_name"],
            "model_type": model_info["model_type"],
            "is_4bit": model_info["is_4bit"]
        }

    except Exception as e:
        logger.error(f"요약 헬스체크 오류: {e}")
        return {
            "status": "error",
            "model_loaded": False,
            "error": str(e)
        }

@router.post("/summarize/test")
async def test_summarization():
    """요약 기능 테스트"""
    test_text = """
    (서울=연합뉴스) 특별취재팀 = 연합뉴스TV에 대한 적대적 인수·합병(M&A)을 시도하는 을지재단이 사실상 박준영 회장 일가의 '족벌경영' 체제 속에 사익을 실현하는 수단으로 활용된다는 지적이 나온다.
    을지재단은 산하에 병원, 대학 등 여러 법인을 두고 있지만, 박준영 회장과 아내인 홍성희 을지대 총장이 요직을 주고받으면서 사실상 함께 경영하는 체제다.
    비영리법인으로 각종 세제 혜택을 받는 을지재단의 '족벌경영' 폐해는 여러 사례를 통해 여실히 드러나고 있다.
    """

    try:
        service = get_summarization_service()
        summary = service.summarize_single(test_text)

        return {
            "status": "success",
            "original_length": len(test_text),
            "summary": summary,
            "summary_length": len(summary) if summary else 0
        }

    except Exception as e:
        logger.error(f"요약 테스트 오류: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
