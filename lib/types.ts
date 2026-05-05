export type Category = "IT" | "Book";
export type PostStatus = "draft" | "published" | "archived";
export type Locale = "ko" | "en" | "vi";
export type TranslationStatus =
  | "pending"
  | "translating"
  | "completed"
  | "failed";

/** post_translations 테이블 row */
export interface Translation {
  language: Locale;
  title: string;
  summary: string | null;
  content_md: string;
}

/** posts 테이블 row (메타 + 상태). 본문은 post_translations 로 분리됨. */
export interface PostRow {
  id: string;
  slug: string;
  category: Category;
  tags: string[];
  cover_url: string | null;
  source_urls: string[];
  source_language: Locale;
  translation_status: TranslationStatus;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  // legacy — 단계적 deprecation. 마이그레이션 완료 후 제거
  title?: string | null;
  summary?: string | null;
  content_md?: string | null;
}

/** 페이지 렌더용 — 현재 locale 또는 fallback 번역이 적용된 형태 */
export interface PostView extends PostRow {
  title: string;
  summary: string | null;
  content_md: string;
  /** 실제 표시 중인 번역 언어 (요청 locale과 다를 수 있음 — fallback 시) */
  displayLanguage: Locale;
  /** 요청 locale 번역이 누락되어 fallback 되었는지 */
  isFallback: boolean;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  IT: "IT",
  Book: "BOOK",
};

export const CATEGORY_ROUTE: Record<Category, string> = {
  IT: "it",
  Book: "book",
};

/** 하위 호환을 위한 별칭 — 기존 코드에서 import 한 Post 를 PostView 로 매핑 */
export type Post = PostView;
