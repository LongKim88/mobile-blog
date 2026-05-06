import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Tech & Books";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — IT와 책 사이의 노트`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "IT 도구·뉴스 큐레이션과 책 서평을 매주 월·목 발행하는 매거진형 블로그 (책은 격주 목).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#008080",
};

/**
 * Root layout — html/body 만 책임진다.
 * 공개 사이트 chrome(헤더·하단 탭바)는 [locale]/layout.tsx 가 처리.
 * /admin, /preview 는 locale 외부 라우트라 자체 layout 만 적용된다.
 *
 * 주의: lang 은 default("ko") 고정. SEO·접근성 강화를 원하면 향후
 *       client 측에서 document.documentElement.lang 동적 갱신.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-win-teal font-mono text-black">{children}</body>
    </html>
  );
}
