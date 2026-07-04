/**
 * pack-zips.mjs —— 构建期预生成 zip 到 web/public/dl/<owner>/<repo>/<name>.zip。
 *
 * web 是 output:"export"(纯静态),没有动态路由 —— 下载必须是构建产物。
 * 只打「已下载 mirror/ 副本」的条目;zip 内含 skill-report.json + mirror/,可离线复算 content_hash。
 * 由 web 的 prebuild 触发(见 packages/web/package.json)。indexed / 未下副本的条目不打,前端回上游。
 */
import { readdirSync, statSync, existsSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "catalog", "skills");
const OUT = join(ROOT, "packages", "web", "public", "dl");

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
  if (!existsSync(join(dir, "mirror")) || !statSync(join(dir, "mirror")).isDirectory()) continue;
  const id = dir.slice(CATALOG.length + 1); // owner/repo/name
  const zipPath = join(OUT, `${id}.zip`);
  try {
    mkdirSync(dirname(zipPath), { recursive: true });
    // 先 zip 到 tmp 再 copy:有些文件系统(受限挂载/容器)不让 zip 直接建输出文件
    const tmp = join(tmpdir(), `omsk-${process.pid}-${made}.zip`);
    execFileSync("zip", ["-rq", tmp, "skill-report.json", "mirror"], { cwd: dir });
    copyFileSync(tmp, zipPath);
    rmSync(tmp, { force: true });
    made++;
  } catch {
    skipped++; // 受限 fs / 已存在不可覆盖:跳过,不阻断构建
  }
}
console.log(`pack-zips: 生成 ${made} 个 zip${skipped ? `,跳过 ${skipped}(fs 受限或已存在)` : ""} → ${OUT}`);
