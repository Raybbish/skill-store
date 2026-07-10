-- 短评三档 → 1-5 星(2026-07-09 用户裁决:「变成 1-5 星」;豆瓣本就是五星制,比三档更贴对标)。
-- 存量映射:good→5,ok→3,bad→1(当前库仅测试数据)。幂等,可重跑。
alter table public.reviews add column if not exists rating smallint;
update public.reviews set rating = case verdict when 'good' then 5 when 'ok' then 3 when 'bad' then 1 else 3 end
  where rating is null and verdict is not null;
update public.reviews set rating = 3 where rating is null; -- 兜底(理论不触发)
alter table public.reviews alter column rating set not null;
alter table public.reviews drop constraint if exists reviews_rating_check;
alter table public.reviews add constraint reviews_rating_check check (rating between 1 and 5);
alter table public.reviews drop column if exists verdict;
