-- 作者自助导入 · 提交未收录仓库(ADR 0023)
-- 「一键导入自己的作品」的第二半:第一半(批量认领已收录)零新基建,循环 claim_skill 即可;
-- 这一半收「店里还没有的仓」——作者用 GitHub 登录后提交自己名下含 SKILL.md 的仓库。
-- 边界与 claim_skill 第①档一致:只收「个人 owner == 平台已验证 GitHub login」的仓(org 仓待②档)。
-- 消费:近期人工(查 pending → 审核入册 sources.yaml → 标 accepted/rejected);
--       后续 pipeline job 直读本表自动入册(见 ADR 0023)。
-- 开关:与认领共用 app_settings['claims'](作者功能一套门;上线 SQL 见 2026-07-08-claims.sql 头注)。

create table if not exists public.submissions (
  id bigint generated always as identity primary key,
  repo text not null,           -- "owner/name";插入前已验证 owner == 提交者已验证的 GitHub login
  github_login text not null,   -- 证据快照:提交时刻平台已验证的 GitHub 身份
  user_id uuid not null references auth.users (id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  note text,                    -- 审核备注(拒绝原因等,人工填)
  created_at timestamptz not null default now()
);
-- 一仓一条(大小写不敏感);拒绝过的也不许重提——重提走人工仲裁,防拉锯刷表
create unique index if not exists submissions_repo_uniq on public.submissions (lower(repo));
create index if not exists submissions_user_idx on public.submissions (user_id);

alter table public.submissions enable row level security;
-- 只读自己的(工作台显示「已提交,待收录」);无公开读——收录与否以货架为准,不预告
create policy submissions_select_own on public.submissions
  for select to authenticated using (user_id = auth.uid());
-- 不给任何直写策略:写入只经 submit_repo RPC(SECURITY DEFINER),owner 校验不可绕。

create or replace function public.submit_repo(p_repo text)
returns table (ok boolean, reason text)
language plpgsql security definer set search_path = public as $$
declare
  v_login text;
  v_repo text := trim(both '/' from trim(p_repo));
begin
  -- 与认领同一开关、同一双层门(前端隐藏入口 + 服务端强制)
  if not claims_enabled() then
    return query select false, 'claims-disabled'; return;
  end if;
  if auth.uid() is null then
    return query select false, 'not-signed-in'; return;
  end if;
  select coalesce(identity_data ->> 'user_name', identity_data ->> 'preferred_username')
    into v_login
    from auth.identities
    where user_id = auth.uid() and provider = 'github'
    limit 1;
  if v_login is null then
    return query select false, 'no-github-identity'; return;
  end if;
  -- 格式:owner/name(GitHub 合法字符集,单斜杠)
  if v_repo !~ '^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?/[A-Za-z0-9._-]+$' then
    return query select false, 'bad-repo'; return;
  end if;
  -- 只收自己名下的仓(第①档口径;org 仓待②档,防替他人代提)
  if lower(split_part(v_repo, '/', 1)) <> lower(v_login) then
    return query select false, 'owner-mismatch:' || v_login; return;
  end if;
  -- 已在店内(skills.id 三段式 owner/repo/name,前两段即仓)
  if exists (select 1 from skills where lower(id) like lower(v_repo) || '/%') then
    return query select false, 'already-listed'; return;
  end if;
  if exists (select 1 from submissions where lower(repo) = lower(v_repo)) then
    return query select false, 'already-submitted'; return;
  end if;
  -- 限流:单账号 24h 30 条(一键全提交也远用不完;防脚本刷表)
  if (select count(*) from submissions where user_id = auth.uid() and created_at > now() - interval '24 hours') >= 30 then
    return query select false, 'rate-limited'; return;
  end if;
  insert into submissions (repo, github_login, user_id) values (v_repo, v_login, auth.uid());
  return query select true, 'submitted';
end;
$$;
revoke all on function public.submit_repo(text) from public;
grant execute on function public.submit_repo(text) to authenticated;
