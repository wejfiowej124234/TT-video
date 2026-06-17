#!/usr/bin/env bash
# C8 证据：社区 staging 运维 Runbook + 监控 smoke（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C8"
RUNBOOK_SRC="$REPO_ROOT/docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
MON_LOG="$EVID/monitoring-check-${STAMP}.log"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
  FE_LOCAL="$REPO_ROOT/frontend/.env.local"
  if [[ -f "$FE_LOCAL" ]]; then
    cp "$FE_LOCAL" "$FE_LOCAL.bak-c8-${STAMP}"
    if grep -qE '^[[:space:]]*NEXT_PUBLIC_API_BASE_URL=' "$FE_LOCAL"; then
      sed -i.bak "s|^[[:space:]]*NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=${API_BASE}|" "$FE_LOCAL" && rm -f "${FE_LOCAL}.bak"
    else
      echo "NEXT_PUBLIC_API_BASE_URL=${API_BASE}" >>"$FE_LOCAL"
    fi
  fi
fi
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_BASE_URL

chmod +x "$REPO_ROOT/scripts/dev/smoke-community-c8-staging-monitoring.sh" 2>/dev/null || true

{
  echo "TT_COMMUNITY_C8_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"
  echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}"

  [[ -f "$RUNBOOK_SRC" ]] || { echo "FAIL: missing $RUNBOOK_SRC"; exit 1; }

  echo "--- C1–C7 evidence STATUS pre-check ---"
  for slot in C1 C2 C3 C4 C5 C6 C7; do
    st="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/${slot}/STATUS.txt"
    grep -q "^status: PASS" "$st" || { echo "FAIL: ${slot} not PASS"; exit 1; }
    echo "OK ${slot} PASS"
  done

  echo "--- staging monitoring smoke ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c8-staging-monitoring.sh" 2>&1 | tee "$MON_LOG"
  grep -q "TT_COMMUNITY_C8_STAGING_MONITORING: OK" "$MON_LOG" || { echo "FAIL: monitoring smoke"; exit 1; }

  echo "--- install runbook.md (from docs SSOT) ---"
  {
    echo "<!-- generated ${STAMP} from docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md -->"
    echo ""
    cat "$RUNBOOK_SRC"
  } > "$EVID/runbook.md"
  grep -q "C8 · Community Staging Ops" "$EVID/runbook.md" || { echo "FAIL: runbook.md incomplete"; exit 1; }

  echo "TT_COMMUNITY_C8_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$MON_LOG")" "$EVID/latest-monitoring-check.log"
cp -f "$RUN_LOG" "$EVID/run.log"
cp -f "$MON_LOG" "$EVID/monitoring-check.log"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C8 (runbook / monitoring / ops)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "runbook: runbook.md"
  echo "monitoring_check: $(basename "$MON_LOG")"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C8 slot PASS only — NOT Phase ② GO / NOT C9-C12 GO / NOT Production GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
