"""뉴스 벡터화 및 Qdrant 저장 유틸리티"""

from __future__ import annotations

import hashlib
from typing import Dict, List, Tuple
from urllib.parse import urlparse

from ..vectorization.qdrant_client import QdrantService

try:
    from ..vectorization import embeddings as _embeddings_module

    embedding_service = _embeddings_module.embedding_service
    _EMBEDDING_INIT_ERROR = None
except RuntimeError as exc:  # 설정에 따른 예외
    embedding_service = None
    _EMBEDDING_INIT_ERROR = exc


class NewsVectorizer:
    """뉴스 벡터화 서비스"""

    def __init__(self):
        self.qdrant_service = QdrantService()
        self.collection_name = "news"

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
            if not embedding_service:
                raise RuntimeError(f"Embedding service unavailable: {_EMBEDDING_INIT_ERROR}")
            # 임베딩 생성
            vector = await embedding_service.encode(text_to_embed)
            
            # 벡터화 결과 구성
            vectorization_result = {
                "vector": vector,
                "metadata": {
                    "news_id": news_data.get("id"),
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

    async def vectorize_and_save_batch(
        self,
        news_items: List[Dict],
        batch_size: int = 16,
        embedding_version: str = "news-v1",
    ) -> Dict[str, int]:
        """뉴스 기사들을 배치로 인코딩하여 Qdrant에 저장

        Args:
            news_items: 요약이 포함된 뉴스 딕셔너리 리스트
            batch_size: API 호출당 임베딩할 항목 수
            embedding_version: 추적용 페이로드 마커

        Returns:
            처리 통계가 담긴 딕셔너리 (processed/embedded/skipped)
        """

        stats = {"processed": len(news_items), "embedded": 0, "skipped": 0}

        prepared_entries: List[Tuple[str, Dict, str]] = []
        for item in news_items:
            text = self._prepare_news_text(item)
            if not text:
                stats["skipped"] += 1
                continue

            metadata = self._build_metadata(item, embedding_version)
            point_id = self._generate_point_id(item, metadata)
            prepared_entries.append((text, metadata, point_id))

        if not prepared_entries:
            return stats

        for start in range(0, len(prepared_entries), batch_size):
            chunk = prepared_entries[start : start + batch_size]

            texts = [entry[0] for entry in chunk]
            metadatas = [entry[1] for entry in chunk]
            point_ids = [entry[2] for entry in chunk]

            if not embedding_service:
                raise RuntimeError(f"Embedding service unavailable: {_EMBEDDING_INIT_ERROR}")

            vectors = await embedding_service.encode_batch(texts)
            await self.qdrant_service.save_vectors_with_metadata_and_ids(
                self.collection_name,
                vectors,
                metadatas,
                point_ids,
            )

            stats["embedded"] += len(chunk)

        return stats

    def _build_metadata(self, news_data: Dict, embedding_version: str) -> Dict:
        """뉴스 메타데이터 생성 - news_id만 저장하여 용량 최적화"""
        metadata = {
            "news_id": news_data.get("id"),
            "embedding_version": embedding_version,
        }

        return metadata

    def _generate_point_id(self, news_data: Dict, metadata: Dict) -> str:
        if "id" in news_data and news_data["id"]:
            return news_data["id"]  # 정수 그대로 반환

        # Qdrant는 UUID 또는 정수만 허용하므로 URL 기반 결정적 UUID 생성
        candidate = metadata.get("url") or news_data.get("link") or news_data.get("title") or "news"
        # MD5 해시를 UUID 형식으로 변환
        digest = hashlib.md5(candidate.encode("utf-8")).hexdigest()
        # 32자리 hex를 UUID 형식으로 변환 (8-4-4-4-12)
        uuid_str = f"{digest[:8]}-{digest[8:12]}-{digest[12:16]}-{digest[16:20]}-{digest[20:32]}"
        return uuid_str

    def _extract_url(self, news_data: Dict) -> str:
        return news_data.get("link") or news_data.get("url") or news_data.get("originallink") or ""

    def _deduce_source(self, url: str) -> str:
        if not url:
            return "unknown"

        parsed = urlparse(url)
        return parsed.netloc or "unknown"

