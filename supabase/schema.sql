-- =========================================================
-- Tech Mag — IT × Books 블로그 스키마 (다국어 ko/en/vi)
-- Supabase SQL Editor 에 통째로 붙여넣고 실행하세요.
-- 기존 프로젝트는 supabase/migrations/001_i18n.sql 로 이주하세요.
-- =========================================================

-- 1. posts 테이블 (메타·상태) ------------------------------
-- title/summary/content_md 는 post_translations 로 분리되어 NULL 허용 (legacy 호환).
-- 새 흐름에선 모든 본문이 post_translations 로 들어갑니다.
create table if not exists public.posts (
  id                  uuid primary key default gen_random_uuid(),
  title               text,                                 -- legacy, 단계적 제거 예정
  slug                text not null unique,
  category            text not null check (category in ('IT', 'Book')),
  tags                text[] not null default '{}',
  summary             text,                                 -- legacy
  content_md          text,                                 -- legacy
  cover_url           text,
  source_urls         text[] not null default '{}',
  status              text not null default 'draft'
                      check (status in ('draft', 'published', 'archived')),
  source_language     text not null default 'ko'
                      check (source_language in ('ko', 'en', 'vi')),
  translation_status  text not null default 'pending'
                      check (translation_status in ('pending', 'translating', 'completed', 'failed')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  published_at        timestamptz
);

create index if not exists posts_status_published_at_idx
  on public.posts (status, published_at desc);

create index if not exists posts_category_published_at_idx
  on public.posts (category, published_at desc);

create index if not exists posts_tags_gin
  on public.posts using gin (tags);

create index if not exists posts_translation_pending_idx
  on public.posts (translation_status, status)
  where translation_status in ('pending', 'failed');

-- 2. updated_at 자동 갱신 트리거 ---------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

-- 3. post_translations — 언어별 본문 -----------------------
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

drop trigger if exists post_translations_touch_updated_at on public.post_translations;
create trigger post_translations_touch_updated_at
  before update on public.post_translations
  for each row execute function public.touch_updated_at();

-- 4. RLS — posts ------------------------------------------
alter table public.posts enable row level security;

drop policy if exists "public read published" on public.posts;
create policy "public read published"
  on public.posts for select
  using (status = 'published');

drop policy if exists "auth full access" on public.posts;
create policy "auth full access"
  on public.posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5. RLS — post_translations -------------------------------
alter table public.post_translations enable row level security;

drop policy if exists "public read translations of published" on public.post_translations;
create policy "public read translations of published"
  on public.post_translations for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_translations.post_id and p.status = 'published'
    )
  );

drop policy if exists "auth full access translations" on public.post_translations;
create policy "auth full access translations"
  on public.post_translations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 6. 자동 초안 routine 용 뷰 — 최근 30일 다룬 주제 -------
create or replace view public.recent_topics as
  select category, tags, slug, created_at
    from public.posts
   where created_at > now() - interval '30 days'
   order by created_at desc;

-- 7. 번역 routine 용 뷰 — 누락 언어 ----------------------
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
