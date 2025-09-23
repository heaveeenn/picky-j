import os
import sys
import urllib.request
import urllib.parse
import json
import requests
import asyncio
from bs4 import BeautifulSoup
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
from .summarization import get_summarization_service
from .vectorizer import NewsVectorizer  # Qdrant 저장 활성화

# ====== 환경 설정 ======
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
    "엔터테인먼트": 9, 
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
  "정치": ["정부", "대통령", "국회", "총리", "장관", "선거", "정당", "외교", "국방", "안보", "정책", "개헌", "비리"],
  "사회": ["노동", "인권", "복지", "범죄", "경찰", "검찰", "재판", "사건사고", "안전", "재난", "시위", "갈등", "실업"],
  "경제": ["경제", "금융", "증권", "투자", "기업", "산업", "무역", "부동산", "건설", "물가", "환율", "고용", "무역협정", "스타트업"],
  "기술": ["IT", "인공지능", "소프트웨어", "하드웨어", "반도체", "데이터", "통신", "로봇", "사이버보안", "블록체인", "클라우드", "스타트업", "메타버스", "5G"],
  "과학": ["과학기술", "물리학", "화학", "생명과학", "지구과학", "천문학", "우주", "연구개발", "실험", "유전자", "의학연구", "기후과학", "신소재"],
  "건강": ["건강", "질병", "의료", "병원", "의약품", "백신", "영양", "운동", "정신건강", "공중보건", "예방", "다이어트"],
  "교육": ["교육", "학교", "대학", "입시", "수능", "교사", "학생", "학원", "평생교육", "온라인교육", "장학금", "교과서", "교육정책"],
  "문화": ["문화", "문학", "예술", "공연", "전시", "전통문화", "미술", "영화제", "언어", "축제", "창작", "예술가"],
  "엔터테인먼트": ["연예", "영화", "드라마", "음악", "K-pop", "아이돌", "방송", "예능", "게임", "웹툰", "OTT", "팬덤", "스타"],
  "스포츠": ["스포츠", "축구", "야구", "농구", "배구", "골프", "올림픽", "월드컵", "e스포츠", "체육", "테니스", "마라톤", "선수단"],
  "역사": ["역사", "한국사", "세계사", "고대사", "근현대사", "고고학", "역사인물", "전쟁사", "문화재", "역사교육", "독립운동", "유적"],
  "환경": ["환경", "기후변화", "탄소중립", "재활용", "에너지", "대기오염", "수질오염", "생태계", "자연재해", "환경정책", "미세먼지", "친환경", "지속가능성"],
  "여행": ["여행", "관광", "국내여행", "해외여행", "호텔", "항공", "교통", "맛집", "여행후기", "여행정보", "배낭여행", "관광지"],
  "생활": ["생활", "요리", "패션", "뷰티", "인테리어", "반려동물", "취미", "운동", "원예", "라이프스타일", "소비", "쇼핑", "서비스"],
  "가정": ["가정", "연애", "결혼", "신혼", "육아", "자녀교육", "가족관계", "부부", "부모", "청소년", "가사", "돌봄"],
  "종교": ["종교", "기독교", "불교", "천주교", "이슬람", "종교행사", "종교갈등", "신앙", "명상", "영성", "사찰", "교회"],
  "철학": ["철학", "윤리", "인문학", "정치철학", "사회철학", "동양철학", "서양철학", "가치관", "도덕", "사상", "철학자", "진리"]
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
def is_good_content(text):
    """텍스트가 실제 뉴스 본문인지 간단 검증"""
    if len(text) < 100:
        return False

    # 메뉴 키워드가 너무 많으면 제외
    menu_keywords = ["전체메뉴", "기사검색", "로그인", "facebook", "검색", "닫기"]
    menu_count = sum(1 for kw in menu_keywords if kw in text)
    if menu_count > 3:
        return False

    # 카테고리 키워드가 너무 많으면 제외 (사이트 네비게이션)
    category_keywords = ["모바일·가전", "방송·통신", "반도체·디스플레이", "SW·보안", "금융", "증권"]
    category_count = sum(1 for kw in category_keywords if kw in text)
    if category_count > 2:
        return False

    return True

def try_alternative_selectors(soup):
    """대안 선택자들로 본문 추출 시도"""
    selectors = [
        ".article-body",
        ".content",
        "#content",
        ".news-content",
        ".article-content"
    ]

    candidates = []

    for selector in selectors:
        element = soup.select_one(selector)
        if element:
            element_text = clean_body(clean_body_soup(element).get_text(separator="\n").strip())
            if is_good_content(element_text):
                candidates.append((element_text, len(element_text)))

    # 적합한 후보 중 가장 긴 것 반환
    if candidates:
        best_text, _ = max(candidates, key=lambda x: x[1])
        return best_text

    return ""

def get_body(url):
    try:
        print(f"[{threading.current_thread().name}] 요청 시작 → {url}")
        res = requests.get(url, timeout=5, headers={"User-Agent":"Mozilla/5.0"})
        soup = BeautifulSoup(res.text, "html.parser")

        # 1. 기존 방식 먼저 시도 (빠름)
        article = soup.find("article")
        if article:
            cleaned_article = clean_body_soup(article)
            text = clean_body(cleaned_article.get_text(separator="\n").strip())
            if is_good_content(text):
                return text

        # 2. 기존 방식 실패시 대안 선택자 시도
        alternative_text = try_alternative_selectors(soup)
        if alternative_text:
            return alternative_text

        # 3. 모든 방법 실패
        return ""

    except Exception as e:
        print("본문 추출 실패:", e)
        return ""

# ====== 요약 기능 (KoBART 모델) ======
# 전역 모델 서비스 및 Lock
_summarization_service = None
_service_lock = threading.Lock()

# ====== 실시간 벡터화 큐 ======
_vectorization_queue = []
_vectorization_lock = threading.Lock()
_vectorizer = None

def get_global_vectorizer():
    """Thread-safe 싱글톤 벡터화 서비스"""
    global _vectorizer
    if _vectorizer is None:
        with _vectorization_lock:
            if _vectorizer is None:
                _vectorizer = NewsVectorizer()
    return _vectorizer

def process_vectorization_batch_async(batch_to_process, batch_id):
    """백그라운드에서 벡터화 배치 처리"""
    try:
        print(f"🔄 배치 벡터화 시작 (배치 #{batch_id}, {len(batch_to_process)}개)")
        vectorizer = get_global_vectorizer()
        stats = asyncio.run(vectorizer.vectorize_and_save_batch(batch_to_process))
        print(f"✅ 배치 #{batch_id} 벡터화 완료: {stats['embedded']}개 저장")
    except Exception as e:
        print(f"❌ 배치 #{batch_id} 벡터화 실패: {e}")

# 배치 카운터 (배치 ID 생성용)
_batch_counter = 0
_batch_counter_lock = threading.Lock()

def add_to_vectorization_queue(news_item):
    """뉴스 아이템을 벡터화 큐에 추가하고, 16개가 되면 백그라운드에서 벡터화 실행"""
    global _vectorization_queue, _batch_counter

    with _vectorization_lock:
        _vectorization_queue.append(news_item)
        current_count = len(_vectorization_queue)

        # 16개가 모이면 백그라운드에서 벡터화 실행
        if current_count >= 16:
            batch_to_process = _vectorization_queue[:16]
            _vectorization_queue = _vectorization_queue[16:]  # 큐에서 제거

            # 배치 ID 생성
            with _batch_counter_lock:
                _batch_counter += 1
                batch_id = _batch_counter

            # 별도 스레드에서 벡터화 실행 (논블로킹)
            vectorization_thread = threading.Thread(
                target=process_vectorization_batch_async,
                args=(batch_to_process, batch_id),
                daemon=True  # 메인 프로세스 종료 시 함께 종료
            )
            vectorization_thread.start()
            print(f"🚀 배치 #{batch_id} 벡터화 스레드 시작 (16개) - 크롤링 계속...")

def flush_remaining_vectorization_queue():
    """남은 큐의 모든 아이템을 백그라운드에서 벡터화하고 완료 대기"""
    global _vectorization_queue, _batch_counter

    with _vectorization_lock:
        if _vectorization_queue:
            remaining_count = len(_vectorization_queue)
            batch_to_process = _vectorization_queue.copy()
            _vectorization_queue.clear()

            # 배치 ID 생성
            with _batch_counter_lock:
                _batch_counter += 1
                batch_id = _batch_counter

            print(f"🔄 최종 배치 벡터화 시작 (배치 #{batch_id}, {remaining_count}개)")

            # 최종 배치는 동기적으로 실행 (완료 대기 필요)
            try:
                vectorizer = get_global_vectorizer()
                stats = asyncio.run(vectorizer.vectorize_and_save_batch(batch_to_process))
                print(f"✅ 최종 배치 #{batch_id} 벡터화 완료: {stats['embedded']}개 저장")
                return stats
            except Exception as e:
                print(f"❌ 최종 배치 #{batch_id} 벡터화 실패: {e}")
                return {"processed": 0, "embedded": 0, "skipped": 0}

    return {"processed": 0, "embedded": 0, "skipped": 0}

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

    try:
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

            # 본문 추출 실패 시 스킵
            if not body:
                print(f"  → 스킵: 본문 추출 실패")
                continue

            # 요약 생성
            print(f"  → 요약 생성 중... (본문 길이: {len(body)}자)")
            summary = summarize_text(body)

            # 요약 실패 시 스킵
            if not summary or "요약 실패" in summary or "요약 오류" in summary:
                print(f"  → 스킵: 요약 생성 실패 ({summary[:30]}...)")
                continue

            print(f"  → 요약 완료: {summary[:50]}...")

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

            news_id = save_to_db(result)

            # 실시간 벡터화 큐에 추가 (정상 뉴스만)
            if news_id:
                result["id"] = news_id  # DB에서 생성된 ID 추가
                add_to_vectorization_queue(result)

            results.append(result)

        return results

    finally:
        session.close()


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
            return None
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
        return news.id  # 생성된 ID 반환

    except IntegrityError:
        session.rollback()
        print(f"⚠️ 중복으로 스킵: {item['link']}")
        return None
    finally:
        session.close()



# ====== 메인 실행 ======
def main():
    print("🤖 뉴스 크롤링 및 요약 시작!")
    print(f"📂 처리 카테고리: {len(CATEGORIES)}개")
    print("=" * 60)


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
                    print(f"    ✅ [{i}/{len(keywords)}] 완료: {len(results)}개 뉴스")
                except Exception as e:
                    print(f"    ❌ [{i}/{len(keywords)}] 에러: {e}")

        print(f"  📊 [{category}] 완료: {len(category_results)}개 뉴스 수집")

    print(f"\n🎉 전체 뉴스 크롤링 및 요약 완료!")

    # 남은 벡터화 큐 처리
    print(f"\n🔗 남은 벡터화 큐 처리 중...")
    final_stats = flush_remaining_vectorization_queue()
    if final_stats["processed"] > 0:
        print(f"✅ 최종 벡터화 완료: 총 {final_stats['embedded']}개 벡터 저장")

    print(f"\n🎉 크롤링 및 벡터화 완료!")

if __name__ == "__main__":
    main()
