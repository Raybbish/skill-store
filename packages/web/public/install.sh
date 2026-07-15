#!/usr/bin/env bash
# oh-my-skill 安装引导。用法:
#   curl -fsSL https://oh-my-skill.com/install.sh | bash -s -- <owner/repo/name> [CLI 参数]
#
# Agent/scope 解析与 content_hash 校验的真实逻辑在 CLI(packages/cli)里。
# 这里只做引导,让 curl 入口与 npx 入口走同一个安装器。
set -euo pipefail

ID="${1:-}"
if [ -z "$ID" ]; then
  echo "用法: curl -fsSL https://oh-my-skill.com/install.sh | bash -s -- <owner/repo/name> [--agent <id>] [--scope user|project]" >&2
  exit 1
fi
shift

if ! command -v npx >/dev/null 2>&1; then
  echo "需要 Node.js(提供 npx)。安装后重试:https://nodejs.org" >&2
  exit 1
fi

exec npx -y oh-my-skill add "$ID" "$@"
