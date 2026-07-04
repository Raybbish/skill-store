/**
 * SkillStore 的服务端(构建期)读取面:直接读 build-index 产出的 public/idx。
 * 只允许在 server component / 构建期代码里 import(依赖 node:fs)。
 * 与客户端 StaticStore 吃同一份产物 —— 首屏(SSG)和交互(fetch)天然一致。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { IdxMeta, Pack, SkillCard } from "./store";

const IDX = join(process.cwd(), "public/idx");

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
  return readJson<SkillCard[]>(`pages/p${n}.json`);
}

export function readIdxPacks(): Pack[] {
  return readJson<Pack[]>("packs.json");
}

/** 新上架(按收录时间降序,build-index 产出) */
export function readIdxNew(): SkillCard[] {
  return readJson<SkillCard[]>("new.json");
}
