-- 行为埋点收集端(ADR 0013「只攒不花」的 P0 collector)
-- 三事件 search / click / install,字段名与 docs/design/analytics-events.md 冻结 schema 逐字对齐
-- (payload 键 = 列名,PostgREST 直插,前端 sendBeacon 直达零中间层)。
-- 端点:NEXT_PUBLIC_ANALYTICS_URL = https://<project>.supabase.co/rest/v1/analytics_events?apikey=<anon>
--  (sendBeacon 不能带 header,anon key 走 query 参数——key 本就烘在前端产物里,无新增暴露面。)
-- 与 install_receipts 彻底分离(那是「从本店安装」渠道留痕,这是 search→click→install 意图链),互不替代。
-- 消费在 P1(行为回填 scene_tags,≥40 进召回 / ≥80 升可见候选);本表纯追加账本,
-- 不建二级索引——read 路径出现时(P1 聚合)再按查询形状建索引/物化视图。

create table if not exists public.analytics_events (
  eid bigint generated always as identity primary key,
  t text not null check (t in ('search', 'click', 'install')),
  q text,            -- search:查询词;click:来源查询(前端从 URL ?q= 读)
  id text,           -- click/install:三段式 skill id owner/repo/name
  pos int,           -- click:结果位次(缺省=非排序位)
  ref_q text,        -- install:促成安装的来源查询(「词 → skill」配对的关键)
  sid text,          -- 匿名会话 id(sessionStorage;只串联一次会话,不做用户画像;隐私模式为空串)
  ts bigint,         -- 客户端毫秒时间戳(客户端时钟不可信,分析以 created_at 为锚、ts 仅排序参考)
  created_at timestamptz not null default now(),
  -- 事件形状(与冻结 schema 对齐):search 必有 q,click/install 必有 id
  constraint analytics_events_shape check (
    (t = 'search' and q is not null)
    or (t in ('click', 'install') and id is not null)
  )
);

alter table public.analytics_events enable row level security;

-- 匿名可插、不可读:埋点是店家账本,不是公开数据。
-- 已知边界(诚实记录,同 install_receipts):匿名插入防不了刷——靠长度/取值约束挡垃圾洪水,
-- P1 消费时按 sid 去重(同 sid 同配对每日计 1)+ 单 sid 占比 >30% 冻结(见 analytics-events.md)。
create policy analytics_events_insert_anon on public.analytics_events
  for insert to anon
  with check (
    (q is null or char_length(q) <= 200)
    and (id is null or char_length(id) <= 200)
    and (ref_q is null or char_length(ref_q) <= 200)
    and (sid is null or char_length(sid) <= 64)
    and (pos is null or pos between 0 and 10000)
    and (ts is null or ts between 0 and 4102444800000) -- 2100-01-01 前的毫秒戳,挡乱值
  );
-- 不建 anon select 策略 = 默认拒读;聚合展示与 P1 回填走服务端(service_role / 物化视图)。
