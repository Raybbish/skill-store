/**
 * 网页端 verify(ADR 0017 路径③的零门槛形态):用户把「装好的 skill 文件夹」拖进页面/点选,
 * 浏览器本地复算内容哈希与货架比对——文件不上传,只有哈希出门。任何系统、任何路径、不碰终端。
 *
 * 算法与管线/CLI 逐字节对齐(pipeline hash.ts / CLI dirContentHash):
 *   每文件 git blob sha1("blob <len>\0" + bytes) → 行 "<相对路径>:<sha1>" → 默认字符串序排序 →
 *   join("\n") 的 sha256,前缀 "sha256:"。跳过 .git/.svn/.hg;额外跳过 .DS_Store(Finder 元数据,
 *   货架内容不会有——本地被 Finder 摸过的目录才有,不剔除会永远差一行)。
 *
 * 防「拖任意文件夹混资格」:必须含 SKILL.md;哈希不一致时(旧版/自改),SKILL.md 的
 * frontmatter name 必须与货架 skill 名一致才算「持有旧版」,否则拒绝。
 */

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 内容条目:file 用 Blob(File 与 zip 解出的字节都装得下,.arrayBuffer()/.text() 两者皆有) */
export interface PickedFile { rel: string; file: Blob }

/** 跳过规则(与管线/CLI 一致 + .DS_Store) */
function admit(rel: string): boolean {
  if (!rel) return false;
  const segs = rel.split("/");
  if (segs.includes(".git") || segs.includes(".svn") || segs.includes(".hg")) return false;
  if (segs.at(-1) === ".DS_Store") return false;
  return true;
}

/** input[webkitdirectory] 的 FileList → 相对路径条目(去掉拖入的根文件夹名,套跳过规则) */
export function fromFileList(list: FileList): PickedFile[] {
  const out: PickedFile[] = [];
  for (const f of Array.from(list)) {
    const p = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    const rel = p.split("/").slice(1).join("/"); // 首段 = 用户拖入的文件夹名,不属于 skill 内部路径
    if (admit(rel)) out.push({ rel, file: f });
  }
  return out;
}

/** 原生 DecompressionStream 解 deflate-raw(zip method 8),零依赖 */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  // new Uint8Array(data) 拷贝成纯 ArrayBuffer 视图(TS 5.7 的 BlobPart 不收 ArrayBufferLike 泛型)
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * .skill / .zip 安装包 → 条目(浏览器本地解包,不上传):手工解析 zip 中央目录 + 原生 inflate。
 * 场景:① 用户拿着从本店下载的 .skill 来验(其实下载已留回执,但拒绝它=制造疑惑);
 * ② 别人转发的 .skill/.zip(无下载回执,验证是刚需)。全部条目共享同一顶层文件夹时剥掉
 * (本店 .skill 规范即如此),混合根则按原样。
 */
export async function fromZipFile(file: File): Promise<PickedFile[]> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // 找 End of Central Directory(从尾部倒扫,容忍 zip 注释)
  let eocd = -1;
  for (let i = buf.length - 22, min = Math.max(0, buf.length - 65558); i >= min; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return [];
  const count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  const raw: PickedFile[] = [];
  const td = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(off, true) !== 0x02014b50) break;
    const method = dv.getUint16(off + 10, true);
    const csize = dv.getUint32(off + 20, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const cmtLen = dv.getUint16(off + 32, true);
    const lho = dv.getUint32(off + 42, true);
    const name = td.decode(buf.subarray(off + 46, off + 46 + nameLen));
    off += 46 + nameLen + extraLen + cmtLen;
    if (name.endsWith("/")) continue; // 目录项
    // 本地头里 name/extra 长度可能与中央目录不同,按本地头定位数据区
    const lnl = dv.getUint16(lho + 26, true);
    const lel = dv.getUint16(lho + 28, true);
    const start = lho + 30 + lnl + lel;
    const comp = buf.subarray(start, start + csize);
    let body: Uint8Array;
    if (method === 0) body = comp;
    else if (method === 8) body = await inflateRaw(comp);
    else continue; // 罕见压缩法:跳过(缺行会导致比对不齐,最终 stale/reject,不误放行)
    raw.push({ rel: name, file: new Blob([new Uint8Array(body)]) });
  }
  // 剥统一顶层文件夹(<name>/SKILL.md → SKILL.md)
  const roots = new Set(raw.map((f) => f.rel.split("/")[0]));
  const strip = roots.size === 1 && raw.every((f) => f.rel.includes("/"));
  return raw
    .map((f) => ({ ...f, rel: strip ? f.rel.split("/").slice(1).join("/") : f.rel }))
    .filter((f) => admit(f.rel));
}

/** 拖拽 DataTransfer → 条目:文件夹递归走 FileSystemEntry;.skill/.zip 文件走解包 */
export async function fromDataTransfer(dt: DataTransfer): Promise<PickedFile[]> {
  const item = dt.items[0];
  const entry = item?.webkitGetAsEntry?.();
  if (entry?.isFile) {
    const f = item.getAsFile();
    return f && /\.(skill|zip)$/i.test(f.name) ? fromZipFile(f) : [];
  }
  if (!entry || !entry.isDirectory) return [];
  const out: PickedFile[] = [];
  async function walk(e: FileSystemEntry, rel: string): Promise<void> {
    const segs = rel.split("/");
    if (segs.includes(".git") || segs.includes(".svn") || segs.includes(".hg")) return;
    if (e.isFile) {
      if (segs.at(-1) === ".DS_Store") return;
      const file = await new Promise<File>((ok, no) => (e as FileSystemFileEntry).file(ok, no));
      if (rel) out.push({ rel, file });
      return;
    }
    const reader = (e as FileSystemDirectoryEntry).createReader();
    // readEntries 每次最多回 100 条,读空为止
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((ok, no) => reader.readEntries(ok, no));
      if (!batch.length) break;
      for (const child of batch) await walk(child, rel ? `${rel}/${child.name}` : child.name);
    }
  }
  await walk(entry, ""); // 根文件夹名不计入相对路径
  return out;
}

export interface WebVerifyResult {
  status: "match" | "stale" | "rejected";
  /** 本地实算哈希(match/stale 时有) */
  hash?: string;
  reason?: string;
}

/** 本地复算 + 比对货架。stale = 持有旧版/自改版(名对、哈希不同);rejected = 不像这个 skill。 */
export async function verifyPickedDir(files: PickedFile[], shelf: { name: string; contentHash?: string }): Promise<WebVerifyResult> {
  if (!files.length) return { status: "rejected", reason: "没读到内容——支持装好的文件夹,或 .skill / .zip 安装包" };
  const skillMd = files.find((f) => f.rel === "SKILL.md");
  if (!skillMd) return { status: "rejected", reason: "这个文件夹里没有 SKILL.md,似乎不是 skill 目录" };

  const sorted = [...files].sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  const enc = new TextEncoder();
  const lines: string[] = [];
  for (const f of sorted) {
    const body = new Uint8Array(await f.file.arrayBuffer());
    const head = enc.encode(`blob ${body.length}\0`);
    const all = new Uint8Array(head.length + body.length);
    all.set(head);
    all.set(body, head.length);
    lines.push(`${f.rel}:${hex(await crypto.subtle.digest("SHA-1", all))}`);
  }
  const hash = "sha256:" + hex(await crypto.subtle.digest("SHA-256", enc.encode(lines.join("\n"))));

  if (shelf.contentHash && hash === shelf.contentHash) return { status: "match", hash };

  // 哈希不同:允许「旧版/自改版」,但 SKILL.md 的 name 得对得上,否则视为拖错/混资格
  const md = await skillMd.file.text();
  const m = md.match(/^---[\s\S]*?\bname:\s*["']?([^\n"']+)["']?[\s\S]*?^---/m);
  const declared = m?.[1]?.trim().toLowerCase();
  if (declared && declared === shelf.name.toLowerCase()) return { status: "stale", hash };
  return {
    status: "rejected",
    reason: declared
      ? `文件夹里的 SKILL.md 自称「${declared}」,和这条 skill(${shelf.name})对不上`
      : "SKILL.md 里没有可比对的 name,无法确认是这条 skill",
  };
}
