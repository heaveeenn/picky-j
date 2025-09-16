#!/usr/bin/env python3
"""
뉴스 요약 모델 테스트 코드
EbanLee/kobart-summary-v3 모델 테스트
"""

import sys

# 프로젝트 루트를 Python path에 추가
sys.path.append('/app')

from app.news.summarization import get_summarization_service


def test_summarization():
    """요약 모델 테스트"""

    # 하드코딩된 테스트 뉴스 (여기에 원하는 뉴스 입력)
    test_news = {
        "title": """
        [공식] 세븐틴 호시 입대 당일 전해진 선행…"1억원 또 기부"
        """,
        "content": """
        [마이데일리 = 이승길 기자] 그룹 세븐틴 멤버 호시가 아동·청소년을 위한 교육 인프라 구축에 또 한 번 힘을 보탰다.

경기사회복지공동모금회 북부사업본부(이하 경기북부 사랑의열매)는 호시가 최근 1억원을 기부했다고 16일 밝혔다. 성금은 잠비아 은돌라 만산사 공립학교 교실 신축과 리모델링에 사용된다.

만산사 공립학교는 유치원부터 7학년까지 약 350명이 재학 중인 곳으로, 그간 단 2개의 교실만 운영되고 있었다. 호시와 부모님은 학생들이 더욱 안정적인 교육 환경에서 꿈을 키울 수 있도록 2개 동 5개 교실을 신축해 기증하기로 했다. 그는 지난해에도 경기북부 사랑의열매에 1억원을 건네 라오스 루아프라방고아학교 시설 개선을 지원한 바 있다.

호시는 “성장하는 아이들에게 조금이나마 힘과 응원을 주고 싶다”라며 “새롭게 지어질 교실에서 아이들이 더 건강하게 꿈을 키울 수 있기를 바란다”라고 전했다.

호시는 데뷔 후 꾸준히 나눔을 실천하며 선한 영향력을 펼치고 있다. 2021년에는 1억원을 기부해 사랑의열매 아너 소사이어티(1억원 이상 고액 개인기부자 모임) 회원으로 가입했으며, 각종 재난·재해로 인한 피해 회복과 지역 사회 소외계층 및 아동·청소년을 위한 후원에도 적극 동참해왔다. 그가 속한 세븐틴 역시 K-팝 아티스트 최초로 유네스코 청년 친선대사로 임명돼 전 세계 청년들을 위해 100만 달러 규모의 기금을 조성하는 등 사회 공헌 활동에 앞장서고 있다.
한편, 호시는 이날 육군 현역 복무를 위해 군 훈련소에 입소, 기초군사훈련을 받는다. 호시의 입대는 세븐틴 멤버 중 네 번째다. 정한, 원우가 병역 의무를 이행 중이다. 앞서 전날엔 우지가 현역으로 입대했다.
        """
    }

    print("🤖 뉴스 요약 모델 테스트")
    print(f"📋 모델: EbanLee/kobart-summary-v3")
    print("=" * 60)

    try:
        # 요약 서비스 가져오기
        print("🔄 요약 서비스 초기화 중...")
        summarization_service = get_summarization_service()

        if not summarization_service.pipe:
            print("❌ 요약 모델이 로드되지 않았습니다!")
            return

        print("✅ 요약 서비스 초기화 완료!")

        # 뉴스 요약
        print(f"\n📰 제목: {test_news['title']}")
        print(f"📝 원문 길이: {len(test_news['content'].strip())}자")
        print("🔄 요약 생성 중...")

        combined_text = f"{test_news['title']}\n\n{test_news['content']}"
        summary = summarization_service.summarize_single(
            combined_text,
            max_length=100,
            min_length=30
        )

        if summary:
            print("✅ 요약 완료!")
            print(f"📋 요약문: {summary}")
            print(f"📊 요약문 길이: {len(summary)}자")

            # 압축률 계산
            compression_ratio = len(summary) / len(combined_text) * 100
            print(f"📉 압축률: {compression_ratio:.1f}%")
        else:
            print("❌ 요약 실패!")

    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()

    print("\n🎉 테스트 완료!")


if __name__ == "__main__":
    test_summarization()