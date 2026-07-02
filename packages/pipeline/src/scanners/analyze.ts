/** 对一个 skill 目录做 L1/L2 静态分析,产出五因子 + 文件级证据 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import type { RiskFactors, Evidence } from "@skill-store/schemas";
import { RULES, type RuleScope } from "./rules.ts";

const SCRIPT_EXT = /\.(py|sh|bash|zsh|js|mjs|cjs|ts|rb|pl|ps1|bat|cmd)$/i;
const TEXT_EXT = /\.(py|sh|bash|zsh|js|mjs|cjs|ts|rb|pl|ps1|bat|cmd|md|txt|json|yaml|yml|toml|cfg|ini|html|css|xml)$/i;
const MAX_FILE = 512 * 1024;
const MAX_EVIDENCE_PER_FACTOR = 8;

export interface AnalysisResult {
  factors: RiskFactors;
  evidence: Evidence[];
  criticalHits: Evidence[];
  scannedFiles: number;
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const name of await readdir(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) await walk(p, out);
    else if (s.size <= MAX_FILE && TEXT_EXT.test(name)) out.push(p);
  }
  return out;
}

/** 从 markdown 提取代码块内容(带行号偏移),普通正文不参与 fence 规则 */
function extractFences(md: string): { text: string; startLine: number }[] {
  const fences: { text: string; startLine: number }[] = [];
  const lines = md.split("\n");
  let inFence = false;
  let buf: string[] = [];
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) {
      if (inFence) fences.push({ text: buf.join("\n"), startLine: start });
      else { buf = []; start = i + 2; }
      inFence = !inFence;
    } else if (inFence) buf.push(lines[i]);
  }
  return fences;
}

function lineOf(text: string, index: number, offset = 1): number {
  return offset + (text.slice(0, index).match(/\n/g)?.length ?? 0);
}

export async function analyzeSkillDir(skillDir: string): Promise<AnalysisResult> {
  const files = await walk(skillDir);
  const factors: RiskFactors = {
    scripts: { present: false },
    network: { present: false },
    filesystem: { present: false },
    env_access: { present: false },
    external_commands: { present: false },
  };
  const evidence: Evidence[] = [];
  const criticalHits: Evidence[] = [];
  const factorCounts: Record<string, number> = {};
  const scriptFiles: string[] = [];

  for (const file of files) {
    const rel = relative(skillDir, file);
    const isScript = SCRIPT_EXT.test(rel);
    const isMd = /\.md$/i.test(rel);
    if (isScript) scriptFiles.push(rel);
    const content = await readFile(file, "utf8").catch(() => "");
    if (!content) continue;

    // 每条规则在(文件 × 适用范围)上匹配一次,取第一处命中做证据
    for (const rule of RULES) {
      const applies = (scope: RuleScope) =>
        scope === "any" || (scope === "script" && isScript) || (scope === "fence" && isMd);
      if (!applies(rule.scope)) continue;

      const targets =
        rule.scope === "fence" && isMd
          ? extractFences(content)
          : [{ text: content, startLine: 1 }];

      for (const t of targets) {
        const m = rule.re.exec(t.text);
        if (!m) continue;
        const ev: Evidence = {
          factor: rule.factor ?? "critical",
          file: rel,
          line: lineOf(t.text, m.index, t.startLine),
          note: `${rule.id}: ${rule.note}`,
        };
        if (rule.critical) {
          criticalHits.push(ev);
        } else if (rule.factor) {
          factors[rule.factor] = { present: true, detail: factors[rule.factor]?.detail ?? rule.note };
          if ((factorCounts[rule.factor] = (factorCounts[rule.factor] ?? 0) + 1) <= MAX_EVIDENCE_PER_FACTOR) {
            evidence.push(ev);
          }
        }
        break; // 该规则在此文件命中一次即可
      }
    }
  }

  factors.scripts = scriptFiles.length
    ? { present: true, detail: `${scriptFiles.length} 个脚本文件` }
    : { present: false };

  // 汇总 detail:给每个命中的因子标注命中文件数
  for (const f of ["network", "filesystem", "env_access", "external_commands"] as const) {
    if (factors[f]?.present) {
      const n = evidence.filter((e) => e.factor === f).length;
      factors[f] = { present: true, detail: `${factors[f]!.detail}(${n} 处证据)` };
    }
  }

  return { factors, evidence: [...criticalHits, ...evidence], criticalHits, scannedFiles: files.length };
}
