-- =========================================================
-- 001_i18n.sql — 다국어(ko/en/vi) 지원을 위한 스키마 변경
-- 적용 방법: Supabase Dashboard → SQL Editor → New query
--           이 파일 내용을 통째로 붙여넣고 Run.
-- 멱등성: 모든 DDL이 if not exists / drop policy 기반이라 재실행 안전.
-- =========================================================

-- 1) posts 메타 컬럼 추가 ----------------------------------
-- 원본 작성 언어. AI 자동 번역의 출발점.
alter table public.posts
  add column if not exists source_language text not null default 'ko'
    check (source_language in ('ko', 'en', 'vi'));

-- 번역 진행 상태. routine이 'pending' 글을 폴링해 처리.
alter table public.posts
  add column if not exists translation_status text not null default 'pending'
    check (translation_status in ('pending', 'translating', 'completed', 'failed'));

-- 2) 본문/제목/요약을 보관할 번역 테이블 -----------------
create table if not exists public.post_translations (
  post_id     uuid not null references public.posts(id) on delete cascade,
  language    text not null check (language in ('ko', 'en', 'vi')),
  title       text not null,
  summary     text,
  content_md  text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (post_id, language)
);

create index if not exists post_translations_language_idx
  on public.post_translations (language);

-- updated_at 자동 갱신 (touch_updated_at 함수는 schema.sql에서 이미 정의됨)
drop trigger if exists post_translations_touch_updated_at on public.post_translations;
create trigger post_translations_touch_updated_at
  before update on public.post_translations
  for each row execute function public.touch_updated_at();

-- 3) 기존 데이터 이관 ------------------------------------
-- 기존 posts.title/summary/content_md를 post_translations(source_language) 로 복사.
-- 멱등: 이미 같은 (post_id, language) 가 있으면 건너뜀.
insert into public.post_translations (post_id, language, title, summary, content_md)
select id, source_language, title, summary, content_md
  from public.posts
on conflict (post_id, language) do nothing;

-- 4) posts 본문 컬럼 NULL 허용 (단계적 deprecation) -------
-- 코드가 점진적으로 post_translations로 이동할 때까지 기존 컬럼 유지.
-- DROP은 코드 마이그레이션 완료 후 002_drop_legacy_post_body.sql 에서 처리 예정.
alter table public.posts alter column title drop not null;
alter table public.posts alter column content_md drop not null;

-- 5) RLS — 번역 테이블 -----------------------------------
alter table public.post_translations enable row level security;

-- 비로그인은 발행된 글의 번역만 읽기
drop policy if exists "public read translations of published" on public.post_translations;
create policy "public read translations of published"
  on public.post_translations for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_translations.post_id and p.status = 'published'
    )
  );

-- 인증된 사용자(관리자)는 전체 R/W
drop policy if exists "auth full access translations" on public.post_translations;
create policy "auth full access translations"
  on public.post_translations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 6) 번역 routine 폴링용 인덱스 --------------------------
-- 발행된 글 중 번역 미완료 row 빠르게 조회.
create index if not exists posts_translation_pending_idx
  on public.posts (translation_status, status)
  where translation_status in ('pending', 'failed');

-- 7) routine 편의를 위한 뷰 ------------------------------
-- "이 글에서 어떤 언어 번역이 누락되었나" 한 줄로 알려주는 뷰
create or replace view public.posts_missing_translations as
  select
    p.id as post_id,
    p.source_language,
    p.translation_status,
    p.status,
    p.created_at,
    array(
      select lang from unnest(array['ko', 'en', 'vi']) as lang
       where lang not in (
         select language from public.post_translations pt where pt.post_id = p.id
       )
    ) as missing_languages
    from public.posts p;

-- 끝.
