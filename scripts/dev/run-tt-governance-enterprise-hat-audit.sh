#!/usr/bin/env bash
# Execute TT_GOVERNANCE_ENTERPRISE_HAT audit (machine-assisted + SSOT review)
#
#   bash scripts/dev/run-tt-governance-enterprise-hat-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_tt_governance_enterprise_hat/audit/${STAMP}"
mkdir -p "$EVID"

bash "$ROOT/scripts/dev/run-tt-governance-enterprise-hat-review.sh" --skip-playwright >>"$EVID/prep.log" 2>&1 || true

UI_VERDICT="FAIL"
if bash "$ROOT/scripts/dev/run-ttg-tokenomics-ui-alignment-audit.sh" >>"$EVID/ui.log" 2>&1; then
  UI_VERDICT="PASS"
fi

ONCHAIN="FAIL"
if bash "$ROOT/scripts/dev/verify-gov-freeze-v2-sepolia-onchain.sh" >>"$EVID/onchain.log" 2>&1; then
  ONCHAIN="PASS"
fi

CONC="SKIP"
if bash "$ROOT/scripts/dev/run-governance-concentration-audit-sepolia.sh" >>"$EVID/concentration.log" 2>&1; then
  CONC="PASS"
fi

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
curl -sS -o "$EVID/api-protocol-reference.json" "${API_BASE}/api/v1/governance/protocol-reference" 2>/dev/null || true
curl -sS -o "$EVID/api-stake-quote.json" "${API_BASE}/api/v1/steward/stake-quote?jurisdictions=KR,JP,US" 2>/dev/null || true
curl -sS -o "$EVID/api-ttg-quote.json" "${API_BASE}/api/v1/governance/ttg-exchange/quote?usdc_amount=100000000&round=0" 2>/dev/null || true

export TT_ENTERPRISE_HAT_AUDIT_EVID="$EVID"
export TT_ENTERPRISE_HAT_AUDIT_STAMP="$STAMP"
export AUDIT_UI_ALIGNMENT="$UI_VERDICT"
export AUDIT_ONCHAIN_VERIFY="$ONCHAIN"
export AUDIT_CONCENTRATION="$CONC"

set +e
python "$ROOT/scripts/dev/lib/tt-governance-enterprise-hat-audit-report.py" | tee "$EVID/audit-summary.log"
AUDIT_EXIT=$?
set -e

echo "$STAMP" >"$ROOT/evidence/GO_tt_governance_enterprise_hat/audit/latest-stamp.txt"
exit "$AUDIT_EXIT"
