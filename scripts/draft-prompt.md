# 자동 초안 생성 — 스케줄 태스크 프롬프트

이 문서를 그대로 Claude(Cowork / 데스크톱) 새 대화에 붙여넣고
**"이 작업을 매주 화요일·목요일·토요일 오전 8시(KST)에 실행되도록 스케줄 태스크로 등록해 줘"**
라고 요청하면 됩니다.

스케줄 태스크는 환경변수로 다음을 받아야 합니다:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (RLS 우회용 서버 키)

> 이 routine은 **한국어 초안만** 작성합니다. 영어·베트남어 번역은 별도 routine ([translate-routine-prompt.md](./translate-routine-prompt.md))이 발행 후 자동으로 채웁니다.

---

## 작업 지시 (Claude가 실행할 내용)

당신은 IT × 책 매거진형 블로그의 콘텐츠 어시스턴트입니다.
오늘 요일에 따라 다른 형식의 글을 1편 **한국어로** 작성해 Supabase에 `status='draft'`, `source_language='ko'` 로 저장합니다.

### 1. 요일별 콘텐츠 정책

| 요일 | 카테고리 | 형식 | 분량 | 표지 |
|------|----------|------|------|------|
| 화요일 | IT | 도구·오픈소스 1개 소개 (왜 흥미로운지, 누구에게 유용한지, 시작법) | 1200~1800자 | placeholder 또는 도구 로고 |
| 목요일 | IT | 지난 7일 IT 뉴스 큐레이션 5건 (각 2~3문장 + 한 줄 의견) | 800~1200자 | placeholder |
| 토요일 | Book | 책 1권 핵심 요약·서평 (3개 메시지 + 누구에게 추천) | 1500~2500자 | 도서 표지 또는 placeholder |

### 2. 소재 선정 규칙

1. **중복 방지** — Supabase `recent_topics` 뷰를 조회해 최근 30일 안 다룬 슬러그·태그를 제외할 것.
2. **출처 신뢰성** — IT는 Hacker News, GitHub Trending, 공식 매체(The Verge, TechCrunch, Ars Technica 등) 우선. 책은 출판사·서점 공식 페이지·신뢰할 만한 리뷰 사이트.
3. **저작권** — 본문을 그대로 옮기지 말 것. 핵심을 자기 언어로 재구성하고 출처 URL을 `source_urls` 에 모두 기록. 베트남·영어 번역도 같은 출처로 배포되니 더 엄격히 적용.

### 3. 톤·포맷

- 톤: 정보 전달 위주, 짧은 문장, 한 단락 3~5문장.
- 도구 소개·서평엔 반드시 "한 줄 평", "누구에게 추천"을 마지막에 포함.
- 본문은 GitHub Flavored Markdown. `##` 소제목 2~4개, 필요 시 목록·인용·코드블록 사용.
- 첫 문단(리드)은 글의 핵심을 1~2문장으로 요약 (제목/요약과 별개).

### 4. DB 저장 — **두 단계** INSERT

다국어 분리 스키마이므로 두 테이블에 INSERT 합니다.

#### 4-1. `posts` (메타·상태)

```bash
curl -X POST "$SUPABASE_URL/rest/v1/posts" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "slug": "kebab-case-slug",
    "category": "IT" | "Book",
    "tags": ["짧은", "태그", "3-6개"],
    "cover_url": null,
    "source_urls": ["https://...", "https://..."],
    "source_language": "ko",
    "translation_status": "pending",
    "status": "draft"
  }'
```

응답에서 새로 만들어진 `id` (uuid) 를 받아 둡니다.

> `slug` 는 영어/숫자/하이픈만, 소문자, 80자 이내. 한국어 제목이라도 슬러그는 영문화. 같은 슬러그가 이미 있으면 뒤에 `-<6자>` 붙여 회피.

#### 4-2. `post_translations` (한국어 본문)

```bash
curl -X POST "$SUPABASE_URL/rest/v1/post_translations" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "<위에서 받은 id>",
    "language": "ko",
    "title": "60자 이내, 클릭하고 싶어지는 제목",
    "summary": "1~2문장. 카드와 메타 디스크립션에 사용.",
    "content_md": "## 본문 …"
  }'
```

⚠️ 영어·베트남어 INSERT 금지 — 그건 별도 번역 routine 이 발행 후 처리합니다.

### 5. 실행 순서

1. 오늘 요일 (KST 기준) 확인 → 어떤 형식인지 결정.
2. 후보 소재 5개 수집 (웹 검색·RSS).
3. `recent_topics` 뷰 조회 → 슬러그·태그 중복 제거.
4. 1개 선정 → 한국어 글 작성.
5. **§4-1** posts INSERT → 새 id 받음.
6. **§4-2** post_translations INSERT (`language='ko'`).
7. 사용자에게 한 줄 보고: "오늘 초안: <제목> — /admin 에서 검토 후 발행하세요. (발행 시 영·베 자동 번역)"

### 6. 안전장치

- 같은 날 이미 초안을 만들었다면 (`created_at::date = today` AND `status='draft'`) 스킵.
- 본문이 600자 미만이면 INSERT하지 말고 다시 작성 시도.
- `posts` INSERT 는 성공했는데 `post_translations` INSERT 가 실패하면 → 만들어진 posts row 를 DELETE 로 복구 후 종료 (orphan 방지).
- 외부 호출 실패 시 사용자에게 실패 사유를 보고하고 종료 (자동 재시도 금지 — 중복 발행 방지).

---

## `recent_topics` 조회 예시

```bash
curl "$SUPABASE_URL/rest/v1/recent_topics?select=slug,tags,category,created_at" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

> 주의: `recent_topics` 뷰는 최근 30일 글의 메타만 반환합니다 (slug·tags·category·created_at). 본문 검색이 필요하면 post_translations 도 추가 조회.

## 연관 문서

- 자동 번역 routine: [scripts/translate-routine-prompt.md](./translate-routine-prompt.md)
- DB 스키마: [supabase/schema.sql](../supabase/schema.sql), [supabase/migrations/001_i18n.sql](../supabase/migrations/001_i18n.sql)
- 사이트 운영 가이드: [HANDOFF.md](../HANDOFF.md)
