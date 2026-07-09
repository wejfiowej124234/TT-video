#!/usr/bin/env bash
# P2FC · ADM-U01 staging RBAC live 验证前置核查（只读 · 非侵入）
#
# 不 deploy · 不重启 · 不改权限 · MR12 不变 · 保持 P0 bypass CONFIRMED
#
#   bash scripts/ops/p2fc-run-adm-u01-staging-live-prep-readonly.sh
#
# 末行：TT_P2FC_ADM_U01_STAGING_LIVE_PREP: READY|BLOCKED
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
OUT="$SOAK_DIR/web3-system-security-audit"
LOG="$OUT/adm-u01-live-prep.log"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"

mkdir -p "$OUT"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "${ts} adm-u01-live-prep: start" >>"$LOG"

set +e
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-adm-u01-staging-live-prep.py" \
  --soak-dir "$SOAK_DIR" \
  --api-base "$API" \
  --fe-base "$FE" \
  --merge-web3-ssot 2>&1 | tee -a "$LOG"
rc=${PIPESTATUS[0]}
set -e

line="$(grep -E '^TT_P2FC_ADM_U01_STAGING_LIVE_PREP:' "$LOG" | tail -1 || true)"
echo "${ts} adm-u01-live-prep: done rc=${rc} ${line}" >>"$LOG"
exit "$rc"
