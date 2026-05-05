import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * /admin/** 인증 가드.
 * - 미인증 사용자가 /admin/** 접근 시 /admin/login 으로 redirect
 * - 이미 로그인된 사용자가 /admin/login 접근 시 /admin 으로 redirect
 */
async function adminGuard(req: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: req });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: req });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isLoginPage = path === "/admin/login";

  if (!isLoginPage && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  if (isLoginPage && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  return response;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // /admin/** : 인증 가드 (locale prefix 적용 안 함)
  if (path.startsWith("/admin")) {
    return adminGuard(req);
  }

  // /preview : 디자인 시안 — locale 외부로 그대로 통과
  if (path.startsWith("/preview")) {
    return NextResponse.next();
  }

  // 나머지 공개 사이트 — next-intl 라우팅 (locale 자동 prefix)
  return intlMiddleware(req);
}

export const config = {
  // _next, api, 정적 파일은 제외
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
