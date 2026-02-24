#!/usr/bin/env bash
# Deterministic build verifier (05 §7.7 / 08-4 第 7 章, W-Q6-FE)
# Goal: 同 commit + 同 Node/锁 + 同构建 → 产物 manifest hash 一致。
#
# 用法：scripts/verify-frontend-deterministic-build.sh
# 要求：frontend/ 存在且已安装依赖（pnpm install）；需 node、pnpm 或 npm。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d "frontend" ] || [ ! -f "frontend/package.json" ]; then
  echo "ERR: frontend/ 或 frontend/package.json 不存在。"
  exit 2
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERR: node 未安装，无法验证前端 deterministic build。"
  exit 2
fi

if ! command -v sha256sum >/dev/null 2>&1; then
  echo "ERR: 缺少 sha256sum（用于生成 manifest.sha256），请在 Git Bash / WSL 环境运行。"
  exit 2
fi

tmp1="$(mktemp -d 2>/dev/null || true)"
tmp2="$(mktemp -d 2>/dev/null || true)"
if [ -z "$tmp1" ] || [ -z "$tmp2" ] || [ ! -d "$tmp1" ] || [ ! -d "$tmp2" ]; then
  echo "ERR: mktemp 不可用；请在支持 mktemp 的 shell 运行（Git Bash/WSL）。"
  exit 2
fi

cleanup() {
  rm -rf "$tmp1" "$tmp2" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# 复制 frontend 到两个临时目录，分别构建，再对产物目录生成 manifest 并对比
cp -r frontend "$tmp1/" && cp -r frontend "$tmp2/"

echo "== build #1 =="
(cd "$tmp1/frontend" && (pnpm install --frozen-lockfile 2>/dev/null || npm ci 2>/dev/null || true) && (pnpm run build 2>/dev/null || npm run build 2>/dev/null)) || true
[ -d "$tmp1/frontend/.next" ] && "$ROOT/scripts/build-frontend-manifest.sh" "$tmp1/frontend/.next" >/dev/null 2>&1 || true

echo "== build #2 =="
(cd "$tmp2/frontend" && (pnpm install --frozen-lockfile 2>/dev/null || npm ci 2>/dev/null || true) && (pnpm run build 2>/dev/null || npm run build 2>/dev/null)) || true
[ -d "$tmp2/frontend/.next" ] && "$ROOT/scripts/build-frontend-manifest.sh" "$tmp2/frontend/.next" >/dev/null 2>&1 || true

# manifest 写在各自传入的目录（.next）下
m1="$tmp1/frontend/.next/manifest.sha256"
m2="$tmp2/frontend/.next/manifest.sha256"
[ -f "$m1" ] || echo "" > "$m1"
[ -f "$m2" ] || echo "" > "$m2"
sha1="$(cat "$m1" 2>/dev/null | tr -d '\r\n')"
sha2="$(cat "$m2" 2>/dev/null | tr -d '\r\n')"

echo "build1 manifest.sha256=$sha1"
echo "build2 manifest.sha256=$sha2"

if [ -n "$sha1" ] && [ "$sha1" = "$sha2" ]; then
  echo "OK: deterministic build verified (same commit => same manifest hash)"
  exit 0
fi

echo "FAIL or SKIP: manifest hash differs or missing; ensure frontend build completes and lockfile is pinned."
echo "Hint: 检查 Node 版本、pnpm-lock.yaml/package-lock.json、next 版本与构建参数是否漂移。"
exit 1
