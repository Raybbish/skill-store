/**
 * SkillStore 的服务端(构建期)读取面:直接读 build-index 产出的 public/idx。
 * 只允许在 server component / 构建期代码里 import(依赖 node:fs)。
 * 与客户端 StaticStore 吃同一份产物 —— 首屏(SSG)和交互(fetch)天然一致。
 * idx 落盘为线格式(WireCard,去可派生字段),读取时统一水合;组件永远只见完整瘦卡。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hydrateCard, type Changelog, type IdxMeta, type Pack, type SkillCard, type WireCard } from "./store";

const IDX = join(process.cwd(), "public/idx");

/** packs.json 的线格式:成员为 WireCard */
type WirePack = Omit<Pack, "members"> & { members: WireCard[] };

function readJson<T>(file: string): T {
  try {
    return JSON.parse(readFileSync(join(IDX, file), "utf8")) as T;
  } catch (e) {
    throw new Error(
      `[store-server] 读不到 public/idx/${file} —— 先跑 npm run web:index 生成索引(dev/build 会经 predev/prebuild 自动跑)。原始错误:${(e as Error).message}`,
    );
  }
}

export function readIdxMeta(): IdxMeta {
  return readJson<IdxMeta>("meta.json");
}

export function readIdxPage(n: number): SkillCard[] {
  return readJson<WireCard[]>(`pages/p${n}.json`).map(hydrateCard);
}

export function readIdxPacks(): Pack[] {
  return readJson<WirePack[]>("packs.json").map((p) => ({ ...p, members: p.members.map(hydrateCard) }));
}

/** 新上架(按收录时间降序,build-index 产出) */
export function readIdxNew(): SkillCard[] {
  return readJson<WireCard[]>("new.json").map(hydrateCard);
}

/** 商店周报(/changelog);缺文件时 fail-open 空,非关键页不因缺索引崩构建 */
export function readIdxChangelog(): Changelog {
  try {
    return JSON.parse(readFileSync(join(IDX, "changelog.json"), "utf8")) as Changelog;
  } catch {
    return { generatedAt: "", weekAdded: 0, entries: [] };
  }
}
