"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { routing } from "@/i18n/routing";
import type { Category, Locale } from "@/lib/types";

// 허용 형식: 영소문자·숫자, 단어 사이 단일 하이픈, 양 끝 하이픈 금지, 80자 이내
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_LANGUAGES: ReadonlyArray<Locale> = ["ko", "en", "vi"];

function slugifyFromTitle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function fallbackSlug(id: string): string {
  return `post-${id.slice(0, 6)}`;
}

function isLocale(v: string): v is Locale {
  return (VALID_LANGUAGES as ReadonlyArray<string>).includes(v);
}

function revalidatePublicPaths(slug?: string) {
  for (const loc of routing.locales) {
    revalidatePath(`/${loc}`);
    revalidatePath(`/${loc}/category/it`);
    revalidatePath(`/${loc}/category/book`);
    if (slug) revalidatePath(`/${loc}/post/${slug}`);
  }
}

export async function newDraftAction(_formData?: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const slug = `draft-${Date.now()}`;
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .insert({
      slug,
      category: "IT",
      tags: [],
      source_urls: [],
      source_language: "ko",
      translation_status: "pending",
      status: "draft",
    })
    .select("id")
    .single();

  if (postErr || !post) {
    throw new Error(`초안 생성 실패: ${postErr?.message}`);
  }

  // 빈 source_language 번역 row 생성 — edit 페이지가 이 row 의 본문을 폼에 채움
  const { error: trErr } = await supabase.from("post_translations").insert({
    post_id: post.id,
    language: "ko",
    title: "",
    summary: null,
    content_md: "",
  });
  if (trErr) {
    throw new Error(`번역 row 생성 실패: ${trErr.message}`);
  }

  redirect(`/admin/edit/${post.id}`);
}

export async function saveDraftAction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const id = String(formData.get("id"));
  const sourceLanguageRaw = String(formData.get("source_language") ?? "ko");
  if (!isLocale(sourceLanguageRaw)) {
    throw new Error("잘못된 원본 언어 값");
  }
  const sourceLanguage: Locale = sourceLanguageRaw;

  // 본문 (source_language 에 해당)
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const content_md = String(formData.get("content_md") ?? "");

  // 메타 (언어 무관)
  const category = String(formData.get("category") ?? "IT") as Category;
  const tagsRaw = String(formData.get("tags") ?? "");
  const sourcesRaw = String(formData.get("source_urls") ?? "");
  const cover_url =
    String(formData.get("cover_url") ?? "").trim() || null;

  const tags = tagsRaw
    .split(/[,\n]/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
  const source_urls = sourcesRaw
    .split(/\s+/)
    .map((u) => u.trim())
    .filter(Boolean);

  // 슬러그
  const slugInput = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  let slug: string;
  if (slugInput) {
    if (!SLUG_RE.test(slugInput)) {
      throw new Error(
        "슬러그는 영소문자·숫자·하이픈만 사용 가능합니다 (예: my-post-2026)"
      );
    }
    slug = slugInput;
  } else {
    slug = slugifyFromTitle(title) || fallbackSlug(id);
  }

  const { data: collision } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();
  if (collision) {
    slug = `${slug}-${id.slice(0, 6)}`;
  }

  // posts 메타 UPDATE + translation_status='pending' (다른 언어 재번역 트리거)
  const { error: postErr } = await supabase
    .from("posts")
    .update({
      slug,
      category,
      tags,
      source_urls,
      cover_url,
      source_language: sourceLanguage,
      translation_status: "pending",
    })
    .eq("id", id);
  if (postErr) throw new Error(`저장 실패: ${postErr.message}`);

  // post_translations UPSERT (source_language)
  const { error: trErr } = await supabase
    .from("post_translations")
    .upsert(
      {
        post_id: id,
        language: sourceLanguage,
        title,
        summary,
        content_md,
      },
      { onConflict: "post_id,language" }
    );
  if (trErr) throw new Error(`번역 본문 저장 실패: ${trErr.message}`);

  revalidatePath("/admin");
  revalidatePath(`/admin/edit/${id}`);
}

export async function publishAction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // 먼저 본문 저장 (메타 + post_translations)
  await saveDraftAction(formData);

  const id = String(formData.get("id"));
  const { data: row, error } = await supabase
    .from("posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) throw new Error(`발행 실패: ${error.message}`);

  revalidatePublicPaths(row?.slug);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function unpublishAction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const id = String(formData.get("id"));
  const { data: row, error } = await supabase
    .from("posts")
    .update({ status: "draft" })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) throw new Error(`해제 실패: ${error.message}`);

  revalidatePublicPaths(row?.slug);
  revalidatePath("/admin");
}

export async function deleteAction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const id = String(formData.get("id"));
  // post_translations 는 ON DELETE CASCADE 로 자동 정리됨
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
  revalidatePublicPaths();
  revalidatePath("/admin");
  redirect("/admin");
}

export async function signOutAction(_formData?: FormData) {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
