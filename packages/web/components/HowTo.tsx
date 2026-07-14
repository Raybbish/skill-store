/**
 * 「怎么用」板块(ADR 0025)——详情页 d-stats 与短评之间。
 *
 * 两层内容,两套口径(ADR 0022):
 *   - 转述段(what / when / say)= 商店的话,跟语言走;缺英文时英文态整段不出
 *     (半套英文比没有更糟),仅 lint 过且锚新鲜时渲染(data.ts 回退闸)。
 *   - 原文折叠 = 商品,原样呈现不翻译;**磁盘在场即是转载资格**(mirror / skill.md
 *     快照只为宽松证条目落盘)——证不宽松时只给「在 GitHub 查看」出口,零转载。
 * 署名口径:source=llm 标「商店整理 · 表述以原文为准」;author 标「作者撰写」
 * (机器不冒充人写的红线,与场景包手记同精神)。
 * 服务端组件(SSG):原文构建期渲染进页面;复制交互在 SayChip 客户端小件里。
 */
import type { Skill, SkillHowtoView } from "@/lib/skill-types";
import { renderMarkdown, stripFrontmatter } from "@/lib/md";
import { L } from "@/lib/i18n/client";
import SayChip from "./SayChip";

function Says({ say }: { say: SkillHowtoView["say"] }) {
  return (
    <div className="say">
      {say.map((s) => (
        <div key={s.text} className="say-row">
          <SayChip text={s.text} />
          {s.note && <span className="say-note">{s.note}</span>}
        </div>
      ))}
    </div>
  );
}

/** 转述三段(单语渲染;zh/en 两份由 <L> 按 locale 切换) */
function Guide({ what, when, say, labels }: { what: string; when: string; say: SkillHowtoView["say"]; labels: [string, string, string] }) {
  return (
    <div className="ht-grid">
      <div className="ht-item">
        <div className="ht-q">{labels[0]}</div>
        <p className="ht-a">{what}</p>
      </div>
      <div className="ht-item">
        <div className="ht-q">{labels[1]}</div>
        <p className="ht-a">{when}</p>
      </div>
      {say.length > 0 && (
        <div className="ht-item">
          <div className="ht-q">{labels[2]}</div>
          <Says say={say} />
        </div>
      )}
    </div>
  );
}

export default function HowTo({ skill, body }: { skill: Skill; body: { text: string; source: "mirror" | "snapshot" } | null }) {
  const h = skill.howto ?? null;
  if (!h && !body) return null; // 无转述也无原文:板块整个不出(上游链接 InstallBox 已有)

  const ver = skill.upstreamCommit ? skill.upstreamCommit.slice(0, 7) : null;
  const verZh = ver ? ` · 版本 ${ver}` : "";
  const verEn = ver ? ` · version ${ver}` : "";
  const enComplete = !!(h && h.whatEn && h.whenEn);

  return (
    <section className="howto">
      <div className="ht-head">
        <h2 className="ht-title"><L zh="怎么用" en="How to use" /></h2>
        {h && (
          h.source === "author" ? (
            <span className="ht-src"><L zh={`作者撰写${verZh}`} en={`Written by the author${verEn}`} /></span>
          ) : (
            <span className="ht-src">
              {/* 英文态没有转述段时,来源注也不出(注无所注) */}
              <L zh={`商店整理自技能原文${verZh} · 表述以原文为准`} en={enComplete ? `Store summary of the skill text${verEn} · original prevails` : ""} />
            </span>
          )
        )}
      </div>

      {h && (
        <L
          zh={<Guide what={h.what} when={h.when} say={h.say} labels={["它做什么", "什么时候触发", "装好后可以这样说"]} />}
          en={
            enComplete ? (
              <Guide what={h.whatEn!} when={h.whenEn!} say={h.sayEn ?? []} labels={["What it does", "When it kicks in", "Things you can say"]} />
            ) : null
          }
        />
      )}

      {body ? (
        <details className="orig">
          <summary>
            <span className="tw" aria-hidden>▶</span>
            <L zh="技能原文 SKILL.md" en="Original SKILL.md" />
            <span className="orig-meta">
              <L zh={`作者撰写 · ${skill.license}${ver ? ` · ${ver}` : ""}`} en={`by the author · ${skill.license}${ver ? ` · ${ver}` : ""}`} />
            </span>
          </summary>
          <div className="orig-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(stripFrontmatter(body.text)) }} />
          <div className="orig-foot">
            <L zh={`按 ${skill.license} 许可原样转载,未经改动`} en={`Redistributed verbatim under ${skill.license}`} />
            {" · "}
            <a href={skill.upstream} target="_blank" rel="noopener noreferrer"><L zh="在 GitHub 查看 →" en="View on GitHub →" /></a>
          </div>
        </details>
      ) : (
        /* 证不宽松 / 快照未回填:不转载正文,只给出口 */
        <p className="orig-link">
          <a href={skill.upstream} target="_blank" rel="noopener noreferrer">
            <L zh="技能原文在 GitHub 查看 →" en="Read the original SKILL.md on GitHub →" />
          </a>
        </p>
      )}
    </section>
  );
}
