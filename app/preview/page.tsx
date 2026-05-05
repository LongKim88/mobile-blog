"use client";

/**
 * /preview — Win98 스타일 디자인 프로토타입 (단일 파일).
 * 채택 결정 후 components/* 와 globals.css·tailwind.config.ts 로 흡수 예정.
 *
 * 표현 범위: 헤더, 피드 카드, 글 상세(마크다운+코드 하이라이트), 태그 필터,
 *           로딩 스켈레톤, 하단 탭바, 버튼.
 */

import { useState } from "react";
import {
  X,
  Minus,
  Square,
  Home,
  Cpu,
  BookOpen,
  Search,
  Folder,
  FileText,
  HardDrive,
} from "lucide-react";

// ─── Win98 디자인 토큰 ──────────────────────────────────────
// 베이지/실버 데스크톱, 네이비 타이틀바, 흰색 패널 배경
const RAISED =
  "border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080]";
const SUNKEN =
  "border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white";
const HARD_SHADOW = "shadow-[4px_4px_0_0_#000]";

// ─── 공용 컴포넌트 ──────────────────────────────────────────

function TitleBar({
  title,
  active = true,
  icon: Icon = Folder,
}: {
  title: string;
  active?: boolean;
  icon?: typeof Folder;
}) {
  return (
    <div
      className={`flex h-7 items-center justify-between px-1 ${
        active ? "bg-[#000080]" : "bg-[#808080]"
      } text-white`}
    >
      <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold">
        <Icon size={14} strokeWidth={2.5} />
        <span className="truncate">{title}</span>
      </div>
      <div className="flex shrink-0 gap-0.5">
        {[Minus, Square, X].map((I, i) => (
          <button
            key={i}
            type="button"
            aria-label="window-control"
            className={`flex h-[22px] w-[22px] items-center justify-center bg-[#c0c0c0] text-black ${RAISED}`}
          >
            <I size={10} strokeWidth={3} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Window({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: typeof Folder;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[#c0c0c0] ${RAISED} ${HARD_SHADOW} ${className}`}>
      <TitleBar title={title} icon={icon} />
      <div className="p-2">{children}</div>
    </div>
  );
}

function Win98Button({
  children,
  className = "",
  pressed = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  pressed?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] bg-[#c0c0c0] px-4 py-2 text-[13px] font-bold text-black ${
        pressed ? SUNKEN : RAISED
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ─── 도메인 컴포넌트 ────────────────────────────────────────

type SamplePost = {
  category: "IT" | "BOOK";
  date: string;
  title: string;
  summary: string;
  tags: string[];
};

function PostCard({ post }: { post: SamplePost }) {
  const isIT = post.category === "IT";
  return (
    <article className={`mb-2 cursor-pointer bg-white p-3 ${SUNKEN}`}>
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <span
          className={`px-1 py-0.5 font-bold uppercase tracking-wider ${
            isIT ? "bg-[#000080] text-white" : "bg-[#800080] text-white"
          }`}
        >
          [{post.category}]
        </span>
        <span className="text-[#606060]">{post.date}</span>
      </div>
      <h3 className="mb-1 text-[15px] font-bold leading-tight text-[#000080] underline">
        {post.title}
      </h3>
      <p className="mb-2 text-[12px] leading-relaxed text-black">
        {post.summary}
      </p>
      <div className="flex flex-wrap gap-1">
        {post.tags.map((t) => (
          <span
            key={t}
            className="bg-[#dfdfdf] px-1.5 py-0.5 text-[10px] font-bold text-black"
          >
            #{t}
          </span>
        ))}
      </div>
    </article>
  );
}

function TagFilter({
  tags,
  active,
  onChange,
}: {
  tags: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  const all = ["ALL", ...tags];
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`min-h-[36px] bg-[#c0c0c0] px-2.5 py-1 text-[11px] font-bold text-black ${
            active === t ? SUNKEN : RAISED
          }`}
        >
          #{t}
        </button>
      ))}
    </div>
  );
}

function CodeBlock() {
  // 의존성 추가 없이 손수 토큰화한 데모 — 채택 시 highlight.js/shiki 연결
  return (
    <div className={`my-3 ${SUNKEN} bg-black p-3 text-[12px] leading-relaxed`}>
      <div className="mb-2 flex items-center gap-1 border-b border-[#404040] pb-1 text-[10px] text-[#a0a0a0]">
        <FileText size={10} />
        <span>example.ts</span>
      </div>
      <pre className="overflow-x-auto whitespace-pre font-mono">
        <span className="text-[#80c0ff]">export function</span>{" "}
        <span className="text-[#ffff80]">slugify</span>
        <span className="text-white">(input: </span>
        <span className="text-[#80ff80]">string</span>
        <span className="text-white">) {"{"}</span>
        {"\n  "}
        <span className="text-[#80c0ff]">return</span>{" "}
        <span className="text-white">input.toLowerCase()</span>
        {"\n    "}
        <span className="text-white">.replace(</span>
        <span className="text-[#ff80ff]">/[^a-z0-9]+/g</span>
        <span className="text-white">, </span>
        <span className="text-[#ff8080]">{'"-"'}</span>
        <span className="text-white">);</span>
        {"\n"}
        <span className="text-white">{"}"}</span>
      </pre>
    </div>
  );
}

function Skeleton() {
  return (
    <div className={`mb-2 bg-white p-3 ${SUNKEN}`}>
      <div className="animate-pulse space-y-2">
        <div className="h-3 w-20 bg-[#c0c0c0]" />
        <div className="h-4 w-full bg-[#c0c0c0]" />
        <div className="h-3 w-3/4 bg-[#c0c0c0]" />
        <div className="flex gap-1 pt-1">
          <div className="h-3 w-12 bg-[#c0c0c0]" />
          <div className="h-3 w-10 bg-[#c0c0c0]" />
        </div>
      </div>
    </div>
  );
}

function BottomTabBar({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const tabs = [
    { id: "home", icon: Home, label: "HOME" },
    { id: "it", icon: Cpu, label: "IT" },
    { id: "book", icon: BookOpen, label: "BOOK" },
    { id: "find", icon: Search, label: "FIND" },
  ];
  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 flex h-[56px] items-stretch gap-0.5 bg-[#c0c0c0] p-0.5 ${RAISED}`}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-pressed={isActive}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 bg-[#c0c0c0] text-black ${
              isActive ? SUNKEN : RAISED
            }`}
          >
            <Icon size={18} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── 페이지 ─────────────────────────────────────────────────

export default function PreviewPage() {
  const [tab, setTab] = useState("home");
  const [filter, setFilter] = useState("ALL");

  const samplePosts: SamplePost[] = [
    {
      category: "IT",
      date: "2026.05.04",
      title: "Cursor + Claude Code 협업 워크플로우",
      summary:
        "에디터 안에서 Claude를 직접 부르는 패턴 4가지와 실패 시나리오 정리.",
      tags: ["ai", "tools", "weekly"],
    },
    {
      category: "IT",
      date: "2026.05.02",
      title: "Next.js 14 → 15 마이그레이션 노트",
      summary: "params async 변경, fetch 캐시 기본값, App Router 동작 차이.",
      tags: ["nextjs", "react"],
    },
    {
      category: "BOOK",
      date: "2026.04.27",
      title: "사피엔스 — 인지혁명에서 AI까지",
      summary:
        "유발 하라리가 그린 인류 역사 서사를 4개의 혁명으로 압축해서 정리.",
      tags: ["history", "review"],
    },
  ];

  const allTags = [
    "ai",
    "tools",
    "nextjs",
    "react",
    "history",
    "review",
    "weekly",
  ];

  const filtered =
    filter === "ALL"
      ? samplePosts
      : samplePosts.filter((p) => p.tags.includes(filter.toLowerCase()));

  return (
    <div
      className="min-h-screen bg-[#008080] pb-[80px]"
      style={{
        fontFamily:
          // 영문은 Courier 계열, 한글은 D2Coding/Apple SD Gothic Neo로 폴백
          "'Courier New', 'Lucida Console', 'D2Coding', 'Apple SD Gothic Neo', monospace",
      }}
    >
      {/* 라이브 사이트로 돌아가기 (프로토타입 전용) */}
      <div className="bg-[#c0c0c0] px-2 py-1 text-[10px] text-[#404040]">
        <a href="/" className="underline hover:text-[#000080]">
          ← live site
        </a>
        <span className="mx-2">|</span>
        <span>preview / win98</span>
      </div>

      <div className="space-y-3 px-2 pt-3">
        {/* 메인 헤더 윈도우 */}
        <div className={`bg-[#c0c0c0] ${RAISED} ${HARD_SHADOW}`}>
          <TitleBar title="Tech & Books — IT와 책 사이의 노트" icon={HardDrive} />
          <div className="flex gap-3 border-b border-[#808080] px-3 py-1 text-[12px]">
            {["File", "Edit", "View", "Help"].map((m) => (
              <span
                key={m}
                className="cursor-pointer hover:bg-[#000080] hover:text-white"
              >
                <span className="underline">{m[0]}</span>
                {m.slice(1)}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-black">
            <span>
              C:\BLOG&gt;{" "}
              <span className="bg-black px-0.5 text-white">_</span>
            </span>
            <span className="text-[#606060]">매주 화·목·토 발행</span>
          </div>
        </div>

        {/* 피드 */}
        <Window title="Latest Posts" icon={Folder}>
          {filtered.length === 0 ? (
            <div className={`bg-white p-6 text-center ${SUNKEN}`}>
              <p className="text-[12px] text-[#404040]">
                해당 태그의 글이 없습니다.
              </p>
            </div>
          ) : (
            filtered.map((p, i) => <PostCard key={i} post={p} />)
          )}
        </Window>

        {/* 태그 필터 */}
        <Window title="Filter by Tag" icon={Search}>
          <TagFilter tags={allTags} active={filter} onChange={setFilter} />
        </Window>

        {/* 글 상세 샘플 */}
        <Window title="post-cursor-claude.md" icon={FileText}>
          <div className={`bg-white p-3 text-[13px] leading-relaxed text-black ${SUNKEN}`}>
            <div className="mb-2 flex items-center gap-2 text-[11px]">
              <span className="bg-[#000080] px-1 py-0.5 font-bold uppercase text-white">
                [IT]
              </span>
              <span className="text-[#606060]">2026.05.04</span>
              <span className="text-[#606060]">· 6분 읽기</span>
            </div>
            <h2 className="mb-3 text-[18px] font-bold leading-tight">
              Cursor + Claude Code 협업 워크플로우
            </h2>
            <p className="mb-3 border-l-4 border-[#000080] bg-[#dfdfdf] p-2 text-[12px]">
              에디터에서 Claude를 부르는 4가지 패턴 — 비용·속도·정확도가 모두
              다르다. 어떤 걸 골라야 할지 정리한다.
            </p>
            <h3 className="mb-2 mt-4 border-b-2 border-black pb-1 text-[15px] font-bold">
              ## 1. Inline 자동완성
            </h3>
            <p className="mb-2">
              가장 빠르고 가장 싸지만 컨텍스트가 좁다. 짧은 헬퍼·정형
              리팩터에 적합. 한 파일을 넘기는 순간 정확도가 떨어진다.
            </p>
            <CodeBlock />
            <p className="mb-2">
              위 함수는 <code className="bg-[#dfdfdf] px-1">[a-z0-9]+</code>만
              허용한다. 한글 입력 시{" "}
              <code className="bg-[#dfdfdf] px-1">post-{`{id}`}</code>{" "}
              fallback으로 떨어진다.
            </p>
            <ul className="mb-2 list-disc space-y-1 pl-5 text-[12px]">
              <li>장점: 결과가 즉시 보임</li>
              <li>단점: 다중 파일 변경에 약함</li>
              <li>비용: 매우 낮음</li>
            </ul>
          </div>
        </Window>

        {/* 액션 버튼 */}
        <Window title="Actions" icon={Cpu}>
          <div className="flex flex-wrap gap-2">
            <Win98Button>READ MORE</Win98Button>
            <Win98Button>SUBSCRIBE</Win98Button>
            <Win98Button>SHARE</Win98Button>
          </div>
        </Window>

        {/* 로딩 스켈레톤 */}
        <Window title="Loading…" icon={HardDrive}>
          <Skeleton />
          <Skeleton />
          <div className={`mt-1 ${SUNKEN} bg-white p-2`}>
            <div className="flex items-center justify-between text-[11px]">
              <span>Copying files…</span>
              <span className="text-[#606060]">42%</span>
            </div>
            <div className={`mt-1 h-3 ${SUNKEN} bg-white`}>
              <div
                className="h-full bg-[#000080]"
                style={{
                  width: "42%",
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #000080 0 4px, #0000c0 4px 8px)",
                }}
              />
            </div>
          </div>
        </Window>
      </div>

      <BottomTabBar active={tab} onChange={setTab} />
    </div>
  );
}
