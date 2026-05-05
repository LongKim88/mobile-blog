import { notFound } from "next/navigation";
import { BookOpen, Cpu } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { pickTranslation } from "@/lib/post";
import PostCard from "@/components/PostCard";
import { Window } from "@/components/Win98";
import { routing } from "@/i18n/routing";
import type { Category, Locale, PostRow, Translation } from "@/lib/types";

export const revalidate = 60;

const ROUTE_TO_CATEGORY: Record<string, Category> = {
  it: "IT",
  book: "Book",
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Object.keys(ROUTE_TO_CATEGORY).map((name) => ({ locale, name }))
  );
}

type Joined = PostRow & { post_translations: Translation[] | null };

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; name: string }>;
}) {
  const { locale, name } = await params;
  setRequestLocale(locale);

  const category = ROUTE_TO_CATEGORY[name.toLowerCase()];
  if (!category) notFound();

  const t = await getTranslations("category");
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, slug, category, tags, cover_url, source_urls, source_language, translation_status, status, created_at, updated_at, published_at, title, summary, content_md, post_translations(language, title, summary, content_md)"
    )
    .eq("status", "published")
    .eq("category", category)
    .order("published_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as Joined[];
  const posts = rows.map((r) => pickTranslation(r, locale as Locale));

  const isIT = category === "IT";
  const Icon = isIT ? Cpu : BookOpen;
  const title = isIT ? t("itTitle") : t("bookTitle");
  const desc = isIT ? t("itDesc") : t("bookDesc");
  const label = isIT ? "IT" : "BOOK";

  return (
    <Window title={title} icon={Icon}>
      <div className="win-sunken mb-2 bg-white p-2 text-[12px] text-black">
        <span className="font-bold">[{label}]</span> {desc}
      </div>
      {posts.length === 0 ? (
        <div className="win-sunken bg-white p-6 text-center text-[12px] text-[#606060]">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} locale={locale} />
          ))}
        </div>
      )}
    </Window>
  );
}
