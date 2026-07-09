-- 安装回执(ADR 0017 隐形验证 · M1 砖一 = 匿名回执)
-- 语义:「从本店安装」的获取渠道留痕——不是使用深度、不是安全背书。
-- 三来源:web 下载 .skill/.zip(channel=download,rid 会话)/ CLI 装机(channel=cli,machine_id,
-- 可带复制命令内嵌 token 绑定 web 会话)/ verify 子命令兜底(channel=verify,后续实现)。
-- user_id 绑定位留给账号层(email OTP,与短评同批):届时把同 rid / machine_id 的回执并入账号。
-- 与 ADR 0013 的行为埋点(search/click/install,只攒不花)彻底分离,互不替代。

create table if not exists public.install_receipts (
  id bigint generated always as identity primary key,
  skill_id text not null,          -- owner/repo/name;整包下载用 pack:<packId>
  content_hash text,               -- 下载/安装时的货架哈希(评价「评于版本」锚)
  channel text not null check (channel in ('download', 'cli', 'verify')),
  rid text,                        -- web 匿名会话 id(localStorage,跨访问稳定)
  machine_id text,                 -- CLI 匿名机器 id(~/.oh-my-skill/machine-id;OMS_TELEMETRY=0 不发)
  token text,                      -- 复制命令内嵌短 token(--t):web 会话 ↔ CLI 安装的绑定线索
  cli_version text,
  user_id uuid references auth.users (id), -- 账号层后绑定;匿名期恒 null
  created_at timestamptz not null default now()
);

create index if not exists install_receipts_skill_idx on public.install_receipts (skill_id, created_at desc);
create index if not exists install_receipts_rid_idx on public.install_receipts (rid) where rid is not null;
create index if not exists install_receipts_machine_idx on public.install_receipts (machine_id) where machine_id is not null;

alter table public.install_receipts enable row level security;

-- 匿名可插、不可读:回执是店家账本,不是公开数据。
-- 装机量聚合展示(App Store 模式的自有信号)后续走服务端视图/物化视图,按需另开只读口。
-- 已知边界(诚实记录):匿名插入无法防刷,当前规模靠字段长度约束+后续按 rid/machine_id 聚合去重;
-- 进评价门/榜单权重时只认「有账号绑定+有账号龄」的回执(ADR 0017 §3.5:反刷=权重,不是门槛)。
create policy install_receipts_insert_anon on public.install_receipts
  for insert to anon
  with check (
    char_length(skill_id) <= 200
    and (content_hash is null or char_length(content_hash) <= 80)
    and (rid is null or char_length(rid) <= 64)
    and (machine_id is null or char_length(machine_id) <= 64)
    and (token is null or char_length(token) <= 16)
    and (cli_version is null or char_length(cli_version) <= 32)
    and user_id is null -- 匿名插入不得伪造账号绑定
  );
-- 不建 anon select 策略 = 默认拒读
