-- 「已验证安装」盖章改按作者判定(修后台 UPDATE 误摘标)
-- 问题:tg_stamp_verified 原实现调 has_receipt() = 查 auth.uid() 名下回执——问的是「这次写行的人」。
-- 用户自己发/改短评时写行人=作者,恰好正确;但 service_role / SQL editor / 后台脚本改行时
-- auth.uid() 为 NULL,has_receipt 恒 false,一次无关编辑(改错字、审核)就把真实的标静默刷掉。
-- 修法:标签语义本来就是「发布者名下有该 skill 的安装/持有记录」(词典 rev.verifiedTip),
-- 直接按行的 user_id(作者)判定,与写行人无关——作者、后台、回填脚本谁来写都盖得对。
-- 诚实不变式不变:标 = 作者名下真有回执,服务端盖章客户端不可伪造;
-- 资格门开关仍不影响真实性(2026-07-08-review-gate-flag.sql)。幂等,可重复执行。

create or replace function public.tg_stamp_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.verified := exists (
    select 1 from install_receipts
    where user_id = new.user_id and skill_id = new.skill_id
  );
  return new;
end;
$$;
-- 触发器 reviews_stamp_verified 本身不动(仍是 before insert or update),只换函数体。

-- 存量对齐一次:按同一谓词把现有行刷到真值。
-- 线上核查(2026-07-14)verified=true 而无回执的行为 0,故此步只会 false→true——
-- 给「发布后才补验证、此后没再编辑」的作者补标。
-- 绕过两个触发器执行:reviews_touch 会把 updated_at 无辜顶到今天(前端显示「更新于」),
-- 盖章触发器则没必要重复跑。
alter table public.reviews disable trigger reviews_touch;
alter table public.reviews disable trigger reviews_stamp_verified;
update public.reviews r
set verified = exists (
  select 1 from public.install_receipts ir
  where ir.user_id = r.user_id and ir.skill_id = r.skill_id
)
where r.verified is distinct from exists (
  select 1 from public.install_receipts ir
  where ir.user_id = r.user_id and ir.skill_id = r.skill_id
);
alter table public.reviews enable trigger reviews_touch;
alter table public.reviews enable trigger reviews_stamp_verified;
