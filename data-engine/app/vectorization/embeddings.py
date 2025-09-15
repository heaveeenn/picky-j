"""
공통 임베딩 모델 로직
GMS + LangChain을 활용한 벡터화
"""

from langchain_openai import OpenAIEmbeddings
from ..core.config import settings


class EmbeddingService:
    """공통 임베딩 서비스 - 모든 도메인에서 사용"""
    
    def __init__(self):
        if not settings.GMS_KEY:
            raise ValueError("GMS_KEY가 설정되지 않았습니다!")
        
        # LangChain OpenAI Embeddings를 GMS로 설정
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=settings.GMS_KEY,
            openai_api_base=settings.GMS_BASE_URL
        )
    
    async def encode(self, text: str) -> list[float]:
        """단일 텍스트를 벡터로 변환 (공통 인터페이스)"""
        try:
            vector = await self.embeddings.aembed_query(text)
            return vector
        except Exception as e:
            raise Exception(f"임베딩 생성 실패: {str(e)}")
    
    async def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """텍스트 리스트를 벡터로 변환 (배치 처리)"""
        try:
            vectors = await self.embeddings.aembed_documents(texts)
            return vectors
        except Exception as e:
            raise Exception(f"배치 임베딩 생성 실패: {str(e)}")


# 전역 임베딩 서비스 인스턴스
embedding_service = EmbeddingService()