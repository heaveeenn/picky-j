import os
import sys
import urllib.request
import urllib.parse
import json
import datetime
import hashlib
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import re

# ====== 환경 설정 ======
load_dotenv()
client_id = os.environ.get('CLIENT_ID')
client_secret = os.environ.get('CLIENT_SECRET')
client = OpenAI(
    api_key=os.environ.get('GMS_KEY'),
    base_url="https://gms.ssafy.io/gmsapi/api.openai.com/v1"
)

CATEGORIES = {
    "정치": ["정부", "국회", "대통령", "총리", "장관", "선거", "정당", "외교", "국방", "안보"],
    "사회": ["노동", "인권", "복지", "범죄", "경찰", "검찰", "재판", "사건사고", "안전", "재난"],
    "경제": ["경제", "금융", "증권", "투자", "기업", "산업", "무역", "부동산", "건설", "물가"],
    "기술": ["IT", "인공지능", "소프트웨어", "하드웨어", "반도체", "데이터", "통신", "로봇", "사이버보안", "블록체인"],
    "과학": ["과학기술", "물리학", "화학", "생명과학", "지구과학", "천문학", "우주", "연구개발", "학술지", "실험"],
    "건강": ["건강", "질병", "의료", "병원", "의약품", "백신", "영양", "운동", "정신건강", "공중보건"],
    "교육": ["교육", "학교", "대학", "입시", "수능", "교사", "학생", "학원", "평생교육", "온라인교육"],
    "문화": ["문화", "문학", "예술", "공연", "전시", "전통문화", "미술", "영화제", "언어", "축제"],
    "연예": ["연예", "영화", "드라마", "음악", "K-pop", "아이돌", "방송", "예능", "게임", "웹툰"],
    "스포츠": ["스포츠", "축구", "야구", "농구", "배구", "골프", "올림픽", "월드컵", "e스포츠", "체육"],
    "역사": ["역사", "한국사", "세계사", "고대사", "근현대사", "고고학", "역사인물", "전쟁사", "문화재", "역사교육"],
    "환경": ["환경", "기후변화", "탄소중립", "재활용", "에너지", "대기오염", "수질오염", "생태계", "자연재해", "환경정책"],
    "여행": ["여행", "관광", "국내여행", "해외여행", "호텔", "항공", "교통", "맛집", "축제여행", "여행후기"],
    "생활": ["생활", "요리", "패션", "뷰티", "인테리어", "반려동물", "취미", "운동", "원예", "라이프스타일"],
    "가정": ["가정", "연애", "결혼", "신혼", "육아", "자녀교육", "가족관계", "부부", "부모", "청소년"],
    "종교": ["종교", "기독교", "불교", "천주교", "이슬람", "종교행사", "종교갈등", "신앙", "명상", "영성"],
    "철학": ["철학", "윤리", "인문학", "정치철학", "사회철학", "서양철학", "동양철학", "형이상학", "논리학", "존재론"]
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
    # 3. 제보/출처/구독 안내/광고/댓글 문구 제거
    text = re.sub(r'^[▶☞■▷※\-\+].*$', '', text, flags=re.MULTILINE)   # 기호로 시작하는 줄
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

    # 9. 공백 정리
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

# ====== 요약 ======
def summarize(text):
    if not text:
        return ""
    prompt = f"다음 기사를 3줄로 요약해 주세요:\n\n{text}"
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role":"user","content":prompt}],
            temperature=0.3
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print("요약 실패:", e)
        return ""

# ====== 대분류에 따른 중분류 병렬 처리 =====
def process_keyword(category, keyword):
    items = get_news(keyword, start=1, display=5)
    bodies = [get_body(item["link"]) for item in items]
    results = []
    for item, body in zip(items, bodies):
        results.append({
            "category": category,
            "keyword": keyword,
            "title": clean_title(item["title"]), 
            "link": item["link"],
            "body": body
        })
    return results

# ====== 메인 실행 ======
def main():
    for category, keywords in CATEGORIES.items():
        print(f"\n======[{category}] news =====")
        with ThreadPoolExecutor(max_workers=10) as executor:  # 중분류 병렬 실행
            futures = [executor.submit(process_keyword, category, kw) for kw in keywords]

            for future in as_completed(futures):
                try:
                    results = future.result()
                    for r in results:
                        print(f"[{r['category']} - {r['keyword']}] {r['title']}")
                        print(f"링크: {r['link']}")
                        print(f"본문: {r['body']}...\n")
                except Exception as e:
                    print("에러 발생:", e)

if __name__ == "__main__":
    main()
