import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import CategoryPill from "@/components/CategoryPill";
import type {
  Locale,
  PostRow,
  Translation,
  TranslationStatus,
} from "@/lib/types";
import { newDraftAction } from "./actions";

export const dynamic = "force-dynamic";

type Joined = PostRow & { post_translations: Translation[] | null };

const STATUS_DOT: Record<TranslationStatus, string> = {
  pending: "bg-yellow-400",
  translating: "bg-blue-400",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

const STATUS_LABEL: Record<TranslationStatus, string> = {
  pending: "대기",
  translating: "번역 중",
  completed: "완료",
  failed: "실패",
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(
    2,
    "0"
  )} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
    2,
    "0"
  )}`;
}

export default async function AdminHome() {
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
    .order("updated_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Joined[];
  const drafts = rows.filter((p) => p.status === "draft");
  const published = rows.filter((p) => p.status === "published");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">대시보드</h1>
          <p className="text-[12px] text-ink-400">
            초안 {drafts.length}개 · 발행됨 {published.length}개
          </p>
        </div>
        <form action={newDraftAction}>
          <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600">
            + 새 초안
          </button>
        </form>
      </div>

      <Section
        title="검토 대기 (초안)"
        empty="대기 중인 초안이 없습니다."
        posts={drafts}
      />
      <Section
        title="발행됨"
        empty="아직 발행한 글이 없습니다."
        posts={published}
      />
    </div>
  );
}

function Section({
  title,
  posts,
  empty,
}: {
  title: string;
  posts: Joined[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">
        {title}
      </h2>
      {posts.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
          {empty}
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 rounded-md border border-ink-200 bg-white">
          {posts.map((p) => {
            const trs = p.post_translations ?? [];
            const sourceTr = trs.find((t) => t.language === p.source_language);
            const displayTitle = sourceTr?.title || p.title || "";
            const displaySummary = sourceTr?.summary ?? p.summary ?? "—";
            const presentLanguages = (["ko", "en", "vi"] as Locale[])
              .map((l) => ({
                lang: l,
                present: trs.some((t) => t.language === l),
              }));

            return (
              <li key={p.id}>
                <Link
                  href={`/admin/edit/${p.id}`}
                  className="flex items-start gap-3 px-4 py-3 transition hover:bg-ink-50"
                >
                  <CategoryPill category={p.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold text-ink-900">
                        {displayTitle || (
                          <span className="italic text-ink-400">
                            (제목 없음)
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-ink-400">
                        {p.source_language}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-ink-400">
                      {displaySummary}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          STATUS_DOT[p.translation_status]
                        }`}
                      />
                      <span className="text-ink-500">
                        i18n: {STATUS_LABEL[p.translation_status]}
                      </span>
                      <span className="text-ink-300">·</span>
                      <span className="font-mono text-ink-400">
                        {presentLanguages
                          .map((l) =>
                            l.present
                              ? l.lang.toUpperCase()
                              : `(${l.lang})`
                          )
                          .join(" ")}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-ink-400">
                    {fmt(p.updated_at)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
