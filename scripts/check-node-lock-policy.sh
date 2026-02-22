#!/usr/bin/env bash
# Node.js 依赖供应链门禁（当前仓库前端为纯 Rust/Trunk；若未来引入 Node 工具链必须过此门禁）
# 规则：
# - 发现 package.json 时，必须同时存在锁文件（pnpm-lock.yaml / yarn.lock / package-lock.json 其一）。
# - package.json 中的依赖版本不得使用 ^ 或 ~（禁止自动漂移升级）。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pkg_files="$(find . -name package.json -not -path "./target/*" -not -path "./.git/*" 2>/dev/null || true)"

if [ -z "$pkg_files" ]; then
  echo "OK: no package.json found"
  exit 0
fi

failures=0
while IFS= read -r pkg; do
  dir="$(dirname "$pkg")"
  lock_ok=0
  for lock in pnpm-lock.yaml yarn.lock package-lock.json; do
    if [ -f "$dir/$lock" ]; then
      lock_ok=1
      break
    fi
  done
  if [ "$lock_ok" -ne 1 ]; then
    echo "FAIL: $pkg found but no lockfile in $dir (need pnpm-lock.yaml/yarn.lock/package-lock.json)" >&2
    failures=$((failures+1))
  fi

  if grep -qE '"(dependencies|devDependencies|optionalDependencies|peerDependencies)"' "$pkg"; then
    if grep -qE '"[^\"]+"[[:space:]]*:[[:space:]]*"[\^~]' "$pkg"; then
      echo "FAIL: $pkg contains ^ or ~ ranges; use pinned versions" >&2
      failures=$((failures+1))
    fi
  fi

done <<< "$pkg_files"

if [ "$failures" -gt 0 ]; then
  echo "FAIL: node lock policy failed ($failures issue(s))" >&2
  exit 1
fi

echo "OK: node lock policy passed"
