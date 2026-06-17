#!/usr/bin/env bash
# AI_PRE_HUMAN_UAT_CHECK · Cert #1 前 Playwright + API + 链读预验收（② only）
#
#   bash scripts/dev/run-ai-pre-human-uat-check.sh
#   bash scripts/dev/run-ai-pre-human-uat-check.sh --skip-playwright
#
# 产出：evidence/GO_ai_pre_human_uat/<stamp>/AI-PRE-HUMAN-UAT-REPORT.md
# PASS 后 Owner 才做最少必要真人录屏 → complete-ttg-cert-step.sh --cert 1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SKIP_PLAY=0
for arg in "$@"; do
  case "$arg" in
    --skip-playwright) SKIP_PLAY=1 ;;
    *) echo "unknown arg $arg" >&2; exit 2 ;;
  esac
done

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_ai_pre_human_uat/${STAMP}"
mkdir -p "$EVID/screenshots"
LOG="$EVID/run.log"
: >"$LOG"

fail() { echo "AI_PRE_HUMAN_UAT: FAIL $*" | tee -a "$LOG" >&2; exit 2; }
step() { echo "AI_PRE_HUMAN_UAT_STEP: $*" | tee -a "$LOG"; }
ok() { echo "AI_PRE_HUMAN_UAT: $*" | tee -a "$LOG"; }

FE_BASE="${HAT_R1_FRONTEND_BASE:-http://127.0.0.1:3012}"
API_BASE="${API_BASE:-http://127.0.0.1:8080}"

step "0 · GovFreeze V2 active baseline gate (read-only)"
bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >>"$LOG" 2>&1 || fail "baseline gate"

step "1 · API + chain-read probe"
python "$ROOT/scripts/dev/ai-pre-human-uat-probe.py" \
  --evidence-dir "$EVID" \
  --api-base "$API_BASE" >>"$LOG" 2>&1 || fail "api-chain probe"

step "2 · Playwright · four personas"
if [[ "$SKIP_PLAY" == "1" ]]; then
  ok "SKIP playwright (--skip-playwright)"
  echo '{"checks":[],"skipped":true}' >"$EVID/playwright-checks.json"
elif ! curl -sf -o /dev/null "${FE_BASE}/governance" 2>/dev/null; then
  fail "frontend not reachable at ${FE_BASE}"
elif ! curl -sf -o /dev/null "${API_BASE}/health" 2>/dev/null; then
  fail "API not reachable at ${API_BASE}/health"
else
  (
    cd "$ROOT/frontend"
    export AI_PRE_HUMAN_UAT_EVID_DIR="$EVID"
    export PLAYWRIGHT_BASE_URL="$FE_BASE"
    export PLAYWRIGHT_API_BASE_URL="$API_BASE"
    export PLAYWRIGHT_REUSE_FE_SERVER=1
    export PLAYWRIGHT_REUSE_API_SERVER=1
    export PLAYWRIGHT_FULL_STACK=0
    npx playwright test e2e/ai-pre-human-uat-governance.spec.ts \
      --project=chromium \
      --workers=1 \
      --retries=0
  ) >>"$LOG" 2>&1 || fail "playwright ai-pre-human-uat"
fi

step "3 · L1 screenshot pack (browser-acceptance routes)"
if [[ "$SKIP_PLAY" != "1" ]] && curl -sf -o /dev/null "${FE_BASE}/governance" 2>/dev/null; then
  node "$ROOT/scripts/dev/capture-hat-r1-screenshots.mjs" \
    --mode=browser-acceptance \
    --out="$EVID/screenshots-l1" \
    --base="$FE_BASE" >>"$LOG" 2>&1 || ok "WARN l1 capture partial"
fi

step "4 · Generate report + PASS gate"
python "$ROOT/scripts/dev/generate-ai-pre-human-uat-report.py" \
  --evidence-dir "$EVID" \
  --stamp "$STAMP" >>"$LOG" 2>&1 || fail "report generation"

echo "$STAMP" >"$ROOT/evidence/GO_ai_pre_human_uat/latest-stamp.txt"
VERDICT="$(python -c "import json; print(json.load(open('${EVID}/AI-PRE-HUMAN-UAT-PASS.json', encoding='utf-8'))['verdict'])")"
ok "verdict=${VERDICT} evidence=${EVID}"
echo "AI_PRE_HUMAN_UAT: ${VERDICT} stamp=${STAMP}"
[[ "$VERDICT" == "PASS" ]] || exit 3
exit 0
