"use client";
import { useState } from "react";
import type { Skill } from "@/lib/skill-types";
import { trackInstall } from "@/lib/analytics";

// CLI / 下载 / 安装脚本的 base 域名 —— 正式域名替换处
const HOST = "https://oh-my-skill.dev";

function CopyBtn({ text, onCopied }: { text: string; onCopied?: () => void }) {
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
      {ok ? "已复制 ✓" : "复制"}
    </button>
  );
}

/**
 * 安装区:对标 ModelScope 的多方式安装,但保留本店差异点——
 *   - 下载 zip 仅 mirrored(宽松 licence)可打包;indexed 回上游(licence 双轨 + DMCA)
 *   - npx / bash 装时校验 content_hash(别家盲装,这里不是)
 *   - 不做 ModelScope 的「SDK 安装」:本店 agent / 模型中立,无自家 SDK,照搬会错位
 */
export default function InstallBox({ skill }: { skill: Skill }) {
  const { id, upstream, hasMirror } = skill;
  const leaf = id.split("/").pop() ?? id;
  const npx = `npx oh-my-skill add ${id}`;
  // 静态站:install.sh 是单个静态脚本,id 走参数(不能用动态路由)
  const curl = `curl -fsSL ${HOST}/install.sh | bash -s -- ${id}`;

  return (
    <div className="inst">
      <div className="inst-m">
        <div className="inst-h"><span>/</span> 下载安装</div>
        {hasMirror ? (
          <>
            <div className="inst-cmd">
              <code className="inst-file">{leaf}.skill</code>
              <span className="inst-note">双击,或拖进 Claude 桌面版 / Cowork,即完成安装</span>
              {/* 同一份文件、两个下载名:.skill 给拖拽安装,.zip 给手动放置(download 属性同源改名) */}
              <a className="cp" href={`/dl/${id}.skill`} download={`${leaf}.skill`} onClick={() => trackInstall(id)}>↓ .skill</a>
              <a className="cp" href={`/dl/${id}.skill`} download={`${leaf}.zip`} onClick={() => trackInstall(id)}>↓ .zip</a>
            </div>
            <details className="inst-dirs">
              <summary>用别的 agent?下载 .zip 解压,把文件夹放进它的技能目录</summary>
              <div className="inst-dirs-t">
                <div><b>Claude Code</b><code>~/.claude/skills/</code>(项目级 <code>.claude/skills/</code>)</div>
                <div><b>Codex CLI</b><code>~/.codex/skills/</code></div>
                <div><b>Cursor</b>自动读取上面两处目录</div>
                <div><b>其他工具</b>见其文档的「skills」目录;两个下载是同一份文件,只是名字不同</div>
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
        <div className="inst-h"><span>/</span> 通过 npx 安装 <em className="inst-tag">校验哈希</em></div>
        <div className="inst-cmd"><code className="cli">{npx}</code><CopyBtn text={npx} onCopied={() => trackInstall(id)} /></div>
      </div>

      <div className="inst-m">
        <div className="inst-h"><span>/</span> 通过 bash 安装</div>
        <div className="inst-cmd"><code className="cli">{curl}</code><CopyBtn text={curl} onCopied={() => trackInstall(id)} /></div>
      </div>

      <div className="inst-foot">
        安装器自动探测 agent 目录(.claude / .codex / .cursor …);落盘前逐文件复算 blob sha 校验 <code>content_hash</code>,与货架不一致即拒装 —— 别家 <code>npx</code> 是盲装,这里不是。
      </div>
    </div>
  );
}
