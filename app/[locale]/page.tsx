import { Folder } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { pickTranslation } from "@/lib/post";
import PostCard from "@/components/PostCard";
import { Window } from "@/components/Win98";
import type { Locale, PostRow, Translation } from "@/lib/types";

export const revalidate = 60; // 1분마다 ISR

type Joined = PostRow & { post_translations: Translation[] | null };

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("feed");
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, category, tags, cover_url, source_urls, source_language, translation_status, status, created_at, updated_at, published_at, title, summary, content_md, post_translations(language, title, summary, content_md)"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);

  const rows = (data ?? []) as Joined[];
  const posts = rows.map((r) => pickTranslation(r, locale as Locale));

  return (
    <Window title={t("latest")} icon={Folder}>
      {error && (
        <div className="win-sunken bg-white p-3 text-[12px] font-bold text-red-700">
          {t("loadError", { message: error.message })}
        </div>
      )}

      {posts.length === 0 && !error && (
        <div className="win-sunken bg-white p-6 text-center">
          <p className="text-[13px] font-bold">{t("empty")}</p>
          <p className="mt-2 text-[11px] text-[#606060]">
            <span className="bg-black px-0.5 text-white">_</span>{" "}
            {t("emptyHint")}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {posts.map((p, i) => (
          <PostCard
            key={p.id}
            post={p}
            locale={locale}
            variant={i === 0 ? "feature" : "default"}
          />
        ))}
      </div>
    </Window>
  );
}
