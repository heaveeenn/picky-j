import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../package.json";

export default defineManifest({
  manifest_version: 3,
  name: "picky",
  version: pkg.version,
  description: "사용자의 웹 활동 로그를 기반으로 학습하는 지능형 지식 동반자",
  oauth2: {
    client_id:
      "263377384158-59v1q0tl0ue430cnvj660spbfbh4t094.apps.googleusercontent.com",
    scopes: ["openid", "email", "profile"],
  },
  icons: {
    16: "public/logo.svg",
    48: "public/logo.svg",
    128: "public/logo.svg",
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
    default_title: "picky",
  },

  content_scripts: [
    {
      matches: ["<all_urls>"],
      exclude_matches: [
        "*://accounts.google.com/*",
        "*://*.google.com/oauth/*",
        "*://*.googleusercontent.com/*",
        "*://oauth.googleusercontent.com/*"
      ],
      js: ["src/content.jsx"],
    },
  ],

  web_accessible_resources: [
    {
      resources: ["offscreen.html", "Readability.js"],
      matches: ["<all_urls>"],
    },
  ],
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtuycTMbd69JMFauQR7RZCJIZf+oV186MrvigZGjgBPFV2wPEtRy7wtptxtYnm46AfCsCwSucZFydpNqILdyJfyLxS5xTt9Qlk/1xl73ZL7TsFSxtUQZVo+gwNPkxD3vnbwcer3BAbkRGTIvM3bxGoe7XVn/D3sK26BImM48u5jl1GQdCz8axsoCaI6NxBvx4cA8VovZK5tF4opiClS6amygzOe0IeJ7RePs9RMAHR4ia1thY1mMQPwabLDDQH7MiI2Qbth9c8G/5PCnrWc4oY5PtRs+5dH4BYKgWw3PE4JnBYgy7xfM2SwKaGiCk8Mvgu4gt93asfpvRtNAxZkDZgwIDAQAB",
});
