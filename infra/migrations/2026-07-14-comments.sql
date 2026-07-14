-- ADR 0026:短评 → 评论区(就地改造 reviews 表)。
-- 用户裁决(2026-07-14):①一人一 skill 可发多条 ②一层回复 ③顶/踩(一人一票可反悔)④发言只需登录。
-- 反转口径:
--   · ADR 0017「评价=已验证安装才可评」——验证不再是门,降级为「已验证安装」徽章(仍服务端按作者回执盖章,不可伪造)。
--   · ADR 0024「/talk 下线」——讨论以「挂在具体 skill 上」的形态回归(不是无对象公海),复用 /talk 的一层回复+副闸手法。
-- 幂等:可重复执行。存量短评(单条/带 verdict)天然是「主楼评论」,零迁移。
--
-- ▶ 执行:Supabase SQL editor 跑本文件(migrations 一贯手工执行,见各迁移抬头)。

-- 1) 一人一 skill 一评 → 允许多条:去唯一约束(默认约束名 reviews_user_id_skill_id_key)
alter table public.reviews drop constraint if exists reviews_user_id_skill_id_key;

-- 2) verdict 变可选:评论可以是纯讨论/回复,不强制带 好/一般/不好用 档。
--    原 check (verdict in ('good','ok','bad')) 对 NULL 恒真,保留即可,只去 NOT NULL。
alter table public.reviews alter column verdict drop not null;

-- 3) 一层回复:reply_to 自引用;删主楼级联删其回复(与 /talk posts 同口径)。
alter table public.reviews add column if not exists reply_to bigint references public.reviews (id) on delete cascade;
create index if not exists reviews_reply_idx on public.reviews (reply_to, created_at);
-- 主楼列表索引:同 skill、按时间倒序(新在前)
create index if not exists reviews_top_idx on public.reviews (skill_id, created_at desc) where reply_to is null;

-- 4) 回复不是评分:回复行(reply_to 非空)不得带 verdict / scene_tags——档位与场景只属于主楼。
alter table public.reviews drop constraint if exists reviews_reply_no_rating;
alter table public.reviews add constraint reviews_reply_no_rating
  check (reply_to is null or (verdict is null and scene_tags is null));

-- 5) 顶/踩计数(denormalized):计数落在评论行上,匿名 listReviews 直接读,零聚合 RPC。
--    真值由 review_votes 的触发器维护(下方),这两列只是被维护的缓存。
alter table public.reviews add column if not exists up integer not null default 0;
alter table public.reviews add column if not exists down integer not null default 0;

-- 6) 发帖闸(复用 /talk 手法,搬到 reviews):
--    ① 一层回复——回复目标必须是「同 skill 的主楼」(既挡回复回复,也挡跨 skill 乱指)
--    ② 每用户 5 秒一条——副闸只挡失手连点与最蠢单账号脚本;真灌水成本卡在账号(邮箱/GitHub 登录)。
create or replace function public.tg_reviews_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.reply_to is not null
     and not exists (select 1 from reviews where id = new.reply_to and skill_id = new.skill_id and reply_to is null) then
    raise exception 'reply_target';
  end if;
  if exists (select 1 from reviews where user_id = new.user_id and created_at > now() - interval '5 seconds') then
    raise exception 'rate_limited';
  end if;
  return new;
end; $$;
drop trigger if exists reviews_guard on public.reviews;
create trigger reviews_guard before insert on public.reviews
  for each row execute function public.tg_reviews_guard();

-- 7) 投票表:一人对一条评论只有一票(顶=1 / 踩=-1);切换走 upsert,取消走 delete。
create table if not exists public.review_votes (
  review_id bigint not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);
create index if not exists review_votes_user_idx on public.review_votes (user_id, review_id);

alter table public.review_votes enable row level security;
-- 净票公开可读(匿名读计数,与短评列表同匿名口径);写只能写自己那一行。
drop policy if exists review_votes_select on public.review_votes;
create policy review_votes_select on public.review_votes for select to anon, authenticated using (true);
drop policy if exists review_votes_insert on public.review_votes;
create policy review_votes_insert on public.review_votes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists review_votes_update on public.review_votes;
create policy review_votes_update on public.review_votes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists review_votes_delete on public.review_votes;
create policy review_votes_delete on public.review_votes for delete to authenticated using (auth.uid() = user_id);

-- 8) 计票触发器:把 review_votes 的增改删翻译成 reviews.up/down 的增减。
--    SECURITY DEFINER 越过 reviews 的写 RLS(投票人不是评论作者也能改计数),但只动这两列。
create or replace function public.tg_review_votes_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update reviews set up = up + (new.value = 1)::int, down = down + (new.value = -1)::int
      where id = new.review_id;
  elsif tg_op = 'DELETE' then
    update reviews set up = up - (old.value = 1)::int, down = down - (old.value = -1)::int
      where id = old.review_id;
  elsif tg_op = 'UPDATE' and new.value is distinct from old.value then
    update reviews set
      up   = up   + (new.value = 1)::int  - (old.value = 1)::int,
      down = down + (new.value = -1)::int - (old.value = -1)::int
      where id = new.review_id;
  end if;
  return null;
end; $$;
drop trigger if exists review_votes_count on public.review_votes;
create trigger review_votes_count after insert or update or delete on public.review_votes
  for each row execute function public.tg_review_votes_count();

-- 9) 写门改「登录即可」(去回执门,ADR 0026):第一层门(登录)由 to authenticated 天然表达;
--    第二层(has_receipt / review_allowed)去掉——它转生为「已验证安装」徽章,不再拦截发言。
--    reviews_stamp_verified 触发器(2026-07-14-verified-stamp-by-author.sql)不动:仍按作者回执盖章。
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (auth.uid() = user_id);

-- update 保留但也去回执门(留作未来「编辑」用;当前前端不暴露编辑)。
drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 本人可删(物理删,级联删回复;与 /talk 同口径——评论区不留墓碑)。
drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete to authenticated
  using (auth.uid() = user_id);

-- 说明:app_settings.review_gate 与 review_gate_enabled()/review_allowed()/review_eligibility() 保留不删
-- (无害;将来若想给「带 verdict 的评分」单独恢复回执门,谓词现成)。当前前端不再读它们。
