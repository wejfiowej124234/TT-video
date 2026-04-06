#!/usr/bin/env bash
# 依赖安全审计（发版前建议执行）：前端 npm audit、后端 cargo audit
# 用法：在仓库根执行 ./scripts/audit-deps.sh
# Windows：.\scripts\audit-deps.ps1（委托本脚本；须 **Git Bash**）
# 可选：npm audit 可用 --audit-level=high 仅在高危时失败；cargo audit 需安装 cargo-audit

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

failures=0

# 前端（优先 pnpm，否则 npm）
if [[ -d frontend ]] && [[ -f frontend/package.json ]]; then
  echo "== frontend: audit =="
  run_audit() {
    (cd frontend && "$@" audit 2>/dev/null)
  }
  if command -v pnpm >/dev/null 2>&1 && run_audit pnpm; then
    echo "OK: frontend pnpm audit passed"
  elif run_audit npm; then
    echo "OK: frontend npm audit passed"
  else
    echo "WARN or FAIL: frontend audit found issues (或未安装 pnpm/npm)" >&2
    failures=$((failures + 1))
  fi
fi

# 后端（cargo-audit 可能未安装）
if command -v cargo-audit >/dev/null 2>&1; then
  echo "== workspace: cargo audit =="
  if cargo audit 2>/dev/null; then
    echo "OK: cargo audit passed"
  else
    echo "WARN or FAIL: cargo audit found issues" >&2
    failures=$((failures + 1))
  fi
else
  echo "SKIP: cargo-audit 未安装（可选：cargo install cargo-audit）"
fi

if [[ $failures -gt 0 ]]; then
  echo "audit-deps: $failures check(s) reported issues" >&2
  exit 1
fi
echo "audit-deps: all checks passed"
exit 0
