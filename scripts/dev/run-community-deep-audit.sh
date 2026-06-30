#!/usr/bin/env bash
# Community Deep Audit · ① API + ② Playwright + PG 一致性
#
#   bash scripts/dev/run-community-deep-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${CDA_OUT:-$ROOT/evidence/community-deep-audit/${STAMP}}"
mkdir -p "$OUT"

export CDA_API_BASE="${CDA_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
export CDA_OUT="$OUT"
export CDA_PASSWORD="${CDA_PASSWORD:-Test123!}"
export CDA_ADMIN_PASSWORD="${CDA_ADMIN_PASSWORD:-Test123!}"
export CDA_ADMIN_EMAIL="${CDA_ADMIN_EMAIL:-tourist@test.com}"
export CDA_ADMIN_EMAIL="${CDA_ADMIN_EMAIL:-tourist@test.com}"
export CDA_SKIP_P2_GAPS="${CDA_SKIP_P2_GAPS:-1}"

# ① 本地：C2 SuperAdmin 种子 · ② staging 深审可设 CDA_USE_P2FC_ADMIN=1
if [[ "${CDA_USE_P2FC_ADMIN:-0}" == "1" ]]; then
  # shellcheck source=scripts/dev/lib/p2fc-audit-admin-prep.sh
  source "$ROOT/scripts/dev/lib/p2fc-audit-admin-prep.sh"
fi

PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then
  command -v python >/dev/null 2>&1 && PY=python || PY=python3
fi

echo "admin_email=${CDA_ADMIN_EMAIL} (seed promote_admin)"
echo "== Community Deep Audit · ${STAMP} =="
echo "api=${CDA_API_BASE}"
echo "NOTE: 生产 Feed 探针使用 @example.com 作者；@traveltrust.test 为 test data_origin"

health="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${CDA_API_BASE}/health" || echo 000)"
if [[ "$health" != "200" ]]; then
  echo "WARN: API ${CDA_API_BASE} /health=${health} — 探针可能 FAIL" >&2
fi

set +e
"$PY" "$ROOT/scripts/dev/community-deep-audit.py" 2>&1 | tee "$OUT/cda-probe.log"
PROBE_RC=$?
set -e

TRACE_AUTH=""
TRACE_ENG=""
if [[ -f "$OUT/cda-trace.json" ]]; then
  TRACE_AUTH="$("$PY" -c "import json; print(json.load(open('$OUT/cda-trace.json',encoding='utf-8')).get('author_token',''))" 2>/dev/null || true)"
  TRACE_ENG="$("$PY" -c "import json; print(json.load(open('$OUT/cda-trace.json',encoding='utf-8')).get('engager_token',''))" 2>/dev/null || true)"
fi
export CDA_TRACE_AUTHOR_TOKEN="$TRACE_AUTH"
export CDA_TRACE_ENGAGER_TOKEN="$TRACE_ENG"

export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-$CDA_API_BASE}"
export PLAYWRIGHT_API_HEALTH_URL="${PLAYWRIGHT_API_HEALTH_URL:-$CDA_API_BASE/health}"

PW_RC=0
if [[ "${CDA_SKIP_PLAYWRIGHT:-0}" == "1" ]]; then
  echo "CDA: SKIP Playwright (CDA_SKIP_PLAYWRIGHT=1)" | tee "$OUT/cda-playwright.log"
else
set +e
(cd "$ROOT/frontend" && npx playwright test \
  e2e/f015-f016-f017-request.spec.ts \
  e2e/f018-f019-f020-request.spec.ts \
  --grep "F-015|F-016|F-017|F-018|F-019" \
  --project=chromium \
  --reporter=list) 2>&1 | tee "$OUT/cda-playwright.log"
PW_RC=$?
set -e
fi

set +e
"$PY" "$ROOT/scripts/dev/community-phase2-pg-consistency-audit.py" 2>&1 | tee "$OUT/cda-phase2-pg.log"
PG_RC=$?
set -e

export CDA_PLAYWRIGHT_RC="$PW_RC"
"$PY" "$ROOT/scripts/dev/community-write-playwright-result.py"

set +e
"$PY" "$ROOT/scripts/dev/community-merge-phase2-findings.py"
MERGE_RC=$?
set -e

"$PY" "$ROOT/scripts/dev/generate-community-deep-audit-report.py" \
  --findings "$OUT/cda-findings.json" \
  --out "$ROOT/docs/runbook/COMMUNITY-DEEP-AUDIT-REPORT.md"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/community-deep-audit/latest" 2>/dev/null || true

VERDICT="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['verdict'])" "$OUT/cda-findings.json")"
echo "CDA_DEEP_AUDIT: $VERDICT"
echo "Report: docs/runbook/COMMUNITY-DEEP-AUDIT-REPORT.md"
echo "Evidence: $OUT"

[[ "$PROBE_RC" -ne 0 || "$PW_RC" -ne 0 || "$PG_RC" -ne 0 || "$MERGE_RC" -ne 0 ]] && exit 1
exit 0
