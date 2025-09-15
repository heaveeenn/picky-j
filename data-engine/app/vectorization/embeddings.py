"""
공통 임베딩 모델 로직
HiEmbed ONNX 모델을 활용한 벡터화
"""

import os
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List

import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer
from huggingface_hub import snapshot_download

logger = logging.getLogger(__name__)


class EmbeddingService:
    """공통 임베딩 서비스 - 모든 도메인에서 사용"""

    def __init__(self, model_name: str = "HancomInSpaceAI/HiEmbed_base_onnx_v1"):
        self.model_name = model_name
        self.tokenizer = None
        self.ort_session = None
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._initialize_model()

    def _initialize_model(self):
        """모델 초기화"""
        try:
            logger.info(f"[임베딩 모델] 로딩 시작: {self.model_name}")

            docker_model_path = "/app/models/HiEmbed"
            if os.path.exists(docker_model_path):
                # Docker 빌드 시 다운로드한 모델 사용
                model_dir = docker_model_path
                logger.info(f"[Docker] 로컬 모델 사용: {model_dir}")
            else:
                # 개발 환경: Hugging Face Hub에서 다운로드 (캐시 재사용)
                model_dir = snapshot_download(repo_id=self.model_name)
                logger.info(f"[Dev] 모델 다운로드 완료: {model_dir}")

            model_path = os.path.join(model_dir, "model.onnx")

            # 토크나이저 로드
            self.tokenizer = AutoTokenizer.from_pretrained(model_dir)

            # ONNX Runtime 세션 생성 (CPU 전용)
            self.ort_session = ort.InferenceSession(
                model_path,
                providers=["CPUExecutionProvider"]
            )

            logger.info("[임베딩 모델] 로딩 완료!")

        except Exception as e:
            error_msg = f"[임베딩 모델] 로딩 실패: {e}"
            logger.error(error_msg)
            self.ort_session = None
            raise RuntimeError(error_msg)


    def _encode_sync(self, texts: List[str]) -> List[List[float]]:
        """동기식 텍스트 벡터화"""
        if not self.ort_session or not self.tokenizer:
            raise RuntimeError("모델이 초기화되지 않았습니다.")

        # 토크나이징
        inputs = self.tokenizer(
            texts,
            return_tensors="np",
            truncation=True,
            padding=True,
            max_length=512
        )

        # ONNX 입력 타입 강제 변환
        ort_inputs = {
            "input_ids": inputs["input_ids"].astype(np.int64),
            "attention_mask": inputs["attention_mask"].astype(np.int64),
        }

        # 추론
        outputs = self.ort_session.run(None, ort_inputs)
        embeddings = outputs[0]

        # L2 정규화
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings.tolist()

    async def encode(self, text: str) -> List[float]:
        """단일 텍스트를 벡터로 변환"""
        loop = asyncio.get_event_loop()
        vectors = await loop.run_in_executor(self.executor, self._encode_sync, [text])
        return vectors[0]

    async def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """텍스트 리스트를 벡터로 변환 (배치)"""
        loop = asyncio.get_event_loop()
        vectors = await loop.run_in_executor(self.executor, self._encode_sync, texts)
        return vectors


# 전역 임베딩 서비스 인스턴스
embedding_service = EmbeddingService()
