"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-lg font-bold">관리자 로그인</h1>
      <p className="mb-5 text-[12px] text-ink-400">
        Supabase Authentication에 등록된 계정으로 로그인하세요.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <div className="mb-1 text-[12px] font-medium text-ink-500">Email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <div className="mb-1 text-[12px] font-medium text-ink-500">Password</div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        {err && <div className="text-[12px] text-red-600">{err}</div>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-ink-900 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50"
        >
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
