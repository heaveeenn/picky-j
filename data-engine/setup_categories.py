#!/usr/bin/env python3
"""
17개 카테고리를 Qdrant에 벡터화하여 저장하는 초기화 스크립트
배포 환경에서 Qdrant 서버 실행 후 최초 1회만 실행
"""

import asyncio
import logging
from typing import Dict
from app.vectorization.embeddings import embedding_service
from app.vectorization.qdrant_client import QdrantService

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 17개 카테고리 정의 (crawler.py와 동일)
CATEGORIES = [
    "정치", "사회", "경제", "기술", "과학", "건강",
    "교육", "문화", "엔터테인먼트", "스포츠", "역사",
    "환경", "여행", "생활", "가정", "종교", "철학"
]

# 카테고리별 상세 키워드
CATEGORY_DESCRIPTIONS = {
    "정치": "정부 대통령 국회 총리 장관 선거 정당 외교 국방 안보 정책 개헌 비리",
    "사회": "노동 인권 복지 범죄 경찰 검찰 재판 사건사고 안전 재난 시위 갈등 실업",
    "경제": "경제 금융 증권 투자 기업 산업 무역 부동산 건설 물가 환율 고용 무역협정 스타트업",
    "기술": "IT 인공지능 소프트웨어 하드웨어 반도체 데이터 통신 로봇 사이버보안 블록체인 클라우드 스타트업 메타버스 5G",
    "과학": "과학기술 물리학 화학 생명과학 지구과학 천문학 우주 연구개발 실험 유전자 의학연구 기후과학 신소재",
    "건강": "건강 질병 의료 병원 의약품 백신 영양 운동 정신건강 공중보건 예방 다이어트",
    "교육": "교육 학교 대학 입시 수능 교사 학생 학원 평생교육 온라인교육 장학금 교과서 교육정책",
    "문화": "문화 문학 예술 공연 전시 전통문화 미술 영화제 언어 축제 창작 예술가",
    "엔터테인먼트": "연예 영화 드라마 음악 K-pop 아이돌 방송 예능 게임 웹툰 OTT 팬덤 스타",
    "스포츠": "스포츠 축구 야구 농구 배구 골프 올림픽 월드컵 e스포츠 체육 테니스 마라톤 선수단",
    "역사": "역사 한국사 세계사 고대사 근현대사 고고학 역사인물 전쟁사 문화재 역사교육 독립운동 유적",
    "환경": "환경 기후변화 탄소중립 재활용 에너지 대기오염 수질오염 생태계 자연재해 환경정책 미세먼지 친환경 지속가능성",
    "여행": "여행 관광 국내여행 해외여행 호텔 항공 교통 맛집 여행후기 여행정보 배낭여행 관광지",
    "생활": "생활 요리 패션 뷰티 인테리어 반려동물 취미 운동 원예 라이프스타일 소비 쇼핑 서비스",
    "가정": "가정 연애 결혼 신혼 육아 자녀교육 가족관계 부부 부모 청소년 가사 돌봄",
    "종교": "종교 기독교 불교 천주교 이슬람 종교행사 종교갈등 신앙 명상 영성 사찰 교회",
    "철학": "철학 윤리 인문학 정치철학 사회철학 동양철학 서양철학 가치관 도덕 사상 철학자 진리"
}


class CategoryInitializer:
    """카테고리 초기화 클래스"""

    def __init__(self):
        self.qdrant_service = QdrantService()
        self.collection_name = "user_logs"  # 사용자 로그와 같은 컬렉션에 저장

    async def setup_categories(self) -> Dict:
        """17개 카테고리를 Qdrant에 벡터화하여 저장"""
        logger.info("🎯 카테고리 벡터화 초기화 시작")

        try:
            # 1. 카테고리별 임베딩용 텍스트 준비
            category_texts = []
            for category in CATEGORIES:
                # 카테고리명 + 상세 설명으로 임베딩 품질 향상
                full_text = f"{category} {CATEGORY_DESCRIPTIONS[category]}"
                category_texts.append(full_text)

            logger.info(f"📝 {len(category_texts)}개 카테고리 텍스트 준비 완료")

            # 2. 배치 임베딩 생성
            logger.info("🔄 카테고리 벡터화 시작...")
            vectors = await embedding_service.encode_batch(category_texts)
            logger.info(f"✅ {len(vectors)}개 카테고리 벡터 생성 완료")

            # 3. 메타데이터 준비
            metadatas = []
            point_ids = []

            for i, category in enumerate(CATEGORIES):
                metadata = {
                    "category_name": category,
                    "category_id": i,
                    "data_source": "category",  # 카테고리임을 명시
                    "description": CATEGORY_DESCRIPTIONS[category],
                    "is_reference": True  # 참조용 데이터임을 표시
                }
                metadatas.append(metadata)
                point_ids.append(i)  # 정수 ID (0, 1, 2, ...)

            # 4. Qdrant에 저장
            logger.info(f"💾 Qdrant '{self.collection_name}' 컬렉션에 저장 중...")
            await self.qdrant_service.save_vectors_with_metadata_and_ids(
                self.collection_name, vectors, metadatas, point_ids
            )

            logger.info("🎉 카테고리 초기화 완료!")

            return {
                "success": True,
                "message": "17개 카테고리 벡터화 및 저장 완료",
                "categories": CATEGORIES,
                "collection": self.collection_name,
                "total_vectors": len(vectors)
            }

        except Exception as e:
            logger.error(f"❌ 카테고리 초기화 실패: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def verify_categories(self) -> Dict:
        """저장된 카테고리 확인"""
        try:
            # 카테고리 데이터 조회 테스트
            results = []
            for i, category in enumerate(CATEGORIES):
                point_id = i  # 정수 ID 사용
                point = await self.qdrant_service.get_point(self.collection_name, point_id)
                if point:
                    results.append({
                        "category": category,
                        "found": True,
                        "vector_dim": len(point["vector"])
                    })
                else:
                    results.append({
                        "category": category,
                        "found": False
                    })

            success_count = sum(1 for r in results if r["found"])

            return {
                "success": success_count == len(CATEGORIES),
                "total_categories": len(CATEGORIES),
                "found_categories": success_count,
                "results": results
            }

        except Exception as e:
            logger.error(f"❌ 카테고리 검증 실패: {e}")
            return {
                "success": False,
                "error": str(e)
            }


async def main():
    """메인 실행 함수"""
    initializer = CategoryInitializer()

    # 카테고리 초기화
    result = await initializer.setup_categories()
    print("=" * 50)
    print("카테고리 초기화 결과:")
    print(result)

    if result["success"]:
        # 검증
        print("\n" + "=" * 50)
        print("저장 확인 중...")
        verify_result = await initializer.verify_categories()
        print("검증 결과:")
        print(verify_result)


if __name__ == "__main__":
    asyncio.run(main())