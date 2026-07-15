-- ADR 0029 P0:安装器必须区分完整镜像与仅有索引/残缺镜像。
-- sync preflight 会把本列纳入写入契约;未执行迁移时同步会响亮失败。

alter table public.skills
  add column if not exists mirror_complete boolean;

comment on column public.skills.mirror_complete is
  'true only when the catalog mirror is complete enough to build a reproducible install artifact; false/null must use pinned upstream';
