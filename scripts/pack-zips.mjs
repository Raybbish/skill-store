/**
 * pack-zips.mjs —— 构建期预生成安装包到 web/public/dl/<owner>/<repo>/<name>.skill。
 *
 * 产物 = 纯净 skill 目录压缩包:顶层单文件夹 <name>/,内含 SKILL.md 与全部资产。
 *  - 以 .skill 名提供:Claude / Cowork 拖入即装的封装(zip archive of a skill directory);
 *  - 前端用 <a download="<name>.zip"> 把同一文件改名成 .zip 提供:任何 agent 解压即得
 *    可直接放进技能目录的文件夹(~/.claude/skills/、~/.codex/skills/ 等)。
 * 旧结构(skill-report.json + mirror/)已废弃——拖入装不了、手动装还得改名;
 * 完整性校验职责归 CLI 通道(npx 装时逐文件复算 content_hash)。
 *
 * 只打「已下载 mirror/ 副本」的条目(宽松 licence);indexed 前端回上游。
 * web 的 prebuild 触发;测试可 `node scripts/pack-zips.mjs 20` 只打前 20 个。
 */
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, rmSync, copyFileSync, cpSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "catalog", "skills");
const OUT = process.env.PACK_OUT || join(ROOT, "packages", "web", "public", "dl"); // PACK_OUT:测试改道,不动真产物
const LIMIT = Number(process.argv[2]) || Infinity;

/** 收集含 skill-report.json 的 skill 目录 */
function skillDirs(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const out = entries.some((e) => e.isFile() && e.name === "skill-report.json") ? [dir] : [];
  for (const e of entries) if (e.isDirectory()) out.push(...skillDirs(join(dir, e.name)));
  return out;
}

if (!existsSync(CATALOG)) {
  console.log("pack-zips: 无 catalog,跳过");
  process.exit(0);
}
try { if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true }); } catch { /* 受限 fs 不让删:逐个覆盖 / 跳过 */ }

let made = 0, skipped = 0;
for (const dir of skillDirs(CATALOG)) {
  if (made >= LIMIT) break;
  if (!existsSync(join(dir, "mirror")) || !statSync(join(dir, "mirror")).isDirectory()) continue;
  const id = dir.slice(CATALOG.length + 1); // owner/repo/name
  const leaf = id.split("/").pop();
  const outPath = join(OUT, `${id}.skill`);
  const stage = join(tmpdir(), `omsk-stage-${process.pid}-${made}`);
  try {
    mkdirSync(dirname(outPath), { recursive: true });
    // 暂存区把 mirror/ 内容改名为 <leaf>/(zip 无法内联改路径),得到「目录的压缩包」
    mkdirSync(join(stage, leaf), { recursive: true });
    cpSync(join(dir, "mirror"), join(stage, leaf), { recursive: true });
    // 先 zip 到 tmp 再 copy:有些文件系统(受限挂载/容器)不让 zip 直接建输出文件
    const tmp = join(tmpdir(), `omsk-${process.pid}-${made}.skill`);
    execFileSync("zip", ["-rq", tmp, leaf], { cwd: stage });
    copyFileSync(tmp, outPath);
    rmSync(tmp, { force: true });
    made++;
  } catch {
    skipped++; // 受限 fs / zip 失败:跳过,不阻断构建
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}
// 场景包整包 zip:catalog/packs/*.json → dl/packs/<id>.zip,内含每个成员的 <name>/ 目录——
// 解压即得 N 个可直接放进技能目录的文件夹(其他 agent 的手动通道;Claude 党用逐成员 .skill)。
// 仅当全部成员都有 mirror/ 时生成,与「包=放心一键装」的承诺一致;缺任一成员则跳过该包。
const PACKS = join(ROOT, "catalog", "packs");
let packsMade = 0;
if (existsSync(PACKS)) {
  for (const f of readdirSync(PACKS).filter((x) => x.endsWith(".json"))) {
    const stage = join(tmpdir(), `omsk-pack-${process.pid}-${f}`);
    try {
      const p = JSON.parse(readFileSync(join(PACKS, f), "utf8"));
      const members = (p.skills ?? []).map((id) => ({ leaf: id.split("/").pop(), mirror: join(CATALOG, id, "mirror") }));
      if (!members.length || !members.every((m) => existsSync(m.mirror))) continue;
      for (const m of members) {
        mkdirSync(join(stage, m.leaf), { recursive: true });
        cpSync(m.mirror, join(stage, m.leaf), { recursive: true });
      }
      const tmp = join(tmpdir(), `omsk-pack-${process.pid}-${f}.zip`);
      execFileSync("zip", ["-rq", tmp, "."], { cwd: stage });
      mkdirSync(join(OUT, "packs"), { recursive: true });
      copyFileSync(tmp, join(OUT, "packs", `${p.id}.zip`));
      rmSync(tmp, { force: true });
      packsMade++;
    } catch { /* 单包失败不阻断 */ } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  }
}
console.log(`pack-zips: 生成 ${made} 个 .skill + ${packsMade} 个整包 zip${skipped ? `,跳过 ${skipped}(fs 受限或失败)` : ""} → ${OUT}`);
