FROM python:3.11-slim

WORKDIR /app

# 1. 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# 2. requirements.txt 먼저 복사 → 캐시 활용
COPY requirements.txt .

# 3. PyTorch / TorchVision CPU wheel 우선 설치 (빠르게)
RUN pip install --no-cache-dir \
    torch==2.8.0 \
    torchvision==0.23.0 \
    --extra-index-url https://download.pytorch.org/whl/cpu

# 4. 나머지 Python 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# 4.5 Hugging Face Hub 설치 (모델 다운로드용)
RUN pip install --no-cache-dir huggingface_hub

# 4.6 모델 다운로드 (빌드 시점)
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download('HancomInSpaceAI/HiEmbed_base_onnx_v1', local_dir='/app/models/HiEmbed')"

# 5. 소스코드 복사
COPY . .

EXPOSE 8000

# 6. 실행 커맨드
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
