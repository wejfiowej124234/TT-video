#!/usr/bin/env bash
# 96-18 / 批次 M — Next.js **`npm run build`**（发版前 / 大改 **`/me/onboarding`** 后建议跑）。
#
# Usage（仓库根）:
#   bash scripts/gates/check-frontend-npm-build.sh
#
# Env:
#   STRICT_FRONTEND_BUILD=1 — 未找到 **node** 或 **npm** 时 **exit 1**（CI 显式要求前端构建时用）。
#   默认（未设 **STRICT_FRONTEND_BUILD**）：无 **node** 时 **exit 0** 并 **stderr** 提示 **skip**（不阻塞仅跑 Rust 的环境）。
#
# 与 **scripts/README.md**、**TT-9618** 一键证据：`CHECK_FRONTEND_NPM_BUILD=1` 串入 **`tt-9618-onboarding-pg-evidence.sh`** 尾段（须先有 **node**）。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f frontend/package.json ]]; then
  echo "check-frontend-npm-build: missing frontend/package.json" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  if [[ "${STRICT_FRONTEND_BUILD:-0}" =~ ^(1|true|yes)$ ]]; then
    echo "check-frontend-npm-build: node or npm not found; STRICT_FRONTEND_BUILD=1 → fail" >&2
    exit 1
  fi
  echo "check-frontend-npm-build: skip (no node/npm on PATH)" >&2
  exit 0
fi

(
  cd frontend
  npm run build
)

echo "check-frontend-npm-build: OK"
