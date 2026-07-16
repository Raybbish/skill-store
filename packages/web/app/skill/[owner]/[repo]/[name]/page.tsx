import { notFound } from "next/navigation";
import { allSkills, getSkill, getSkillBody } from "@/lib/data";
import InstallBox from "./InstallBox";
import HowTo from "@/components/HowTo";
import SkillReviews from "@/components/SkillReviews";
import SkillClaim from "@/components/SkillClaim";
import { BackHome } from "@/components/Chrome";
import { WhenChip } from "@/components/DetailBits";
import { L } from "@/lib/i18n/client";

function fmtContextTokens(tokens?: number | null): string | null {
  if (tokens == null) return null; // 只有缺失才是「待重算」(JSX 层按 locale 渲染);0 是合法计数
  if (tokens < 1000) return `~${tokens}`;
  return `~${Math.round(tokens / 100) / 10}K`;
}
/** 待重算占位(双语) */
const Pending = () => <L zh="待重算" en="pending" />;

// 计数方式不再占独立展示格(在「上下文体积」标签下像个坏数值):
// 数值前的 ~ 已表达「估算」,方式与口径细节收进悬停提示。
function contextMethodTip(c: { id: string; method: string; description?: string; tokenizer?: string }): string {
  const label = c.tokenizer ?? (c.method === "heuristic" ? "静态估算" : c.id);
  return c.description ? `${label} · ${c.description}` : label;
}

export async function generateMetadata({ params }: { params: Promise<{ owner: string; repo: string; name: string }> }) {
  const { owner, repo, name } = await params;
  const s = getSkill(owner, repo, name);
  if (!s) return {};
  // 副题优先机器微文案 tagline,与列表行同口径;缺失回退 description 截断
  const desc = s.tagline ?? (s.description ? (s.description.length > 140 ? s.description.slice(0, 140) + "…" : s.description) : undefined);
  return { title: `${s.name} — @${s.publisher} · oh-my-skill`, description: desc };
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

  return (
    <>
      <BackHome />

      <section className="detail-hero">
        <h1 className="d-name">{s.name}</h1>
        <div className="d-pub">
          <a href={`/publisher/${s.publisher}/`}>@{s.publisher}</a>
          <WhenChip k="d.addedAt" iso={s.firstSeenAt} />
          <WhenChip k="d.upstreamAt" iso={s.upstreamCommitAt} />
          {s.curatedBy && s.curatedBy.length > 0 && <span className="d-tag"><L zh="★ 社区精选" en="★ Community pick" /></span>}
          {/* 认领入口/已认领徽章(ADR 0006 第①档);env 未配自隐藏 */}
          <SkillClaim skillId={s.id} publisher={s.publisher} />
        </div>
        {/* 退市墓碑(ADR 0020):只陈述事实;镜像/回执/历史保留,重新观测到会自动复活 */}
        {s.delistedAt && (
          <p className="d-fit" style={{ color: "var(--faint)" }}>
            <L
              zh={`上游已移除或改名,本条目于 ${s.delistedAt.slice(0, 10)} 停止收录;历史数据与镜像保留。`}
              en={`The upstream was removed or renamed; this entry stopped being listed on ${s.delistedAt.slice(0, 10)}. History and mirror are preserved.`}
            />
          </p>
        )}
        <p className="d-desc">{s.description ?? <L zh="(无描述)" en="(no description)" />}</p>
        {/* 场景词全量展示(详情页不裁词频);「话题」层样式,点击 = 搜索聚合,不进 facet(ADR 0013 补充) */}
        {s.sceneTags && s.sceneTags.length > 0 && (
          <div className="d-scene">
            <span className="sc-k"><L zh="场景" en="Scene" /></span>
            <L
              zh={s.sceneTags.map((w) => (
                <a key={w} href={`/?q=${encodeURIComponent(w)}`} className="sc">{w}</a>
              ))}
              en={(s.sceneTagsEn ?? s.sceneTags).map((w) => (
                <a key={w} href={`/en/?q=${encodeURIComponent(w)}`} className="sc">{w}</a>
              ))}
            />
          </div>
        )}
        {/* fit_line 放安装按钮上方(决策位):最典型那类用户的处境 */}
        {(s.fitLine || s.fitLineEn) && (
          <p className="d-fit"><L zh={s.fitLine ?? s.fitLineEn ?? ""} en={s.fitLineEn ?? s.fitLine ?? ""} /></p>
        )}
        <InstallBox skill={s} />
        <div className="d-stats">
          <div><b>{s.stars ?? "–"}</b><span>GitHub stars</span></div>
          {contextSize == null ? (
            <div><b><Pending /></b><span><L zh="上下文体积" en="context size" /></span></div>
          ) : singleFile ? (
            <div title={methodTip}><b>{fmtContextTokens(contextSize.scopes.activation_core?.tokens) ?? <Pending />}</b><span><L zh="上下文体积 · 单文件" en="context size · single file" /></span></div>
          ) : (
            <>
              <div title={methodTip}><b>{fmtContextTokens(contextSize.scopes.activation_core?.tokens) ?? <Pending />}</b><span><L zh="最小装载" en="min load" /></span></div>
              <div title={methodTip}><b>{fmtContextTokens(contextSize.scopes.activation_with_declared_refs?.tokens) ?? <Pending />}</b><span><L zh="含声明引用" en="with refs" /></span></div>
              <div title={methodTip}><b>{fmtContextTokens(contextSize.scopes.package_total_text?.tokens) ?? <Pending />}</b><span><L zh="文本包总量" en="total text" /></span></div>
            </>
          )}
          <div><b>{s.hosting === "mirrored" ? <L zh="镜像" en="Mirrored" /> : <L zh="索引" en="Indexed" />}</b><span><L zh="托管" en="hosting" /></span></div>
        </div>
      </section>

      {/* 怎么用(ADR 0025):双语转述段 + 原文折叠;先懂再装,装完再评 */}
      <HowTo skill={s} body={getSkillBody(s.id)} />

      {/* 短评(砖二):env 未配时组件自隐藏;评价挂对象页,不是社区板块(ADR 0017) */}
      <SkillReviews skillId={s.id} contentHash={s.contentHash} scene={s.sceneTags ?? []} />
    </>
  );
}
