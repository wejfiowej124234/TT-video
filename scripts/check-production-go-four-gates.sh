#!/usr/bin/env bash
# Production GO · Four-Gate Framework runner
# SSOT: registry/production-go-four-gate-framework.v1.yaml
#       docs/runbook/PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md
set -euo pipefail
export PYTHONIOENCODING=utf-8

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EV_ROOT="${FOUR_GATE_EVIDENCE_DIR:-evidence/GO_production_readiness/four-gate}"
OUT="${EV_ROOT}/four-gate-${STAMP}"
mkdir -p "$OUT"
LOG="$OUT/gate.log"
exec > >(tee -a "$LOG") 2>&1

echo "== Production GO Four-Gate Framework · ${STAMP} =="
echo "SSOT: registry/production-go-four-gate-framework.v1.yaml"

failures=0

require_file() {
  [[ -f "$1" ]] || { echo "SSOT: FAIL missing $1" >&2; failures=$((failures + 1)); return 1; }
  echo "SSOT: OK $1"
}

require_file registry/production-go-four-gate-framework.v1.yaml
require_file registry/production-go-remaining-work.v1.yaml
require_file docs/runbook/PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md
require_file registry/payment-architecture-classification.v1.yaml

# --- Gate 1: Business ---
g1="PASS"
if [[ -f registry/production-readiness-master-matrix.v1.yaml ]]; then
  g1_yaml="$(grep 'TT_PRODUCTION_READINESS_G1_GATE:' registry/production-readiness-master-matrix.v1.yaml | awk '{print $2}' || echo NOT_STARTED)"
  entry="$(grep 'TT_PRODUCTION_ENTRY_READY:' registry/production-readiness-master-checklist.v1.yaml 2>/dev/null | head -1 | awk '{print $2}' || echo unknown)"
  [[ "$g1_yaml" == "PASS" ]] || g1="IN_PROGRESS"
  echo "GATE-1 Business: ${g1} (G1=${g1_yaml}, ENTRY=${entry})"
else
  g1="IN_PROGRESS"
  echo "GATE-1 Business: IN_PROGRESS (matrix missing)"
fi
business_verdict="TT_PRODUCTION_BUSINESS_${g1}"

# --- Gate 2: Web3 (layered — payment + entire system) ---
web3_payment_detail="NOT_STARTED"
web3_system_detail="NOT_STARTED"
if [[ -f evidence/GO_production_readiness/G3-02/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json ]]; then
  web3_payment_detail="$(python -c "import json; print(json.load(open('evidence/GO_production_readiness/G3-02/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json'))['verdict'])" 2>/dev/null || echo NOT_STARTED)"
fi
if [[ -f evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-DEEP-AUDIT-LATEST.json ]]; then
  web3_system_detail="$(python -c "import json; print(json.load(open('evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-DEEP-AUDIT-LATEST.json')).get('summary',{}).get('web3_system_ready', False))" 2>/dev/null || echo False)"
fi
web3_verdict="TT_PRODUCTION_WEB3_IN_PROGRESS"
case "$web3_payment_detail" in
  WEB3_PAYMENT_PRODUCTION_PASS)
    web3_verdict="TT_PRODUCTION_WEB3_IN_PROGRESS"
    [[ "$web3_system_detail" == "True" ]] && web3_verdict="TT_PRODUCTION_WEB3_PASS"
    ;;
  WEB3_PAYMENT_PRODUCTION_IN_PROGRESS|WEB3_PAYMENT_PRODUCTION_FAIL) web3_verdict="TT_PRODUCTION_WEB3_IN_PROGRESS" ;;
  *) web3_verdict="TT_PRODUCTION_WEB3_NOT_STARTED" ;;
esac
echo "GATE-2 Web3: ${web3_verdict} (payment=${web3_payment_detail}, system_ready=${web3_system_detail})"
echo "  layering: TT_WEB3_PAYMENT_PRODUCTION_READY · TT_WEB3_SYSTEM_PRODUCTION_READY · registry/web3-gate-layering.v1.yaml"

# Run web3 gate SSOT check (non-failing — records state)
bash scripts/check-web3-payment-production-readiness.sh 2>&1 | tee "$OUT/web3-subgate.log" || true

# --- Gate 3: Infrastructure ---
infra_verdict="TT_PRODUCTION_INFRASTRUCTURE_IN_PROGRESS"
g3="$(grep 'TT_PRODUCTION_READINESS_G3_GATE:' registry/production-readiness-master-matrix.v1.yaml 2>/dev/null | awk '{print $2}' || echo NOT_STARTED)"
[[ "$g3" == "PASS" ]] && infra_verdict="TT_PRODUCTION_INFRASTRUCTURE_PASS"
echo "GATE-3 Infrastructure: ${infra_verdict} (G3=${g3})"

# --- Gate 4: Operations ---
ops_verdict="TT_PRODUCTION_OPERATIONS_IN_PROGRESS"
if [[ -f evidence/GO_production_operations_enablement/PRODUCTION-OPERATIONS-GO-LATEST-REDACTED.json ]]; then
  ops_go="$(python -c "import json; print(json.load(open('evidence/GO_production_operations_enablement/PRODUCTION-OPERATIONS-GO-LATEST-REDACTED.json')).get('summary',{}).get('verdict','NO_GO'))" 2>/dev/null || echo NO_GO)"
  [[ "$ops_go" == "GO" ]] && ops_verdict="TT_PRODUCTION_OPERATIONS_PARTIAL_GO"
  echo "GATE-4 Operations: ${ops_verdict} (ops_enablement=${ops_go} — full ops UAT still required for PASS)"
else
  echo "GATE-4 Operations: ${ops_verdict} (no ops evidence)"
fi

# --- Final GO ---
prod_go="NO_GO"
if [[ "$business_verdict" == "TT_PRODUCTION_BUSINESS_PASS" && "$web3_verdict" == "TT_PRODUCTION_WEB3_PASS" && "$infra_verdict" == "TT_PRODUCTION_INFRASTRUCTURE_PASS" && "$ops_verdict" == "TT_PRODUCTION_OPERATIONS_PASS" ]]; then
  prod_go="PENDING_OWNER_SIGNOFF"
fi

LATEST="${EV_ROOT}/PRODUCTION-GO-FOUR-GATE-LATEST.json"
node -e "
const fs=require('fs');
const payload={
  kind:'traveltrust.production_go_four_gate.v1',
  recorded_utc:process.argv[1],
  stamp:process.argv[1],
  framework:'registry/production-go-four-gate-framework.v1.yaml',
  gates:{
    business:{machine_key:'TT_PRODUCTION_BUSINESS_READY',verdict:process.argv[2]},
    web3:{machine_key:'TT_PRODUCTION_WEB3_READY',verdict:process.argv[3],detail:process.argv[4]},
    infrastructure:{machine_key:'TT_PRODUCTION_INFRASTRUCTURE_READY',verdict:process.argv[5]},
    operations:{machine_key:'TT_PRODUCTION_OPERATIONS_READY',verdict:process.argv[6]},
    owner_signoff:{machine_key:'TT_OWNER_FINAL_SIGNOFF',verdict:'PENDING'},
    production_go:{machine_key:'TT_PRODUCTION_GO',verdict:process.argv[7]}
  },
  payment_architecture:{
    core:'Web3 Escrow USDC',
    stripe:'Optional Fiat Onboarding P1 not in gates'
  },
  evidence_dir:process.argv[8]
};
fs.writeFileSync(process.argv[9], JSON.stringify(payload,null,2)+'\n');
" "$STAMP" "$business_verdict" "$web3_verdict" "$web3_detail" "$infra_verdict" "$ops_verdict" "$prod_go" "$OUT" "$LATEST"

echo ""
echo "Evidence: $OUT"
echo "Latest: $LATEST"
echo "TT_PRODUCTION_BUSINESS_READY: ${business_verdict#TT_PRODUCTION_BUSINESS_}"
echo "TT_PRODUCTION_WEB3_READY: ${web3_verdict#TT_PRODUCTION_WEB3_}"
echo "TT_PRODUCTION_INFRASTRUCTURE_READY: ${infra_verdict#TT_PRODUCTION_INFRASTRUCTURE_}"
echo "TT_PRODUCTION_OPERATIONS_READY: ${ops_verdict#TT_PRODUCTION_OPERATIONS_}"
echo "TT_PRODUCTION_GO: ${prod_go}"

# Exit 1 only if SSOT files missing
[[ "$failures" -eq 0 ]] || exit 1
exit 0
