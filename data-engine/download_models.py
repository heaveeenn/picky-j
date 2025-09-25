#!/usr/bin/env python3
"""
Docker 빌드 시 모델 사전 다운로드 스크립트
"""

import os
import logging
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_kobart_model():
    """KoBART 요약 모델 다운로드"""
    model_name = "EbanLee/kobart-summary-v3"

    try:
        logger.info(f"🔄 KoBART 모델 다운로드 시작: {model_name}")

        # 토크나이저 다운로드
        logger.info("📦 토크나이저 다운로드 중...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)

        # 모델 다운로드
        logger.info("🤖 모델 다운로드 중...")
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

        logger.info("✅ KoBART 모델 다운로드 완료!")
        logger.info(f"📍 캐시 위치: {os.path.expanduser('~/.cache/huggingface/transformers')}")

    except Exception as e:
        logger.error(f"❌ 모델 다운로드 실패: {e}")
        raise

if __name__ == "__main__":
    download_kobart_model()