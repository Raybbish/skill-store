/**
 * L1/L2 静态扫描规则集 v1。
 * L1 = critical 签名(密钥、pipe-to-shell、混淆执行、破坏性命令)→ 命中即 needs_review
 * L2 = 风险五因子行为模式 → 填充 risk_factors
 *
 * scope 控制规则应用范围:
 *   script  = 脚本文件(.py/.sh/.js 等)
 *   fence   = SKILL.md / 其他 md 的代码块内(指令让 agent 执行的命令)
 *   any     = 所有文本文件
 * md 正文里的普通 http 链接是文档引用,不算 network —— 这是主要的误报来源,刻意排除。
 */

export type RuleScope = "script" | "fence" | "any";
export type Factor = "network" | "filesystem" | "env_access" | "external_commands";

export interface Rule {
  id: string;
  factor?: Factor; // 无 factor 的是 L1 critical 规则
  critical?: boolean;
  scope: RuleScope;
  re: RegExp;
  note: string;
}

export const RULES: Rule[] = [
  // ===== L1 critical =====
  { id: "l1-aws-key", critical: true, scope: "any", re: /\bAKIA[0-9A-Z]{16}\b/, note: "疑似 AWS Access Key" },
  { id: "l1-gh-token", critical: true, scope: "any", re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, note: "疑似 GitHub token" },
  { id: "l1-private-key", critical: true, scope: "any", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, note: "内嵌私钥块" },
  { id: "l1-pipe-shell", critical: true, scope: "any", re: /\b(curl|wget)\b[^\n|]{0,200}\|\s*(ba|z|da)?sh\b/, note: "远程脚本管道执行(curl|bash)" },
  { id: "l1-b64-exec", critical: true, scope: "any", re: /(base64\s+(-d|--decode)[^\n]{0,80}\|\s*(ba|z)?sh|exec\(\s*base64|eval\(\s*atob)/, note: "base64 解码后执行(混淆)" },
  { id: "l1-destructive", critical: true, scope: "any", re: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)[a-z]*\s+(\/|~\/?($|\s))/, note: "破坏性删除(rm -rf / 或 ~)" },
  { id: "l1-cred-paths", critical: true, scope: "any", re: /(\.ssh\/id_[a-z0-9]+|\.aws\/credentials|\.netrc|\.docker\/config\.json)/, note: "引用凭证文件路径" },

  // ===== L2: network =====
  { id: "net-py", factor: "network", scope: "script", re: /\b(requests|httpx|aiohttp|urllib\.request|urllib3|http\.client)\b/, note: "Python HTTP 库" },
  { id: "net-js", factor: "network", scope: "script", re: /\b(fetch\s*\(|axios|XMLHttpRequest|https?\.request|net\.connect|WebSocket\s*\()/, note: "JS 网络调用" },
  { id: "net-socket", factor: "network", scope: "script", re: /\bsocket\s*\.\s*(socket|create_connection)|new\s+Socket\b/, note: "原始 socket 连接" },
  { id: "net-cli", factor: "network", scope: "fence", re: /\b(curl|wget|nc|ncat|ssh|scp|rsync)\s+/, note: "指令要求执行网络命令" },
  { id: "net-cli-script", factor: "network", scope: "script", re: /\b(curl|wget|nc|ncat)\s+/, note: "脚本调用网络命令" },

  // ===== L2: filesystem =====
  { id: "fs-write-py", factor: "filesystem", scope: "script", re: /\bopen\s*\([^)]*['"](w|a|x|wb|ab)\b|shutil\.(copy|move|rmtree)|os\.(remove|unlink|rename|makedirs)/, note: "Python 文件写/删" },
  { id: "fs-write-js", factor: "filesystem", scope: "script", re: /\bfs\.(write|append|unlink|rm|mkdir|cp|rename)/, note: "Node 文件写/删" },
  { id: "fs-escape", factor: "filesystem", scope: "script", re: /(\.\.\/){2,}|(^|["'\s=])(\/etc\/|\/var\/|\/usr\/)/m, note: "访问工作目录外路径" },
  { id: "fs-home", factor: "filesystem", scope: "any", re: /(~\/|\$HOME\/|os\.path\.expanduser|homedir\(\))\s*[^\s]*\.(ssh|aws|gnupg|config|env)/, note: "访问家目录敏感位置" },

  // ===== L2: env_access =====
  { id: "env-py", factor: "env_access", scope: "script", re: /\bos\.(environ|getenv)\b/, note: "Python 读环境变量" },
  { id: "env-js", factor: "env_access", scope: "script", re: /\bprocess\.env\b/, note: "Node 读环境变量" },
  { id: "env-sh", factor: "env_access", scope: "script", re: /\b(printenv|env)\s*($|\||>)|\$\{?(AWS|GITHUB|OPENAI|ANTHROPIC|API)_?[A-Z_]*(KEY|TOKEN|SECRET)/, note: "Shell 导出/引用凭证类环境变量" },

  // ===== L2: external_commands =====
  { id: "cmd-py", factor: "external_commands", scope: "script", re: /\b(subprocess\.(run|call|Popen|check_output)|os\.(system|popen|exec[lv]p?e?))\b/, note: "Python 执行外部命令" },
  { id: "cmd-js", factor: "external_commands", scope: "script", re: /\b(child_process|execSync|spawnSync?|execFile)\b/, note: "Node 执行外部命令" },
  { id: "cmd-osa", factor: "external_commands", scope: "any", re: /\b(osascript|AppleScript|powershell(\.exe)?|reg\s+add)\b/i, note: "系统自动化命令" },
];

export const SCANNER_VERSIONS = { l1: "rules-v1", l2: "static-v1" };
