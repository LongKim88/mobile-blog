# Tech Mag — IT × Books 모바일 블로그

자동 초안 생성 + 수동 검토/발행 흐름의 모바일 우선 매거진형 블로그 스타터.

## 스택

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — 테크 매거진 톤
- **Supabase** — Postgres + Auth + RLS
- **Vercel** — 배포
- **Claude 스케줄 태스크** — 화/목/토 자동 초안 생성

## 폴더 구조

```
mobile-blog/
├── app/
│   ├── layout.tsx                      # 루트 레이아웃 + 글로벌 스타일
│   ├── globals.css
│   ├── page.tsx                        # 홈 피드 (최근 글)
│   ├── category/[name]/page.tsx        # 카테고리(IT/Book) 페이지
│   ├── post/[slug]/page.tsx            # 포스트 상세
│   └── admin/
│       ├── layout.tsx                  # 인증 가드
│       ├── page.tsx                    # 초안 목록
│       ├── login/page.tsx              # 로그인 폼
│       └── edit/[id]/page.tsx          # 초안 편집/발행
├── components/
│   ├── Header.tsx
│   ├── PostCard.tsx
│   ├── TagBadge.tsx
│   └── CategoryPill.tsx
├── lib/
│   ├── supabase-server.ts              # 서버 컴포넌트용 클라이언트
│   ├── supabase-browser.ts             # 클라이언트 컴포넌트용
│   └── types.ts
├── supabase/
│   └── schema.sql                      # 테이블/RLS/인덱스 정의
├── scripts/
│   └── draft-prompt.md                 # 스케줄 태스크용 프롬프트
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

## 1. Supabase 셋업 (5분)

1. https://supabase.com 가입 → 새 프로젝트
2. **SQL Editor** 메뉴에서 `supabase/schema.sql` 내용을 통째로 복사해 실행
3. **Project Settings → API** 에서 다음 두 값 복사:
   - `Project URL`
   - `anon public` 키
4. **Authentication → Providers**에서 Email 로그인 활성화 (또는 Google OAuth)
5. **Authentication → Users**에서 본인 계정 1개 생성 (관리자용)

## 2. 로컬 실행

```bash
cd mobile-blog
cp .env.example .env.local
# .env.local 에 Supabase 값 채우기
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 3. 첫 초안 만들어보기

`/admin/login` 으로 가서 Supabase에 만든 계정으로 로그인 →
`/admin` 에서 "새 초안" 버튼 → 글 작성 → "발행" 누르면 공개 페이지에 노출됩니다.

## 4. 자동 초안 생성 스케줄 등록

`scripts/draft-prompt.md` 의 프롬프트를 Claude에 붙여넣고
"이 작업을 매주 화/목/토 오전 8시에 실행하도록 스케줄 등록해 줘"
라고 요청하면 됩니다. Supabase 자격증명은 스케줄 태스크에 환경변수로 주입.

## 5. Vercel 배포

1. GitHub에 이 폴더를 푸시
2. Vercel에 GitHub 연동 → 프로젝트 임포트
3. 환경변수 추가: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## 발행 주기 (제안 기본값)

| 요일 | 카테고리 | 형식 | 분량 |
|------|----------|------|------|
| 화요일 | IT | 도구·오픈소스 소개 | 1200~1800자 |
| 목요일 | IT | 주간 뉴스 큐레이션 | 800~1200자 |
| 토요일 | Book | 핵심 요약·서평 | 1500~2500자 |

`scripts/draft-prompt.md` 에서 변경 가능.

## 핵심 규칙

- **자동 발행 ❌, 자동 초안 ⭕** — 모든 글은 본인이 검토 후 발행 버튼을 눌러야 공개됨
- **출처 명시** — 자동 생성 글은 참고한 원문 URL을 본문 하단에 자동 포함
- **중복 방지** — 최근 30일 안 다룬 주제만 선택
