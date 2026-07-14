#!/usr/bin/env bash
# 一次性配置 deploy.yml 所需的 GitHub Actions secrets + 绑域名(2026-07-13,配套 .github/workflows/deploy.yml)。
# 在仓库根运行:bash scripts/setup-deploy-secrets.sh
#
# 做什么:
#   1. 确保 gh CLI 可用并已登录(没装就 brew 装,没登就拉起浏览器登录);
#   2. vercel link 取 orgId/projectId(交互式选既有项目,别新建);
#   3. 从 packages/web/.env.local 抽 4 个 NEXT_PUBLIC_* 值;TYPESENSE_URL 由 NEXT_PUBLIC_TYPESENSE_URL 派生;
#   4. TYPESENSE_ADMIN_KEY:先从 zsh 历史找回,找不到再提示输入(输入不回显);
#   5. VERCEL_TOKEN:提示去 vercel.com/account/settings/tokens 生成后粘贴(不回显);
#   6. gh secret set 全部写入(值不落盘不回显);
#   7. 可选:把 oh-my-skill.com / www 绑到 Vercel 项目,并打印 CF 需要加的 DNS 记录。
#
# 本脚本不含任何密钥,可安心入库;所有值来自本机文件或运行时输入。
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="Raybbish/skill-store"
ENVL="packages/web/.env.local"
say() { printf "\n\033[1m%s\033[0m\n" "$*"; }

[ -f "$ENVL" ] || { echo "✗ 找不到 $ENVL(NEXT_PUBLIC_* 的取值来源),先补齐再跑"; exit 1; }

# ---------- 1) gh ----------
say "① 检查 gh CLI"
if ! command -v gh >/dev/null 2>&1; then
  echo "  未安装,brew 安装中…"
  brew install gh
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "  未登录,拉起浏览器登录(选 GitHub.com → HTTPS → Login with a web browser)"
  gh auth login --hostname github.com --git-protocol https --web
fi
echo "  ✓ gh 就绪"

# ---------- 2) vercel org/project ----------
say "② 取 Vercel orgId / projectId"
if [ ! -f .vercel/project.json ]; then
  echo "  没有 .vercel/project.json,运行 vercel link——**用方向键选既有项目**(oh-my-skill 那个),不要 Create new"
  npx vercel@latest link
fi
ORG_ID=$(node -p "require('./.vercel/project.json').orgId")
PROJECT_ID=$(node -p "require('./.vercel/project.json').projectId")
echo "  ✓ orgId=${ORG_ID:0:8}… projectId=${PROJECT_ID:0:8}…"

# ---------- 3) .env.local 取值 ----------
say "③ 从 $ENVL 取 NEXT_PUBLIC_*"
envval() { grep -E "^$1=" "$ENVL" | head -1 | cut -d= -f2- | sed 's/^"//; s/"$//'; }
SB_URL=$(envval NEXT_PUBLIC_SUPABASE_URL)
SB_KEY=$(envval NEXT_PUBLIC_SUPABASE_ANON_KEY)
TS_PUB_URL=$(envval NEXT_PUBLIC_TYPESENSE_URL)
TS_PUB_KEY=$(envval NEXT_PUBLIC_TYPESENSE_SEARCH_KEY)
[ -n "$SB_URL" ] && [ -n "$SB_KEY" ] || { echo "✗ .env.local 缺 Supabase 两件,拒绝继续(缺了线上静默丢登录)"; exit 1; }
echo "  ✓ Supabase 两件在手;Typesense 浏览器侧 $([ -n "$TS_PUB_URL" ] && echo 在手 || echo 缺失,将跳过)"

# ---------- 4) Typesense admin key ----------
say "④ TYPESENSE_ADMIN_KEY(推索引用,search-only key 不行)"
TS_ADMIN=""
HIST="${HOME}/.zsh_history"
if [ -f "$HIST" ]; then
  TS_ADMIN=$(grep -ao "TYPESENSE_ADMIN_KEY=[A-Za-z0-9_-]*" "$HIST" | tail -1 | cut -d= -f2 || true)
fi
if [ -n "$TS_ADMIN" ]; then
  echo "  从 zsh 历史找回一枚(尾 4 位 …${TS_ADMIN: -4})。回车确认使用,或输入新值覆盖:"
  read -r -s INPUT || true
  [ -n "${INPUT:-}" ] && TS_ADMIN="$INPUT"
else
  echo "  历史里没有。去 Typesense Cloud 控制台(cloud.typesense.org → 集群 → API Keys → Admin)复制后粘贴(不回显);直接回车 = 跳过搜索推送:"
  read -r -s TS_ADMIN || true
fi

# ---------- 5) Vercel token ----------
say "⑤ VERCEL_TOKEN"
echo "  打开 https://vercel.com/account/settings/tokens → Create,Scope 选你的账号,过期按需 → 复制粘贴到这里(不回显):"
read -r -s VERCEL_TOKEN
[ -n "$VERCEL_TOKEN" ] || { echo "✗ 空 token,退出"; exit 1; }

# ---------- 6) 写 secrets ----------
say "⑥ 写入 GitHub Actions secrets → $REPO"
# ⚠ 不要用 --body -:gh 会把 "-" 当字面值存进去(2026-07-13 全场事故根因——九个 secret 全被写成减号,
#   排障两小时;fingerprint sha256("-")=3973e022e932 定案)。不带 --body 时 gh 默认读 stdin,这才是管道写法。
setsec() { [ -n "$2" ] && printf %s "$2" | gh secret set "$1" --repo "$REPO" && echo "  ✓ $1" || echo "  – 跳过 $1(无值)"; }
setsec VERCEL_TOKEN "$VERCEL_TOKEN"
setsec VERCEL_ORG_ID "$ORG_ID"
setsec VERCEL_PROJECT_ID "$PROJECT_ID"
setsec NEXT_PUBLIC_SUPABASE_URL "$SB_URL"
setsec NEXT_PUBLIC_SUPABASE_ANON_KEY "$SB_KEY"
setsec NEXT_PUBLIC_TYPESENSE_URL "$TS_PUB_URL"
setsec NEXT_PUBLIC_TYPESENSE_SEARCH_KEY "$TS_PUB_KEY"
setsec TYPESENSE_URL "$TS_PUB_URL"
setsec TYPESENSE_ADMIN_KEY "$TS_ADMIN"

# ---------- 7) 绑域名(可选) ----------
say "⑦ 绑 oh-my-skill.com 到 Vercel 项目?(y/N)"
read -r BIND || true
if [ "${BIND:-n}" = "y" ] || [ "${BIND:-n}" = "Y" ]; then
  for d in oh-my-skill.com www.oh-my-skill.com; do
    code=$(curl -s -o /tmp/vercel-domain.json -w "%{http_code}" -X POST \
      "https://api.vercel.com/v10/projects/${PROJECT_ID}/domains?teamId=${ORG_ID}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" -H "Content-Type: application/json" \
      -d "{\"name\":\"$d\"}")
    case "$code" in
      200|201) echo "  ✓ $d 已挂到项目";;
      409) echo "  ✓ $d 已存在(之前挂过)";;
      *) echo "  ⚠ $d 失败 HTTP $code:$(cat /tmp/vercel-domain.json)";;
    esac
  done
  cat <<'DNS'

  最后一步(手动,Cloudflare DNS,记录用「仅 DNS/灰云」):
    @    A      76.76.21.21
    www  CNAME  cname.vercel-dns.com
  生效后 Vercel 项目 Settings → Domains 会自动转绿。
DNS
fi

say "完成。验收:合并 PR 后跑 → gh workflow run 'Deploy Web' --repo $REPO && gh run watch --repo $REPO"
