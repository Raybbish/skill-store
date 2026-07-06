-- 2026-07-06 · ADR 0015:「token / 次」→ 上下文体积
-- schema.sql 是 create table if not exists,不会改已有表;存量库必须先执行本迁移,
-- 否则 sync(flatten 写 context_size 列)会报列不存在。在 Supabase SQL Editor 整段执行一次。

alter table public.skills add column if not exists context_size jsonb;
alter table public.skills drop column if exists token_cost;
