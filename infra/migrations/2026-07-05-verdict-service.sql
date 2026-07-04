-- ADR 0012:审计字段拆出至 catalog/verdicts 账本,skills 表停写审计列。
-- 在 Supabase SQL Editor 执行一次(下次 npm run sync 之前),否则 audit_status 非空约束会拒写。
alter table public.skills alter column audit_status drop not null;
comment on column public.skills.audit_status is '⛔ 已下架(ADR 0012):判定迁至 catalog/verdicts,停写';
