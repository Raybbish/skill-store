/** 社区 / 发布者数据层(M1 预演)。demo 数据为演示用;真实实现将来自 DB(threads/comments 关联 skill_id+version+verified_install)。
 *  引用真实 catalog 中的 skill,发布者从 allSkills() 派生。仅服务端使用(依赖 data.ts 的 fs 读取)。*/
import { allSkills, getSkill } from "./data";
import { toCard, type SkillCard } from "./store";

export type BoardId = "help" | "show" | "challenge" | "announce";
export interface Board { id: BoardId; n: string; em: string; d: string }

export const BOARDS: Board[] = [
  { id: "help",     n: "求助台",     em: "🆘", d: "用法问题、报错求助 · 绑定 skill 版本" },
  { id: "show",     n: "晒用法",     em: "✨", d: "分享你的真实用法与效果" },
  { id: "challenge",n: "评测挑战",   em: "🧪", d: "复现 / 质疑货架分数 · 提交失败案例" },
  { id: "announce", n: "公告 & 复盘", em: "📢", d: "下架公告、安全复盘、协议征求意见" },
];

interface Thread {
  board: BoardId;
  ref?: [string, string, string]; // [owner, repo, name] 关联真实 skill
  title: string; author: string; time: string;
  replies?: number; likes?: number;
  solved?: boolean; status?: string; pinned?: boolean; tag?: string;
}

const THREADS: Thread[] = [
  // 求助台
  { board: "help", ref: ["anthropics", "skills", "pptx"], title: "pptx 生成的母版在 WPS 打开字体错位,如何嵌入字体?", author: "office_lin", time: "2 小时前", replies: 6, solved: true, tag: "字体" },
  { board: "help", ref: ["anthropics", "skills", "xlsx"], title: "xlsx 大表公式重算很慢,有分片建议吗?", author: "fp_amy", time: "5 小时前", replies: 3, solved: false, tag: "性能" },
  { board: "help", ref: ["vercel-labs", "agent-skills", "deploy-to-vercel"], title: "deploy-to-vercel 在 monorepo 下找不到 root,如何指定?", author: "ship_it", time: "1 天前", replies: 8, solved: true, tag: "Monorepo" },
  { board: "help", ref: ["supabase", "agent-skills", "supabase-postgres-best-practices"], title: "按最佳实践建 RLS 后本地测试 403,如何调试?", author: "pg_newbie", time: "1 天前", replies: 4, solved: true, tag: "RLS" },
  // 晒用法
  { board: "show", ref: ["anthropics", "skills", "xlsx"], title: "用 xlsx 把月结对账压到十分钟(附完整流程)", author: "卷王本王", time: "6 小时前", likes: 128, tag: "财务" },
  { board: "show", ref: ["mattpocock", "skills", "tdd"], title: "让 tdd skill 在遗留代码里先补测试再重构,真香", author: "refactor_guy", time: "1 天前", likes: 96, tag: "工程" },
  { board: "show", ref: ["anthropics", "skills", "docx"], title: "docx + 模板出合同,法务这关一次过", author: "inhouse_c", time: "2 天前", likes: 74, tag: "法务" },
  // 评测挑战
  { board: "challenge", ref: ["anthropics", "skills", "pptx"], title: "复现 pptx 版式还原任务:我这边跑到 8.1,元数据已附", author: "repro_kate", time: "4 小时前", replies: 11, status: "存疑", tag: "可复现" },
  { board: "challenge", ref: ["anthropics", "skills", "xlsx"], title: "第二模型交叉跑 xlsx,分数稳定复现 ✓", author: "benchmark_joe", time: "1 天前", replies: 5, status: "已复现", tag: "可复现" },
  { board: "challenge", ref: ["xixu-me", "skills", "openclaw-secure-linux-cloud"], title: "建议给安全类 skill 评测集加「提示注入」任务", author: "sec_vik", time: "3 天前", replies: 9, status: "讨论中", tag: "任务集" },
  // 公告 & 复盘
  { board: "announce", title: "下架公告:第三方源 quick-mailer 含 base64 外传指令,已移除并公开复盘", author: "oh-my-skill 安全组", time: "2 天前", pinned: true, tag: "安全复盘" },
  { board: "announce", title: "可复现评测协议 v0.1 征求意见:任务集结构与校验器接口", author: "oh-my-skill 评测组", time: "5 天前", tag: "评测协议" },
];

/** 序列化视图模型:客户端组件只吃这个,不碰 fs */
export interface ThreadVM {
  board: BoardId; title: string; author: string; time: string; tag?: string;
  metric: string; flag: { text: string; tone: string } | null;
  skill: { id: string; owner: string; repo: string; name: string } | null;
}

function toVM(t: Thread): ThreadVM {
  let skill: ThreadVM["skill"] = null;
  if (t.ref) {
    const s = getSkill(t.ref[0], t.ref[1], t.ref[2]);
    if (s) skill = { id: s.id, owner: s.owner, repo: s.repo, name: s.name };
  }
  const metric = t.replies != null ? `💬 ${t.replies}` : t.likes != null ? `♥ ${t.likes}` : "";
  let flag: ThreadVM["flag"] = null;
  if (t.solved === true) flag = { text: "已解决", tone: "ok" };
  else if (t.solved === false) flag = { text: "待解答", tone: "warn" };
  else if (t.status) flag = { text: t.status, tone: t.status === "已复现" ? "ok" : t.status === "存疑" ? "warn" : "" };
  else if (t.pinned) flag = { text: "置顶", tone: "pin" };
  return { board: t.board, title: t.title, author: t.author, time: t.time, tag: t.tag, metric, flag, skill };
}

export function allThreadVMs(): ThreadVM[] { return THREADS.map(toVM); }
export function threadVMsForSkill(id: string): ThreadVM[] {
  return THREADS.map(toVM).filter((v) => v.skill?.id === id);
}

/** 发布者主页 */
const OFFICIAL = new Set(["anthropics", "vercel-labs", "microsoft", "supabase", "larksuite", "remotion-dev"]);
interface Meta { bio: string; joined: string; respHrs: number | null; chalWins: number }
const PUB_META: Record<string, Meta> = {
  "anthropics":    { bio: "Agent Skills 标准的提出者。官方精选 skill,licence 清晰、质量基线高。", joined: "2025-10", respHrs: 8, chalWins: 14 },
  "vercel-labs":   { bio: "面向前端与部署的官方 skill 集合。", joined: "2025-11", respHrs: 10, chalWins: 9 },
  "microsoft":     { bio: "Azure 云与企业基础设施 skill。", joined: "2026-01", respHrs: 12, chalWins: 6 },
  "supabase":      { bio: "Postgres 与后端最佳实践 skill。", joined: "2025-12", respHrs: 7, chalWins: 5 },
  "larksuite":     { bio: "飞书开放平台官方 skill,覆盖审批 / 多维表格 / 文档等。", joined: "2026-02", respHrs: 9, chalWins: 4 },
  "mattpocock":    { bio: "TypeScript 教育者,专注开发工作流 skill(TDD、重构、PRD)。", joined: "2025-11", respHrs: 5, chalWins: 11 },
  "xixu-me":       { bio: "安全与云环境工具 skill 作者。", joined: "2026-01", respHrs: 6, chalWins: 8 },
  "remotion-dev":  { bio: "以代码做视频的 Remotion 官方 skill。", joined: "2026-02", respHrs: 11, chalWins: 3 },
  "agentspace-so": { bio: "AI 音视频生成 skill 集合。", joined: "2026-02", respHrs: 14, chalWins: 2 },
  "obra":          { bio: "superpowers 系列:brainstorming 等思维工作流。", joined: "2026-01", respHrs: 12, chalWins: 3 },
};

export interface PublisherView {
  pub: string; verified: boolean; bio: string; joined: string; respHrs: number | null; chalWins: number;
  /** 作品集只带瘦卡 —— 列表行所需字段面,别把全量 Skill 序列化给客户端组件(ADR 0007) */
  works: SkillCard[]; totalInstalls: number; challenge: ThreadVM[];
}

export function listPublishers(): string[] {
  return [...new Set(allSkills().map((s) => s.publisher))];
}

export function getPublisherView(pub: string): PublisherView | null {
  const works = allSkills().filter((s) => s.publisher === pub).sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0)).map(toCard);
  if (!works.length) return null;
  const meta = PUB_META[pub] ?? { bio: "该发布者尚未完善主页信息。", joined: "—", respHrs: null, chalWins: 0 };
  const totalInstalls = works.reduce((a, s) => a + (s.installs ?? 0), 0);
  const workIds = new Set(works.map((s) => s.id));
  const challenge = allThreadVMs().filter((v) => v.board === "challenge" && v.skill && workIds.has(v.skill.id));
  return { pub, verified: OFFICIAL.has(pub), ...meta, works, totalInstalls, challenge };
}
