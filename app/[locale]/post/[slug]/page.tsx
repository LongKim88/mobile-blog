import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { pickTranslation } from "@/lib/post";
import { Window } from "@/components/Win98";
import CategoryPill from "@/components/CategoryPill";
import TagBadge from "@/components/TagBadge";
import type { Locale, PostRow, PostView, Translation } from "@/lib/types";

export const revalidate = 60;

type Joined = PostRow & { post_translations: Translation[] | null };

async function getPost(
  slug: string,
  locale: Locale
): Promise<PostView | null> {
  const supabase = createSupabaseServerClient();
  // App Router는 dynamic params를 자동 디코딩하지 않음 — 비-ASCII slug 매칭 위해 명시적 디코딩
  const decoded = decodeURIComponent(slug);
  const { data } = await supabase
    .from("posts")
    .select(
      "id, slug, category, tags, cover_url, source_urls, source_language, translation_status, status, created_at, updated_at, published_at, title, summary, content_md, post_translations(language, title, summary, content_md)"
    )
    .eq("slug", decoded)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  return pickTranslation(data as Joined, locale);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale as Locale);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary ?? undefined,
    openGraph: {
      title: post.title,
      description: post.summary ?? undefined,
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  };
}

function fmt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost(slug, locale as Locale);
  if (!post) notFound();

  const t = await getTranslations("post");

  return (
    <Window title={`${post.slug}.md`} icon={FileText}>
      <article className="win-sunken bg-white p-3">
        <div className="mb-3 flex items-center gap-2 text-[11px]">
          <CategoryPill category={post.category} />
          <span className="text-[#606060]">{fmt(post.published_at)}</span>
          {post.isFallback && (
            <span className="bg-yellow-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
              {post.displayLanguage} · {t("translationPending")}
            </span>
          )}
        </div>

        <h1 className="mb-3 text-[20px] font-bold leading-tight text-black">
          {post.title}
        </h1>

        {post.summary && (
          <p className="mb-4 border-l-4 border-win-navy bg-win-silver-light p-2 text-[13px] leading-relaxed">
            {post.summary}
          </p>
        )}

        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_url} alt="" className="mb-4 w-full" />
        )}

        <div className="prose-article">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content_md}
          </ReactMarkdown>
        </div>

        {post.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5 border-t-2 border-black pt-3">
            {post.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {post.source_urls?.length > 0 && (
          <div className="win-sunken mt-6 bg-win-silver-light p-3 text-[11px]">
            <div className="mb-2 font-bold uppercase tracking-wider">
              {t("sources")}
            </div>
            <ul className="space-y-1">
              {post.source_urls.map((u) => (
                <li key={u}>
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-win-navy underline hover:text-win-navy-light"
                  >
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </Window>
  );
}
