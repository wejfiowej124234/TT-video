#!/usr/bin/env bash
# ① Steward Workbench L5 证据：vitest 绿集 + API 烟测
#
# 用法（仓库根）：
#   bash scripts/dev/record-steward-workbench-l5-evidence.sh
#   TRAVELTRUST_EVIDENCE_REUSE_API=1 bash scripts/dev/record-steward-workbench-l5-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_steward_workbench_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/STEWARD-WORKBENCH-L5-${STAMP}.log"
API_PORT="${API_PORT:-8080}"
API_BASE="${API_BASE:-http://127.0.0.1:${API_PORT}}"
export API_BASE

{
  echo "== record-steward-workbench-l5 ${STAMP} =="
  bash "$ROOT/scripts/dev/smoke-steward-workbench-l5-local.sh"
} 2>&1 | tee "$RUN_LOG"

echo "TT_STEWARD_WORKBENCH_L5_EVIDENCE: OK log=${RUN_LOG#"$ROOT"/}"
