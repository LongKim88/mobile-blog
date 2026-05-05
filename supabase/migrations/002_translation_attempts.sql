-- =========================================================
-- 002_translation_attempts.sql — 번역 routine 안전장치
-- 적용: Supabase SQL Editor → New query → 통째로 붙여넣고 Run
-- 멱등: 모든 DDL 이 if not exists / drop check / drop policy 패턴
-- =========================================================

-- 1) 재시도 횟수 카운터 ---------------------------------------------
-- routine 이 한 글을 처리할 때마다 +1. 임계값 도달 시 permanent_failure 로 멈춤.
alter table public.posts
  add column if not exists translation_attempts int not null default 0;

-- 2) 'permanent_failure' 상태 추가 ---------------------------------
-- 3회 실패 또는 본문 길이 초과 시 routine 이 자동 마킹. 운영자 수동 개입 전까지 더 이상 시도 안 함.
alter table public.posts drop constraint if exists posts_translation_status_check;
alter table public.posts add constraint posts_translation_status_check
  check (translation_status in (
    'pending',
    'translating',
    'completed',
    'failed',
    'permanent_failure'
  ));

-- 3) 인덱스 — routine 폴링 효율 -----------------------------------
-- pending/failed 만 처리 대상. permanent_failure 와 completed 는 인덱스에서 제외.
drop index if exists posts_translation_pending_idx;
create index posts_translation_pending_idx
  on public.posts (translation_status, status)
  where translation_status in ('pending', 'failed');

-- 4) 운영자 수동 재시작 헬퍼 — permanent_failure 를 pending 으로 되돌리기 (참고)
-- 사용 예 (어드민에서 직접 SQL 실행 또는 향후 어드민 UI 버튼으로 노출):
-- update public.posts set translation_status = 'pending', translation_attempts = 0
--   where translation_status = 'permanent_failure' and id = '<uuid>';

-- 끝.
