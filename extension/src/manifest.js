import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Picky",
  version: pkg.version,
  description: "사용자의 웹 활동 로그를 기반으로 학습하여 맞춤형 콘텐츠를 추천하는 지능형 지식 동반자",
  oauth2: {
    client_id:
      "263377384158-59v1q0tl0ue430cnvj660spbfbh4t094.apps.googleusercontent.com",
    scopes: ["openid", "email", "profile"],
  },
  icons: {
    16: "public/picky_icon_16.png",
    48: "public/picky_icon_48.png",
    128: "public/picky_icon_128.png",
  },

  permissions: [
    "tabs",
    "storage",
    "history",
    "offscreen",
    "scripting",
    "identity",
  ],

  host_permissions: ["<all_urls>"],

  background: {
    service_worker: "src/background.js",
  },

  action: {
    default_popup: "src/popup/index.html",
    default_title: "Picky",
  },

  content_scripts: [
  {
    matches: ["<all_urls>"],
    exclude_matches: [
      // 로컬/파일
      "file://*/*", "*://localhost:*/*", "*://127.0.0.1:*/*",

      // OAuth/로그인(대표)
      "*://accounts.google.com/*", "*://*.google.com/oauth/*", "*://oauth.googleusercontent.com/*",

      // 이메일/메신저/협업
      "*://mail.google.com/*", "*://mail.naver.com/*",
      "*://outlook.live.com/*", "*://outlook.office.com/*", "*://outlook.com/*",
      "*://web.telegram.org/*", "*://web.whatsapp.com/*",
      "*://*.slack.com/*", "*://teams.microsoft.com/*", "*://*.discord.com/*", "*://discord.com/*",
      "*://*.zoom.us/*", "*://meet.google.com/*",

      // 클라우드/저장소
      "*://drive.google.com/*", "*://*.dropbox.com/*", "*://*.onedrive.live.com/*", "*://*.sharepoint.com/*",
      "*://*.box.com/*", "https://mega.nz/*", "*://*.pcloud.com/*",

      // 결제/PG/간편결제(전면 제외)
      "*://*.kakaopay.com/*", "https://pay.naver.com/*", "*://*.paypal.com/*",
      "https://toss.im/*", "*://*.tosspayments.com/*", "*://*.iamport.kr/*",
      "*://*.kcp.co.kr/*", "*://*.nicepay.co.kr/*", "*://*.kgmobilians.com/*", "*://*.danal.co.kr/*",
      "https://www.payco.com/*", "*://*.smilepay.com/*", "https://pay.google.com/*", "https://pay.apple.com/*",
      "*://*.alipay.com/*", "https://pay.weixin.qq.com/*",

      // 은행/증권/카드(전면 제외)
      "*://*.kbstar.com/*","*://*.hanafn.com/*","*://*.shinhan.com/*","*://*.wooribank.com/*",
      "*://*.nhbank.com/*","*://*.ibk.co.kr/*","*://*.kakaobank.com/*","*://*.tossbank.com/*",
      "*://*.sc.co.kr/*","*://*.citibank.co.kr/*","*://*.kbanknow.com/*","*://*.busanbank.co.kr/*",
      "*://*.kyongnambank.co.kr/*","*://*.dgb.co.kr/*","*://*.jbbank.co.kr/*","*://*.suhyup-bank.com/*","*://*.kdb.co.kr/*",
      "*://*.kbsec.com/*","*://*.nhqv.com/*","*://*.shinhansec.com/*","*://*.miraeasset.com/*","*://*.samsungsecurities.co.kr/*",
      "*://*.kiwoom.com/*","*://*.truefriend.com/*","*://*.daishin.com/*","*://*.ebestsec.co.kr/*","*://*.hanaw.com/*",
      "*://*.kbcard.com/*","*://*.hyundaicard.com/*","*://*.shinhancard.com/*","*://*.samsungcard.com/*","*://*.bccard.com/*",
      "*://*.lottecard.co.kr/*","*://*.nhcard.co.kr/*","*://*.wooricard.com/*","*://*.hanacard.co.kr/*",

      // 정부/공공
      "*://*.go.kr/*","*://*.gov.kr/*","*://*.assembly.go.kr/*","*://*.president.go.kr/*","*://*.police.go.kr/*","*://*.court.go.kr/*","*://korea.kr/*",

      // 의료(대표)
      "https://med.naver.com/*","*://*.samsungmedicalcenter.com/*","*://*.amc.seoul.kr/*","*://*.snuh.org/*",

      // 전역 민감 경로(도메인 불문 차단)
      "*://*/*login*","*://*/*signin*","*://*/*logout*",
      "*://*/*2fa*","*://*/*mfa*","*://*/*verify*",
      "*://*/*profile*","*://*/*settings*","*://*/*mypage*",
      "*://*/*account*","*://*/*accounts*",
      "*://*/*billing*","*://*/*checkout*","*://*/*invoice*",
      "*://*/*payment*","*://*/*transfer*",
      "*://*/*loan*","*://*/*mortgage*",
      "*://*/*secure*","*://*/*cert*","*://*/*privacy*","*://*/*security*",

      // 성인/도박/불법(대표 — 유지보수는 나중에 DNR 동적 규칙로 확장)
      "*://*.pornhub.com/*","*://*.xvideos.com/*","*://*.xnxx.com/*","*://*.xhamster.com/*",
      "*://*.spankbang.com/*","*://*.youporn.com/*","*://*.redtube.com/*","*://*.tube8.com/*",
      "*://*.eporner.com/*","*://*.hqporner.com/*","https://hitomi.la/*","https://nhentai.net/*","https://rule34.xxx/*",
      "*://*.bet365.com/*","*://*.stake.com/*","*://*.1xbet.com/*","*://*.betfair.com/*","*://*.pinnacle.com/*",
      "https://1337x.to/*","https://thepiratebay.org/*","https://yts.mx/*","https://nyaa.si/*","https://fmovies.to/*"
      ],
      js: ["src/content.jsx"],
      run_at: "document_idle"
    }
  ],


  web_accessible_resources: [
    {
      resources: ["offscreen.html", "Readability.js", "content.css", "images/characters/*"],
      matches: ["<all_urls>"],
    },
  ],
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtuycTMbd69JMFauQR7RZCJIZf+oV186MrvigZGjgBPFV2wPEtRy7wtptxtYnm46AfCsCwSucZFydpNqILdyJfyLxS5xTt9Qlk/1xl73ZL7TsFSxtUQZVo+gwNPkxD3vnbwcer3BAbkRGTIvM3bxGoe7XVn/D3sK26BImM48u5jl1GQdCz8axsoCaI6NxBvx4cA8VovZK5tF4opiClS6amygzOe0IeJ7RePs9RMAHR4ia1thY1mMQPwabLDDQH7MiI2Qbth9c8G/5PCnrWc4oY5PtRs+5dH4BYKgWw3PE4JnBYgy7xfM2SwKaGiCk8Mvgu4gt93asfpvRtNAxZkDZgwIDAQAB",
});
