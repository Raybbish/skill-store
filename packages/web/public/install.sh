#!/usr/bin/env bash
# oh-my-skill 安装引导。用法:
#   curl -fsSL https://oh-my-skill.dev/install.sh | bash -s -- <owner/repo/name>
#
# 「装前权限营养标签 + content_hash 校验」的真实逻辑在 CLI(packages/cli)里。
# 这里只做引导,让 curl 入口与 npx 入口走同一个经过校验的安装器 —— 不重复实现、更不盲装。
set -euo pipefail

ID="${1:-}"
if [ -z "$ID" ]; then
  echo "用法: curl -fsSL https://oh-my-skill.dev/install.sh | bash -s -- <owner/repo/name>" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "需要 Node.js(提供 npx)。安装后重试:https://nodejs.org" >&2
  exit 1
fi

exec npx -y oh-my-skill add "$ID"
