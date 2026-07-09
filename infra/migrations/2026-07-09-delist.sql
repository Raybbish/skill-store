-- 退市墓碑(ADR 0020):上游连续缺席 ≥ DELIST_STREAK 个观测日 → catalog 标 delisted_at,sync 传导至此列。
-- 行保留(回执/短评/认领引用历史事实),读侧按 delisted_at is not null 隐藏;复活时 sync 写回 null。
-- 幂等,可重跑。
alter table skills add column if not exists delisted_at timestamptz;
