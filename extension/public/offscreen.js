/**
 * offscreen.js
 * 
 * Offscreen Document에서 실행되는 스크립트
 * CORS 차단된 사이트의 콘텐츠 추출 담당
 */

// Readability는 로컬 파일에서 전역으로 로드됨

console.log("🎯 offscreen.html 로드 시작");
console.log("📚 Readability.js 로드 완료");
console.log("🔧 offscreen.js 로드 시도 완료");
console.log("🔧 Offscreen document 로드됨");

/**
 * 예상 가능한 실패인지 확인
 */
function isExpectedFailure(error) {
  const message = error.message.toLowerCase();
  const expectedErrors = [
    'http 430', 'http 429', 'http 500', 'http 503', 'http 404',
    'cors', 'failed to fetch', 'network error', 'timeout'
  ];
  return expectedErrors.some(expected => message.includes(expected));
}

// 백그라운드 스크립트로부터 메시지 수신
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT_OFFSCREEN') {
    console.log(`🔍 Offscreen 콘텐츠 추출 요청: ${message.url}`);
    console.log(`📋 Readability 사용 가능:`, typeof Readability !== 'undefined');
    
    try {
      const result = await extractContentFromUrl(message.url);
      console.log(`✅ Offscreen 추출 성공: ${message.url}`, result ? '콘텐츠 있음' : '콘텐츠 없음');
      
      // 결과를 background script로 다시 전송
      chrome.runtime.sendMessage({
        type: 'OFFSCREEN_EXTRACT_RESULT',
        success: true,
        content: result
      });
      
    } catch (error) {
      // 예상 가능한 실패들은 조용히 처리
      if (!isExpectedFailure(error)) {
        console.error(`❌ Offscreen 추출 실패: ${message.url}`, error);
      }

      // 에러를 background script로 전송
      chrome.runtime.sendMessage({
        type: 'OFFSCREEN_EXTRACT_RESULT',
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * URL에서 콘텐츠 추출
 */
async function extractContentFromUrl(url) {
  try {
    console.log(`📥 fetch 시도: ${url}`);
    
    // fetch로 HTML 직접 가져오기
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`📄 HTML 받음: ${html.length}자`);
    
    // 스크립트 태그 제거 (CSP 오류 방지)
    const cleanHtml = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
    
    // 임시 DOM에서 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');
    console.log(`📋 DOM 파싱 완료: ${doc.title}`);
    
    // Readability 적용
    let content = null;
    
    try {
      const reader = new Readability(doc, {
        charThreshold: 100,
        classesToPreserve: ['highlight', 'important']
      });
      
      const article = reader.parse();
      
      if (article && article.textContent && article.textContent.trim()) {
        content = {
          title: article.title || doc.title || '',
          content: article.textContent,
          excerpt: article.excerpt || '',
          length: article.length || 0,
          wordCount: countWords(article.textContent)
        };
        console.log(`✅ Readability 성공: ${content.wordCount}단어`);
      }
    } catch (readabilityError) {
      console.warn(`⚠️ Readability 실패: ${readabilityError.message}`);
    }
    
    // Readability 실패시 기본 추출
    if (!content) {
      content = extractBasicContent(doc);
      if (content) {
        console.log(`✅ 기본 추출 성공: ${content.wordCount}단어`);
      }
    }
    
    return content;
    
  } catch (error) {
    // fetch 실패는 조용히 처리
    throw error;
  }
}

/**
 * 기본 콘텐츠 추출 (Readability 실패시)
 */
function extractBasicContent(document) {
  try {
    const title = document.title || '';
    const paragraphs = Array.from(document.querySelectorAll('p, article, main'))
      .map(el => el.textContent?.trim())
      .filter(text => text && text.length > 0)
      .slice(0, 10);
    
    const content = paragraphs.join('\n');
    
    if (!content.trim()) {
      return null;
    }
    
    return {
      title: title,
      content: content,
      excerpt: content.substring(0, 200) + '...',
      length: content.length,
      wordCount: countWords(content)
    };
    
  } catch (error) {
    console.warn(`⚠️ 기본 추출 실패: ${error.message}`);
    return null;
  }
}

/**
 * 단어 수 계산
 */
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

