/**
 * idx → Typesense 推送(P1 第一期):public/idx/docs.json(线格式,热门序)→ skills collection。
 *
 * 跑法:npm run typesense:push(根目录)或 npm run typesense:push -w @skill-store/web;
 * 前置:npm run web:index(docs.json 是唯一输入,catalog 仍是事实源)。
 * env:TYPESENSE_URL(默认 http://localhost:8108)· TYPESENSE_ADMIN_KEY(默认 oms-dev-key,对齐 infra compose)。
 *
 * 幂等策略(第一期从简):drop + create + import(全量重建,10k 级秒内);
 * 上生产前升级为「版本化 collection + alias 原子切换」,零下线窗口。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hydrateCard, type WireCard } from "../lib/store";
import { TS_COLLECTION, type TsDoc } from "../lib/store-typesense";

const URL = (process.env.TYPESENSE_URL ?? "http://localhost:8108").replace(/\/$/, "");
const KEY = process.env.TYPESENSE_ADMIN_KEY ?? "oms-dev-key";
const H = { "x-typesense-api-key": KEY, "content-type": "application/json" };

async function api(path: string, init?: RequestInit): Promise<Response> {
  const r = await fetch(`${URL}${path}`, { ...init, headers: { ...H, ...init?.headers } });
  return r;
}

const wire = JSON.parse(readFileSync(join(process.cwd(), "public/idx/docs.json"), "utf8")) as WireCard[];
if (!wire.length) {
  console.error("[typesense-push] docs.json 为空——先跑 npm run web:index");
  process.exit(1);
}

// 线格式 → TsDoc:补齐派生字段(publisher/repoFull),pop=热门序反转(docs.json 本身即热门序)。
// cap_overflow = per-repo cap 平价(对齐 lib/skill-utils applyRepoCap 默认 cap=3):docs.json 已是热门序,
// 逐条按 repoFull 计数,同仓前 3 席留头(0)、其余沉底(1);前端无词浏览 sort cap_overflow:asc,pop:desc 复刻其重排。
const REPO_CAP = 3;
const repoSeen = new Map<string, number>();
const docs: TsDoc[] = wire.map((w, i) => {
  const c = hydrateCard(w);
  const repoFull = `${c.owner}/${c.repo}`;
  const rank = (repoSeen.get(repoFull) ?? 0) + 1;
  repoSeen.set(repoFull, rank);
  return {
    ...w,
    id: w.id.replaceAll("/", "~"), // Typesense 文档 id 不能含 "/"
    sid: w.id,
    publisher: c.publisher,
    repoFull,
    pop: wire.length - i,
    cap_overflow: rank > REPO_CAP ? 1 : 0,
  };
});

// 等就绪:容器冷启动/raft 选主要几秒,/health ok 才动手(30s 超时)——否则 503 "Not Ready or Lagging"
for (let i = 0; ; i++) {
  try {
    const h = await api("/health");
    if (h.ok && ((await h.json()) as { ok: boolean }).ok) break;
  } catch { /* 还没监听 */ }
  if (i >= 30) throw new Error(`typesense ${URL} 30s 未就绪——容器起了吗?docker compose -f infra/typesense/docker-compose.yml ps`);
  await new Promise((r) => setTimeout(r, 1000));
}

// drop(容忍 404)→ create → import
const del = await api(`/collections/${TS_COLLECTION}`, { method: "DELETE" });
if (!del.ok && del.status !== 404) throw new Error(`drop collection: ${del.status} ${await del.text()}`);

const create = await api("/collections", {
  method: "POST",
  body: JSON.stringify({
    name: TS_COLLECTION,
    // pop 显式声明为默认排序键;其余字段 auto(10k 级全索引无压力,P1 后半场再按需收窄)
    fields: [{ name: "pop", type: "int32" }, { name: "cap_overflow", type: "int32" }, { name: ".*", type: "auto" }],
    default_sorting_field: "pop",
  }),
});
if (!create.ok) throw new Error(`create collection: ${create.status} ${await create.text()}`);

let imported = 0;
const BATCH = 2000;
for (let i = 0; i < docs.length; i += BATCH) {
  const body = docs.slice(i, i + BATCH).map((d) => JSON.stringify(d)).join("\n");
  const r = await api(`/collections/${TS_COLLECTION}/documents/import?action=upsert`, { method: "POST", body });
  if (!r.ok) throw new Error(`import batch@${i}: ${r.status} ${await r.text()}`);
  const lines = (await r.text()).trim().split("\n");
  const bad = lines.filter((l) => !l.includes('"success":true'));
  if (bad.length) console.warn(`[typesense-push] 批 ${i / BATCH + 1}:${bad.length} 条失败,样例 ${bad[0]?.slice(0, 200)}`);
  imported += lines.length - bad.length;
}

console.log(`[typesense-push] ${URL} · ${TS_COLLECTION} · 导入 ${imported}/${docs.length} 条`);
