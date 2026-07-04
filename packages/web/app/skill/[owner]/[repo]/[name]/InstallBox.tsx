"use client";
import { useState } from "react";
import type { Skill } from "@/lib/skill-types";

// CLI / 下载 / 安装脚本的 base 域名 —— 正式域名替换处
const HOST = "https://oh-my-skill.dev";

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="cp"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
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
 *   - npx / bash 装前显示权限营养标签、装时校验 content_hash(别家盲装,这里不是)
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
        <div className="inst-h"><span>/</span> 下载</div>
        {hasMirror ? (
          <div className="inst-cmd">
            <code className="inst-file">{leaf}.zip</code>
            <span className="inst-note">含 skill-report.json + content_hash,可离线手动校验</span>
            <a className="cp" href={`${HOST}/dl/${id}.zip`}>↓ 下载</a>
          </div>
        ) : (
          <div className="inst-cmd">
            <a className="inst-url" href={upstream} target="_blank" rel="noopener noreferrer">{upstream}<span style={{ whiteSpace: "nowrap" }}> ↗</span></a>
          </div>
        )}
      </div>

      <div className="inst-m">
        <div className="inst-h"><span>/</span> 通过 npx 安装 <em className="inst-tag">装前看权限标签 · 校验哈希</em></div>
        <div className="inst-cmd"><code className="cli">{npx}</code><CopyBtn text={npx} /></div>
      </div>

      <div className="inst-m">
        <div className="inst-h"><span>/</span> 通过 bash 安装</div>
        <div className="inst-cmd"><code className="cli">{curl}</code><CopyBtn text={curl} /></div>
      </div>

      <div className="inst-foot">
        安装器自动探测 agent 目录(.claude / .codex / .cursor …);落盘前逐文件复算 blob sha 校验 <code>content_hash</code>,与货架不一致即拒装 —— 别家 <code>npx</code> 是盲装,这里不是。
      </div>
    </div>
  );
}
