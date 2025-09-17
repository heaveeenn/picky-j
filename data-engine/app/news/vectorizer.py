"""News vectorization utilities for Qdrant ingestion."""

from __future__ import annotations

import hashlib
from typing import Dict, List, Tuple
from urllib.parse import urlparse

from ..vectorization.qdrant_client import QdrantService

try:
    from ..vectorization import embeddings as _embeddings_module

    embedding_service = _embeddings_module.embedding_service
    _EMBEDDING_INIT_ERROR = None
except RuntimeError as exc:  # pragma: no cover - configuration dependent
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

    async def vectorize_and_save_batch(
        self,
        news_items: List[Dict],
        batch_size: int = 16,
        embedding_version: str = "news-v1",
    ) -> Dict[str, int]:
        """Encode news articles in batches and persist them to Qdrant.

        Args:
            news_items: List of news dicts that already contain summaries.
            batch_size: Number of items to embed per API call.
            embedding_version: Payload marker for traceability.

        Returns:
            Dictionary with simple statistics (processed/embedded/skipped).
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
        summary = (news_data.get("summary") or "").strip()
        content = (news_data.get("body") or news_data.get("content") or "").strip()
        url = self._extract_url(news_data)

        metadata = {
            "title": news_data.get("title", ""),
            "url": url,
            "origin_url": news_data.get("originallink") or news_data.get("origin_url"),
            "category": news_data.get("category"),
            "keyword": news_data.get("keyword"),
            "summary": summary,
            "summary_length": len(summary),
            "body_length": len(content),
            "published_at": news_data.get("published_at"),
            "crawled_at": news_data.get("created_at"),
            "source": news_data.get("source") or self._deduce_source(url),
            "embedding_version": embedding_version,
        }

        return metadata

    def _generate_point_id(self, news_data: Dict, metadata: Dict) -> str:
        if "id" in news_data and news_data["id"]:
            return str(news_data["id"])

        candidate = metadata.get("url") or news_data.get("link") or news_data.get("title") or "news"
        digest = hashlib.md5(candidate.encode("utf-8")).hexdigest()
        return f"news:{digest}"

    def _extract_url(self, news_data: Dict) -> str:
        return news_data.get("link") or news_data.get("url") or news_data.get("originallink") or ""

    def _deduce_source(self, url: str) -> str:
        if not url:
            return "unknown"

        parsed = urlparse(url)
        return parsed.netloc or "unknown"
