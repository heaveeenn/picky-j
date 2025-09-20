FROM python:3.11.9-slim

WORKDIR /app

# 1. 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# 2. pip 최신화 (캐시 레이어)
RUN pip install --no-cache-dir --upgrade pip

# 3. requirements.txt 먼저 복사 → 캐시 활용
COPY requirements.txt .

# 4. PyTorch 먼저 설치 (가장 큰 패키지, 캐시 중요)
RUN pip install --no-cache-dir torch==2.8.0 --extra-index-url https://download.pytorch.org/whl/cpu

# 5. transformers 관련 패키지 설치 (두 번째로 큰 패키지들)
RUN pip install --no-cache-dir \
    "transformers>=4.41.0,<5.0.0" \
    "sentencepiece>=0.1.99" \
    "safetensors>=0.4.0"


# 6. 나머지 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# 7. 모델 다운로드 스크립트 복사 및 실행 (소스코드 변경과 독립적으로 캐시)
COPY download_models.py .
RUN python download_models.py

# 8. 소스코드 복사 (맨 마지막에 복사하여 코드 변경 시 캐시 활용)
COPY . .

EXPOSE 8000

# 9. 실행 커맨드 (Python 출력 버퍼링 비활성화)
CMD ["python", "-u", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
