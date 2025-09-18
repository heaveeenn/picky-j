import os
import sys
import urllib.request
import urllib.parse
import json
import datetime
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import re
from email.utils import parsedate_to_datetime
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from .models import News

# 프로젝트 루트를 Python path에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from news.summarization import get_summarization_service
# from news.vectorizer import NewsVectorizer  # TODO: Qdrant 저장 재활성화 시 주석 해제

# ====== 환경 설정 ======
load_dotenv()
client_id = os.environ.get('CLIENT_ID')
client_secret = os.environ.get('CLIENT_SECRET')

CATEGORY_MAP = {
    "정치": 1,
    "사회": 2,
    "경제": 3,
    "기술": 4,
    "과학": 5,
    "건강": 6,
    "교육": 7,
    "문화": 8,
    "연예": 9, 
    "스포츠": 10,
    "역사": 11,
    "환경": 12,
    "여행": 13,
    "생활": 14,
    "가정": 15,
    "종교": 16,
    "철학": 17,
}

CATEGORIES = {
    "정치": ["정부", "국회", "대통령", "총리", "장관", "선거", "정당", "외교", "국방", "안보"],
    # "사회": ["노동", "인권", "복지", "범죄", "경찰", "검찰", "재판", "사건사고", "안전", "재난"],
    # "경제": ["경제", "금융", "증권", "투자", "기업", "산업", "무역", "부동산", "건설", "물가"],
    # "기술": ["IT", "인공지능", "소프트웨어", "하드웨어", "반도체", "데이터", "통신", "로봇", "사이버보안", "블록체인"],
    # "과학": ["과학기술", "물리학", "화학", "생명과학", "지구과학", "천문학", "우주", "연구개발", "학술지", "실험"],
    # "건강": ["건강", "질병", "의료", "병원", "의약품", "백신", "영양", "운동", "정신건강", "공중보건"],
    # "교육": ["교육", "학교", "대학", "입시", "수능", "교사", "학생", "학원", "평생교육", "온라인교육"],
    # "문화": ["문화", "문학", "예술", "공연", "전시", "전통문화", "미술", "영화제", "언어", "축제"],
    # "연예": ["연예", "영화", "드라마", "음악", "K-pop", "아이돌", "방송", "예능", "게임", "웹툰"],
    # "스포츠": ["스포츠", "축구", "야구", "농구", "배구", "골프", "올림픽", "월드컵", "e스포츠", "체육"],
    # "역사": ["역사", "한국사", "세계사", "고대사", "근현대사", "고고학", "역사인물", "전쟁사", "문화재", "역사교육"],
    # "환경": ["환경", "기후변화", "탄소중립", "재활용", "에너지", "대기오염", "수질오염", "생태계", "자연재해", "환경정책"],
    # "여행": ["여행", "관광", "국내여행", "해외여행", "호텔", "항공", "교통", "맛집", "축제여행", "여행후기"],
    # "생활": ["생활", "요리", "패션", "뷰티", "인테리어", "반려동물", "취미", "운동", "원예", "라이프스타일"],
    # "가정": ["가정", "연애", "결혼", "신혼", "육아", "자녀교육", "가족관계", "부부", "부모", "청소년"],
    # "종교": ["종교", "기독교", "불교", "천주교", "이슬람", "종교행사", "종교갈등", "신앙", "명상", "영성"],
    # "철학": ["철학", "윤리", "인문학", "정치철학", "사회철학", "서양철학", "동양철학", "형이상학", "논리학", "존재론"]
}

# ====== 본문 크롤링 후 전처리 =====
def clean_title(raw_title):
    # HTML 태그 제거
    text = BeautifulSoup(raw_title, "html.parser").get_text()
    return text

def clean_body_soup(soup):
    remove_targets = [
        # 이미지/영상/광고/댓글 등 불필요 요소
        ("class", "end_photo_org"), ("class", "vod_player_wrap"),
        ("id", "video_area"), ("class", "vod_area"),
        ("class", "reporter_area"), ("class", "copyright"),
        ("class", "promotion"), ("class", "source"),
        ("class", "caption"), ("class", "byline"),
        ("class", "related_articles"), ("id", "scroll_sns"),
        ("class", "sns_share"), ("class", "reply"),
        ("id", "comment"), ("class", "ad"),
        ("class", "categorize"), ("class", "artical-btm")
    ]
    for attr, val in remove_targets:
        for tag in soup.find_all(attrs={attr: val}):
            tag.decompose()
    return soup

def clean_body(text):
    if not text:
        return ""
    # 1. 이메일 제거
    text = re.sub(r'\S+@\S+', '', text)
    # 2. URL 제거 (http/https 포함)
    text = re.sub(r'http\S+|www\S+', '', text)
    # 3. 제보/출처/구독 안내/광고/댓글 문구 제거 (특수문자 포함)
    text = re.sub(r'^[▶☞■▷※◆◇●○▲△□▣\-\+].*$', '', text, flags=re.MULTILINE)   # 기호로 시작하는 줄
    text = re.sub(r'^\[사진 출처.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^■ 제보하기.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'네이버.*구독.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^(관련기사.*|광고안내.*|제보.*)$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^(SNS.*보내기.*|댓글.*|기자페이지.*|저작권자.*|무단전재.*)$', '', text, flags=re.MULTILINE)
    # 4. 기자명 / 승인·수정시간 제거
    text = re.sub(r'^\s*기자명.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*[가-힣]+\s?기자.*$', '', text, flags=re.MULTILINE) 
    text = re.sub(r'^\s*승인시간.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*수정시간.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*입력.*$', '', text, flags=re.MULTILINE)
    # 5. 댓글/로그인/삭제 안내 제거
    text = re.sub(r'^\s*댓글.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*삭제.*$', '', text, flags=re.MULTILINE)        # "삭제"
    text = re.sub(r'^\s*닫기.*$', '', text, flags=re.MULTILINE)        # "닫기"
    text = re.sub(r'^\s*복구.*없습니다.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*수정.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*비밀번호.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*내 댓글.*$', '', text, flags=re.MULTILINE)
    # 6. 공유/스크랩/보내기 제거
    text = re.sub(r'^(.*보내기.*)$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^(.*스크랩.*)$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^(.*공유.*)$', '', text, flags=re.MULTILINE)
    # 7. 제보/연락처 (이메일:, 카카오톡:, @노컷뉴스, 사이트:)
    text = re.sub(r'^\s*이메일\s*:.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*카카오톡\s*:.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*@노컷뉴스.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*사이트\s*:.*$', '', text, flags=re.MULTILINE)
    # 8. 추가: 삭제 안내/입력창/폰트조절
    text = re.sub(r'^\s*그래도 삭제하시겠습니까.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*본문\s*/\s*400.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*바로가기.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*가$', '', text, flags=re.MULTILINE)  # '가' 단독 라인

    # 9. JSON 파싱 문제를 일으키는 특수 Unicode 문자 제거
    text = re.sub(r'[◆◇●○▲△□▣♦♧♠♥◯◎◐◑]', '', text)  # Unicode 도형 기호들
    text = re.sub(r'[⚫⚪⬛⬜]', '', text)  # 기타 기하학적 도형
    text = re.sub(r'[✓✔✕✖✗]', '', text)  # 체크/X 마크들

    # 10. 공백 정리
    text = re.sub(r'\n+', '\n', text).strip()

    return text

# ====== 네이버 뉴스 API 호출 ======
def get_news(keyword, start=1, display=5):
    encText = urllib.parse.quote(str(keyword))
    url = f"https://openapi.naver.com/v1/search/news.json?query={encText}&start={start}&display={display}&sort=sim"
    
    request = urllib.request.Request(url)
    request.add_header("X-Naver-Client-Id", client_id)
    request.add_header("X-Naver-Client-Secret", client_secret)
    
    response = urllib.request.urlopen(request)
    if response.getcode() == 200:
        response_body = response.read()
        return json.loads(response_body.decode('utf-8'))["items"]
    else:
        print("Error Code:" + str(response.getcode()))
        return []

# ====== 본문 크롤링 ======
def get_body(url):
    try:
        print(f"[{threading.current_thread().name}] 요청 시작 → {url}")
        res = requests.get(url, timeout=5, headers={"User-Agent":"Mozilla/5.0"})
        soup = BeautifulSoup(res.text, "html.parser")
        article = soup.find("article")
        if article:
            article = clean_body_soup(article)
            return clean_body(article.get_text(separator="\n").strip())
        else:
            return ""
    except Exception as e:
        print("본문 추출 실패:", e)
        return ""

# ====== 요약 기능 (KoBART 모델) ======
# 전역 모델 서비스 및 Lock
_summarization_service = None
_service_lock = threading.Lock()

def get_global_summarization_service():
    """Thread-safe 싱글톤 요약 서비스"""
    global _summarization_service
    if _summarization_service is None:
        with _service_lock:
            if _summarization_service is None:
                print("🔄 요약 모델 전역 초기화 중...")
                _summarization_service = get_summarization_service()
                if _summarization_service.pipe:
                    print("✅ 요약 모델 전역 초기화 완료!")
                else:
                    print("❌ 요약 모델 초기화 실패!")
    return _summarization_service

def summarize_text(text):
    """Thread-safe KoBART 모델 요약"""
    if not text or len(text.strip()) < 50:
        return "요약할 내용이 부족합니다."

    # 텍스트 길이에 따른 동적 길이 조정
    text_len = len(text.strip())
    if text_len < 200:
        max_length = min(text_len // 2, 80)
        min_length = min(max_length // 2, 30)
    else:
        max_length = min(text_len // 3, 150)
        min_length = min(max_length // 3, 50)

    try:
        # Thread-safe 모델 접근
        with _service_lock:
            summarization_service = get_global_summarization_service()
            if not summarization_service or not summarization_service.pipe:
                return "요약 모델이 로드되지 않았습니다."

            summary = summarization_service.summarize_single(
                text,
                max_length=max_length,
                min_length=min_length
            )

        return summary if summary else "요약 실패"
    except Exception as e:
        print(f"요약 오류: {e}")
        return f"요약 오류: {str(e)[:30]}..."

# ====== 대분류에 따른 중분류 병렬 처리 =====
def process_keyword(category, keyword):
    """카테고리별 키워드로 뉴스 수집 및 요약"""
    from core.mysql_db import SessionLocal
    session = SessionLocal()
    items = get_news(keyword, start=1, display=5)
    results = []

    for item in items:
        url = item["link"]
        
        if session.query(News).filter_by(url=url).first():
            print(f"⏭️ 스킵 (이미 존재): {url}")
            continue
        
        print(f"[{category}-{keyword}] 처리 중: {clean_title(item['title'])}")

        # 본문 추출
        body = get_body(item["link"])

        # 요약 생성
        summary = ""
        if body:
            print(f"  → 요약 생성 중... (본문 길이: {len(body)}자)")
            summary = summarize_text(body)
            print(f"  → 요약 완료: {summary[:50]}...")
        else:
            print(f"  → 본문 추출 실패")

        published_at = parse_pub_date(item.get("pubDate"))
        result = {
            "category": category,
            "keyword": keyword,
            "title": clean_title(item["title"]),
            "link": item["link"],
            "originallink": item.get("originallink"),
            "body": body,
            "summary": summary,
            "created_at": datetime.now().isoformat(),
            "published_at": published_at
        }

        save_to_db(result)

        results.append(result)

    return results


def parse_pub_date(raw_pubdate):
    """네이버 API pubDate 문자열을 ISO8601로 변환"""
    if not raw_pubdate:
        return None

    try:
        dt = parsedate_to_datetime(raw_pubdate)
        if dt.tzinfo:
            return dt.isoformat()
        return dt.replace(tzinfo=datetime.timezone.utc).isoformat()
    except Exception:
        return raw_pubdate

# ====== db 저장 =======
def save_to_db(item):
    from core.mysql_db import SessionLocal
    session = SessionLocal()
    try:
        category_id = CATEGORY_MAP.get(item["category"])
        if not category_id:
            print(f"⚠️ 카테고리 매핑 실패: {item['category']}")
            return
        pub_dt = None
        if item.get("published_at"):
            try:
                pub_dt = datetime.fromisoformat(item["published_at"].replace("Z", "+00:00"))
            except Exception:
                pass
        news = News(
            category_id=category_id,
            title=item["title"],
            url=item["link"],
            summary=item["summary"][:1000],
            published_at=pub_dt
        )
        session.add(news)
        session.commit()
        print(f"✅ 저장 성공: {news.title[:30]}...")

    except IntegrityError:
        session.rollback()
        print(f"⚠️ 중복으로 스킵: {item['link']}")
    finally:
        session.close()


# ====== JSON 저장 ======
def save_to_json(all_results, filename=None):
    """수집된 뉴스 데이터를 JSON 파일로 저장"""
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"news_crawled_{timestamp}_2.json"

    json_data = {
        "created_at": datetime.now().isoformat(),
        "total_count": len(all_results),
        "categories": list(set(r['category'] for r in all_results)),
        "news": all_results
    }

    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        print(f"✅ JSON 저장 완료: {filename}")
        print(f"📊 총 {len(all_results)}개 뉴스 저장됨")
        return filename
    except Exception as e:
        print(f"❌ JSON 저장 실패: {e}")
        return None

# ====== 메인 실행 ======
def main():
    print("🤖 뉴스 크롤링 및 요약 시작!")
    print(f"📂 처리 카테고리: {len(CATEGORIES)}개")
    print("=" * 60)

    all_results = []  # 전체 결과 저장용

    # 모델 사전 로딩 (메인 스레드에서)
    print("\n🔄 요약 모델 사전 로딩 중...")
    get_global_summarization_service()

    # 전체 카테고리 처리
    for category, keywords in CATEGORIES.items():
        print(f"\n📰 [{category}] 카테고리 처리 중...")
        category_results = []

        # EC2 t2.xlarge 다중 서비스 환경 최적화 (Backend, DB 등과 리소스 공유)
        optimal_workers = min(2, len(keywords))  # 보수적 설정
        with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
            print(f"  🚀 {len(keywords)}개 키워드를 {optimal_workers}개 스레드로 병렬 처리")

            futures = [executor.submit(process_keyword, category, kw) for kw in keywords]

            for i, future in enumerate(as_completed(futures), 1):
                try:
                    results = future.result()
                    category_results.extend(results)
                    all_results.extend(results)
                    print(f"    ✅ [{i}/{len(keywords)}] 완료: {len(results)}개 뉴스")
                except Exception as e:
                    print(f"    ❌ [{i}/{len(keywords)}] 에러: {e}")

        print(f"  📊 [{category}] 완료: {len(category_results)}개 뉴스 수집")

    print(f"\n🎉 전체 뉴스 크롤링 및 요약 완료!")
    print(f"📊 총 수집된 뉴스: {len(all_results)}개")

    # 최종 JSON 저장
    print(f"\n{'=' * 60}")
    print("💾 JSON 파일 저장 중...")
    saved_file = save_to_json(all_results)

    if saved_file:
        print(f"\n🎉 크롤링 완료!")
        print(f"📄 저장 파일: {saved_file}")
        print(f"📊 총 수집: {len(all_results)}개 뉴스")

        # 카테고리별 통계
        category_stats = {}
        for result in all_results:
            cat = result['category']
            category_stats[cat] = category_stats.get(cat, 0) + 1

        print("\n📈 카테고리별 수집 현황:")
        for cat, count in category_stats.items():
            print(f"  - {cat}: {count}개")

        # Qdrant 저장 로직 (현재 비활성화)
        # try:
        #     vectorizer = NewsVectorizer()
        #     stats = asyncio.run(vectorizer.vectorize_and_save_batch(all_results))
        #     print(
        #         f"✅ Qdrant 저장 완료: 총 {stats['embedded']}개 벡터 저장"
        #         f" (요청 {stats['processed']}개, 스킵 {stats['skipped']}개)"
        #     )
        # except Exception as exc:
        #     print(f"❌ 뉴스 벡터화 실패: {exc}")

    else:
        print("❌ 저장 실패!")

if __name__ == "__main__":
    main()
