import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트/Server Action에서 사용하는 Supabase 클라이언트.
 * 쿠키 기반 세션을 자동 처리.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            /* Server Component 안에서는 set이 무시될 수 있음 — 정상 */
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            /* noop */
          }
        },
      },
    }
  );
}
