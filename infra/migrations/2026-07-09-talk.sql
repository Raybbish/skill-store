-- ⛔ 勿执行(2026-07-12,ADR 0024):/talk 论坛已整体下线(冷启动期没有用户,先不做)。
-- 本迁移从未在生产执行过(下线时仍在「待用户端执行」状态);留档供重新上架时参考。
--
-- 公海讨论区(ADR 0021):无对象可挂的自由讨论(求推荐 / 提问 / 反馈 / 闲聊)。
-- 形态最薄:楼(reply_to is null)+ 一层回复,纯文本;匿名可读,登录(email OTP)即可发——
-- 公海是说话的地方,不设回执门(区别于短评:评价是凭证,发言不是)。
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id),
  reply_to bigint references public.posts (id) on delete cascade, -- 删楼级联删回复
  body text not null check (char_length(body) between 1 and 2000),
  author_label text check (author_label is null or char_length(author_label) <= 24), -- 自选署名;空=「用户」
  -- 主理人署名帖:RLS 强制插入时 false,只能事后由 service role/SQL 置 true——防冒名。
  -- 主理人发官方帖流程:正常发一条 → update posts set official = true where id = <id>;
  official boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_top_idx on public.posts (created_at desc) where reply_to is null;
create index if not exists posts_reply_idx on public.posts (reply_to, created_at);

-- 发帖闸:①一层回复(不许回复回复)②每用户 5 秒一条——副闸只挡失手连点与最蠢的单账号脚本;
-- 真正的灌水成本卡在账号(邮箱 OTP),间隔不是主防线(闸不是门,同 ADR 0017 哲学)。
-- 60s→5s(2026-07-09 用户裁决):公海是对话节奏,60s 误伤连续回复的真人;真灌水再调回,改此函数即生效。
create or replace function public.tg_posts_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.reply_to is not null and exists (select 1 from posts where id = new.reply_to and reply_to is not null) then
    raise exception 'reply_depth';
  end if;
  if exists (select 1 from posts where user_id = new.user_id and created_at > now() - interval '5 seconds') then
    raise exception 'rate_limited';
  end if;
  return new;
end; $$;
drop trigger if exists posts_guard on public.posts;
create trigger posts_guard before insert on public.posts
  for each row execute function public.tg_posts_guard();

alter table public.posts enable row level security;
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (true);
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated
  with check (user_id = auth.uid() and official = false);
-- 本人可删(审核后台暂无,治理走 SQL 兜底;删除即物理删,公海不留墓碑)
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete to authenticated
  using (user_id = auth.uid());
