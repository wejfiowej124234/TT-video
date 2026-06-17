#!/usr/bin/env bash
# Order–Escrow–Dispute Deep Audit · ① API + ② Playwright + PG 一致性
#
#   bash scripts/dev/run-order-escrow-dispute-deep-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${OED_OUT:-$ROOT/evidence/order-escrow-dispute-deep-audit/${STAMP}}"
mkdir -p "$OUT"

export OED_API_BASE="${OED_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
export OED_OUT="$OUT"
export OED_PASSWORD="${OED_PASSWORD:-TestPass12!}"
export OED_ADMIN_PASSWORD="${OED_ADMIN_PASSWORD:-Test123!}"
export OED_ARBITRATOR_EMAIL="${OED_ARBITRATOR_EMAIL:-oed-arbitrator-${STAMP}@traveltrust.test}"
export OED_ADMIN_EMAIL="${OED_ADMIN_EMAIL:-tourist@test.com}"
export OED_SKIP_P2_GAPS="${OED_SKIP_P2_GAPS:-1}"

PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then
  command -v python >/dev/null 2>&1 && PY=python || PY=python3
fi

if [[ -z "${P3_SEED_ARBITRATOR_EMAIL:-}" ]]; then
  echo "WARN: P3_SEED_ARBITRATOR_EMAIL 未设 — 须与 arb_email 一致，否则裁决链 FAIL" >&2
fi

echo "arb_email=${OED_ARBITRATOR_EMAIL} (API 须 P3_SEED_ARBITRATOR_EMAIL 对齐)"
echo "admin_email=${OED_ADMIN_EMAIL} (seed promote_admin)"
echo "== Order–Escrow–Dispute Deep Audit · ${STAMP} =="
echo "api=${OED_API_BASE}"
echo "NOTE: F-024 须 API TRAVELTRUST_PUBLIC_CATALOG_SURFACE=0（@traveltrust.test 向导进公开列表）"

health="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${OED_API_BASE}/health" || echo 000)"
if [[ "$health" != "200" ]]; then
  echo "WARN: API ${OED_API_BASE} /health=${health} — 探针可能 FAIL" >&2
fi

arb_check="$("$PY" -c "
import json, os, urllib.request
api=os.environ.get('OED_API_BASE','http://127.0.0.1:8080').rstrip('/')
email=os.environ.get('OED_ARBITRATOR_EMAIL','')
pw=os.environ.get('OED_PASSWORD','Test123!')
body=json.dumps({'email':email,'password':pw,'nickname':'oed-preflight'}).encode()
req=urllib.request.Request(api+'/auth/register', data=body, headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=12) as r:
        j=json.loads(r.read().decode())
        print('PASS' if j.get('role')=='arbitrator' else 'FAIL:register role='+str(j.get('role')))
except Exception as e:
    if hasattr(e,'read'):
        j=json.loads(e.read().decode())
        if j.get('error')=='email_already_registered':
            body2=json.dumps({'email':email,'password':pw}).encode()
            req2=urllib.request.Request(api+'/auth/login', data=body2, headers={'Content-Type':'application/json'}, method='POST')
            with urllib.request.urlopen(req2, timeout=12) as r2:
                j2=json.loads(r2.read().decode())
                print('PASS' if j2.get('role')=='arbitrator' else 'FAIL:login role='+str(j2.get('role')))
        else:
            print('FAIL:'+str(j))
    else:
        print('FAIL:'+str(e))
" 2>/dev/null || echo "FAIL:preflight")"
echo "arbitrator_preflight=${arb_check}"
if [[ "$arb_check" != PASS ]]; then
  echo "ERROR: 裁决员预检失败 — 重启 API: export P3_SEED_ARBITRATOR_EMAIL=${OED_ARBITRATOR_EMAIL}" >&2
  exit 2
fi

set +e
"$PY" "$ROOT/scripts/dev/order-escrow-dispute-deep-audit.py" 2>&1 | tee "$OUT/oed-probe.log"
PROBE_RC=$?
set -e

TRACE_TOK=""
if [[ -f "$OUT/oed-trace.json" ]]; then
  TRACE_TOK="$("$PY" -c "import json; print(json.load(open('$OUT/oed-trace.json',encoding='utf-8')).get('traveler_token',''))" 2>/dev/null || true)"
fi
export OED_TRACE_TRAVELER_TOKEN="$TRACE_TOK"

export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-$OED_API_BASE}"
export PLAYWRIGHT_API_HEALTH_URL="${PLAYWRIGHT_API_HEALTH_URL:-$OED_API_BASE/health}"
export PLAYWRIGHT_ARBITRATOR_SEED_EMAIL="${PLAYWRIGHT_ARBITRATOR_SEED_EMAIL:-$OED_ARBITRATOR_EMAIL}"

PW_RC=0
set +e
(cd "$ROOT/frontend" && npx playwright test e2e/f024-f025-f026-request.spec.ts --grep "F-025|F-026" --project=chromium --reporter=list) \
  2>&1 | tee "$OUT/oed-playwright.log"
PW_RC=$?
set -e

set +e
"$PY" "$ROOT/scripts/dev/oed-phase2-pg-consistency-audit.py" 2>&1 | tee "$OUT/oed-phase2-pg.log"
PG_RC=$?
set -e

export OED_PLAYWRIGHT_RC="$PW_RC"
"$PY" "$ROOT/scripts/dev/oed-write-playwright-result.py"

set +e
"$PY" "$ROOT/scripts/dev/oed-merge-phase2-findings.py"
MERGE_RC=$?
set -e

"$PY" "$ROOT/scripts/dev/generate-oed-deep-audit-report.py" \
  --findings "$OUT/oed-findings.json" \
  --out "$ROOT/docs/runbook/ORDER-ESCROW-DISPUTE-DEEP-AUDIT-REPORT.md"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/order-escrow-dispute-deep-audit/latest" 2>/dev/null || true

VERDICT="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['verdict'])" "$OUT/oed-findings.json")"
echo "OED_DEEP_AUDIT: $VERDICT"
echo "Report: docs/runbook/ORDER-ESCROW-DISPUTE-DEEP-AUDIT-REPORT.md"
echo "Evidence: $OUT"

[[ "$PROBE_RC" -ne 0 || "$PW_RC" -ne 0 || "$PG_RC" -ne 0 || "$MERGE_RC" -ne 0 ]] && exit 1
exit 0
