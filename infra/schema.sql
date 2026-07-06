-- Skill Store 数据库 v1(在 Supabase SQL Editor 里整段执行一次)
-- skills 表 = catalog 仓的扁平投影,可随时全量重建

create table if not exists public.skills (
  id text primary key,                    -- owner/name
  name text not null,
  description text,
  license text,
  hosting text check (hosting in ('mirrored','indexed')),
  category text,
  publisher text,
  publisher_verified boolean default false,
  audit_status text,                      -- ⛔ 已下架(ADR 0012):判定迁至 catalog/verdicts 账本,此列及下四列停写(留空)
  risk_factors jsonb,
  evidence jsonb,
  review jsonb,
  l3 jsonb,
  context_size jsonb,
  stars_github int,
  installs_skills_sh int,
  upstream text,
  upstream_commit text,
  content_hash text,
  marketplace_commit text not null,       -- 溯源:来自 catalog 仓哪个 commit
  first_seen_at timestamptz,              -- 首次进 catalog 的时间(catalog git 派生,盖一次永不覆盖):「新上架」榜排序键(ADR 0016)。区别于 updated_at(每次同步刷新)
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,''))
  ) stored
);
create index if not exists skills_fts on public.skills using gin (fts);
create index if not exists skills_status on public.skills (audit_status);
create index if not exists skills_first_seen on public.skills (first_seen_at desc);  -- 「新上架」榜排序(ADR 0016)

create table if not exists public.sync_state (
  id int primary key default 1,
  last_commit text,
  synced_at timestamptz
);

-- RLS:匿名只读 skills;sync_state 不对外
alter table public.skills enable row level security;
alter table public.sync_state enable row level security;
drop policy if exists "public read" on public.skills;
create policy "public read" on public.skills for select using (true);
