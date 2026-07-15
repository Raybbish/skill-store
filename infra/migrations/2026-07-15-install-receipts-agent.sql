-- ADR 0029 S1:安装回执增加 Agent / scope / Adapter / projection 维度。
-- 语义仍沿用 ADR 0017:只证明获取渠道或本机持有,不证明兼容性、使用深度或安全。

alter table public.install_receipts
  add column if not exists agent_id text,
  add column if not exists scope text,
  add column if not exists adapter_version text,
  add column if not exists projection_hash text;

drop policy if exists install_receipts_insert_anon on public.install_receipts;
create policy install_receipts_insert_anon on public.install_receipts
  for insert to anon
  with check (
    char_length(skill_id) <= 200
    and (content_hash is null or char_length(content_hash) <= 80)
    and (rid is null or char_length(rid) <= 64)
    and (machine_id is null or char_length(machine_id) <= 64)
    and (token is null or char_length(token) <= 16)
    and (cli_version is null or char_length(cli_version) <= 32)
    and (agent_id is null or char_length(agent_id) <= 32)
    and (scope is null or char_length(scope) <= 16)
    and (adapter_version is null or char_length(adapter_version) <= 64)
    and (projection_hash is null or char_length(projection_hash) <= 80)
    and user_id is null
  );
