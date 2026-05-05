# Tech & Books — 프로젝트 컨텍스트 (Claude Code용)

이 파일은 Claude Code(또는 Cursor/Windsurf 등)가 본 프로젝트의 의도와 규칙을
이해하도록 돕습니다. 새 세션을 시작할 때 자동으로 읽힙니다.

## 한 줄 요약

IT × 책 주제의 **모바일 우선 매거진형 블로그**.
글 본문은 외부에서 자동 생성된 초안을 운영자(=오너 1명)가 검토 후 발행.

## 사용자

- **오너 (관리자, 글 발행자)** — 본인 1명. 모바일에서 `/admin` 접속해 초안 검토·발행.
- **독자 (일반 방문자)** — 인증 없이 발행된 글만 읽음.

다중 운영자 시나리오는 현재 범위 밖.

## 스택

- **Next.js 14** (App Router, RSC, Server Actions)
- **TypeScript** (strict)
- **Tailwind CSS** — 커스텀 팔레트 (`ink`, `accent`, `cat.it`, `cat.book`)
- **Supabase** — Postgres + Auth + RLS
- **react-markdown + remark-gfm** — 본문 렌더
- **Vercel** 배포 전제

## 파일 구조 (현재 스캐폴드)

```
app/
  layout.tsx, globals.css, page.tsx (홈)
  category/[name]/page.tsx
  post/[slug]/page.tsx
  admin/
    layout.tsx
    page.tsx          # 대시보드
    actions.ts        # Server Actions (저장/발행/해제/삭제/로그아웃)
    login/page.tsx
    edit/[id]/page.tsx
components/  Header, PostCard, CategoryPill, TagBadge
lib/         supabase-server.ts, supabase-browser.ts, types.ts
supabase/    schema.sql
scripts/     draft-prompt.md  (Cowork 측 자동 초안 작업용 — 이 코드베이스 외부)
```

## 디자인 톤

테크 매거진 감성. 다음 규칙을 깨지 않으면 자유롭게 개선해 됨.

- 본문 가독성 최우선 (모바일에서 한 손 스크롤이 편해야 함)
- 큰 타이포그래피 + 넓은 여백, 장식적인 그림자/그라데이션 지양
- 카테고리 칩(IT=파랑/BOOK=보라)으로 시각 분류
- 액센트 컬러는 오렌지 `#ff5a1f` (`accent-DEFAULT`) — 링크·발행 버튼·강조선
- 본문 한국어/영어 혼합 — 시스템 기본 산세리프 (Pretendard 우선) 사용

## 데이터 모델

`posts` 테이블 (자세한 스키마는 `supabase/schema.sql`):

```
id uuid pk, title, slug unique, category('IT'|'Book'),
tags text[], summary, content_md, cover_url,
source_urls text[], status('draft'|'published'|'archived'),
created_at, updated_at, published_at
```

**RLS 핵심**: 비로그인 = `status='published'` 만 SELECT, 인증된 사용자(=관리자) = 전체 R/W.

## 자동 글쓰기 — 이 코드베이스가 다루지 않는 부분

자동 초안 생성은 **외부 스케줄 태스크(Anthropic Cowork)** 에서 실행되어
Supabase REST API로 `posts` 테이블에 `status='draft'` 로 INSERT합니다.
**이 Next.js 앱에서 자동 생성 로직을 구현하지 마세요.** 단순히 초안이 들어와 있으면
관리자 화면에 표시되고, 운영자가 검토 후 발행만 하면 됩니다.

자동 작업 측 프롬프트는 `scripts/draft-prompt.md` (참고용 사본).

## 개발 우선순위 (제안 로드맵)

스캐폴드는 동작하는 최소 버전입니다. Claude Code에서 다음 순서로 키워가면 좋습니다.

### Phase 1 — 운영 시작에 필요한 것
1. Supabase 프로젝트 생성 + `supabase/schema.sql` 실행
2. `.env.local` 채우고 `npm install && npm run dev` 검증
3. 관리자 계정으로 첫 글 직접 작성·발행 (자동화 없이도 사이트가 살아있는지 확인)
4. Vercel 배포 + 커스텀 도메인 연결

### Phase 2 — 사용성 개선
- `/admin/edit/[id]` 에 **마크다운 라이브 프리뷰** 추가 (split view)
- `/admin` 대시보드에 검색·필터 (카테고리/상태)
- 발행 직전 confirm 모달 (실수 방지)
- 모바일에서 본문 편집 시 자동 저장 (debounce 3초)
- `posts` 에 `reading_time_min` 컬럼 추가 → 카드/상세 페이지에 "○분 읽기"

### Phase 3 — 독자 경험
- 홈/카테고리 페이지 페이지네이션 또는 "더 보기"
- 본문 상단 **목차(TOC)** 자동 추출 (h2 기준)
- `/tag/[name]` 페이지 — 태그별 필터
- `og:image` 자동 생성 (Vercel OG)
- RSS 피드 (`/rss.xml`)
- sitemap.xml + robots.txt

### Phase 4 — 분석·SEO
- 방문 분석 (Plausible/Umami 등 가벼운 도구)
- structured data (Article schema.org)
- 관련 글 추천 (태그 기반 단순 매칭으로 시작)

### 의도적으로 보류
- 댓글 시스템 — 운영 부담만 큼, 처음엔 빼는 게 낫다
- 다국어 — 한국어 단일로 시작
- 다중 작성자 — 위 사용자 정의 참고
- 자동 발행 — 절대 금지 (자동은 초안까지만)

## 코딩 규칙

- 서버 컴포넌트 우선, 인터랙션이 필요한 부분만 `"use client"` 분리
- 데이터 페칭은 서버 컴포넌트 내부에서 직접 `createSupabaseServerClient()` 호출
- 변경 작업은 **Server Actions** (`app/admin/actions.ts` 패턴 참고)
- DB 컬럼명은 snake_case, TypeScript 변수는 camelCase로 매핑하지 말고 그대로 사용 (단순함 유지)
- Tailwind 임의값(`text-[1.65rem]` 등) 사용 가능. 컴포넌트가 작으면 분리하지 않아도 됨.
- 새 컴포넌트는 `components/`, 새 라이브러리 함수는 `lib/`
- 페이지에서 `revalidate` 시간을 명시 (현재 60초). 정적이면 더 길게.

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    # 서버 전용 — 클라이언트 노출 금지
NEXT_PUBLIC_SITE_NAME
NEXT_PUBLIC_SITE_URL
```

## 배포

- 레포지토리: GitHub
- 호스팅: Vercel (Next.js 공식)
- DB: Supabase Cloud (무료 티어로 충분)
- CI: 별도 없음 — Vercel이 PR 프리뷰 + main 자동 배포

## 첫 작업으로 좋은 프롬프트 (Claude Code에)

> "@CLAUDE.md 를 참고해서, 먼저 이 프로젝트가 빌드 통과하는지 확인해줘.
> 그 다음 `/admin/edit/[id]/page.tsx` 에 마크다운 라이브 프리뷰(split view)를
> 추가하고, 모바일에서는 탭으로 전환되도록 만들어줘."
