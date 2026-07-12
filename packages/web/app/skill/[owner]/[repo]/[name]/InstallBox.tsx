"use client";
import { useEffect, useState } from "react";
import type { Skill } from "@/lib/skill-types";
import { trackInstall } from "@/lib/analytics";
import { ridToken } from "@/lib/receipts";
import DlLink from "@/components/DlLink";
import { useT } from "@/lib/i18n/client";

// CLI / 下载 / 安装脚本的 base 域名 —— 正式域名替换处
const HOST = "https://oh-my-skill.com";

function CopyBtn({ text, onCopied }: { text: string; onCopied?: () => void }) {
  const tt = useT();
  const [ok, setOk] = useState(false);
  return (
    <button
      className="cp"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          onCopied?.(); // 埋点:复制安装命令 = 强安装意图
          setTimeout(() => setOk(false), 1200);
        } catch {
          /* clipboard 不可用则忽略 */
        }
      }}
    >
      {ok ? tt("inst.copied") : tt("inst.copy")}
    </button>
  );
}

/**
 * 安装区:多方式安装 + 本店差异点(哈希校验;indexed 回上游)。
 * chrome 双语(共享页,客户端切换);命令与路径是事实,不翻。
 */
export default function InstallBox({ skill }: { skill: Skill }) {
  const tt = useT();
  const { id, upstream, hasMirror, contentHash } = skill;
  const leaf = id.split("/").pop() ?? id;
  // 复制命令内嵌短 token(ADR 0017 路径②):CLI 装机回执带回,绑定 web 会话——藏在复制动作里。
  // 挂载后再取(localStorage),初始渲染不带,避免 SSG 水合不匹配。
  const [tok, setTok] = useState("");
  useEffect(() => setTok(ridToken()), []);
  const npx = `npx oh-my-skill add ${id}${tok ? ` --t ${tok}` : ""}`;
  // 已装过的存量用户(早期的主流人群):verify 验证本机副本,不重装(ADR 0017 路径③)
  const vfy = `npx oh-my-skill verify ${id}${tok ? ` --t ${tok}` : ""}`;
  // 静态站:install.sh 是单个静态脚本,id 走参数(不能用动态路由)
  const curl = `curl -fsSL ${HOST}/install.sh | bash -s -- ${id}`;

  return (
    <div className="inst">
      <div className="inst-m">
        <div className="inst-h"><span>/</span> {tt("inst.download")}</div>
        {hasMirror ? (
          <>
            <div className="inst-cmd">
              <code className="inst-file">{leaf}.skill</code>
              <span className="inst-note">{tt("inst.dragNote")}</span>
              {/* 同一份文件、两个下载名:.skill 给拖拽安装,.zip 给手动放置(download 属性同源改名) */}
              <DlLink id={id} href={`/dl/${id}.skill`} download={`${leaf}.skill`} contentHash={contentHash}>↓ .skill</DlLink>
              <DlLink id={id} href={`/dl/${id}.skill`} download={`${leaf}.zip`} contentHash={contentHash}>↓ .zip</DlLink>
            </div>
            <details className="inst-dirs">
              <summary>{tt("inst.otherAgent")}</summary>
              <div className="inst-dirs-t">
                <div><b>Claude Code</b><code>~/.claude/skills/</code>({tt("inst.projLevel")} <code>.claude/skills/</code>)</div>
                <div><b>Codex CLI</b><code>~/.codex/skills/</code></div>
                <div><b>Cursor</b>{tt("inst.cursorNote")}</div>
                <div><b>{tt("inst.otherTools")}</b>{tt("inst.otherToolsNote")}</div>
              </div>
            </details>
          </>
        ) : (
          <div className="inst-cmd">
            <a className="inst-url" href={upstream} target="_blank" rel="noopener noreferrer">{upstream}<span style={{ whiteSpace: "nowrap" }}> ↗</span></a>
          </div>
        )}
      </div>

      <div className="inst-m">
        <div className="inst-h"><span>/</span> {tt("inst.npx")} <em className="inst-tag">{tt("inst.hashTag")}</em></div>
        <div className="inst-cmd"><code className="cli">{npx}</code><CopyBtn text={npx} onCopied={() => trackInstall(id)} /></div>
      </div>

      <div className="inst-m">
        <div className="inst-h"><span>/</span> {tt("inst.bash")}</div>
        <div className="inst-cmd"><code className="cli">{curl}</code><CopyBtn text={curl} onCopied={() => trackInstall(id)} /></div>
      </div>

      <div className="inst-m">
        <div className="inst-h"><span>/</span> {tt("inst.verify")}</div>
        <div className="inst-cmd"><code className="cli">{vfy}</code><CopyBtn text={vfy} /></div>
      </div>

      <div className="inst-foot">{tt("inst.foot")}</div>
    </div>
  );
}
