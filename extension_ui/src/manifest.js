import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';


export default defineManifest({
  manifest_version: 3,
  name: 'Picky_UI',
  version: pkg.version,
  description: '사용자의 웹 활동 로그(Log)를 기반으로 개인 관심사를 학습하여, 맞춤형 뉴스와 지식을 추천하는 지능형 지식 동반자',

  icons: {
    16: 'public/picky_icon_16.png',
    48: 'public/picky_icon_48.png',
    128: 'public/picky_icon_128.png',
  },

    // permissions: activeTab, storage, identity, history, contextMenus 등 확장 프로그램의 핵심 권한을 정의합니다.
      permissions: ['activeTab', 'storage', 'identity', 'identity.email', 'history'],
  host_permissions: ['http://localhost:8000/*', 'http://localhost:8080/*'],

  background: {
    service_worker: 'src/background.js',
  },

  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'picky',
  },

  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content.jsx'],
      run_at: 'document_end', // body 준비 이후 주입을 보장하기 위함
    },
  ],

  web_accessible_resources: [
    {
      resources: ['content.css', 'images/characters/*'], // Vite가 빌드한 CSS 파일 및 캐릭터 이미지
      matches: ['<all_urls>'],
    },
  ],

});
