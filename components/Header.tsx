"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { HardDrive } from "lucide-react";
import { TitleBar } from "./Win98";
import LanguageSwitcher from "./LanguageSwitcher";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Tech & Books";

export default function Header() {
  const pathname = usePathname() || "/";
  const t = useTranslations();
  const tMenu = useTranslations("menu");

  // 어드민 영역에서는 공개 사이트의 Win98 헤더를 노출하지 않음 (이중 안전장치)
  if (pathname.startsWith("/admin")) return null;

  const menuKeys = ["file", "edit", "view", "help"] as const;

  return (
    <header className="px-2 pt-2">
      <div className="win-raised win-shadow bg-win-silver">
        <TitleBar
          title={`${SITE_NAME} — ${t("header.subtitle")}`}
          icon={HardDrive}
        />
        <div className="flex items-center justify-between gap-3 border-b border-win-silver-dark px-3 py-1 text-[12px]">
          <div className="flex gap-3">
            {menuKeys.map((k) => {
              const label = tMenu(k);
              return (
                <span
                  key={k}
                  className="cursor-default select-none hover:bg-win-navy hover:text-white"
                >
                  <span className="underline">{label[0]}</span>
                  {label.slice(1)}
                </span>
              );
            })}
          </div>
          <LanguageSwitcher />
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-[11px]">
          <span>
            C:\BLOG&gt;{" "}
            <span className="bg-black px-0.5 text-white">_</span>
          </span>
          <span className="text-[#606060]">{t("header.schedule")}</span>
        </div>
      </div>
    </header>
  );
}
