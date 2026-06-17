#!/usr/bin/env bash
# C11 证据：社区 04 路由闸 · staging 对拍（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
REPO_WIN="$(pwd -W 2>/dev/null || pwd)"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C11"
EVID_WIN="$REPO_WIN/evidence/GO_phase2_testnet_20260526/community/C11"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_BASE_URL

chmod +x "$REPO_ROOT/scripts/dev/smoke-community-c11-staging-route-gate.sh" 2>/dev/null || true

{
  echo "TT_COMMUNITY_C11_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"
  echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}"

  export C11_STAGING_EVIDENCE_OUT="$EVID"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c11-staging-route-gate.sh"

  test -f "$EVID/route-gate-report.json" || { echo "FAIL: route-gate-report.json missing"; exit 1; }
  grep -q '"verdict": "PASS"' "$EVID/route-gate-report.json" || { echo "FAIL: report verdict not PASS"; exit 1; }

  python "$REPO_ROOT/scripts/gen-community-c11-route-gate-summary.py" \
    --evidence-dir "$EVID" \
    --stamp "$STAMP"

  grep -q "C11 slot verdict" "$EVID/route-gate-summary.md" || { echo "FAIL: summary incomplete"; exit 1; }

  echo "TT_COMMUNITY_C11_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
cp -f "$RUN_LOG" "$EVID/run.log"

PROBE_PASS="$(python -c "import json; j=json.load(open(r'$EVID_WIN/route-gate-report.json', encoding='utf-8')); p=j.get('staging_api_probes',[]); print(f\"{sum(1 for x in p if x.get('ok'))}/{len(p)}\")")"
BROWSER_PASS="$(python -c "import json; j=json.load(open(r'$EVID_WIN/route-gate-report.json', encoding='utf-8')); b=j.get('browser_route_probes') or {}; print(f\"{b.get('passed',0)}/{b.get('total',0)}\")")"
REPORT_VERDICT="$(python -c "import json; print(json.load(open(r'$EVID_WIN/route-gate-report.json', encoding='utf-8')).get('verdict','FAIL'))")"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C11 (route gate / 04 routes staging reconciliation)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "route_gate_report: route-gate-report.json"
  echo "route_gate_summary: route-gate-summary.md"
  echo "staging_api_probes: ${PROBE_PASS}"
  echo "browser_routes: ${BROWSER_PASS}"
  echo "report_verdict: ${REPORT_VERDICT}"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C11 slot PASS only — NOT Phase ② GO / NOT C12 GO / NOT Production GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
