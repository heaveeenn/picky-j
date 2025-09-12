import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../package.json";

export default defineManifest({
  
  manifest_version: 3,
  name: "picky",
  version: pkg.version,
  description: "사용자의 웹 활동 로그를 기반으로 학습하는 지능형 지식 동반자",

  icons: {
    16: "public/logo.svg",
    48: "public/logo.svg",
    128: "public/logo.svg",
  },

  permissions: ["tabs", "storage", "identity", "identity.email", "history", "offscreen"],

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
      js: ["src/content.jsx"],
    },
  ],

  web_accessible_resources: [
    {
      resources: ["offscreen.html", "Readability.js"],
      matches: ["<all_urls>"],
    },
  ],
});