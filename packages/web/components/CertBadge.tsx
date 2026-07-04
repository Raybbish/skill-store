"use client";
import { useState, useEffect, type MouseEvent } from "react";
import type { SkillCard } from "@/lib/store";

const FACTORS: [string, string, string][] = [
  ["network", "🌐", "网络请求"],
  ["scripts", "📜", "脚本执行"],
  ["filesystem", "📂", "文件读写"],
  ["env_access", "🔑", "环境变量"],
  ["external_commands", "⚙️", "外部命令"],
];

function dotColor(key: string, present: boolean | null | undefined): string {
  if (present == null) return "#c9ced8";
  if (!present) return "var(--green)";
  return key === "filesystem" ? "var(--blue)" : "var(--amber)";
}

function Shield({ rev, size }: { rev: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.3l5.4 1.8v4.2c0 3.5-2.7 5.6-5.4 6.9-2.7-1.3-5.4-3.4-5.4-6.9V3.1z" fill="currentColor" />
      {rev ? (
        <path d="M8 5v3.4M8 10.4v.1" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <path d="M5.4 8.1l1.7 1.7 3.4-3.5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** 徽章 + 认证弹窗只需要瘦卡字段(status/risk/l3/review/upstream);全量 Skill 结构兼容 */
export default function CertBadge({ skill, size = 17 }: { skill: SkillCard; size?: number }) {
  const [open, setOpen] = useState(false);
  const rev = skill.status !== "pass";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const openIt = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); setOpen(true); };

  return (
    <>
      <button
        className={`cert ${rev ? "rev" : ""}`}
        onClick={openIt}
        aria-label={rev ? "待人工复核,点击查看认证" : "已认证,点击查看认证流程"}
        title={rev ? "待人工复核 · 点击查看认证" : "已认证 · 点击查看认证流程"}
      >
        <Shield rev={rev} size={size} />
      </button>

      {open && (
        <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="认证详情">
            <div className="m-head">
              <div className="m-badge" style={rev ? { background: "var(--amber-soft)", color: "var(--amber)" } : undefined}>
                <Shield rev={rev} size={22} />
              </div>
              <div>
                <div className="mt">{rev ? "待人工复核" : "已认证"} · {skill.name}</div>
                <div className="msu">oh-my-skill 认证</div>
              </div>
              <button className="m-close" onClick={() => setOpen(false)} aria-label="关闭">✕</button>
            </div>

            <div className="m-body">
              <p className="m-intro">
                {rev
                  ? "这个 skill 含网络外联或有待确认项,已进入人工复核队列——货架标注「待复核」,不是通过。下面是它已跑完的检查与逐项披露。"
                  : "这个 skill 上架前走完了下面这条可公开复核的链路。审计报告随 catalog 仓公开,变更走 PR、每条记录带 commit 溯源。"}
              </p>

              <div className="m-sub">权限营养标签 · 本 skill 实测</div>
              <div className="facts">
                {FACTORS.map(([k, , label]) => {
                  const f = skill.risk[k];
                  const present = f?.present;
                  return (
                    <div className="fact" key={k}>
                      <i style={{ background: dotColor(k, present) }}></i>
                      <div><b>{label}</b> <span>{present == null ? "未判定" : present ? (f?.detail ?? "含") : "无"}</span></div>
                    </div>
                  );
                })}
              </div>

              {skill.l3?.verdict?.intent_summary && (
                <p className="m-note">🤖 L3 意图审查（{skill.l3.model}）:{skill.l3.verdict.intent_summary}</p>
              )}
              {skill.review?.note && (
                <p className="m-note">👤 人工复核（{skill.review.by}）:{skill.review.note}</p>
              )}

              <div className="m-sub">认证流程如何运作</div>
              <div className="steps">
                <div className="step"><div className="dot"></div><div className="st">采集 · 去重哈希</div><div className="sd">从官方精选仓与头部榜单收录;content_hash 去重,并作为安装时的校验锚点。</div></div>
                <div className="step"><div className="dot"></div><div className="st">L1 静态签名</div><div className="sd">YARA + 正则,拦已知恶意模式(密钥外传、危险命令)。</div></div>
                <div className="step"><div className="dot"></div><div className="st">L2 脚本数据流</div><div className="sd">追踪脚本读取→外传路径,产出上面的风险五因子。</div></div>
                <div className="step"><div className="dot"></div><div className="st">L3 意图审查</div><div className="sd">模型审查 SKILL.md 指令意图,抓提示注入,双模型交叉。</div></div>
                <div className="step end"><div className="dot"></div><div className="st">人工复核 · 上架</div><div className="sd">含外联一律进人工队列放行;货架显示状态,可在 catalog 仓复核。</div></div>
              </div>

              <div className="disc"><b>已扫描 ≠ 保证安全。</b>徽章是结构化披露,帮你自己判断,不是平台的安全背书。</div>
              <a className="m-link" href={skill.upstream} target="_blank" rel="noreferrer">查看上游仓库与审计来源 ↗</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
