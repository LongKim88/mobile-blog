import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  saveDraftAction,
  publishAction,
  unpublishAction,
  deleteAction,
} from "../../actions";
import type {
  Locale,
  PostRow,
  Translation,
  TranslationStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type Joined = PostRow & { post_translations: Translation[] | null };

const LOCALE_LABEL: Record<Locale, string> = {
  ko: "한국어 (KO)",
  en: "English (EN)",
  vi: "Tiếng Việt (VI)",
};

const STATUS_LABEL: Record<TranslationStatus, string> = {
  pending: "번역 대기",
  translating: "번역 중…",
  completed: "번역 완료",
  failed: "번역 실패",
};

const STATUS_STYLE: Record<TranslationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  translating: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  failed: "bg-red-100 text-red-800 border-red-300",
};

export default async function EditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data } = await supabase
    .from("posts")
    .select(
      "id, slug, category, tags, cover_url, source_urls, source_language, translation_status, status, created_at, updated_at, published_at, title, summary, content_md, post_translations(language, title, summary, content_md)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();
  const post = data as Joined;
  const isPublished = post.status === "published";

  const translations = post.post_translations ?? [];
  const sourceTr =
    translations.find((t) => t.language === post.source_language) ??
    ({
      language: post.source_language,
      title: "",
      summary: null,
      content_md: "",
    } as Translation);
  const otherTrs = translations.filter(
    (t) => t.language !== post.source_language
  );
  const missing = (["ko", "en", "vi"] as Locale[]).filter(
    (l) => !translations.some((t) => t.language === l)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-sm text-ink-500 hover:text-accent">
          ← 대시보드
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
              STATUS_STYLE[post.translation_status]
            }`}
          >
            i18n: {STATUS_LABEL[post.translation_status]}
            {missing.length > 0 && ` · 누락 ${missing.join("/")}`}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
              isPublished
                ? "bg-green-100 text-green-700"
                : "bg-ink-100 text-ink-500"
            }`}
          >
            {post.status}
          </span>
        </div>
      </div>

      <form action={saveDraftAction} className="space-y-4">
        <input type="hidden" name="id" value={post.id} />

        <Field label="원본 언어 (이 언어로 작성 → routine이 다른 두 언어로 자동 번역)">
          <fieldset className="flex gap-3 rounded-md border border-ink-200 bg-white p-2">
            {(["ko", "en", "vi"] as Locale[]).map((loc) => (
              <label
                key={loc}
                className="flex cursor-pointer items-center gap-1.5 text-sm"
              >
                <input
                  type="radio"
                  name="source_language"
                  value={loc}
                  defaultChecked={post.source_language === loc}
                />
                {LOCALE_LABEL[loc]}
              </label>
            ))}
          </fieldset>
        </Field>

        <Field label={`제목 (${LOCALE_LABEL[post.source_language]})`}>
          <input
            name="title"
            defaultValue={sourceTr.title}
            placeholder="제목을 입력하세요"
            className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-base font-bold outline-none focus:border-accent"
          />
        </Field>

        <Field label="슬러그 (URL용 — 영소문자·숫자·하이픈, 비우면 자동 생성)">
          <input
            name="slug"
            defaultValue={post.slug.startsWith("draft-") ? "" : post.slug}
            placeholder="my-post-2026"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="카테고리">
            <select
              name="category"
              defaultValue={post.category}
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="IT">IT</option>
              <option value="Book">Book</option>
            </select>
          </Field>
          <Field label="태그 (쉼표 구분, 영문 통일 권장)">
            <input
              name="tags"
              defaultValue={post.tags.join(", ")}
              placeholder="ai, tools, weekly"
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
        </div>

        <Field label={`요약 (${LOCALE_LABEL[post.source_language]} — 카드/메타 디스크립션에 사용)`}>
          <textarea
            name="summary"
            defaultValue={sourceTr.summary ?? ""}
            rows={2}
            className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </Field>

        <Field label="표지 이미지 URL (선택, 언어 공통)">
          <input
            name="cover_url"
            defaultValue={post.cover_url ?? ""}
            placeholder="https://..."
            className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </Field>

        <Field label={`본문 (${LOCALE_LABEL[post.source_language]} — Markdown)`}>
          <textarea
            name="content_md"
            defaultValue={sourceTr.content_md}
            rows={20}
            className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </Field>

        <Field label="출처 URL (공백/줄바꿈 구분, 언어 공통)">
          <textarea
            name="source_urls"
            defaultValue={post.source_urls.join("\n")}
            rows={3}
            className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-[12px] outline-none focus:border-accent"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
          >
            저장
          </button>
          <button
            type="submit"
            formAction={publishAction}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
          >
            {isPublished ? "다시 발행 (저장)" : "발행"}
          </button>
          <span className="ml-auto text-[11px] text-ink-400">
            저장 시 다른 언어 번역은 다시 pending 상태가 되어 routine이 재번역합니다.
          </span>
        </div>
      </form>

      {/* 다른 언어 번역 미리보기 */}
      {(otherTrs.length > 0 || missing.length > 0) && (
        <section className="rounded-md border border-ink-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">다른 언어 번역</h2>
          <div className="space-y-3">
            {(["ko", "en", "vi"] as Locale[])
              .filter((l) => l !== post.source_language)
              .map((loc) => {
                const tr = otherTrs.find((t) => t.language === loc);
                return (
                  <details
                    key={loc}
                    className="rounded border border-ink-200 bg-ink-50 p-3"
                  >
                    <summary className="cursor-pointer text-sm font-bold">
                      {LOCALE_LABEL[loc]}
                      {tr ? (
                        <span className="ml-2 text-[11px] font-normal text-ink-400">
                          ({tr.content_md.length.toLocaleString()}자)
                        </span>
                      ) : (
                        <span className="ml-2 text-[11px] font-normal text-yellow-700">
                          (아직 번역되지 않음 — routine이 처리 예정)
                        </span>
                      )}
                    </summary>
                    {tr && (
                      <div className="mt-2 space-y-2 text-[12px]">
                        <div>
                          <div className="font-bold text-ink-500">제목</div>
                          <div>{tr.title || <em className="text-ink-300">비어 있음</em>}</div>
                        </div>
                        {tr.summary && (
                          <div>
                            <div className="font-bold text-ink-500">요약</div>
                            <div>{tr.summary}</div>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-ink-500">본문 (앞부분)</div>
                          <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-ink-700">
                            {tr.content_md.slice(0, 800)}
                            {tr.content_md.length > 800 && "…"}
                          </pre>
                        </div>
                      </div>
                    )}
                  </details>
                );
              })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-200 pt-4">
        {isPublished && (
          <form action={unpublishAction}>
            <input type="hidden" name="id" value={post.id} />
            <button className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-600 hover:bg-ink-50">
              발행 해제
            </button>
          </form>
        )}
        <form action={deleteAction}>
          <input type="hidden" name="id" value={post.id} />
          <button className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50">
            삭제
          </button>
        </form>
        {isPublished && (
          <Link
            href={`/${post.source_language}/post/${post.slug}`}
            className="ml-auto rounded-md bg-ink-100 px-3 py-1.5 text-[13px] text-ink-600 hover:bg-ink-200"
          >
            공개 페이지에서 보기 ↗
          </Link>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[12px] font-medium text-ink-500">{label}</div>
      {children}
    </label>
  );
}
