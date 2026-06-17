#!/usr/bin/env bash
# Identity–Trust–Governance Deep Audit · ① API + ② Playwright + PG 一致性
#
#   bash scripts/dev/run-identity-trust-governance-deep-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${ITG_OUT:-$ROOT/evidence/identity-trust-governance-deep-audit/${STAMP}}"
mkdir -p "$OUT"

export ITG_API_BASE="${ITG_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
export ITG_OUT="$OUT"
export ITG_PASSWORD="${ITG_PASSWORD:-TestPass12!}"
export ITG_ADMIN_PASSWORD="${ITG_ADMIN_PASSWORD:-Test123!}"
export ITG_ADMIN_EMAIL="${ITG_ADMIN_EMAIL:-tourist@test.com}"
export ITG_SKIP_P2_GAPS="${ITG_SKIP_P2_GAPS:-1}"

PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then
  command -v python >/dev/null 2>&1 && PY=python || PY=python3
fi

echo "admin_email=${ITG_ADMIN_EMAIL} (seed promote_admin)"
echo "== Identity–Trust–Governance Deep Audit · ${STAMP} =="
echo "api=${ITG_API_BASE}"
echo "NOTE: 治理种子须 API SEED_TEST_ACCOUNTS=1；trust-growth 须 DATABASE_URL"

health="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${ITG_API_BASE}/health" || echo 000)"
if [[ "$health" != "200" ]]; then
  echo "WARN: API ${ITG_API_BASE} /health=${health} — 探针可能 FAIL" >&2
fi

set +e
"$PY" "$ROOT/scripts/dev/identity-trust-governance-deep-audit.py" 2>&1 | tee "$OUT/itg-probe.log"
PROBE_RC=$?
set -e

export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-$ITG_API_BASE}"
export PLAYWRIGHT_API_HEALTH_URL="${PLAYWRIGHT_API_HEALTH_URL:-$ITG_API_BASE/health}"
export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"

PW_RC=0
set +e
(cd "$ROOT/frontend" && npx playwright test \
  e2e/f007-f010-f032-request.spec.ts \
  --grep "F-032" \
  --project=chromium \
  --reporter=list) 2>&1 | tee "$OUT/itg-playwright.log"
PW_RC=$?
set -e

set +e
"$PY" "$ROOT/scripts/dev/itg-phase2-pg-consistency-audit.py" 2>&1 | tee "$OUT/itg-phase2-pg.log"
PG_RC=$?
set -e

export ITG_PLAYWRIGHT_RC="$PW_RC"
"$PY" "$ROOT/scripts/dev/itg-write-playwright-result.py"

set +e
"$PY" "$ROOT/scripts/dev/itg-merge-phase2-findings.py"
MERGE_RC=$?
set -e

"$PY" "$ROOT/scripts/dev/generate-itg-deep-audit-report.py" \
  --findings "$OUT/itg-findings.json" \
  --out "$ROOT/docs/runbook/IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT-REPORT.md"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/identity-trust-governance-deep-audit/latest" 2>/dev/null || true

VERDICT="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['verdict'])" "$OUT/itg-findings.json")"
echo "ITG_DEEP_AUDIT: $VERDICT"
echo "Report: docs/runbook/IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT-REPORT.md"
echo "Evidence: $OUT"

[[ "$PROBE_RC" -ne 0 || "$PG_RC" -ne 0 || "$MERGE_RC" -ne 0 ]] && exit 1
exit 0
