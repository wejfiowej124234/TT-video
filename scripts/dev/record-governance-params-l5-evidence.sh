#!/usr/bin/env bash
# ① Governance Params L5 证据：vitest 绿集 + API 烟测
#
# 用法（仓库根）：
#   bash scripts/dev/record-governance-params-l5-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_governance_params_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/GOVERNANCE-PARAMS-L5-${STAMP}.log"
API_PORT="${API_PORT:-8080}"
API_BASE="${API_BASE:-http://127.0.0.1:${API_PORT}}"
export API_BASE

{
  echo "== record-governance-params-l5 ${STAMP} =="
  bash "$ROOT/scripts/dev/smoke-governance-params-l5-local.sh"
} 2>&1 | tee "$RUN_LOG"

echo "TT_GOVERNANCE_PARAMS_L5_EVIDENCE: OK log=${RUN_LOG#"$ROOT"/}"
