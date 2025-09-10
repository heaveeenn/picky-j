import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.js';

export default defineConfig({
  plugins: [
    react({
      /**
       * React 17+ 자동 런타임 사용
       * - JSX를 자동으로 import하는 방식으로 변환한다.
       * - 결과적으로 번들이 전역 React 심볼을 요구하지 않는다.
       */
      jsxRuntime: 'automatic',

      /**
       * include는 기본값으로도 충분하지만, .js/.jsx만 사용하는 프로젝트라면 아래 주석을 해제할 수 있다.
       * 단, TS/TSX를 쓰지 않는 전제에서만 사용 권장.
       */
      // include: /\.(js|jsx)$/,

      /**
       * babel 플러그인 주의
       * - '@babel/plugin-transform-react-jsx'는 클래식 런타임을 강제하므로 사용하지 않는다.
       * - 특별한 사유가 없으면 babel 옵션을 비워둔다.
       */
      // babel: { plugins: [] },
    }),
    crx({ manifest }),
  ],

  /**
   * esbuild 단계에서도 JSX 자동 런타임을 보증한다.
   * - 일부 경로에서 클래식 런타임으로 변환되는 것을 방지하기 위한 안전망.
   */
  esbuild: {
    jsx: 'automatic',
  },

  /**
   * 빌드 설정
   * - MV3는 최신 브라우저 대상이므로 target을 별도로 낮출 필요는 없다.
   * - 디버깅 편의상 sourcemap를 true로 두는 것을 권장(배포 시에는 false 가능).
   */
  build: {
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },

  /**
   * 필요 시 의존성 최적화나 해상도 옵션을 추가할 수 있다.
   * - optimizeDeps.include에 react, react-dom을 명시하면 개발 서버 초기 번들링이 빨라질 수 있다.
   * - 필수는 아니므로 기본값 유지.
   */
  // optimizeDeps: {
  //   include: ['react', 'react-dom'],
  // },
});
