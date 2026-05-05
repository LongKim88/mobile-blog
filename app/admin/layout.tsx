import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// 어드민 영역은 검색엔진 인덱싱 차단 (robots.txt와 함께 이중 방어)
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 인증 강제는 각 admin 페이지(page.tsx)에서 redirect로 처리합니다.
  // (login 페이지는 인증 없이 접근 가능해야 하므로 layout에서 일괄 redirect 하지 않음)
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    // 어드민은 기능 위주 — 공개 사이트의 Win98 톤과 분리해서 sans-serif·라이트 그레이 유지
    // root layout main의 padding/space-y를 음수 margin으로 상쇄
    <div className="-mx-2 -mt-3 -mb-[80px] min-h-screen bg-ink-50 pb-[80px] font-sans text-ink-800">
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-mono text-sm font-bold">
            admin<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center gap-3 text-[12px]">
            {user ? (
              <>
                <span className="text-ink-400">{user.email}</span>
                <Link
                  href="/"
                  className="rounded-full bg-ink-100 px-3 py-1 text-ink-600"
                >
                  사이트 보기
                </Link>
              </>
            ) : (
              <Link
                href="/admin/login"
                className="rounded-full bg-ink-900 px-3 py-1 text-white"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
    </div>
  );
}
