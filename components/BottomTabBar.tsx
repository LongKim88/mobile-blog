"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, Cpu, Home, Search } from "lucide-react";

type Tab = {
  id: string;
  hrefSuffix: string;            // locale prefix 뒤에 붙는 부분
  icon: typeof Home;
  labelKey: "home" | "it" | "book" | "find";
  match: (path: string, locale: string) => boolean;
  disabled?: boolean;
};

const TABS: Tab[] = [
  {
    id: "home",
    hrefSuffix: "",
    icon: Home,
    labelKey: "home",
    match: (p, l) => p === `/${l}` || p === `/${l}/`,
  },
  {
    id: "it",
    hrefSuffix: "/category/it",
    icon: Cpu,
    labelKey: "it",
    match: (p, l) => p.startsWith(`/${l}/category/it`),
  },
  {
    id: "book",
    hrefSuffix: "/category/book",
    icon: BookOpen,
    labelKey: "book",
    match: (p, l) => p.startsWith(`/${l}/category/book`),
  },
  // 검색·태그 페이지는 추후 추가 예정 — 우선 비활성으로 자리만
  {
    id: "find",
    hrefSuffix: "#",
    icon: Search,
    labelKey: "find",
    match: () => false,
    disabled: true,
  },
];

export default function BottomTabBar() {
  const pathname = usePathname() || "/";
  const locale = useLocale();
  const t = useTranslations("nav");

  // 어드민 영역에서는 노출하지 않음 (이중 안전장치)
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Bottom navigation"
      className="win-raised fixed inset-x-0 bottom-0 z-50 flex h-[56px] items-stretch gap-0.5 bg-win-silver p-0.5"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(pathname, locale);
        const className = `flex flex-1 flex-col items-center justify-center gap-0.5 bg-win-silver text-black ${
          active ? "win-sunken" : "win-raised"
        } ${tab.disabled ? "opacity-40" : ""}`;
        const inner = (
          <>
            <Icon size={18} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">{t(tab.labelKey)}</span>
          </>
        );
        if (tab.disabled) {
          return (
            <button
              key={tab.id}
              type="button"
              disabled
              aria-disabled
              className={className}
            >
              {inner}
            </button>
          );
        }
        return (
          <Link
            key={tab.id}
            href={`/${locale}${tab.hrefSuffix}`}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
