#!/usr/bin/env tsx
/**
 * 번역 routine — published 글 중 번역 누락 언어를 채우는 작업.
 * GitHub Actions cron 또는 로컬에서 실행 가능.
 *
 * 환경변수 필수:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY  (RLS 우회 — 외부 노출 금지)
 * - ANTHROPIC_API_KEY          (콘솔에서 발급한 sk-ant-* 키)
 *
 * 안전장치:
 * - 1회 실행 최대 5건 처리
 * - 본문 10000자 초과 시 영구실패 처리
 * - 재시도 3회 후 permanent_failure 로 멈춤 (운영자 수동 개입 필요)
 * - translating 상태로 잠금 (concurrent 실행 중복 처리 방지)
 * - prompt caching 으로 토큰 비용 ~90% 절감
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ─── 환경변수 검증 ─────────────────────────────────────────────
const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const ANTHROPIC_API_KEY = requiredEnv("ANTHROPIC_API_KEY");

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[fatal] 환경변수 누락: ${name}`);
    process.exit(1);
  }
  return v;
}

// ─── 설정 ──────────────────────────────────────────────────────
const MODEL = "claude-sonnet-4-6";
const MAX_POSTS_PER_RUN = 5;
const MAX_BODY_CHARS = 10_000;
const MAX_ATTEMPTS = 3;
const MAX_OUTPUT_TOKENS = 8192;

const LOCALES = ["ko", "en", "vi"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_NAMES: Record<Locale, string> = {
  ko: "Korean (한국어)",
  en: "English",
  vi: "Vietnamese (Tiếng Việt)",
};

const LOCALE_TONE: Record<Locale, string> = {
  ko: "정보 전달 위주의 짧은 문장. 매거진 톤.",
  en: "Tech-magazine tone, concise, active voice.",
  vi: "Trang trọng nhưng thân thiện, ngôn ngữ kỹ thuật rõ ràng.",
};

const SYSTEM_PROMPT = `당신은 IT·책 큐레이션 블로그의 전문 번역가입니다.

규칙:
1. 마크다운 구조를 정확히 유지 — heading(##), list, blockquote, code block, link, table 등.
2. 코드 블록(\`\`\`...\`\`\`) 내부는 절대 번역하지 말 것. 변수명·함수명·문자열 그대로.
3. 기술 용어와 제품명은 원문 유지: Next.js, GitHub, Supabase, AI, Claude, Cursor, React, TypeScript 등.
4. 의미 단위로 자연스럽게 번역. 직역체 피하고 매거진 톤 유지.
5. 문장 수를 임의로 늘리거나 줄이지 말 것. 추가 정보·요약 금지.
6. 제목은 60자 이내. 한국어 제목이 영어로 길어지면 핵심 단어 위주로 압축.
7. 인용 박스(blockquote)·강조(**)·인라인 코드 등 장식 요소 그대로 유지.
8. 출처 URL, 코드 식별자, 영문 고유명사 변경 금지.
9. 응답은 반드시 valid JSON 객체로만. \`\`\`json fence 또는 추가 설명 절대 금지.`;

// ─── 클라이언트 ────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ─── 타입 ──────────────────────────────────────────────────────
type TranslationRow = {
  language: Locale;
  title: string;
  summary: string | null;
  content_md: string;
};

type PostCandidate = {
  id: string;
  slug: string;
  source_language: Locale;
  translation_status: string;
  translation_attempts: number;
  post_translations: TranslationRow[] | null;
};

type Outcome = "success" | "failed" | "permanent_failure" | "skipped";

// ─── 메인 ──────────────────────────────────────────────────────
async function main() {
  console.log(
    `[translate] 시작 — model=${MODEL}, max=${MAX_POSTS_PER_RUN}건, attempt 한도=${MAX_ATTEMPTS}`
  );

  const { data: candidates, error } = await supabase
    .from("posts")
    .select(
      "id, slug, source_language, translation_status, translation_attempts, post_translations(language, title, summary, content_md)"
    )
    .eq("status", "published")
    .in("translation_status", ["pending", "failed"])
    .order("updated_at", { ascending: true })
    .limit(MAX_POSTS_PER_RUN);

  if (error) {
    console.error("[fatal] candidate 조회 실패:", error.message);
    process.exit(1);
  }
  if (!candidates || candidates.length === 0) {
    console.log("[translate] 처리 대상 없음 — 종료.");
    return;
  }

  const tally = { success: 0, failed: 0, permanent_failure: 0, skipped: 0 };
  for (const post of candidates) {
    const outcome = await processPost(post as PostCandidate);
    tally[outcome] += 1;
  }

  console.log(
    `[translate] 완료 — 성공 ${tally.success} / 실패 ${tally.failed} / 영구실패 ${tally.permanent_failure} / 스킵 ${tally.skipped} (총 ${candidates.length})`
  );
}

// ─── 글 1건 처리 ───────────────────────────────────────────────
async function processPost(post: PostCandidate): Promise<Outcome> {
  const tag = `[${post.slug}]`;
  console.log(
    `${tag} 시도 ${post.translation_attempts + 1}/${MAX_ATTEMPTS} (source=${post.source_language})`
  );

  // 1) translating 으로 잠금 — 다른 인스턴스 선점 방지
  const { data: locked, error: lockErr } = await supabase
    .from("posts")
    .update({ translation_status: "translating" })
    .eq("id", post.id)
    .in("translation_status", ["pending", "failed"])
    .select("id")
    .maybeSingle();

  if (lockErr) {
    console.error(`${tag} 잠금 실패:`, lockErr.message);
    return "skipped";
  }
  if (!locked) {
    console.log(`${tag} 다른 인스턴스가 잡음 — 스킵`);
    return "skipped";
  }

  // 2) source 본문 추출
  const translations = post.post_translations ?? [];
  const source = translations.find((t) => t.language === post.source_language);
  if (!source || !source.content_md.trim()) {
    console.log(`${tag} source 본문 비어 있음 — pending 으로 복원`);
    await supabase
      .from("posts")
      .update({ translation_status: "pending" })
      .eq("id", post.id);
    return "skipped";
  }

  // 3) 본문 길이 검사
  if (source.content_md.length > MAX_BODY_CHARS) {
    console.warn(
      `${tag} 본문 ${source.content_md.length}자 — ${MAX_BODY_CHARS} 초과, 영구실패`
    );
    await supabase
      .from("posts")
      .update({
        translation_status: "permanent_failure",
        translation_attempts: post.translation_attempts + 1,
      })
      .eq("id", post.id);
    return "permanent_failure";
  }

  // 4) 누락 언어 산출
  const present = new Set(translations.map((t) => t.language));
  const missing = LOCALES.filter(
    (l) => l !== post.source_language && !present.has(l)
  );

  if (missing.length === 0) {
    console.log(`${tag} 누락 언어 없음 — completed`);
    await supabase
      .from("posts")
      .update({ translation_status: "completed" })
      .eq("id", post.id);
    return "success";
  }

  console.log(`${tag} 번역 대상: ${missing.join(", ")}`);

  // 5) 누락 언어별 번역 + INSERT
  let allOk = true;
  for (const target of missing) {
    try {
      const translated = await translate(source, post.source_language, target);
      const { error: insertErr } = await supabase
        .from("post_translations")
        .insert({
          post_id: post.id,
          language: target,
          title: translated.title,
          summary: translated.summary,
          content_md: translated.content_md,
        });
      if (insertErr) {
        // 23505 = unique 제약 위반 (이미 같은 (post_id, language) 존재)
        if (insertErr.code === "23505") {
          console.log(`${tag}/${target} 이미 존재 — 건너뜀`);
        } else {
          throw insertErr;
        }
      } else {
        console.log(`${tag}/${target} ✓ ${translated.content_md.length}자`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`${tag}/${target} ✗ ${msg}`);
      allOk = false;
    }
  }

  // 6) 결과에 따라 상태 업데이트
  const newAttempts = post.translation_attempts + 1;
  if (allOk) {
    await supabase
      .from("posts")
      .update({
        translation_status: "completed",
        translation_attempts: newAttempts,
      })
      .eq("id", post.id);
    return "success";
  }
  if (newAttempts >= MAX_ATTEMPTS) {
    await supabase
      .from("posts")
      .update({
        translation_status: "permanent_failure",
        translation_attempts: newAttempts,
      })
      .eq("id", post.id);
    console.warn(`${tag} ${newAttempts}회 실패 — permanent_failure 로 정지`);
    return "permanent_failure";
  }
  await supabase
    .from("posts")
    .update({
      translation_status: "failed",
      translation_attempts: newAttempts,
    })
    .eq("id", post.id);
  return "failed";
}

// ─── Claude 번역 호출 ─────────────────────────────────────────
async function translate(
  source: { title: string; summary: string | null; content_md: string },
  sourceLang: Locale,
  targetLang: Locale
): Promise<{ title: string; summary: string | null; content_md: string }> {
  const userPrompt = `다음 글을 ${LOCALE_NAMES[targetLang]}로 번역하세요.
톤: ${LOCALE_TONE[targetLang]}

응답은 반드시 valid JSON 객체 한 개로만. fence·설명·앞뒤 텍스트 모두 금지.

원문 (source: ${LOCALE_NAMES[sourceLang]}):

${JSON.stringify(
  { title: source.title, summary: source.summary, content_md: source.content_md },
  null,
  2
)}

응답 스키마:
{
  "title": "string (60자 이내)",
  "summary": "string | null",
  "content_md": "string (마크다운 본문)"
}`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude 응답에 text block 없음");
  }

  // 혹시 ```json fence 가 섞여 있으면 정리
  const cleaned = textBlock.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      `JSON 파싱 실패: ${(e as Error).message} — 응답 앞부분: ${cleaned.slice(0, 200)}`
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { title?: unknown }).title !== "string" ||
    typeof (parsed as { content_md?: unknown }).content_md !== "string"
  ) {
    throw new Error("응답 JSON 스키마 불일치 (title/content_md 누락 또는 타입 불일치)");
  }

  const obj = parsed as {
    title: string;
    summary?: string | null;
    content_md: string;
  };
  return {
    title: obj.title,
    summary: obj.summary ?? null,
    content_md: obj.content_md,
  };
}

main().catch((e) => {
  console.error("[fatal]", e);
  process.exit(1);
});
