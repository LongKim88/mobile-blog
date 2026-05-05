"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

const LOCALE_LABEL: Record<Locale, string> = {
  ko: "KO",
  en: "EN",
  vi: "VI",
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const currentLocale = useLocale() as Locale;
  const t = useTranslations("language");

  function switchTo(next: Locale) {
    if (next === currentLocale) return;
    // /ko/post/foo → /en/post/foo  (locale prefix 만 교체)
    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as Locale)) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    router.push(segments.join("/") || "/");
  }

  return (
    <div className="flex items-center gap-0.5" aria-label={t("label")}>
      {routing.locales.map((loc) => {
        const isActive = loc === currentLocale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-current={isActive ? "true" : undefined}
            className={`bg-win-silver px-1.5 py-0.5 text-[10px] font-bold ${
              isActive ? "win-sunken" : "win-raised"
            }`}
          >
            {LOCALE_LABEL[loc]}
          </button>
        );
      })}
    </div>
  );
}
