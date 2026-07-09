#!/usr/bin/env bash
# G3-02 · Web3 USDC Payment Production Readiness gate
# SSOT: registry/web3-payment-production-gate.v1.yaml
#       registry/production-payment-readiness-checklist.v1.yaml
#       docs/runbook/PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md
set -euo pipefail
export PYTHONIOENCODING=utf-8

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EV_ROOT="${WEB3_PAY_EVIDENCE_DIR:-evidence/GO_production_readiness/G3-02}"
OUT="${EV_ROOT}/web3-payment-readiness-${STAMP}"
mkdir -p "$OUT"
LOG="$OUT/gate.log"
exec > >(tee -a "$LOG") 2>&1

PROD_API="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
PROD_WEB="${PROD_WEB_BASE:-https://tt-web-prod.fly.dev}"

echo "== Web3 USDC Payment Production Readiness · ${STAMP} =="
echo "Scope: PRODUCTION_SCOPE_SEPOLIA · CHAIN_ID=11155111"
echo "Prod API: ${PROD_API}"
echo "Discipline: audit/gate SSOT validation — live USDC smoke requires Owner wallet + funded Sepolia USDC"

failures=0
warns=0

require_file() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo "SSOT: FAIL missing $f" >&2
    failures=$((failures + 1))
    return 1
  fi
  echo "SSOT: OK $f"
}

require_file registry/payment-architecture-classification.v1.yaml
require_file registry/production-usdc-go-live-master-checklist.v1.yaml
require_file docs/runbook/PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md
require_file registry/production-go-closure-sequence.v1.yaml
require_file registry/production-payment-readiness-checklist.v1.yaml
require_file registry/web3-payment-production-gate.v1.yaml
require_file docs/runbook/PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md
require_file docs/runbook/TT-B435-USER-WALLET-ESCROW-FEEROUTER-PAYMENT-PATH-001.md
require_file docs/runbook/TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md
require_file crates/core/src/escrow.rs

# --- Prod /meta: mock-pay must be off ---
meta_json=""
mock_pay="unknown"
chain_id=""
if meta_json="$(curl -fsS "${PROD_API}/meta" 2>/dev/null || true)"; then
  echo "/meta: reachable"
  meta_tmp="$(mktemp)"
  printf '%s' "$meta_json" > "$meta_tmp"
  mock_pay="$(python -c "
import json,sys
with open(sys.argv[1], encoding='utf-8') as f:
  d=json.load(f)
v=d.get('order_mock_pay_enabled')
if v is True:
  print('enabled')
elif v is False:
  print('disabled')
else:
  print('absent')
" "$meta_tmp")"
  chain_id="$(python -c "
import json,sys
with open(sys.argv[1], encoding='utf-8') as f:
  d=json.load(f)
print(d.get('chain_id',''))
" "$meta_tmp")"
  rm -f "$meta_tmp"
  echo "order_mock_pay: ${mock_pay}"
  echo "chain_id(meta): ${chain_id:-n/a}"
  if [[ "$mock_pay" == "enabled" ]]; then
    echo "META_NO_MOCK_PAY: FAIL — mock-pay enabled on prod" >&2
    failures=$((failures + 1))
  else
    echo "META_NO_MOCK_PAY: OK"
  fi
  if [[ -n "$chain_id" && "$chain_id" != "11155111" ]]; then
    echo "CHAIN_ID: WARN meta chain_id=${chain_id} (expected 11155111)" >&2
    warns=$((warns + 1))
  elif [[ "$chain_id" == "11155111" ]]; then
    echo "CHAIN_ID: OK"
  fi
else
  echo "/meta: WARN unreachable — skipping runtime probes" >&2
  warns=$((warns + 1))
fi

# --- Contract parity: registry vs FE build.env.local ---
REG_ESCROW="$(python -c "import yaml; d=yaml.safe_load(open('registry/production-payment-readiness-checklist.v1.yaml', encoding='utf-8')); print(d['prod_contracts_sepolia']['ESCROW_FACTORY_ADDRESS'])" 2>/dev/null || true)"
FE_ENV="frontend/build.env.local"
contract_parity_ok=true
if [[ -f "$FE_ENV" && -n "$REG_ESCROW" ]]; then
  fe_escrow="$(grep -E '^NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=' "$FE_ENV" | cut -d= -f2- | tr -d '\r' || true)"
  if [[ -n "$fe_escrow" && "${fe_escrow,,}" != "${REG_ESCROW,,}" ]]; then
    echo "CONTRACT_PARITY: FAIL FE EscrowFactory ${fe_escrow} != registry ${REG_ESCROW}" >&2
    contract_parity_ok=false
    failures=$((failures + 1))
  else
    echo "CONTRACT_PARITY: OK EscrowFactory FE ↔ registry"
  fi
else
  echo "CONTRACT_PARITY: WARN FE build.env.local or registry parse unavailable" >&2
  warns=$((warns + 1))
fi

# --- Checklist evidence dirs (structure only until live smoke) ---
checklist_count="$(python -c "
import yaml
d=yaml.safe_load(open('registry/production-payment-readiness-checklist.v1.yaml', encoding='utf-8'))
print(len(d.get('checklist',[])))
")"
echo "checklist items: ${checklist_count} (PAY-W01..W16)"

evidence_items_passed=0
evidence_items_total=0
while IFS= read -r evdir; do
  evdir="${evdir//$'\r'/}"
  evidence_items_total=$((evidence_items_total + 1))
  if [[ -d "$evdir" ]]; then
    if compgen -G "$evdir/*" >/dev/null 2>&1; then
      evidence_items_passed=$((evidence_items_passed + 1))
      echo "evidence: OK $evdir (has artifacts)"
    else
      echo "evidence: PLANNED $evdir (dir exists, empty)"
    fi
  else
    echo "evidence: NOT_STARTED $evdir"
  fi
done < <(python -c "
import yaml
d=yaml.safe_load(open('registry/production-payment-readiness-checklist.v1.yaml', encoding='utf-8'))
for i in d.get('checklist',[]):
  print(i.get('evidence','').rstrip('/'))
")

# --- Stripe extension gate (P1 — does NOT block core) ---
stripe_verdict="PI3-003_NOT_RUN"
if [[ -f "scripts/check-pi3-003-stripe-live-production-webhook-execution.sh" ]]; then
  echo ""
  echo "-- Stripe onboarding extension (P1 optional · not core payment) --"
  bash "scripts/check-pi3-003-stripe-live-production-webhook-execution.sh" 2>&1 | tee "$OUT/stripe-extension-pi3-003.log" || true
  latest_pi3="$(ls -d evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-003-exec-* 2>/dev/null | sort | tail -1 || true)"
  if [[ -n "$latest_pi3" && -f "${latest_pi3}/summary.json" ]]; then
    stripe_verdict="$(python -c "import json,sys; print(json.load(open(sys.argv[1]))['verdict'])" "${latest_pi3}/summary.json")"
  fi
  echo "stripe_extension_gate: ${stripe_verdict} (blocks_core_payment=false)"
fi

# --- Verdict ---
verdict="WEB3_PAYMENT_PRODUCTION_NOT_STARTED"
if [[ "$evidence_items_passed" -ge "$checklist_count" && "$failures" -eq 0 ]]; then
  verdict="WEB3_PAYMENT_PRODUCTION_PASS"
elif [[ "$evidence_items_passed" -gt 0 || "$failures" -gt 0 ]]; then
  verdict="WEB3_PAYMENT_PRODUCTION_IN_PROGRESS"
fi
if [[ "$failures" -gt 0 ]]; then
  verdict="WEB3_PAYMENT_PRODUCTION_FAIL"
fi

LATEST_MANIFEST="$EV_ROOT/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json"
node -e "
const fs=require('fs');
const payload={
  kind:'traveltrust.web3_payment_production_readiness.v1',
  recorded_utc:process.argv[1],
  stamp:process.argv[1],
  verdict:process.argv[2],
  machine_key:'TT_WEB3_PAYMENT_PRODUCTION_READINESS',
  g3_domain:'G3-02',
  production_scope:'PRODUCTION_SCOPE_SEPOLIA',
  chain_id:11155111,
  prod_api:process.argv[3],
  prod_web:process.argv[4],
  ssot:{
    checklist:'registry/production-payment-readiness-checklist.v1.yaml',
    gate:'registry/web3-payment-production-gate.v1.yaml',
    runbook:'docs/runbook/PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md'
  },
  runtime_probes:{
    meta_reachable:process.argv[5]==='true',
    mock_pay_forbidden:process.argv[6],
    contract_parity_ok:process.argv[7]==='true'
  },
  checklist_evidence:{
    total:Number(process.argv[8]),
    with_artifacts:Number(process.argv[9])
  },
  stripe_onboarding_extension:{
    classification:'P1_FUTURE_FIAT_ONRAMP',
    pi3_verdict:process.argv[10],
    blocks_core_payment_gate:false,
    blocks_production_go:false
  },
  failures:Number(process.argv[11]),
  warnings:Number(process.argv[12]),
  evidence_dir:process.argv[13]
};
fs.writeFileSync(process.argv[14], JSON.stringify(payload,null,2)+'\n');
" "$STAMP" "$verdict" "$PROD_API" "$PROD_WEB" \
  "$([[ -n "$meta_json" ]] && echo true || echo false)" \
  "${mock_pay:-unknown}" \
  "$([[ "$contract_parity_ok" == true ]] && echo true || echo false)" \
  "$checklist_count" "$evidence_items_passed" \
  "$stripe_verdict" "$failures" "$warns" "$OUT" "$LATEST_MANIFEST"

echo ""
echo "Evidence: $OUT"
echo "Latest: $LATEST_MANIFEST"
echo "TT_WEB3_PAYMENT_PRODUCTION_READINESS: ${verdict}"
echo "checklist evidence with artifacts: ${evidence_items_passed}/${checklist_count}"

if [[ "$verdict" == "WEB3_PAYMENT_PRODUCTION_FAIL" ]]; then
  exit 1
fi
exit 0
