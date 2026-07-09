-- 短评资格门改一键 flag(用户裁决:冷启动期默认关,真出现刷评再开;ADR 0012 式开关手法)。
-- 门关时:登录即可评(第一层门保留);门开时:恢复「已验证安装才可评」。
-- 诚实不变式:无论门开关,「已验证安装」标签只打给发布时名下真有回执的短评(服务端触发器盖章,
-- 客户端不可伪造)——门关≠虚标,没回执的短评就是没有标。
--
--   ▶ 一键开门: update public.app_settings set value = 'on'  where key = 'review_gate';
--   ▶ 一键关门: update public.app_settings set value = 'off' where key = 'review_gate';
-- (前端零改动:资格 RPC 与 RLS 都读同一个 flag,拦截页在门开时自动复活。)

-- 设置表:锁死——不给 anon/authenticated 任何策略,只有 SECURITY DEFINER 函数与服务端能读写
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
insert into public.app_settings (key, value) values ('review_gate', 'off')
  on conflict (key) do nothing;

create or replace function public.review_gate_enabled() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value from app_settings where key = 'review_gate'), 'off') = 'on';
$$;
revoke all on function public.review_gate_enabled() from public;
grant execute on function public.review_gate_enabled() to anon, authenticated;

-- 门谓词:门关 = 人人可评(仍需登录);门开 = 需名下回执
create or replace function public.review_allowed(p_skill_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select (not review_gate_enabled()) or has_receipt(p_skill_id);
$$;
revoke all on function public.review_allowed(text) from public;
grant execute on function public.review_allowed(text) to authenticated;

-- 资格 RPC 改读门谓词(拦截页跟着 flag 走);receipt_hash 逻辑不变(没有就 null,评于版本缺省)
create or replace function public.review_eligibility(p_skill_id text)
returns table (eligible boolean, receipt_hash text)
language sql stable security definer set search_path = public as $$
  select
    review_allowed(p_skill_id),
    (select content_hash from install_receipts
       where user_id = auth.uid() and skill_id = p_skill_id and content_hash is not null
       order by created_at desc limit 1);
$$;

-- 「已验证安装」按行盖章:发布/更新时由服务端按当时回执事实写入,门开关不影响其真实性
alter table public.reviews add column if not exists verified boolean not null default false;
update public.reviews set verified = true; -- 存量:旧门全开着「必须有回执」,全部属实

create or replace function public.tg_stamp_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.verified := has_receipt(new.skill_id);
  return new;
end;
$$;
drop trigger if exists reviews_stamp_verified on public.reviews;
create trigger reviews_stamp_verified before insert or update on public.reviews
  for each row execute function public.tg_stamp_verified();

-- RLS 改挂门谓词
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (auth.uid() = user_id and review_allowed(skill_id));

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and review_allowed(skill_id));
