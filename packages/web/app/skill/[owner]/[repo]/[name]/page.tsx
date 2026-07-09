import Link from "next/link";
import { notFound } from "next/navigation";
import { allSkills, getSkill, fmtInstalls } from "@/lib/data";
import InstallBox from "./InstallBox";
import SkillReviews from "@/components/SkillReviews";
import SkillClaim from "@/components/SkillClaim";

function fmtContextTokens(tokens?: number | null): string {
  if (tokens == null) return "待重算"; // 只有缺失才是「待重算」;0 是合法计数

  if (tokens < 1000) return `~${tokens}`;
  return `~${Math.round(tokens / 100) / 10}K`;
}

// 计数方式不再占独立展示格(在「上下文体积」标签下像个坏数值):
// 数值前的 ~ 已表达「估算」,方式与口径细节收进悬停提示。
function contextMethodTip(c: { id: string; method: string; description?: string; tokenizer?: string }): string {
  const label = c.tokenizer ?? (c.method === "heuristic" ? "静态估算" : c.id);
  return c.description ? `${label} · ${c.description}` : label;
}

/** 相对时间(活人感):构建期计算,粗到「天/周/月/年前」,精确日期进 title 悬停;缺失/非法返回 null。 */
function relTime(iso?: string | null): { rel: string; abs: string } | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / 86_400_000);
  const rel =
    days <= 0 ? "今天" : days === 1 ? "昨天" : days < 7 ? `${days} 天前`
    : days < 30 ? `${Math.floor(days / 7)} 周前` : days < 365 ? `${Math.floor(days / 30)} 个月前`
    : `${Math.floor(days / 365)} 年前`;
  return { rel, abs: iso.slice(0, 10) };
}

export function generateStaticParams() {
  // 可见条目 + 退市墓碑页(ADR 0020:deep link 不 404,留事实行);拷贝/不合规仍不出页
  const tombs = allSkills({ includeHidden: true }).filter(
    (s) => s.delistedAt && !s.duplicateOf && s.frontmatterValid !== false,
  );
  return [...allSkills(), ...tombs].map((s) => ({ owner: s.owner, repo: s.repo, name: s.name }));
}

export default async function SkillPage({ params }: { params: Promise<{ owner: string; repo: string; name: string }> }) {
  const { owner, repo, name } = await params;
  const s = getSkill(owner, repo, name);
  if (!s) notFound();

  const contextSize = s.contextSize;
  // 单文本文件包(catalog 全量约 49%):三个 scope 文本集合相同,三格数字必然一样,折叠成一格。
  // 判据用 text_files === 1(结构事实)而非三值相等(数值巧合也会命中)。
  const singleFile = contextSize?.scopes?.package_total_text?.text_files === 1;
  const methodTip = contextSize ? contextMethodTip(contextSize.counter) : undefined;
  const added = relTime(s.firstSeenAt);         // 收录于(我们首次上架)
  const upstream = relTime(s.upstreamCommitAt); // 上游提交(维护活性;采集起攒,缺则不显示)

  return (
    <>
      <Link href="/" className="back">‹ 首页</Link>

      <section className="detail-hero">
        <h1 className="d-name">{s.name}</h1>
        <div className="d-pub">
          <Link href={`/publisher/${s.publisher}/`}>@{s.publisher}</Link>
          {added && <span title={`收录于 ${added.abs}`}> · 收录于 {added.rel}</span>}
          {upstream && <span title={`上游最近提交 ${upstream.abs}`}> · 上游提交 {upstream.rel}</span>}
          {s.curatedBy && s.curatedBy.length > 0 && <span className="d-tag">★ 社区精选</span>}
          {/* 认领入口/已认领徽章(ADR 0006 第①档);env 未配自隐藏 */}
          <SkillClaim skillId={s.id} publisher={s.publisher} />
        </div>
        {/* 退市墓碑(ADR 0020):只陈述事实;镜像/回执/历史保留,重新观测到会自动复活 */}
        {s.delistedAt && (
          <p className="d-fit" style={{ color: "var(--faint)" }}>
            上游已移除或改名,本条目于 {s.delistedAt.slice(0, 10)} 停止收录;历史数据与镜像保留。
          </p>
        )}
        <p className="d-desc">{s.description ?? "(无描述)"}</p>
        {/* 场景词全量展示(详情页不裁词频);「话题」层样式,点击 = 搜索聚合,不进 facet(ADR 0013 补充) */}
        {s.sceneTags && s.sceneTags.length > 0 && (
          <div className="d-scene">
            <span className="sc-k">场景</span>
            {s.sceneTags.map((w) => (
              <Link key={w} href={`/?q=${encodeURIComponent(w)}`} className="sc">{w}</Link>
            ))}
          </div>
        )}
        {/* fit_line 放安装按钮上方(决策位):最典型那类用户的处境 */}
        {s.fitLine && <p className="d-fit">{s.fitLine}</p>}
        <InstallBox skill={s} />
        <div className="d-stats">
          {s.installs != null && <div><b>{fmtInstalls(s.installs)}</b><span>安装量</span></div>}
          <div><b>{s.stars ?? "–"}</b><span>GitHub stars</span></div>
          {contextSize == null ? (
            <div><b>待重算</b><span>上下文体积</span></div>
          ) : singleFile ? (
            <div title={methodTip}><b>{fmtContextTokens(contextSize.scopes.activation_core?.tokens)}</b><span>上下文体积 · 单文件</span></div>
          ) : (
            <>
              <div title={methodTip}><b>{fmtContextTokens(contextSize.scopes.activation_core?.tokens)}</b><span>最小装载</span></div>
              <div title={methodTip}><b>{fmtContextTokens(contextSize.scopes.activation_with_declared_refs?.tokens)}</b><span>含声明引用</span></div>
              <div title={methodTip}><b>{fmtContextTokens(contextSize.scopes.package_total_text?.tokens)}</b><span>文本包总量</span></div>
            </>
          )}
          <div><b>{s.hosting === "mirrored" ? "镜像" : "索引"}</b><span>托管</span></div>
        </div>
      </section>

      {/* 短评(砖二):env 未配时组件自隐藏;评价挂对象页,不是社区板块(ADR 0017) */}
      <SkillReviews skillId={s.id} contentHash={s.contentHash} scene={s.sceneTags ?? []} />
    </>
  );
}
