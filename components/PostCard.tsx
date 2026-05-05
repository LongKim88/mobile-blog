import Link from "next/link";
import type { PostView } from "@/lib/types";
import CategoryPill from "./CategoryPill";
import TagBadge from "./TagBadge";

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function PostCard({
  post,
  locale,
  variant = "default",
}: {
  post: PostView;
  locale: string;
  variant?: "default" | "feature";
}) {
  const isFeature = variant === "feature";
  return (
    <Link
      href={`/${locale}/post/${post.slug}`}
      className="win-sunken block bg-white p-3 hover:bg-[#fafafa]"
    >
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <CategoryPill category={post.category} />
        <span className="text-[#606060]">{fmtDate(post.published_at)}</span>
        {post.isFallback && (
          <span className="bg-yellow-200 px-1 py-0.5 text-[9px] font-bold uppercase text-black">
            {post.displayLanguage}
          </span>
        )}
      </div>
      <h2
        className={
          isFeature
            ? "text-[18px] font-bold leading-tight text-win-navy underline"
            : "text-[15px] font-bold leading-tight text-win-navy underline"
        }
      >
        {post.title}
      </h2>
      {post.summary && (
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-black">
          {post.summary}
        </p>
      )}
      {post.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {post.tags.slice(0, 4).map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
        </div>
      )}
    </Link>
  );
}
