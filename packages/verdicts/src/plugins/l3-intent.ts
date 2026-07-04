/**
 * L3 意图审查插件:LLM(OpenAI 兼容,默认 DeepSeek)审 SKILL.md 指令意图 + 脚本行为一致性。
 * 防注入定界符与 fail-closed 语义在 engines/llm.ts;失败通过 finding.error 上报,
 * 后果(flagged)由编排器按 policy.fail_closed 决定。
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { l3Review, buildReviewContent } from "../engines/llm.ts";
import type { ScannerPlugin } from "../types.ts";

const SCRIPT_EXT = /\.(py|sh|bash|zsh|js|mjs|cjs|ts|rb|pl|ps1)$/i;

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const name of await readdir(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

export const l3Intent: ScannerPlugin = {
  layer: "L3",
  async scan({ skillDir, prior }) {
    const files = await walk(skillDir);
    const rel = (p: string) => relative(skillDir, p);
    const skillMd = await readFile(join(skillDir, "SKILL.md"), "utf8").catch(() => "");
    const scripts: { path: string; content: string }[] = [];
    for (const f of files.filter((p) => SCRIPT_EXT.test(p))) {
      scripts.push({ path: rel(f), content: await readFile(f, "utf8").catch(() => "") });
    }
    const l2 = prior.find((x) => x.layer === "L2");
    const result = await l3Review(
      buildReviewContent(skillMd, scripts, JSON.stringify(l2?.factors ?? {}), files.map(rel)),
    );
    if (!result.ok) {
      return { layer: "L3", verdict: "failed", by: result.model, error: result.error };
    }
    const v = result.verdict!;
    return { layer: "L3", verdict: v.severity, by: result.model, l3: v, note: v.intent_summary };
  },
};
