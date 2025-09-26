"""
뉴스 요약 서비스
KoBART-summary-v3 모델을 사용한 한국어 뉴스 요약
"""

import logging
import time
import asyncio
import os
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor

import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

logger = logging.getLogger(__name__)


class NewsSummarizationService:
    """뉴스 요약 서비스"""

    def __init__(self,
                 model_name: str = "EbanLee/kobart-summary-v3"):
        """
        Args:
            model_name: 사용할 요약 모델명
        """
        self.model_name = model_name
        self.pipe = None
        self.executor = ThreadPoolExecutor(max_workers=4)  # CPU 멀티스레딩
        self._initialize_model()

    def _initialize_model(self):
        """모델 초기화"""
        try:
            logger.info(f"[요약 모델] 로딩 시작: {self.model_name}")

            # 환경변수 기반 디바이스 설정
            force_cpu = os.getenv("FORCE_CPU", "false").lower() == "true"

            # 토크나이저 로드
            tokenizer = AutoTokenizer.from_pretrained(self.model_name)

            # 모델 로드 후 디바이스/정밀도 설정 (torch_dtype 인자 사용 안 함)
            model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)

            if force_cpu or not torch.cuda.is_available():
                model = model.to(dtype=torch.float32)
                device = -1
                logger.info("[요약 모델] CPU 모드로 로딩")
            else:
                model = model.to(device=torch.device("cuda:0"), dtype=torch.float16)
                device = 0
                logger.info("[요약 모델] GPU 모드로 로딩")

            # pipeline 생성
            self.pipe = pipeline(
                "summarization",
                model=model,
                tokenizer=tokenizer,
                device=device
            )
            logger.info("[요약 모델] 로딩 완료!")

        except Exception as e:
            error_msg = f"[요약 모델] 로딩 실패: {e}"
            logger.error(error_msg)
            self.pipe = None
            raise RuntimeError(f"요약 모델 로딩 실패: {self.model_name}. 원인: {e}")

    def summarize_single(self, text: str, max_length: int = 120, min_length: int = 60) -> Optional[str]:
        """단일 텍스트 요약 (GPT 권장사항 적용)"""
        if not self.pipe:
            logger.error("모델이 로드되지 않았습니다.")
            return None

        try:
            if len(text.strip()) < 100:  # 너무 짧은 텍스트는 스킵
                return text[:max_length]

            start_time = time.time()
            # GPT 권장: 안정성/완결성 우선 설정
            generation_kwargs = {
                "num_beams": 5,                    # beam search
                "do_sample": False,                # 일관성 우선
                "max_new_tokens": max_length,      # 3줄 요약용 120토큰
                "no_repeat_ngram_size": 3,         # 반복 방지
                "length_penalty": 1.0,             # 길이 페널티
                "repetition_penalty": 1.07,        # 반복 방지 보정
                "early_stopping": True,            # beam search에서 조기 종료
                "eos_token_id": self.pipe.tokenizer.eos_token_id,
                "pad_token_id": self.pipe.tokenizer.pad_token_id,
            }

            # min_new_tokens 지원 여부 체크
            try:
                generation_kwargs["min_new_tokens"] = min_length
            except:
                # 버전이 낮으면 min_length 사용
                generation_kwargs["min_length"] = min_length

            # 입력 텍스트 전처리 (truncation은 여기서만 사용)
            if len(text) > 2000:  # 너무 긴 텍스트 제한
                text = text[:2000]

            result = self.pipe(
                text,
                **generation_kwargs,
            )

            processing_time = time.time() - start_time

            # 결과 검증 후 안전하게 추출
            if not result or len(result) == 0:
                logger.error(f"[요약 실패] 모델이 빈 결과를 반환했습니다.")
                return "요약 실패"

            if "summary_text" not in result[0]:
                logger.error(f"[요약 실패] 결과에 summary_text가 없습니다: {result}")
                return "요약 실패"

            summary = result[0]["summary_text"]

            # 3줄 요약 사후 정제 (GPT 권장사항)
            summary = self._post_process_summary(summary)

            logger.info(f"[요약 완료] {processing_time:.2f}초 소요")
            return summary.strip()

        except Exception as e:
            logger.error(f"[요약 실패] {e}")
            return None

    def _post_process_summary(self, summary: str) -> str:
        """3줄 요약 사후 정제 (GPT 권장사항)"""
        if not summary:
            return summary

        # 불완전한 문장 마무리 처리
        summary = summary.strip()

        # 마침표로 끝나지 않는 경우 마침표 추가 (문장 완결성)
        if not summary.endswith(('.', '!', '?', '다', '요')):
            summary += '.'

        # 3줄 형태로 정리 (줄바꿈 기준)
        lines = summary.split('\n')
        lines = [line.strip() for line in lines if line.strip()]

        # 3줄 초과시 처리
        if len(lines) > 3:
            lines = lines[:3]

        # 각 줄이 너무 짧으면 합치기
        if len(lines) > 1:
            combined_lines = []
            current_line = ""

            for line in lines:
                if len(current_line + " " + line) < 80 and len(combined_lines) < 3:
                    current_line = (current_line + " " + line).strip()
                else:
                    if current_line:
                        combined_lines.append(current_line)
                    current_line = line

            if current_line:
                combined_lines.append(current_line)

            lines = combined_lines[:3]

        return '\n'.join(lines)

    def _summarize_batch_sync(self, texts: List[str], max_length: int = 100) -> List[Optional[str]]:
        """동기 배치 요약 (내부용)"""
        return [self.summarize_single(text, max_length) for text in texts]

    async def summarize_batch(self, texts: List[str], max_length: int = 100, batch_size: int = 10) -> List[Optional[str]]:
        """비동기 배치 요약"""
        if not texts:
            return []

        logger.info(f"[배치 요약] {len(texts)}개 텍스트 처리 시작")
        start_time = time.time()

        all_results = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            loop = asyncio.get_event_loop()
            batch_results = await loop.run_in_executor(
                self.executor,
                self._summarize_batch_sync,
                batch,
                max_length
            )

            all_results.extend(batch_results)
            logger.info(f"[배치 진행] {i + len(batch)}/{len(texts)} 완료")

        total_time = time.time() - start_time
        success_count = sum(1 for r in all_results if r is not None)

        logger.info(f"[배치 완료] {success_count}/{len(texts)} 성공, {total_time:.2f}초 소요")
        return all_results

    async def summarize_news_articles(self, articles: List[Dict]) -> List[Dict]:
        """뉴스 기사 배치 요약"""
        if not articles:
            return []

        texts_to_summarize = []
        for article in articles:
            title = article.get("title", "")
            content = article.get("content", "")
            combined_text = f"{title}\n\n{content}" if title else content
            texts_to_summarize.append(combined_text)

        summaries = await self.summarize_batch(texts_to_summarize)

        result_articles = []
        for article, summary in zip(articles, summaries):
            article_with_summary = article.copy()
            article_with_summary["summary"] = summary
            article_with_summary["summary_generated_at"] = time.time()
            result_articles.append(article_with_summary)

        return result_articles


# 전역 싱글톤
_summarization_service = None

def get_summarization_service() -> NewsSummarizationService:
    """요약 서비스 싱글톤 인스턴스 반환"""
    global _summarization_service
    if _summarization_service is None:
        try:
            _summarization_service = NewsSummarizationService()
        except RuntimeError as e:
            logger.error(f"요약 서비스 초기화 실패: {e}")
            # 빈 서비스 객체 생성 (pipe=None 상태)
            _summarization_service = NewsSummarizationService.__new__(NewsSummarizationService)
            _summarization_service.model_name = "EbanLee/kobart-summary-v3"
            _summarization_service.pipe = None
            _summarization_service.executor = ThreadPoolExecutor(max_workers=4)
    return _summarization_service
