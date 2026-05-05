import type { Category } from "@/lib/types";

const STYLES: Record<Category, string> = {
  IT: "bg-win-navy text-white",
  Book: "bg-win-purple text-white",
};

export default function CategoryPill({ category }: { category: Category }) {
  const label = category === "IT" ? "IT" : "BOOK";
  return (
    <span
      className={`inline-flex items-center px-1 py-0.5 text-[11px] font-bold uppercase tracking-wider ${STYLES[category]}`}
    >
      [{label}]
    </span>
  );
}
