# Tech & Books — 프로젝트 핸드오프 문서

> Mac Mini 등 다른 컴퓨터에서 이어서 작업할 때 이 파일 하나만 따라가면
> 셋업·아키텍처·다음 단계까지 전부 파악할 수 있도록 정리한 마스터 문서.
>
> **이 폴더(mobile-blog/) 안의 다른 문서들과의 관계**
> - `README.md` — 빠른 시작 가이드
> - `CLAUDE.md` — Claude Code가 자동으로 읽는 프로젝트 컨텍스트
> - `HANDOFF.md` (이 파일) — 의사결정 + 셋업 + 운영 흐름까지 한 곳에 정리
> - `scripts/translate.ts` — 번역 routine 코드 (GitHub Actions가 실행)
> - `scripts/draft-prompt.md` — 자동 초안 routine 프롬프트 (현재 미가동)
> - `supabase/schema.sql` + `supabase/migrations/*.sql` — DB 스키마

---

## 1. 프로젝트 한 줄 정의

IT × 책 주제의 **모바일 우선 다국어(ko/en/vi) 매거진형 블로그**.
운영자가 한국어로 글 작성 → 발행 → GitHub Actions routine이 영·베로 자동 번역 → 다국어 노출.

## 2. 의사결정 요약

| 항목 | 선택 | 이유 |
|------|------|------|
| 웹 구축 방식 | **직접 코딩** (Next.js + Supabase) | 자유도 ↑, Vercel·Supabase 무료 티어로 시작 가능 |
| 글 주제 | **IT + 책 혼합** | 두 카테고리로 구분, 톤은 분리하되 한 사이트에서 통합 운영 |
| 발행 주기 | **주 2편** (월·목) — 기본 IT, Book은 격주 목요일 | IT 비중↑(월간 6편) + 운영 부담 절반 |
| 분량 정책 | 월 1200~1800자 (IT) / 목 IT=800~1200, Book=1500~2500 | 짧은·긴 결을 한 주 안에 섞어 SEO 유리 |
| **다국어** | **한·영·베 (ko/en/vi)** | 운영자가 베트남 거주, 다국어 독자 확보 |
| 다국어 운영 방식 | **운영자는 한국어만 작성, AI가 영·베 자동 번역** | 운영 부담 ↑ 방지, 일관 톤 유지 |
| 자동화 범위 | **초안 + 번역 자동, 발행은 수동** | 품질 관리·저작권·SEO 안전성 |
| 디자인 톤 | **Win98 retro** (모노스페이스 + 베벨 + 시안 데스크톱) | 테크 매거진 정체성 + 향수 |
| 호스팅 | **Vercel Hobby (무료)** | git push → 자동 배포, 사이트 도메인 무료 |
| 자동 routine 인프라 | **GitHub Actions cron** | Cowork 샌드박스가 외부 API 차단해서 우회 — 무료, 단순 |
| 번역 모델 | **Claude Sonnet 4.6** | 번역 품질 ↑, 월 ~$2 |
| 개발 환경 | 본인이 Claude Code로 직접 개발 | 자동 초안과 페이지 개발의 책임 분리 |

## 3. 아키텍처 한 장 그림

```
┌──────────────────────────────────────────────────────────────────┐
│   ① Vercel — 사이트 호스팅                                          │
│   https://mobile-blog-nu.vercel.app                              │
│   - main push → 자동 배포                                          │
│   - 공개 페이지 / 어드민 (인증) 모두 여기                              │
└───────────┬────────────────────────────────────────┬─────────────┘
            │                                        │
            │ Supabase REST                          │ next-intl /[locale]
            ▼                                        ▼
   ┌────────────────────────┐         독자 (모바일 브라우저)
   │ ② Supabase             │         /ko · /en · /vi 자동 라우팅
   │ posts (메타·상태)        │
   │ post_translations      │
   │ (언어별 본문)           │
   │ + RLS                  │
   └─────┬──────────────┬──┘
         │              │
         │              │
         ▼              ▼
   ┌──────────────┐ ┌──────────────────────────────────┐
   │ ③ 어드민      │ │ ④ GitHub Actions — 번역 routine    │
   │ /admin       │ │ 매시 정각 cron                      │
   │              │ │ - posts where status='published'   │
   │ 운영자가      │ │   AND translation_status='pending' │
   │ 한국어 작성   │ │ - Claude Sonnet 4.6 호출            │
   │ → 발행        │ │ - post_translations INSERT         │
   │              │ │                                    │
   └──────────────┘ │ Secrets: SUPABASE_*, ANTHROPIC_API_KEY │
                    └──────────────────────────────────────┘
```

핵심: ②(DB)는 ①(사이트)와 ④(routine) 둘 다에서 접근. ④는 **GitHub Actions에서** 실행 (Anthropic Cowork 샌드박스가 외부 도메인을 차단해서 거기 못 둠 — §10 참고).

## 4. 스택

- **Next.js 14** (App Router, RSC, Server Actions, TypeScript strict)
- **Tailwind CSS** — Win98 디자인 토큰 (`win-silver`, `win-navy` 등)
- **next-intl 4.x** — 다국어 라우팅 + 메시지
- **Supabase** — Postgres + Auth + RLS
- **react-markdown + remark-gfm** — 본문 렌더
- **lucide-react** — 아이콘
- **@anthropic-ai/sdk** + **tsx** — 번역 routine 스크립트
- **@supabase/ssr** — 쿠키 기반 세션
- **Vercel** — 사이트 호스팅
- **GitHub Actions** — 번역 routine cron 인프라

## 5. 현재 만들어진 파일

```
mobile-blog/
├── README.md / CLAUDE.md / HANDOFF.md (이 파일)
├── package.json / tsconfig.json / next.config.js / tailwind.config.ts
├── postcss.config.js / .env.example / .gitignore / middleware.ts
│
├── app/
│   ├── layout.tsx                 루트 (html/body, globals.css)
│   ├── globals.css                Win98 톤 + .prose-article + .win-* 유틸
│   ├── robots.ts                  /admin·/api Disallow + sitemap URL
│   ├── [locale]/                  ko·en·vi 라우팅
│   │   ├── layout.tsx             Header + main + BottomTabBar + NextIntlClientProvider
│   │   ├── page.tsx               홈
│   │   ├── category/[name]/page.tsx
│   │   └── post/[slug]/page.tsx
│   └── admin/                     locale 외부 (sans-serif)
│       ├── layout.tsx · page.tsx
│       ├── actions.ts             post_translations 쓰기
│       ├── login/page.tsx
│       └── edit/[id]/page.tsx     원본 언어 선택 + 번역 미리보기
│
├── components/
│   ├── Header.tsx · BottomTabBar.tsx · Win98.tsx
│   ├── PostCard.tsx · CategoryPill.tsx · TagBadge.tsx
│   └── LanguageSwitcher.tsx
│
├── lib/
│   ├── supabase-server.ts · supabase-browser.ts
│   ├── post.ts                    pickTranslation: locale fallback
│   └── types.ts                   Locale, PostRow, Translation, PostView
│
├── i18n/
│   ├── routing.ts                 locales=[ko,en,vi]
│   └── request.ts                 messages 로드
│
├── messages/
│   └── ko.json · en.json · vi.json
│
├── supabase/
│   ├── schema.sql                 통합 스키마 (신규 설치자용)
│   └── migrations/
│       ├── 001_i18n.sql           post_translations + 컬럼 추가
│       └── 002_translation_attempts.sql
│
├── scripts/
│   ├── translate.ts               번역 routine (Node.js/tsx)
│   ├── translate-routine-prompt.md (legacy, Cowork용)
│   └── draft-prompt.md            자동 초안 프롬프트 (현재 미가동)
│
└── .github/
    └── workflows/
        └── translate.yml          매시 정각 cron + workflow_dispatch
```

## 6. 다른 컴퓨터로 옮기는 방법

### GitHub 경유 (권장 — 이미 진행됨)

이미 https://github.com/LongKim88/mobile-blog 에 push되어 있습니다.

새 컴퓨터에서:

```bash
gh repo clone LongKim88/mobile-blog
cd mobile-blog
```

또는 SSH·HTTPS로:

```bash
git clone https://github.com/LongKim88/mobile-blog.git
cd mobile-blog
```

이 방식이 좋은 이유: Vercel 자동 배포 연결도 GitHub 기준이고, 어차피 git을 쓰게 됨.

## 7. 새 컴퓨터 초기 셋업 (1회만)

이미 설치된 건 건너뛰면 됨.

### 7.1 Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 7.2 Node.js (LTS) + GitHub CLI + Git

```bash
brew install node gh git
node --version    # v20+ 권장
```

### 7.3 GitHub 인증

```bash
gh auth login    # HTTPS + 웹 로그인 선택
git config --global user.email "longkim2025@gmail.com"
git config --global user.name "LongKim88"
```

### 7.4 Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

폴더 안에서 `claude` 입력하면 세션이 시작되고 자동으로 `CLAUDE.md`를 읽습니다.

## 8. 프로젝트 실행 단계 (새 컴퓨터에서)

### 8.1 Supabase 프로젝트는 이미 있음

기존 프로젝트 사용. 새로 만들 필요 없음.

- URL: `https://hsfajllebqazwwnxjrjh.supabase.co`
- 마이그레이션 002까지 적용된 상태

새로 처음부터 만들어야 한다면:
1. https://supabase.com → New project
2. Region: `Northeast Asia (Seoul)`
3. SQL Editor에 `supabase/schema.sql` 통째로 실행 (이게 최신 통합 스키마)
4. Auth Providers → Email enable
5. Auth Users → Add user (본인 이메일·비번)

### 8.2 환경변수 채우기

```bash
cp .env.example .env.local
```

`.env.local`을 열어:

```
NEXT_PUBLIC_SUPABASE_URL=https://hsfajllebqazwwnxjrjh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...     # Settings → API Keys
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...              # Settings → API Keys
NEXT_PUBLIC_SITE_NAME=Tech & Books
NEXT_PUBLIC_SITE_URL=http://localhost:3000           # production 에선 Vercel 도메인
```

### 8.3 의존성 설치 + 로컬 실행

```bash
npm install
npm run dev
```

→ http://localhost:3000 → `/ko`로 자동 redirect.

### 8.4 첫 로그인·발행 확인

1. http://localhost:3000/admin/login → 로그인
2. /admin → "+ 새 초안" → 한국어로 채우고 저장 → 발행
3. http://localhost:3000/ko → 카드 표시 확인

## 9. Vercel 배포 (이미 완료, 새로 셋업할 때 참고)

production 사이트: https://mobile-blog-nu.vercel.app

### 9.1 새로 셋업하는 경우

1. https://vercel.com 가입 (GitHub 연동)
2. Add New → Project → `LongKim88/mobile-blog` 선택 → Import
3. **Environment Variables 5개 등록** (Production + Preview 둘 다 체크):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_NAME=Tech & Books`
   - `NEXT_PUBLIC_SITE_URL=https://<vercel-domain>`
4. Deploy

> ⚠️ `ANTHROPIC_API_KEY`는 Vercel에 **등록하지 마세요** — 사이트는 Claude를 직접 호출하지 않습니다. 그건 GitHub Actions 전용.

### 9.2 배포 후 — Supabase Auth 등록 필수

Authentication → URL Configuration:
- **Site URL**: `https://<vercel-domain>`
- **Redirect URLs**: `https://<vercel-domain>/**` 추가 (로컬 `http://localhost:3000/**` 도 같이 두기)

## 10. 자동 routine — GitHub Actions

> 📝 **이력 메모**: 초기 설계는 Anthropic Cowork(Scheduled Tasks)에 routine을 올리는 것이었으나, **Cowork 샌드박스가 외부 도메인을 allowlist로 제한**해서 Supabase REST API 호출이 차단됐습니다 (403 blocked-by-allowlist). 그래서 GitHub Actions로 이전했고, 결과적으로 더 단순·견고한 인프라가 되었습니다. 같은 이유로 자동 초안 routine도 결국 GitHub Actions로 갈 예정.

### 10.1 번역 routine — 가동 중

- 위치: `.github/workflows/translate.yml` + `scripts/translate.ts`
- 트리거: 매시 정각 cron + 수동(workflow_dispatch)
- 비용: Anthropic API 월 ~$2 (글 1편 영·베 번역 ≈ $0.08)
- 안전장치: 1회 5건, 본문 10000자 상한, 재시도 3회, translating 잠금, prompt caching, 월 $5 hard limit

### 10.2 새로 등록할 때 (이미 등록되어 있으면 SKIP)

GitHub repo Settings → Secrets and variables → Actions → New repository secret 3개:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://hsfajllebqazwwnxjrjh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` (같은 값) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (콘솔에서 발급, 월 $5 hard limit 설정) |

그 후 Actions 탭 → translate-routine → Run workflow 한 번 → 검증.

### 10.3 자동 초안 routine — 미가동 (향후 작업)

`scripts/draft-prompt.md` 의 동작을 GitHub Actions에서 돌리도록 만드는 작업.
요약:
- 월·목 KST 8시 cron
- 웹 검색·RSS로 소재 → Claude로 한국어 글 작성 → posts + post_translations(ko) INSERT (status='draft')
- 번역 routine이 매시 정각에 영·베 자동 채움
- 운영자는 /admin에서 검토만 → 발행

## 11. 개발 로드맵

`CLAUDE.md` 와 같은 내용:

### Phase 1 — 운영 시작 (✅ 완료)
- Supabase + Vercel 배포 완료
- 첫 글 발행 + 번역 routine 가동 검증

### Phase 2 — 사용성
- 마크다운 라이브 프리뷰 (split view, 모바일 탭)
- 대시보드 검색·필터 (카테고리/상태/번역 상태)
- 발행 직전 confirm 모달
- 모바일 자동 저장 (debounce 3초)
- `posts.reading_time_min` + 카드/상세에 "○분 읽기"
- legacy posts.title/summary/content_md 컬럼 완전 제거 (003 마이그레이션)

### Phase 3 — 독자 경험
- 페이지네이션 / 더 보기
- 본문 TOC 자동 추출 (h2 기준)
- `/[locale]/tag/[name]` 페이지 (FIND 탭 활성화)
- og:image 자동 (Vercel OG)
- RSS / sitemap.xml / hreflang

### Phase 4 — 분석·SEO·자동 초안
- Plausible / Umami
- structured data (Article schema.org)
- 관련 글 추천
- **자동 초안 routine GitHub Actions 이식**

### 보류
- 댓글 시스템 / 다중 작성자 / 자동 발행 (절대 금지)

## 12. 자주 막힐 만한 부분 / 트러블슈팅

### "Supabase 로그인이 안 돼요"
- Authentication → Users 에 본인 계정이 실제로 있는지 확인
- production 도메인에서 안 되면 Auth → URL Configuration의 Site URL과 Redirect URLs가 제대로 등록됐는지

### "글이 발행됐는데 공개 페이지에 안 보여요"
- ISR 캐시 (페이지에 `revalidate=60`) 때문에 최대 1분 지연. `actions.ts`의 발행 함수가 모든 locale의 `revalidatePath`를 호출하지만 캐시 시점에 따라 잠깐 지연 가능
- Vercel에서 즉시 보고 싶으면 Deployments → Redeploy

### "RLS 때문에 admin에서 글 저장이 안 돼요"
- 로그인 세션이 끊겼을 가능성 → 다시 로그인
- SQL Editor에서 `select * from pg_policies where tablename in ('posts','post_translations');` 로 정책 확인

### "환경변수가 적용 안 돼요"
- `.env.local`은 `npm run dev` 재시작 필요
- **`NEXT_PUBLIC_*` 변수는 Vercel에서 빌드 타임에 인라인됨 — 변경 후 "Use existing Build Cache" 끄고 Redeploy 해야 반영**
- Vercel 환경변수 등록은 Settings → Environments → Production 클릭 → Environment Variables 섹션

### "이미지가 안 보여요"
- `next.config.js` 에 `images.unoptimized: true` 설정 — `<img>` 태그 그대로 사용. 외부 이미지 URL이 깨졌는지 확인

### "TypeScript 에러"
- `npm run build`로 정확한 오류 위치 확인. dev 서버는 타입 검사가 약함, build는 strict
- 큰 변경 후 push 전에 한 번 build 권장

### "dev에서 'Cannot find module ./vendor-chunks/...'"
- `.next` 빌드 캐시 손상 (보통 `npm run build`를 dev 서버 떠있는 채 돌렸을 때):
  ```bash
  rm -rf .next
  npm run dev
  ```

### "GitHub Actions npm ci 가 sync 에러"
- 로컬 npm 11 vs CI npm 10 lock file 호환성. workflow가 `npm install --no-audit --no-fund` 로 우회하도록 되어 있음. 그래도 막히면 lock file 재생성:
  ```bash
  rm -f package-lock.json && rm -rf node_modules
  npm install
  git add package-lock.json && git commit -m "fix: regenerate lock"
  git push
  ```

### "translate routine이 작동 안 함"
- Actions 탭에서 마지막 실행 로그 확인
- 가장 흔한 원인 3가지: Secrets 누락 (`[fatal] 환경변수 누락:`) / Anthropic 한도 초과 / `posts.translation_attempts` 컬럼 없음 (migration 002 미적용)

### "Cowork에 routine 등록했는데 안 됨"
- Cowork 샌드박스가 외부 도메인을 allowlist로 차단. **routine은 GitHub Actions에서 돌립니다** (§10 참고)

## 13. 자주 쓸 명령어 모음

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드 (배포 전 검증) — dev 서버 멈춘 상태에서
npm run build && npm start

# 번역 routine 로컬 시뮬레이션 (환경변수 필요)
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... npm run translate

# 의존성 추가
npm install <package>

# 타입 체크만
npx tsc --noEmit

# .next 캐시 손상 복구
rm -rf .next && npm run dev

# Claude Code 시작
claude

# GitHub Actions 수동 트리거 (gh CLI)
gh workflow run translate-routine
gh run list --workflow=translate-routine

# Supabase 마이그레이션 다시 적용 (스키마 변경 시)
# Supabase 대시보드 → SQL Editor 에서 새 SQL 실행
```

## 14. 참고 링크

- production 사이트: https://mobile-blog-nu.vercel.app
- GitHub repo: https://github.com/LongKim88/mobile-blog
- Vercel 프로젝트: https://vercel.com (mobile-blog)
- Supabase 프로젝트: https://supabase.com/dashboard (`hsfajllebqazwwnxjrjh`)
- Anthropic 콘솔: https://console.anthropic.com (월 $5 hard limit)
- Next.js App Router: https://nextjs.org/docs/app
- next-intl: https://next-intl.dev
- Supabase + Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs

## 15. 막혔을 때 어디서 도움받을지

- **사이트 코드 (Next.js, Tailwind, Supabase 통합)** → 폴더에서 `claude` (Claude Code)
- **번역 품질·톤** → `scripts/translate.ts` 의 `SYSTEM_PROMPT` 수정
- **자동 초안 정책** → `scripts/draft-prompt.md` 수정 후 routine에 반영
- **디자인 톤·아키텍처 큰 그림** → Claude Code 또는 Claude 데스크톱

---

**핵심만 다시 한 번**

1. 새 컴퓨터: `gh repo clone LongKim88/mobile-blog` + Node·gh·Claude Code 설치
2. `.env.local` 채우기 (Supabase API Keys 페이지 + `NEXT_PUBLIC_SITE_NAME=Tech & Books`)
3. `npm install && npm run dev` → http://localhost:3000/ko 확인
4. 어드민 로그인·첫 글 발행
5. push → Vercel 자동 배포 (이미 연결됨)
6. 번역 routine은 GitHub Actions에서 자동 가동 중. 본인이 손댈 필요 없음.
7. 자동 초안 routine은 미가동 — Phase 4에서 같은 GitHub Actions 패턴으로 추가 예정.

좋은 운영 되시길!
