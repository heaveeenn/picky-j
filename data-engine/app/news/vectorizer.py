"""
뉴스 벡터화 모듈
뉴스 본문을 임베딩하여 사용자 관심사와 매칭
"""

from ..vectorization.embeddings import embedding_service
from ..vectorization.qdrant_client import QdrantService


class NewsVectorizer:
    """뉴스 벡터화 서비스"""
    
    def __init__(self):
        self.qdrant_service = QdrantService()
    
    async def vectorize(self, news_data: dict) -> dict:
        """뉴스 데이터를 벡터화하여 반환"""
        # TODO: 뉴스 데이터 구조가 정의되면 구현
        
        # 예상 구조:
        # news_data = {
        #     "news_id": "...",
        #     "title": "...",
        #     "content": "...",
        #     "summary": "...",
        #     "category": "...",
        #     "published_at": "..."
        # }
        
        # 뉴스 본문 텍스트 준비
        text_to_embed = self._prepare_news_text(news_data)
        
        if not text_to_embed:
            return {"success": False, "message": "임베딩할 뉴스 텍스트가 없습니다."}
        
        try:
            # 임베딩 생성
            vector = await embedding_service.encode(text_to_embed)
            
            # 벡터화 결과 구성
            vectorization_result = {
                "vector": vector,
                "metadata": {
                    "news_id": news_data.get("news_id"),
                    "title": news_data.get("title"),
                    "category": news_data.get("category"),
                    "published_at": news_data.get("published_at"),
                    "source": news_data.get("source", "unknown")
                }
            }
            
            return {
                "success": True,
                "message": "뉴스 벡터화 완료",
                "result": vectorization_result
            }
            
        except Exception as e:
            return {"success": False, "message": f"뉴스 벡터화 실패: {str(e)}"}
    
    def _prepare_news_text(self, news_data: dict) -> str:
        """뉴스 데이터에서 임베딩용 텍스트 준비"""
        # TODO: 실제 뉴스 데이터 구조에 맞게 수정 필요
        
        title = news_data.get("title", "")
        summary = news_data.get("summary", "")
        content = news_data.get("content", "")
        
        # 제목 + 요약 + 본문 일부를 결합
        combined_text = ""
        if title:
            combined_text += title
        if summary:
            combined_text += " " + summary
        if content:
            # 본문은 2000자까지만 사용
            combined_text += " " + content[:2000]
        
        return combined_text.strip()
    
    async def save_to_qdrant(self, vectorization_result: dict):
        """Qdrant에 뉴스 벡터 저장"""
        try:
            collection_name = "news"
            
            await self.qdrant_service.save_vectors_with_metadata(
                collection_name, 
                [vectorization_result["vector"]], 
                [vectorization_result["metadata"]]
            )
            
            print(f"[저장완료] 뉴스 벡터가 Qdrant 컬렉션 '{collection_name}'에 저장됨")
            
        except Exception as e:
            print(f"[저장실패] 뉴스 벡터 저장 실패: {e}")
            raise