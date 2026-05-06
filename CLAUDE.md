# Tech & Books — 프로젝트 컨텍스트 (Claude Code용)

이 파일은 Claude Code(또는 Cursor/Windsurf 등)가 본 프로젝트의 의도와 규칙을
이해하도록 돕습니다. 새 세션을 시작할 때 자동으로 읽힙니다.

## 한 줄 요약

IT × 책 주제의 **모바일 우선 다국어 매거진형 블로그**.
운영자가 한국어로 글 작성 → 발행 → 외부 routine이 영어·베트남어로 자동 번역 → 다국어 노출.

## 사용자

- **오너 (관리자, 글 발행자)** — 본인 1명. 베트남에서 운영. 모바일에서 `/admin` 접속해 한국어로 작성·검토·발행.
- **독자 (일반 방문자)** — 인증 없이 발행된 글만 읽음. 한국어/영어/베트남어 중 자기 언어로 자동 라우팅.

다중 운영자 시나리오는 현재 범위 밖.

## 스택

- **Next.js 14** (App Router, RSC, Server Actions)
- **TypeScript** (strict)
- **Tailwind CSS** — Win98 디자인 토큰 (`win-silver`, `win-navy`, `win-purple`, `win-teal` 등)
- **next-intl** — 다국어 라우팅 + 메시지 (`/ko`, `/en`, `/vi`)
- **Supabase** — Postgres + Auth + RLS
- **react-markdown + remark-gfm** — 본문 렌더
- **lucide-react** — 아이콘 (Win98 윈도우 컨트롤·하단 탭바 등)
- **@anthropic-ai/sdk** + **tsx** — 번역 routine 스크립트 (`scripts/translate.ts`)
- **Vercel** — 호스팅 ([https://mobile-blog-nu.vercel.app](https://mobile-blog-nu.vercel.app))
- **GitHub Actions** — 자동 번역 routine cron (매시 정각)

## 파일 구조

```
app/
  layout.tsx                          루트 레이아웃 (html/body, globals.css)
  globals.css                         Win98 톤 + .prose-article + .win-* 유틸
  robots.ts                           /admin·/api Disallow + sitemap URL
  [locale]/                           ko·en·vi 라우팅 (next-intl)
    layout.tsx                        Header + main + BottomTabBar + NextIntlClientProvider
    page.tsx                          홈 피드
    category/[name]/page.tsx          /[locale]/category/it · book
    post/[slug]/page.tsx              글 상세 (locale 본문 + fallback)
  admin/                              어드민 — locale 외부 (sans-serif 톤)
    layout.tsx                        font-sans 강제, 회색 배경
    page.tsx                          대시보드 (글 목록 + 번역 상태 배지)
    actions.ts                        Server Actions (저장/발행/해제/삭제 + post_translations 쓰기)
    login/page.tsx                    이메일·비번 로그인
    edit/[id]/page.tsx                편집기 (원본 언어 선택 + 번역 미리보기)

components/
  Header.tsx                          Win98 메인 윈도우 (admin 경로에서 hide)
  BottomTabBar.tsx                    HOME/IT/BOOK/FIND 4탭 (locale-aware, admin에서 hide)
  Win98.tsx                           TitleBar / Window 공용 프리미티브
  PostCard.tsx                        SUNKEN 패널 카드 (네이비 제목 + fallback 배지)
  CategoryPill.tsx                    [IT]/[BOOK] 브래킷 칩
  TagBadge.tsx                        회색 사각 #tag 배지
  LanguageSwitcher.tsx                KO/EN/VI 버튼 (헤더 우측)

lib/
  supabase-server.ts                  서버 컴포넌트용
  supabase-browser.ts                 클라이언트 컴포넌트용
  post.ts                             pickTranslation: 현재 locale 본문 + fallback
  types.ts                            Locale, PostRow, Translation, PostView 등

i18n/
  routing.ts                          locales=[ko,en,vi], defaultLocale=ko
  request.ts                          getRequestConfig — messages 로드

messages/
  ko.json · en.json · vi.json         UI 라벨 (헤더·네비·피드·메타)

middleware.ts                         /admin 가드 + intl middleware (locale 외부 분기)

supabase/
  schema.sql                          posts + post_translations + RLS + 뷰
  migrations/
    001_i18n.sql                      post_translations 테이블 + source_language·translation_status
    002_translation_attempts.sql      translation_attempts + permanent_failure 상태

scripts/
  translate.ts                        번역 routine — Supabase 조회 → Claude 호출 → INSERT
  translate-routine-prompt.md         (legacy) Cowork 등록용 — 현재는 GitHub Actions 사용
  draft-prompt.md                     자동 초안 routine 프롬프트 (현재 미가동)

.github/
  workflows/
    translate.yml                     매시 정각 cron + workflow_dispatch
```

## 디자인 톤 — Windows 98 retro

테크 매거진 + Win98 향수. 다음 규칙을 깨지 않으면 자유롭게 개선해도 됨.

- **컬러**: 데스크톱 시안 `#008080`, 윈도우 패널 실버 `#c0c0c0`, 타이틀바 네이비 `#000080` + 흰 글씨
- **카테고리**: IT=네이비, BOOK=보라(`#800080`)
- **폰트 (공개 사이트)**: Courier New + D2Coding(한글) + Apple SD Gothic Neo 폴백 — 모노스페이스
- **폰트 (어드민)**: sans-serif (Pretendard) — 기능 위주
- **베벨**: 양각 `.win-raised` (top/left=흰색, right/bottom=회색) / 음각 `.win-sunken` (반전)
- **하드 섀도우**: `4px 4px 0 0 #000`
- **터치 타겟**: 버튼·태그·탭 모두 최소 44px·36px (모바일 우선)
- 본문 가독성 우선 (모바일에서 한 손 스크롤이 편해야 함)
- **하단 탭바 고정** (HOME / IT / BOOK / FIND) — 어드민 영역에서는 hide

## 데이터 모델

`posts` (메타·상태) + `post_translations` (언어별 본문) 분리. 자세한 스키마는 `supabase/schema.sql`.

```
posts (
  id, slug, category, tags, cover_url, source_urls,
  source_language ('ko'|'en'|'vi'),
  translation_status ('pending'|'translating'|'completed'|'failed'|'permanent_failure'),
  translation_attempts INT,
  status ('draft'|'published'|'archived'),
  ... created_at, updated_at, published_at
)

post_translations (
  post_id (FK), language ('ko'|'en'|'vi'),
  title, summary, content_md,
  PRIMARY KEY (post_id, language)
)
```

**RLS 핵심**: 비로그인 = `posts.status='published'` 만 SELECT + 그 글의 번역만 읽기. 인증 사용자(=관리자) = 전체 R/W.

## 자동 글쓰기·번역 — 외부 인프라

자동 작업 두 종류:

| routine | 상태 | 인프라 | 트리거 |
|---|---|---|---|
| **번역** (한국어 발행 글 → 영·베) | ✅ 가동 중 | GitHub Actions (`.github/workflows/translate.yml`) | 매시 정각 cron + 수동 |
| **자동 초안 작성** (주 2편 한국어 — 월·목, Book은 격주 목) | ❌ 미가동 | (예정) GitHub Actions | 미정 |

**중요한 발견**: 초기 설계에서는 Anthropic Cowork(Scheduled Tasks)에 routine을 등록하려 했으나, **Cowork 샌드박스가 외부 도메인을 allowlist로 제한**해서 Supabase 도메인을 호출할 수 없었습니다. 그래서 routine을 **GitHub Actions로 이전**했고, Anthropic API를 직접 호출합니다.

### 번역 routine 동작

1. GitHub Actions cron이 매시 정각에 깨어남
2. `npm run translate` → `scripts/translate.ts` 실행
3. Supabase에서 `posts WHERE status='published' AND translation_status IN ('pending','failed')` 최대 5건 조회
4. 각 글의 source 본문을 Claude Sonnet 4.6으로 영어·베트남어로 번역
5. `post_translations` INSERT, `translation_status='completed'` (또는 실패 시 'failed' / 3회 실패 시 'permanent_failure')

### 안전장치 (코드에 반영됨)

- 1회 실행 최대 5건 (rate limit 방어)
- 본문 10000자 초과 시 영구실패
- 재시도 3회 한도
- `translating` 잠금 (concurrent 방지)
- prompt caching 활성 (~90% 토큰 절감)
- Anthropic 콘솔에서 월 $5 hard limit 설정

### 운영비

월 ~$2 (Anthropic Sonnet 4.6 토큰). 글 1편 영·베 번역 ≈ $0.08.

## 개발 우선순위 (제안 로드맵)

### Phase 1 — 운영 시작 (✅ 완료)
- Supabase + Vercel 배포
- 한국어 첫 글 발행
- 번역 routine 가동

### Phase 2 — 사용성 개선
- `/admin/edit/[id]` 마크다운 라이브 프리뷰 (split view, 모바일은 탭)
- `/admin` 대시보드 검색·필터 (카테고리/상태/번역 상태)
- 발행 직전 confirm 모달 (실수 방지)
- 모바일에서 본문 편집 시 자동 저장 (debounce 3초)
- `posts.reading_time_min` 컬럼 추가 → 카드/상세 페이지에 "○분 읽기"
- legacy posts.title/summary/content_md 컬럼 완전 제거 (003 마이그레이션)

### Phase 3 — 독자 경험
- 홈/카테고리 페이지 페이지네이션 또는 "더 보기"
- 본문 상단 **목차(TOC)** 자동 추출 (h2 기준)
- `/[locale]/tag/[name]` 페이지 — 태그 필터 (FIND 탭 활성화)
- `og:image` 자동 생성 (Vercel OG)
- RSS 피드 (`/[locale]/rss.xml`)
- sitemap.xml + hreflang

### Phase 4 — 분석·SEO
- 방문 분석 (Plausible/Umami)
- structured data (Article schema.org)
- 관련 글 추천 (태그 기반 단순 매칭)
- 자동 초안 routine GitHub Actions 이식

### 의도적으로 보류
- 댓글 시스템
- 다중 작성자
- 자동 발행 — **절대 금지** (자동은 초안·번역까지만, 발행은 운영자 수동)

## 코딩 규칙

- 서버 컴포넌트 우선, 인터랙션이 필요한 부분만 `"use client"` 분리
- 데이터 페칭은 서버 컴포넌트 내부에서 직접 `createSupabaseServerClient()` 호출
- 변경 작업은 **Server Actions** (`app/admin/actions.ts` 패턴 참고)
- DB 컬럼명은 snake_case, TypeScript 변수는 camelCase로 매핑하지 말고 그대로 사용
- Tailwind 임의값(`text-[1.65rem]` 등) 사용 가능. `win-*` 토큰은 `tailwind.config.ts`에 정의
- 새 컴포넌트는 `components/`, 새 라이브러리 함수는 `lib/`
- 페이지에서 `revalidate` 시간을 명시 (현재 60초). 정적이면 더 길게.
- 큰 변경 후 push 전에 `npm run build` 한 번 → Vercel type check 미리 통과 확인 권장

## 환경 변수

### `.env.local` (사이트용 — Vercel에도 같이 등록)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    # 서버 전용 — 클라이언트 노출 금지
NEXT_PUBLIC_SITE_NAME=Tech & Books
NEXT_PUBLIC_SITE_URL=https://mobile-blog-nu.vercel.app
```

### GitHub Secrets (번역 routine 전용 — Vercel에는 등록 안 함)

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY            # sk-ant-* — Anthropic 콘솔에서 발급, $5/월 hard limit 설정
```

## 배포

- 레포지토리: GitHub ([https://github.com/LongKim88/mobile-blog](https://github.com/LongKim88/mobile-blog))
- 호스팅: Vercel (Hobby plan, 무료)
  - main push → 자동 배포
  - production 도메인: `https://mobile-blog-nu.vercel.app`
- DB: Supabase Cloud (무료 티어)
- 자동 번역: GitHub Actions cron (`.github/workflows/translate.yml`) — 무료 (퍼블릭 repo 무제한)
- CI: 별도 없음

## 첫 작업으로 좋은 프롬프트 (Claude Code에)

> "@CLAUDE.md 를 참고해서, `/admin/edit/[id]/page.tsx`에 마크다운 라이브 프리뷰(split view)를 추가하고, 모바일에서는 탭으로 전환되도록 만들어줘. 어드민 톤(sans-serif, 회색 배경)은 그대로 유지."
