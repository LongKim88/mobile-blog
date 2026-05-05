import type { Locale, PostRow, PostView, Translation } from "./types";

/**
 * 요청 locale 번역을 우선 사용하고,
 * 없으면 source_language → 사용 가능한 첫 번역 → legacy 컬럼 순으로 fallback.
 */
export function pickTranslation(
  row: PostRow & { post_translations?: Translation[] | null },
  preferred: Locale
): PostView {
  const list: Translation[] = row.post_translations ?? [];

  const chosen =
    list.find((t) => t.language === preferred) ??
    list.find((t) => t.language === row.source_language) ??
    list[0];

  const title = chosen?.title ?? row.title ?? "";
  const summary = chosen?.summary ?? row.summary ?? null;
  const content_md = chosen?.content_md ?? row.content_md ?? "";
  const displayLanguage: Locale = chosen?.language ?? row.source_language;
  const isFallback = displayLanguage !== preferred;

  return {
    ...row,
    title,
    summary,
    content_md,
    displayLanguage,
    isFallback,
  };
}
