# Tech & Books — 프로젝트 핸드오프 문서

> Mac Mini 등 다른 컴퓨터에서 이어서 작업할 때 이 파일 하나만 따라가면
> 셋업·아키텍처·다음 단계까지 전부 파악할 수 있도록 정리한 마스터 문서.
>
> **이 폴더(mobile-blog/) 안의 다른 문서들과의 관계**
> - `README.md` — 빠른 시작 가이드
> - `CLAUDE.md` — Claude Code가 자동으로 읽는 프로젝트 컨텍스트
> - `HANDOFF.md` (이 파일) — 의사결정 + 셋업 + 운영 흐름까지 한 곳에 정리
> - `scripts/draft-prompt.md` — 자동 초안 작성용 프롬프트 (Cowork 측 운영)
> - `supabase/schema.sql` — DB 스키마

---

## 1. 프로젝트 한 줄 정의

IT × 책 주제의 **모바일 우선 매거진형 블로그**.
Claude(Cowork)가 정기적으로 글 초안을 자동 작성 → 본인이 모바일에서 검토 → 발행.

## 2. 의사결정 요약

| 항목 | 선택 | 이유 |
|------|------|------|
| 웹 구축 방식 | **직접 코딩** (Next.js + Supabase) | 자유도 최고, Vercel 무료, Supabase 무료 티어로 시작 가능 |
| 글 주제 | **IT + 책 혼합** | 두 카테고리로 구분, 톤은 분리하되 한 사이트에서 통합 운영 |
| 발행 주기 | **주 3편** (화/목/토) | 화·목 IT, 토 책 — 균형이 자연스럽고 검토 부담 적음 |
| 분량 정책 | 화 1200~1800자(IT 도구 소개) / 목 800~1200자(IT 뉴스) / 토 1500~2500자(서평) | 한 주 안에 짧은·중간·긴 결을 섞어 SEO 유리 |
| 자동화 범위 | **초안만 자동, 발행은 수동** | 품질 관리·저작권·SEO 안전성 |
| 디자인 톤 | **테크 매거진 감성** | 큰 타이포·여백, 카테고리 칩, 액센트 오렌지 |
| 개발 환경 | **본인이 Claude Code로 직접 개발** | 자동 초안과 페이지 개발의 책임 분리 |

## 3. 아키텍처 한 장 그림

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ① 자동 초안 생성 (Cowork 스케줄 태스크)                          │
│   화/목/토 오전 8시                                               │
│   - RSS / 웹 검색으로 소재 수집                                    │
│   - Claude가 글 작성                                               │
│   - Supabase REST API로 INSERT (status='draft')                  │
│                                                                  │
└──────────────────┬───────────────────────────────────────────────┘
                   │ HTTPS
                   ▼
       ┌────────────────────────────────┐
       │   ② Supabase (Postgres + Auth) │
       │   posts 테이블 (RLS 적용)        │
       │   - 비로그인: published 만 SELECT │
       │   - 인증: 전체 R/W                │
       └─────────────┬──────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
  ┌──────────────┐        ┌────────────────────┐
  │  ③ 공개 사이트 │        │  ④ 관리자 페이지     │
  │  Next.js SSR │        │  /admin (모바일에서) │
  │              │        │                    │
  │  /           │        │  - 초안 검토         │
  │  /category   │        │  - 편집              │
  │  /post/[slug]│        │  - 발행 / 해제 / 삭제 │
  │              │        │                    │
  │  Vercel 배포  │        │  본인이 사용          │
  └──────────────┘        └────────────────────┘
        ▲
        │
   독자 (모바일 브라우저)
```

핵심: ①과 ③/④는 **완전히 분리**되어 있음. ①은 Cowork 측에서 운영, ③/④는 본인이 Next.js로 개발. 둘이 만나는 지점은 Supabase 한 곳뿐.

## 4. 스택

- **Next.js 14** (App Router, RSC, Server Actions, TypeScript strict)
- **Tailwind CSS** — 커스텀 팔레트(`ink`, `accent`, `cat.it`, `cat.book`)
- **Supabase** — Postgres + Auth + RLS
- **react-markdown + remark-gfm** — 본문 렌더
- **@supabase/ssr** — 쿠키 기반 세션
- **Vercel** — 호스팅 (전제)

## 5. 현재 만들어진 파일 (스캐폴드)

```
mobile-blog/
├── README.md                       빠른 시작
├── CLAUDE.md                       Claude Code용 프로젝트 컨텍스트
├── HANDOFF.md                      ← 이 파일
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
├── .env.example
├── .gitignore
│
├── app/
│   ├── layout.tsx                  루트 레이아웃 + 글로벌 메타
│   ├── globals.css                 전역 스타일 + .prose-article
│   ├── page.tsx                    홈 피드 (최근 30개)
│   ├── category/[name]/page.tsx    /category/it, /category/book
│   ├── post/[slug]/page.tsx        포스트 상세 + OG 메타
│   └── admin/
│       ├── layout.tsx              관리자 헤더
│       ├── page.tsx                대시보드 (초안/발행 분리)
│       ├── actions.ts              Server Actions (저장/발행/해제/삭제)
│       ├── login/page.tsx          이메일·비번 로그인
│       └── edit/[id]/page.tsx      편집기
│
├── components/
│   ├── Header.tsx                  공개 헤더
│   ├── PostCard.tsx                피드 카드 (default / feature)
│   ├── CategoryPill.tsx            IT/BOOK 칩
│   └── TagBadge.tsx                태그 배지
│
├── lib/
│   ├── supabase-server.ts          서버 컴포넌트용
│   ├── supabase-browser.ts         클라이언트 컴포넌트용
│   └── types.ts                    Post, Category, PostStatus
│
├── supabase/
│   └── schema.sql                  posts 테이블 + RLS + 트리거 + 뷰
│
└── scripts/
    └── draft-prompt.md             자동 초안 작업용 프롬프트 (Cowork 운영)
```

## 6. Mac Mini로 옮기는 방법

이 폴더(`mobile-blog/`)를 통째로 Mac Mini로 옮기는 가장 깔끔한 방법은 **GitHub 경유**.

### 방법 A: GitHub 경유 (권장)

현재 컴퓨터에서:

```bash
cd mobile-blog
git init
git add .
git commit -m "Initial scaffold"
# GitHub에서 새 비공개 저장소 만들고 그 URL 사용
git branch -M main
git remote add origin https://github.com/<your-username>/mobile-blog.git
git push -u origin main
```

Mac Mini에서:

```bash
git clone https://github.com/<your-username>/mobile-blog.git
cd mobile-blog
```

이 방식이 좋은 이유: Vercel 자동 배포 연결도 GitHub 기준이고, 어차피 git을 쓰게 됨.

### 방법 B: AirDrop / iCloud Drive

폴더를 통째로 AirDrop 또는 iCloud Drive에 올려서 Mac Mini에서 받기. 빠르지만 git 이력이 없으니 결국 위처럼 git init은 해야 함.

### 방법 C: 외장 디스크 / USB

가장 단순. 폴더를 그대로 복사.

## 7. Mac Mini 초기 셋업 (1회만)

처음 쓰는 Mac Mini라면 다음을 설치해 두세요. 이미 설치된 건 건너뛰면 됩니다.

### 7.1 Homebrew (macOS 패키지 매니저)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

설치 후 안내 문구의 `eval "$(/opt/homebrew/bin/brew shellenv)"` 같은 줄을 `~/.zshrc`에 추가하라고 나오면 그대로 따라하기.

### 7.2 Node.js (LTS)

```bash
brew install node
node --version    # v20.x 이상 권장
npm --version
```

### 7.3 Git

```bash
brew install git
git config --global user.name "<본인 이름>"
git config --global user.email "longkim2025@gmail.com"
```

### 7.4 Claude Code (선택, 권장)

```bash
npm install -g @anthropic-ai/claude-code
```

설치 후 프로젝트 폴더에서 `claude` 만 입력하면 세션이 시작되고, 자동으로 `CLAUDE.md`를 읽어 컨텍스트로 사용합니다.

### 7.5 코드 에디터

VS Code 또는 Cursor 둘 중 편한 쪽:

```bash
brew install --cask visual-studio-code
# 또는
brew install --cask cursor
```

Cursor를 쓰면 IDE 안에서 채팅으로 Claude를 쓸 수 있고, VS Code는 별도 터미널에서 `claude` 명령으로 Claude Code를 띄우는 흐름.

## 8. 프로젝트 실행 단계 (Mac Mini에서)

### 8.1 Supabase 프로젝트 만들기 (1회)

1. https://supabase.com 가입 → "New project"
2. 리전은 `Northeast Asia (Seoul)` 권장 (한국 사용자 기준 빠름)
3. DB 비밀번호 설정 (어딘가 보관)
4. 프로젝트 생성 후 좌측 **SQL Editor** → New query
5. 본 폴더의 `supabase/schema.sql` 내용을 통째로 복사 → Run
6. 좌측 **Authentication → Providers** → Email 활성화 (기본값으로 OK)
7. 좌측 **Authentication → Users** → "Add user" → 본인 이메일·비번 등록
8. 좌측 **Project Settings → API** → 다음 3개 값을 메모해 둠
   - `Project URL`
   - `anon` `public` 키
   - `service_role` `secret` 키 ⚠️ 외부 노출 금지

### 8.2 환경변수 채우기

```bash
cd mobile-blog
cp .env.example .env.local
```

`.env.local`을 열어 위 3개 값과 사이트 정보를 채움:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_NAME=Tech & Books
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 8.3 의존성 설치 + 로컬 실행

```bash
npm install
npm run dev
```

→ 브라우저에서 `http://localhost:3000` 접속.
처음엔 발행된 글이 없으니 빈 화면이 정상.

### 8.4 첫 글 발행해 보기

1. `http://localhost:3000/admin/login` → 8.1에서 만든 계정으로 로그인
2. `/admin` 으로 이동 → "+ 새 초안" 클릭
3. 제목·카테고리·본문 채우고 → "저장" → "발행"
4. `http://localhost:3000` 으로 가서 글이 보이는지 확인

여기까지 동작하면 **사이트 자체는 완성**. 이제 본인이 원하는 기능을 키워가면 됨.

## 9. Vercel 배포 (사이트 공개)

1. https://vercel.com 가입 (GitHub 연동)
2. "Import Project" → 위에서 만든 GitHub 저장소 선택
3. Framework: Next.js (자동 감지됨)
4. **Environment Variables** 탭에서 `.env.local`에 있는 값 그대로 추가
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_NAME`
   - `NEXT_PUBLIC_SITE_URL` ← 배포 후엔 실제 도메인으로 바꾸기
5. Deploy

배포 완료 후엔 `<프로젝트>.vercel.app` 도메인이 생기고, GitHub의 main 브랜치에 push할 때마다 자동 재배포.

커스텀 도메인이 있으면 Vercel 대시보드 → Domains 에서 연결.

## 10. 자동 초안 생성 (Cowork 측 운영)

이 부분은 **Mac Mini에서 코드 작업할 필요 없음**. Cowork(Claude 데스크톱 모드)에서 운영함.

### 10.1 흐름

화/목/토 오전 8시에 자동으로:
1. Cowork가 RSS·웹에서 IT 뉴스/도구 / 책 신간 검색
2. `recent_topics` 뷰 조회로 최근 30일 안 다룬 주제 골라냄
3. Claude가 정해진 톤·길이로 글 작성
4. Supabase REST API에 `status='draft'` 로 INSERT
5. (선택) 본인에게 알림

### 10.2 등록 방법

Mac Mini에서 사이트가 동작하는 걸 확인한 다음, **Cowork(Claude 데스크톱)** 으로 와서:

1. 새 대화 시작
2. `mobile-blog/scripts/draft-prompt.md` 내용을 통째로 복사해 붙여넣기
3. 그 아래에 다음 정보 추가:
   - Supabase URL
   - Supabase Service Role Key
4. 메시지 끝에 **"이 작업을 매주 화·목·토 오전 8시(KST)에 실행되는 스케줄 태스크로 등록해 줘"** 라고 요청
5. Cowork가 스케줄 등록 → 첫 실행을 한 번 즉시 돌려서 검증해 달라고 추가 요청 가능

이 등록은 **딱 한 번만** 하면 이후 자동 운영됨.

### 10.3 운영 도중 톤·정책 바꾸고 싶을 때

`scripts/draft-prompt.md` 내용을 수정해서 다시 같은 절차를 반복하면 됨. 정책을 코드에 박아두지 않은 이유가 이것 — 사이트 코드는 그대로 두고 작성 정책만 갈아끼울 수 있음.

## 11. 개발 로드맵 (제안)

`CLAUDE.md`에도 같은 내용이 있지만 여기 한 번 더 정리:

### Phase 1 — 운영 시작
- Supabase + Vercel 셋업
- 첫 글 직접 발행해서 흐름 확인

### Phase 2 — 사용성
- `/admin/edit` 마크다운 라이브 프리뷰 (split view, 모바일은 탭)
- 대시보드 검색·필터
- 발행 직전 confirm 모달
- 모바일 자동 저장 (debounce 3초)
- `reading_time_min` 컬럼 + 카드/상세 표시

### Phase 3 — 독자 경험
- 페이지네이션 또는 "더 보기"
- 본문 TOC 자동 추출 (h2 기준)
- `/tag/[name]` 태그 페이지
- `og:image` 자동 생성 (Vercel OG)
- RSS 피드, sitemap.xml, robots.txt

### Phase 4 — 분석·SEO
- Plausible 또는 Umami (가벼운 분석)
- structured data (Article schema.org)
- 관련 글 추천 (태그 기반)

### 보류 / 의도적 제외
- 댓글 시스템 (운영 부담)
- 다국어 (한국어 단일)
- 다중 작성자 (1인 운영 전제)
- 자동 발행 (절대 금지 — 자동은 초안까지만)

## 12. 자주 막힐 만한 부분 / 트러블슈팅

### "Supabase 로그인이 안 돼요"
- Authentication → Users 에 본인 계정이 실제로 있는지 확인
- 비밀번호를 잊었으면 같은 화면에서 "Send password reset" 가능
- 이메일 confirm이 필요한 설정이라면 받은 메일에서 확인 클릭

### "글이 발행됐는데 공개 페이지에 안 보여요"
- ISR 캐시 때문일 수 있음. 페이지에 `revalidate = 60` 이라 최대 1분 지연
- 즉시 반영하려면 Vercel에서 재배포 또는 `revalidatePath` 호출 (이미 발행 액션에 포함됨)

### "RLS 때문에 admin에서 글 저장이 안 돼요"
- 로그인 세션이 끊겼을 가능성 → 다시 로그인
- `supabase/schema.sql` 의 `auth full access` 정책이 적용됐는지 SQL Editor에서 `select * from pg_policies where tablename = 'posts';` 로 확인

### "환경변수가 적용 안 돼요"
- `.env.local`은 `npm run dev` 재시작이 필요함 (저장만으론 적용 안 됨)
- Vercel은 환경변수 추가 후 재배포가 필요

### "이미지가 안 보여요"
- `next.config.js` 의 `remotePatterns`에 `**` 가 들어있어 모든 https는 허용됨. 도메인 차단이 의심되면 거기를 좁혀가며 디버그

### "TypeScript 에러"
- `npm run build`로 정확한 오류 위치 확인
- 자주 발생: `params`가 `Promise`인지 동기인지 — 본 스캐폴드는 동기 가정

## 13. 자주 쓸 명령어 모음

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드 (배포 전 검증)
npm run build && npm start

# 의존성 추가
npm install <package>

# 타입 체크만
npx tsc --noEmit

# Claude Code 시작 (프로젝트 폴더 안에서)
claude

# Supabase 마이그레이션 다시 적용 (스키마 변경 시)
# Supabase 대시보드 → SQL Editor 에서 새 SQL 실행
```

## 14. 참고 링크

- Next.js App Router 문서: https://nextjs.org/docs/app
- Supabase + Next.js 가이드: https://supabase.com/docs/guides/auth/server-side/nextjs
- Tailwind CSS: https://tailwindcss.com/docs
- Vercel 배포: https://vercel.com/docs/deployments
- Claude Code: https://docs.claude.com/en/docs/claude-code/overview

## 15. 막혔을 때 어디서 도움받을지

- **사이트 코드 관련 (Next.js, Tailwind, Supabase 통합)** → Mac Mini에서 `claude` (Claude Code)
- **자동 초안 정책·스케줄** → Cowork (Claude 데스크톱)
- **디자인 톤 결정·아키텍처 큰 그림** → 둘 중 어느 쪽이든 가능

---

**핵심만 다시 한 번**

1. `mobile-blog/` 폴더 통째로 Mac Mini로 (GitHub 경유 권장)
2. Mac Mini에서 Node·Git·Claude Code·VS Code/Cursor 설치
3. Supabase 프로젝트 만들고 `schema.sql` 실행 → 관리자 계정 등록
4. `.env.local` 채우고 `npm install && npm run dev`
5. `/admin` 에서 첫 글 직접 발행해 흐름 확인
6. GitHub push → Vercel 연결로 공개 배포
7. Cowork에 와서 자동 초안 스케줄 한 번 등록
8. 이후 본인은 Mac Mini에서 Claude Code로 사이트 키워가기

좋은 출발 되시길!
