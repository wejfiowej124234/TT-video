#!/usr/bin/env bash
# STAGING-API-PARITY-SPRINT — Fly staging API 对齐本地 20260608–20260610 迁移栈
#
#   export HTTPS_PROXY=http://127.0.0.1:15715   # 小地球仪 · 见 PHASE2-STAGING-FRONTEND-HOSTING
#   bash scripts/dev/record-staging-api-parity-sprint-evidence.sh
#
# 步骤：fly deploy → CMS/Growth/Official + acquisition 200 → PHASE2-HUMAN-ACCEPTANCE-SPRINT
# 四角色 ①+② 全 PASS 后自动 TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED
#
# 可选：
#   STAGING_PARITY_SKIP_DEPLOY=1     跳过 fly deploy（仅探针 + HAT）
#   TESTNET_FREEZE_OVERRIDE=1        绕过 TESTNET_STAGING_FREEZE（若存在）
#   P2HA_START_FE=1                  本地 FE 未起时尝试启动
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

EVID="$ROOT/evidence/staging-api-parity-sprint"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/STAGING-API-PARITY-SPRINT-${STAMP}.log"
SPRINT_DIR="$EVID/${STAMP}"
STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"

mkdir -p "$SPRINT_DIR"

# Fly / curl 走本地代理（小地球仪默认 15715）
if [[ -z "${HTTPS_PROXY:-}" && -z "${https_proxy:-}" ]]; then
  if curl -sS -o /dev/null --connect-timeout 2 --max-time 4 -x "http://127.0.0.1:15715" https://api.fly.io 2>/dev/null; then
    export HTTPS_PROXY="http://127.0.0.1:15715"
    export HTTP_PROXY="$HTTPS_PROXY"
    echo "staging-api-parity: using HTTPS_PROXY=$HTTPS_PROXY"
  fi
fi

{
  echo "TT_STAGING_API_PARITY_SPRINT: START ${STAMP}"
  echo "target_api=${STAGING_API}"
  echo "migration_stack: through 20260608120000 (CMS/Growth/Official/Sprint168)"

  echo ""
  echo "== Step A: fly deploy tt-api-staging =="
  if [[ "${STAGING_PARITY_SKIP_DEPLOY:-}" == "1" ]]; then
    echo "SKIP STAGING_PARITY_SKIP_DEPLOY=1"
  else
    phase2_require_staging_deploy_allowed "$ROOT" || exit 3
    export TESTNET_FREEZE_OVERRIDE=1
    bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$SPRINT_DIR/fly-deploy.log"
  fi

  echo ""
  echo "== Step B: staging API parity probe (CMS/Growth/Official + acquisition HTTP 200) =="
  export STAGING_API_BASE="$STAGING_API"
  python "$ROOT/scripts/dev/staging-api-parity-probe.py" 2>&1 | tee "$SPRINT_DIR/parity-probe.log"
  grep -q "TT_STAGING_API_PARITY: PASS" "$SPRINT_DIR/parity-probe.log"

  echo ""
  echo "== Step C: PHASE2-HUMAN-ACCEPTANCE-SPRINT (①+② · 四角色) =="
  export P2HA_STAGING_API="$STAGING_API"
  export P2HA_START_FE="${P2HA_START_FE:-1}"
  bash "$ROOT/scripts/dev/record-phase2-human-acceptance-sprint-evidence.sh" 2>&1 | tee "$SPRINT_DIR/human-acceptance.log"
  grep -q "TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: OK" "$SPRINT_DIR/human-acceptance.log"
  grep -q "TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED" "$SPRINT_DIR/human-acceptance.log"

  echo ""
  echo "TT_STAGING_API_PARITY_SPRINT: OK ${STAMP}"
  echo "TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED ${STAMP}"
  echo "evidence: ${SPRINT_DIR}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_STAGING_API_PARITY_SPRINT: OK" "$RUN_LOG" || exit 1
echo "Log: $RUN_LOG"
exit 0
