import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import BottomTabBar from "@/components/BottomTabBar";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 알 수 없는 locale 거부 (middleware가 1차 필터링하지만 직접 진입 대비)
  if (!routing.locales.includes(locale as never)) notFound();

  // 정적 렌더링 활성화
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <main className="mx-auto max-w-3xl space-y-3 px-2 pb-[80px] pt-3">
        {children}
      </main>
      <BottomTabBar />
    </NextIntlClientProvider>
  );
}
