#!/usr/bin/env python3
"""
퀴즈 벡터화 스크립트 - MySQL의 퀴즈 데이터를 Qdrant에 벡터화하여 저장
"""

import asyncio
import logging
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# .env 파일 로드
load_dotenv()

from app.vectorization.embeddings import embedding_service
from app.vectorization.qdrant_client import QdrantService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class QuizVectorizer:
    """퀴즈 벡터화 서비스"""

    def __init__(self):
        self.qdrant_service = QdrantService()
        self.collection_name = "quizzes"

        import os
        mysql_url = os.getenv("MYSQL_URL")
        if not mysql_url:
            raise ValueError("MYSQL_URL 환경변수가 설정되지 않았습니다.")

        if mysql_url.startswith("mysql://"):
            mysql_url = mysql_url.replace("mysql://", "mysql+pymysql://")

        self.engine = create_engine(mysql_url)
        self.SessionLocal = sessionmaker(bind=self.engine)

    def get_quiz_count(self) -> int:
        """전체 퀴즈 개수 조회"""
        session = self.SessionLocal()
        try:
            result = session.execute(text("SELECT COUNT(*) FROM quiz"))
            count = result.scalar()
            logger.info(f"📊 전체 퀴즈 개수: {count:,}개")
            return count
        finally:
            session.close()

    def get_quizzes_batch(self, offset: int, limit: int) -> List[Dict]:
        """배치로 퀴즈 데이터 조회"""
        session = self.SessionLocal()
        try:
            query = text("""
                SELECT id, title, question, explanation
                FROM quiz
                ORDER BY id
                LIMIT :limit OFFSET :offset
            """)

            result = session.execute(query, {"limit": limit, "offset": offset})

            quizzes = []
            for row in result:
                quizzes.append({
                    "id": row[0],
                    "title": row[1] or "",
                    "question": row[2] or "",
                    "explanation": row[3] or ""
                })

            return quizzes

        except Exception as e:
            logger.error(f"❌ 퀴즈 데이터 조회 실패: {e}")
            return []
        finally:
            session.close()

    def prepare_quiz_text(self, quiz_data: Dict) -> str:
        """퀴즈 데이터에서 벡터화용 텍스트 준비"""
        title = quiz_data.get("title", "").strip()
        question = quiz_data.get("question", "").strip()
        explanation = quiz_data.get("explanation", "").strip()

        # X문제(explanation 있음): title + explanation (올바른 정보)
        if explanation:
            return f"{title} {explanation}".strip()

        # O문제(explanation 없음): title + question (올바른 정보)
        else:
            return f"{title} {question}".strip()

    def build_metadata(self, quiz_data: Dict) -> Dict:
        """퀴즈 메타데이터 생성 - quiz_id만 저장하여 용량 최적화"""
        return {
            "quiz_id": quiz_data.get("id"),
            "embedding_version": "quiz-v1"
        }

    async def vectorize_and_save_batch(
        self,
        quizzes: List[Dict],
        batch_size: int = 32
    ) -> Dict[str, int]:
        """퀴즈 배치를 벡터화하여 Qdrant에 저장"""

        stats = {"processed": len(quizzes), "embedded": 0, "skipped": 0}

        # 텍스트와 메타데이터 준비
        prepared_entries = []
        for quiz in quizzes:
            text = self.prepare_quiz_text(quiz)
            if not text or len(text.strip()) < 10:  # 너무 짧은 텍스트는 스킵
                stats["skipped"] += 1
                continue

            metadata = self.build_metadata(quiz)
            point_id = quiz["id"]
            prepared_entries.append((text, metadata, point_id))

        if not prepared_entries:
            return stats

        # 배치 단위로 벡터화 및 저장
        for start in range(0, len(prepared_entries), batch_size):
            chunk = prepared_entries[start:start + batch_size]

            texts = [entry[0] for entry in chunk]
            metadatas = [entry[1] for entry in chunk]
            point_ids = [entry[2] for entry in chunk]

            # 재시도 로직 (최대 3번)
            max_retries = 3
            retry_count = 0
            success = False

            while retry_count < max_retries and not success:
                try:
                    if not embedding_service:
                        raise RuntimeError("Embedding service is not available")

                    # 벡터화
                    vectors = await embedding_service.encode_batch(texts)

                    # Qdrant에 저장
                    await self.qdrant_service.save_vectors_with_metadata_and_ids(
                        self.collection_name,
                        vectors,
                        metadatas,
                        point_ids
                    )

                    stats["embedded"] += len(chunk)
                    logger.info(f"✅ 배치 저장 완료: {len(chunk)}개 (총 {stats['embedded']}개)")
                    success = True

                except Exception as e:
                    retry_count += 1
                    if retry_count < max_retries:
                        wait_time = retry_count * 2  # 2초, 4초, 6초 대기
                        logger.warning(f"⚠️ 배치 실패 (시도 {retry_count}/{max_retries}): {e}")
                        logger.info(f"🔄 {wait_time}초 후 재시도...")
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"❌ 배치 저장 최종 실패 ({max_retries}번 시도): {e}")
                        stats["skipped"] += len(chunk)

        return stats

    async def vectorize_all_quizzes(self, batch_size: int = 1000, embed_batch_size: int = 32, max_quizzes: int = None):
        """모든 퀴즈를 벡터화"""
        logger.info("🚀 퀴즈 벡터화 시작")
        start_time = time.time()

        # 전체 개수 확인
        total_count = self.get_quiz_count()
        if total_count == 0:
            logger.warning("❌ 처리할 퀴즈가 없습니다.")
            return

        # 최대 처리 개수 제한
        if max_quizzes and max_quizzes < total_count:
            total_count = max_quizzes
            logger.info(f"🔢 처리 개수 제한: {max_quizzes:,}개로 설정")

        # 컬렉션 생성 확인
        try:
            self.qdrant_service.create_collection_if_not_exists(
                self.collection_name,
                vector_size=1536
            )
            logger.info(f"✅ Qdrant 컬렉션 '{self.collection_name}' 준비 완료")
        except Exception as e:
            logger.error(f"❌ Qdrant 컬렉션 생성 실패: {e}")
            return

        # 통계 초기화
        total_embedded = 0
        total_skipped = 0

        # 배치 단위로 처리
        for offset in range(0, total_count, batch_size):
            batch_num = (offset // batch_size) + 1
            total_batches = (total_count + batch_size - 1) // batch_size

            logger.info(f"📦 배치 {batch_num}/{total_batches} 처리 중... (offset: {offset})")

            # 퀴즈 데이터 조회
            quizzes = self.get_quizzes_batch(offset, batch_size)
            if not quizzes:
                logger.warning(f"⚠️ 배치 {batch_num}: 데이터 없음")
                continue

            # 벡터화 및 저장
            stats = await self.vectorize_and_save_batch(quizzes, embed_batch_size)

            total_embedded += stats["embedded"]
            total_skipped += stats["skipped"]

            # 진행률 출력
            progress = (offset + len(quizzes)) / total_count * 100
            logger.info(f"📊 진행률: {progress:.1f}% | 임베딩: {total_embedded:,}개 | 스킵: {total_skipped:,}개")

            # 배치간 짧은 대기 (API 서버 부담 완화)
            await asyncio.sleep(0.1)

        # 완료 통계
        total_time = time.time() - start_time
        logger.info("=" * 60)
        logger.info("🎉 퀴즈 벡터화 완료!")
        logger.info(f"📊 처리 결과:")
        logger.info(f"   - 전체 퀴즈: {total_count:,}개")
        logger.info(f"   - 벡터화 성공: {total_embedded:,}개")
        logger.info(f"   - 스킵: {total_skipped:,}개")
        logger.info(f"   - 소요 시간: {total_time:.1f}초")
        logger.info(f"   - 처리 속도: {total_embedded/total_time:.1f}개/초")
        logger.info("=" * 60)

async def main():
    """메인 실행 함수"""
    try:
        vectorizer = QuizVectorizer()
        await vectorizer.vectorize_all_quizzes(
            batch_size=1000,
            embed_batch_size=32,
            max_quizzes=10000
        )
    except Exception as e:
        logger.error(f"❌ 퀴즈 벡터화 실패: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())