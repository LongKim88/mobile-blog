import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // 지원 언어. DB의 source_language CHECK 제약과 일치해야 함.
  locales: ["ko", "en", "vi"],
  defaultLocale: "ko",
  // localePrefix 'always' — 모든 경로에 prefix 강제 (/, /en, /vi 등)
  // 'as-needed' 로 바꾸면 기본 언어(ko)만 prefix 생략 가능
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
