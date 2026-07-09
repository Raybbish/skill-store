-- 原作者一键认领 · M1 第①档(ADR 0006 + 2026-07-08 补充裁决)
-- 身份证明 = 对源仓控制权。第①档 = 个人仓 owner 本人:
-- Supabase OAuth 已验证过的 GitHub login(auth.identities)与 skill id 首段比对——纯 SQL,零新基建。
-- ②org 成员/③聚合源 frontmatter/④挑战验证 需调 GitHub API,留给第一个 Edge Function(有真实需求再建);⑤人工永久兜底。
-- claims 为 append-only 审计流(撤销/仲裁的证据链,ADR 0006「claims 表必留」)。

-- 聚合判定数据位(sync 下一次全量回填;null 视为非聚合,回填后闸门自动收紧)
-- ⚠ 此段必须在下次 sync 前执行(sync 已开始写这两列);功能开关独立,见下
alter table public.skills add column if not exists repo_skill_count integer;
alter table public.skills add column if not exists bulk_source boolean;

-- 功能开关(用户裁决 2026-07-08:认领先不上线):默认 off,前端入口与 RPC 读同一个 flag。
--   ▶ 上线: update public.app_settings set value = 'on'  where key = 'claims';
--   ▶ 下线: update public.app_settings set value = 'off' where key = 'claims';
insert into public.app_settings (key, value) values ('claims', 'off')
  on conflict (key) do nothing;

create or replace function public.claims_enabled() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value from app_settings where key = 'claims'), 'off') = 'on';
$$;
revoke all on function public.claims_enabled() from public;
grant execute on function public.claims_enabled() to anon, authenticated;

create table if not exists public.claims (
  id bigint generated always as identity primary key,
  skill_id text not null,
  user_id uuid not null references auth.users (id),
  github_login text not null,  -- 证据快照:认领时刻平台已验证的 GitHub 身份
  method text not null check (method in ('owner-login')), -- 阶梯档位;后续档位扩枚举
  status text not null default 'approved' check (status in ('approved', 'revoked')),
  created_at timestamptz not null default now()
);
create unique index if not exists claims_one_active on public.claims (skill_id) where status = 'approved';
create index if not exists claims_user_idx on public.claims (user_id);

alter table public.claims enable row level security;
-- 公开可读:货架显示「作者已认领」。身份 ≠ 背书(ADR 0006 红线),只陈述归属事实。
create policy claims_select_public on public.claims
  for select to anon, authenticated using (true);
-- 不给任何直写策略:写入只经 claim_skill RPC(SECURITY DEFINER),证据链不可绕。

create or replace function public.claim_skill(p_skill_id text)
returns table (ok boolean, reason text)
language plpgsql security definer set search_path = public as $$
declare
  v_login text;
  v_bulk boolean;
begin
  -- 双层同步:前端隐藏入口 + 服务端强制(绕过 UI 直调也被拒)
  if not claims_enabled() then
    return query select false, 'claims-disabled'; return;
  end if;
  if auth.uid() is null then
    return query select false, 'not-signed-in'; return;
  end if;
  -- 平台已验证的 GitHub 身份(OAuth 登录时由 Supabase 写入,用户不可伪造)
  select coalesce(identity_data ->> 'user_name', identity_data ->> 'preferred_username')
    into v_login
    from auth.identities
    where user_id = auth.uid() and provider = 'github'
    limit 1;
  if v_login is null then
    return query select false, 'no-github-identity'; return;
  end if;
  select coalesce(bulk_source, false) into v_bulk from skills where id = p_skill_id;
  if not found then
    return query select false, 'skill-not-found'; return;
  end if;
  -- 聚合/折叠采样仓:owner=搬运工,第①档会误绑,拒绝并指去后续档位(ADR 0006 分叉)
  if v_bulk then
    return query select false, 'aggregator-source'; return;
  end if;
  if lower(split_part(p_skill_id, '/', 1)) <> lower(v_login) then
    return query select false, 'owner-mismatch:' || v_login; return;
  end if;
  -- 幂等与冲突
  if exists (select 1 from claims where skill_id = p_skill_id and status = 'approved') then
    if exists (select 1 from claims where skill_id = p_skill_id and status = 'approved' and user_id = auth.uid()) then
      return query select true, 'already-yours'; return;
    end if;
    return query select false, 'already-claimed'; return;
  end if;
  insert into claims (skill_id, user_id, github_login, method)
    values (p_skill_id, auth.uid(), v_login, 'owner-login');
  -- 货架徽章数据位(schema 原生字段);sync 已改为不再冲写此列
  update skills set publisher_verified = true where id = p_skill_id;
  return query select true, 'claimed';
end;
$$;
revoke all on function public.claim_skill(text) from public;
grant execute on function public.claim_skill(text) to authenticated;
