#!/usr/bin/env bash
# SUPERSEDED · Phase ② · Testnet Perfect Validation orchestrator (evidence only · NO-GO safe)
#
# **毕业序 SSOT：** `scripts/dev/run-phase2-graduation-closure-program.sh`
# TESTNET_STAGING_FREEZE ACTIVE 时默认 exit 2 · Owner 取证：`LEGACY_ORCHESTRATOR_OK=1`
#
#   bash scripts/dev/run-testnet-perfect-validation-orchestrator.sh
#
# 诚实边界：mock-pay sprint ≠ 真 PSP；ADM-U01 须 STAGING_DATABASE_URL 网内可达。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-legacy-orchestrator-guard.sh
source "$ROOT/scripts/dev/lib/phase2-legacy-orchestrator-guard.sh"
phase2_legacy_orchestrator_guard "$ROOT" "$(basename "$0")" || exit $?

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/orchestrator-${STAMP}.log"

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
FE="${FE%/}"

exec > >(tee -a "$LOG") 2>&1

echo "TT_TESTNET_PERFECT_VALIDATION: START ${STAMP}"
echo "api=${API} fe=${FE}"

P0=0
P1=0

echo "=== probe health ==="
hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${API}/health" || echo 000)"
[[ "$hc" == "200" ]] || { echo "FAIL health=$hc"; P0=$((P0 + 1)); }

echo "=== P2Exec sprint S01-S10 ==="
SPR_EVID="frontend/evidence/GO_phase2_testnet_execution_sprint/steps-${STAMP}"
if STAGING_API_BASE="$API" P2EXEC_EVID_ROOT="$ROOT/$SPR_EVID" bash "$ROOT/scripts/dev/smoke-phase2-testnet-execution-sprint.sh"; then
  echo "P2EXEC: PASS"
else
  echo "P2EXEC: FAIL"
  P0=$((P0 + 1))
fi

echo "=== six-domain UAT ==="
UAT_OUT="$ROOT/evidence/staging-uat-six-domains/${STAMP}"
if STAGING_UAT_OUT="$UAT_OUT" STAGING_API_BASE="$API" STAGING_WEB_BASE="$FE" \
  bash "$ROOT/scripts/dev/run-staging-uat-six-domains.sh"; then
  echo "UAT: PASS"
else
  echo "UAT: FAIL"
  P0=$((P0 + 1))
fi

ADM_VERDICT="SKIP"
if [[ -n "${STAGING_DATABASE_URL:-}" ]]; then
  echo "=== ADM-U01 (requires reachable STAGING_DATABASE_URL) ==="
  export STAGING_API_BASE="$API"
  export STAGING_FE_BASE="$FE"
  export ADM_U01_REQUIRE_PERSISTENT_HOST=1
  export ADM_U01_STRICT=1
  if bash "$ROOT/scripts/dev/record-adm-u01-staging-evidence.sh"; then
    ADM_VERDICT="PASS"
  else
    ADM_VERDICT="FAIL"
    P0=$((P0 + 1))
  fi
else
  echo "ADM-U01: SKIP (STAGING_DATABASE_URL unset)"
  P0=$((P0 + 1))
fi

node "$ROOT/scripts/dev/gen-testnet-perfect-validation-report.mjs" \
  --stamp "$STAMP" \
  --evid-dir "$EVID" \
  --p2exec-dir "$ROOT/$SPR_EVID" \
  --uat-dir "$UAT_OUT" \
  --adm-verdict "$ADM_VERDICT" \
  --open-p0 "$P0" \
  --open-p1 "${OPEN_TESTNET_P1_COUNT:-10}"

if [[ "$P0" -eq 0 && "${OPEN_TESTNET_P1_COUNT:-10}" -eq 0 ]]; then
  echo "TT_TESTNET_PERFECT_VALIDATION_GO: GO"
  exit 0
fi

echo "TT_TESTNET_PERFECT_VALIDATION_GO: NO-GO (open_p0=${P0})"
exit 1
