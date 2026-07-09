-- 短评(ADR 0017 M1 砖二):双层门 = 登录(email OTP) + 名下有该 skill 回执(「已验证安装才可评」)。
-- 浏览/下载零登录不变;只在「写短评」时要验证码——延迟注册,登录即并入匿名回执(claim_receipts)。
-- 评价是公共内容:匿名可读;写只能写自己的行,且 RLS 内嵌资格判定(has_receipt)。

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id),
  skill_id text not null,
  verdict text not null check (verdict in ('good', 'ok', 'bad')), -- 好用/一般/不好用(点选,打字可选)
  text text check (text is null or char_length(text) <= 500),
  scene_tags text[] check (scene_tags is null or array_length(scene_tags, 1) <= 5),
  author_label text check (author_label is null or char_length(author_label) <= 24), -- 自选昵称;空=前端显示「用户」
  content_hash text check (content_hash is null or char_length(content_hash) <= 80), -- 评于版本:取评价者名下最近回执的哈希
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_id) -- 一人一 skill 一评;重评走 upsert 覆盖
);
create index if not exists reviews_skill_idx on public.reviews (skill_id, created_at desc);

-- updated_at 触发器(重评时间可信,前端显示「更新于」)
create or replace function public.tg_touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews
  for each row execute function public.tg_touch_updated_at();

-- 资格判定:SECURITY DEFINER 越过 install_receipts 的拒读 RLS,但只回答布尔——不泄露回执内容
create or replace function public.has_receipt(p_skill_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from install_receipts
    where user_id = auth.uid() and skill_id = p_skill_id
  );
$$;
revoke all on function public.has_receipt(text) from public;
grant execute on function public.has_receipt(text) to authenticated;

-- 资格 + 评于版本一次拿(前端表单初始化):eligible=有回执;receipt_hash=最近一条带哈希回执的内容哈希
create or replace function public.review_eligibility(p_skill_id text)
returns table (eligible boolean, receipt_hash text)
language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from install_receipts where user_id = auth.uid() and skill_id = p_skill_id),
    (select content_hash from install_receipts
       where user_id = auth.uid() and skill_id = p_skill_id and content_hash is not null
       order by created_at desc limit 1);
$$;
revoke all on function public.review_eligibility(text) from public;
grant execute on function public.review_eligibility(text) to authenticated;

-- 登录即并入匿名回执(延迟注册的关键一步):
--   rid   = web 匿名会话 id(localStorage)
--   token = 复制命令内嵌的 rid 前 8 位——覆盖「网页复制命令 → CLI 安装」的回执
-- 诚实边界:纯 CLI 直装(无 --t)的 machine_id 回执此处并不进来,需 CLI 登录(device flow,M2)。
-- 幂等:只认 user_id 为空的行,重复调用无害。
create or replace function public.claim_receipts(p_rid text, p_token text)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then return 0; end if;
  update install_receipts set user_id = auth.uid()
    where user_id is null
      and ((p_rid is not null and rid = p_rid)
        or (p_token is not null and token = p_token));
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.claim_receipts(text, text) from public;
grant execute on function public.claim_receipts(text, text) to authenticated;

alter table public.reviews enable row level security;

create policy reviews_select_public on public.reviews
  for select to anon, authenticated using (true);

-- 双层门第二层在此:本人 + 名下有回执。第一层(登录)由 to authenticated 天然表达。
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (auth.uid() = user_id and has_receipt(skill_id));

create policy reviews_update_own on public.reviews
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and has_receipt(skill_id));
