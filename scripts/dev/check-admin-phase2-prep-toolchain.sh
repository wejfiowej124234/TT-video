#!/usr/bin/env bash
# ① Admin Phase ②  toolchain 自检（不触 Staging · 非 TT_PHASE2_ADMIN_STAGING: PASS）
#
# 确认 ② 收口脚本与 ① 预备脚本在盘；可选跑 L5 绿集。
#   bash scripts/dev/check-admin-phase2-prep-toolchain.sh
#   bash scripts/dev/check-admin-phase2-prep-toolchain.sh --with-l5
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

WITH_L5=0
for arg in "$@"; do
  [[ "$arg" == "--with-l5" ]] && WITH_L5=1
done

required=(
  scripts/dev/.env.staging-admin.example
  scripts/dev/record-phase2-admin-adm-u01-then-u02.sh
  scripts/dev/record-adm-u01-staging-evidence.sh
  scripts/dev/record-adm-u02-staging-evidence.sh
  scripts/dev/run-admin-remaining-local-prep.sh
  scripts/dev/run-admin-adm-u02-local-prep.sh
  scripts/dev/generate-phase2-admin-closure-skeleton.sh
  scripts/dev/run-admin-adm-u01-local-prep.sh
  scripts/gates/validate-phase2-admin-staging-closure.sh
  scripts/gates/merge-phase2-admin-staging-closure.py
)

for f in "${required[@]}"; do
  [[ -f "$REPO_ROOT/$f" ]] || {
    echo "FAIL: missing $f" >&2
    exit 1
  }
done

echo "phase2-admin scripts: OK (${#required[@]} paths)"

if [[ "$WITH_L5" -eq 1 ]]; then
  bash "$REPO_ROOT/scripts/dev/run-admin-l5-green.sh"
fi

echo "TT_ADMIN_PHASE2_PREP_TOOLCHAIN: OK (① check only — set STAGING_* and G-1/G-2 before record-phase2-admin-adm-u01-then-u02.sh)"
