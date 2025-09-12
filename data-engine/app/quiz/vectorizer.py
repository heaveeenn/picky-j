"""
퀴즈 벡터화 모듈
퀴즈 질문/선택지를 임베딩하여 사용자 관심사와 매칭
"""

from ..vectorization.embeddings import embedding_service
from ..vectorization.qdrant_client import QdrantService


class QuizVectorizer:
    """퀴즈 벡터화 서비스"""
    
    def __init__(self):
        self.qdrant_service = QdrantService()
    
    async def vectorize(self, quiz_data: dict) -> dict:
        """퀴즈 데이터를 벡터화하여 반환"""
        # TODO: 퀴즈 데이터 구조가 정의되면 구현
        
        # 예상 구조:
        # quiz_data = {
        #     "quiz_id": "...",
        #     "question": "...",
        #     "options": ["A", "B", "C", "D"],
        #     "correct_answer": "A",
        #     "explanation": "...",
        #     "category": "...",
        #     "difficulty": "easy|medium|hard"
        # }
        
        # 퀴즈 텍스트 준비
        text_to_embed = self._prepare_quiz_text(quiz_data)
        
        if not text_to_embed:
            return {"success": False, "message": "임베딩할 퀴즈 텍스트가 없습니다."}
        
        try:
            # 임베딩 생성
            vector = await embedding_service.encode(text_to_embed)
            
            # 벡터화 결과 구성
            vectorization_result = {
                "vector": vector,
                "metadata": {
                    "quiz_id": quiz_data.get("quiz_id"),
                    "question": quiz_data.get("question"),
                    "category": quiz_data.get("category"),
                    "difficulty": quiz_data.get("difficulty"),
                    "correct_answer": quiz_data.get("correct_answer")
                }
            }
            
            return {
                "success": True,
                "message": "퀴즈 벡터화 완료",
                "result": vectorization_result
            }
            
        except Exception as e:
            return {"success": False, "message": f"퀴즈 벡터화 실패: {str(e)}"}
    
    def _prepare_quiz_text(self, quiz_data: dict) -> str:
        """퀴즈 데이터에서 임베딩용 텍스트 준비"""
        # TODO: 실제 퀴즈 데이터 구조에 맞게 수정 필요
        
        question = quiz_data.get("question", "")
        options = quiz_data.get("options", [])
        explanation = quiz_data.get("explanation", "")
        
        # 질문 + 선택지 + 해설을 결합
        combined_text = ""
        if question:
            combined_text += question
        
        # 선택지들 추가
        if options:
            options_text = " ".join(options)
            combined_text += " " + options_text
        
        # 해설 추가 (1000자까지만)
        if explanation:
            combined_text += " " + explanation[:1000]
        
        return combined_text.strip()
    
    async def save_to_qdrant(self, vectorization_result: dict):
        """Qdrant에 퀴즈 벡터 저장"""
        try:
            collection_name = "quiz"
            
            await self.qdrant_service.save_vectors_with_metadata(
                collection_name, 
                [vectorization_result["vector"]], 
                [vectorization_result["metadata"]]
            )
            
            print(f"[저장완료] 퀴즈 벡터가 Qdrant 컬렉션 '{collection_name}'에 저장됨")
            
        except Exception as e:
            print(f"[저장실패] 퀴즈 벡터 저장 실패: {e}")
            raise