-- 2026-07-06 · 新上架排序键 first_seen_at(见 ADR 0016)
-- 在已上线的 Supabase 上补列;新库直接跑 infra/schema.sql 即含此列,无需再执行本迁移。
--
-- 数据来源:catalog 侧 signals.first_seen_at(git 历史派生、盖一次永不覆盖),
-- 由 `npm run sync` 幂等 upsert 带入本列。存量 catalog 先跑 `npm run backfill:first-seen` 回填,
-- 再 `npm run sync -- --full` 把 first_seen_at 推上来。

alter table public.skills add column if not exists first_seen_at timestamptz;

-- 「新上架」榜排序索引(倒序取最近上架)
create index if not exists skills_first_seen on public.skills (first_seen_at desc);
