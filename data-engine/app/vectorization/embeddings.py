"""
공통 임베딩 모델 로직
GMS API를 활용한 벡터화
"""

import logging
import os
from concurrent.futures import ThreadPoolExecutor
from typing import List

import httpx

logger = logging.getLogger(__name__)


class EmbeddingService:
    """공통 임베딩 서비스 - 모든 도메인에서 사용"""

    def __init__(self, api_endpoint: str = "https://gms.ssafy.io/gmsapi/"):
        self.api_endpoint = api_endpoint
        self.api_key = os.getenv("GMS_KEY")
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._validate_config()

    def _validate_config(self):
        """GMS API 설정 검증"""
        if not self.api_key:
            raise RuntimeError("GMS_KEY 환경변수가 설정되지 않았습니다.")

        logger.info(f"[GMS API] 엔드포인트: {self.api_endpoint}")
        logger.info("[GMS API] 설정 완료!")


    async def _encode_async(self, texts: List[str]) -> List[List[float]]:
        """비동기식 텍스트 벡터화 (GMS API 사용)"""
        if not self.api_key:
            raise RuntimeError("GMS API 키가 설정되지 않았습니다.")

        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "input": texts,
                "model": "text-embedding-3-small"  # GMS에서 지원하는 모델명
            }

            response = await client.post(
                f"{self.api_endpoint}api.openai.com/v1/embeddings",
                headers=headers,
                json=payload,
                timeout=30.0
            )

            if response.status_code != 200:
                raise RuntimeError(f"GMS API 호출 실패: {response.status_code} - {response.text}")

            result = response.json()
            embeddings = [item["embedding"] for item in result["data"]]
            return embeddings

    async def encode(self, text: str) -> List[float]:
        """단일 텍스트를 벡터로 변환"""
        vectors = await self._encode_async([text])
        return vectors[0]

    async def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """텍스트 리스트를 벡터로 변환 (배치)"""
        return await self._encode_async(texts)


# 전역 임베딩 서비스 인스턴스
embedding_service = EmbeddingService()