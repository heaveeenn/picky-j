import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';


export default defineManifest({
  manifest_version: 3,
  name: 'Picky',
  version: pkg.version,
  description: '사용자의 웹 활동 로그(Log)를 기반으로 개인 관심사를 학습하여, 맞춤형 뉴스와 지식을 추천하는 지능형 지식 동반자',

  icons: {
    16: 'public/picky_icon_16.png',
    48: 'public/picky_icon_48.png',
    128: 'public/picky_icon_128.png',
  },

  // 원본 유지
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
      resources: ['content.css'], // Vite가 빌드한 CSS 파일
      matches: ['<all_urls>'],
    },
  ],

});
