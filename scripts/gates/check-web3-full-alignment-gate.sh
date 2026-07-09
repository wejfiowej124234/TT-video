#!/usr/bin/env bash
# WEB3_FULL_ALIGNMENT_GATE — TravelTrust Web3 Full Alignment Audit v2 aggregator
# SSOT: registry/web3-final-alignment-matrix.v2.yaml
# Report: docs/spec/governance-token/WEB3_ALIGNMENT_DRIFT_REPORT-v2.md (summary refresh)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

MATRIX_V2="registry/web3-final-alignment-matrix.v2.yaml"
DRIFT_MD="docs/spec/governance-token/WEB3_ALIGNMENT_DRIFT_REPORT-v2.md"
AUDIT_MD="docs/spec/governance-token/TRAVELTRUST-WEB3-FULL-ALIGNMENT-AUDIT-v2.md"
DE_CFG="config/jurisdiction_country_pool_net_profit.sepolia.json"
REGISTRY="registry/protocol-convergence-deployments.v1.yaml"
PHASE2_ENV="scripts/dev/.env.phase2-chain-deploy.local"

command -v python >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || fail "python required"
PY=python
command -v python >/dev/null 2>&1 || PY=python3

[[ -f "$MATRIX_V2" ]] || fail "missing $MATRIX_V2"

OPEN_HIGH=0
OPEN_MEDIUM=0
OPEN_LOW=0
OPEN_CRITICAL=0
CHECKS=0
FINDINGS=()

record() {
  local sev="$1" id="$2" msg="$3"
  FINDINGS+=("[$sev] $id: $msg")
  case "$sev" in
    CRITICAL) OPEN_CRITICAL=$((OPEN_CRITICAL + 1)) ;;
    HIGH) OPEN_HIGH=$((OPEN_HIGH + 1)) ;;
    MEDIUM) OPEN_MEDIUM=$((OPEN_MEDIUM + 1)) ;;
    LOW) OPEN_LOW=$((OPEN_LOW + 1)) ;;
  esac
}

echo "== WEB3 Full Alignment Gate (Audit v2) =="

echo ">> Prerequisite · Master Matrix"
bash scripts/gates/check-web3-protocol-master-matrix-gate.sh >/dev/null
CHECKS=$((CHECKS + 1))

echo ">> Prerequisite · Vacancy deployment readiness"
VACANCY_RECONCILE_LIVE_SAVED="${VACANCY_RECONCILE_LIVE:-}"
unset VACANCY_RECONCILE_LIVE
bash scripts/gates/check-vacancy-deployment-readiness-gate.sh >/dev/null
export VACANCY_RECONCILE_LIVE="${VACANCY_RECONCILE_LIVE_SAVED:-1}"
CHECKS=$((CHECKS + 1))

echo ">> Prerequisite · Deployment truth"
bash scripts/gates/check-web3-deployment-truth-gate.sh >/dev/null
CHECKS=$((CHECKS + 1))

echo ">> B · ABI alignment scans"
if [[ -f contracts/abi/UnallocatedStewardPathVault.json ]]; then
  if ! grep -q '"name": "vacancyLedger"' contracts/abi/UnallocatedStewardPathVault.json 2>/dev/null; then
    record HIGH ABI-001 "UnallocatedStewardPathVault.json missing vacancyLedger() — stale Q-F01 ABI"
  fi
fi
if [[ -f contracts/src/EscrowV2.sol && ! -f contracts/abi/EscrowV2.json ]]; then
  record MEDIUM ABI-002 "EscrowV2.sol without checked-in ABI (FUTURE_MAINNET_REQUIRED)"
fi
if grep -q 'vacancyLedger()(uint256,uint256,uint256,uint256,uint8)' scripts/gates/check-vacancy-legacy-balance-audit-gate.sh 2>/dev/null; then
  record LOW ABI-003 "legacy balance audit gate uses stale 5-tuple vacancyLedger cast"
fi
CHECKS=$((CHECKS + 1))

echo ">> D · API backend treasury source scans"
if grep -qE 'treasury_address = .*or_else.*TREASURY_ADDRESS|treasury_address = .*or_else.*REGION_VAULT' crates/api/src/chain/mod.rs 2>/dev/null; then
  record HIGH API-001 "chain/mod.rs treasury fallback chain includes deprecated keys"
fi
if grep -q 'GOVERNANCE_TREASURY_ADDRESS' crates/api/src/routes/governance/governance_pool.rs 2>/dev/null \
  || grep -q 'GOVERNANCE_TREASURY_ADDRESS' crates/api/src/routes/governance/pool_chain.rs 2>/dev/null; then
  record HIGH API-002 "governance pool reads GOVERNANCE_TREASURY_ADDRESS"
fi
if grep -qE '\$\{TREASURY_ADDRESS:-|\$\{GOVERNANCE_TREASURY_ADDRESS:-' scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh 2>/dev/null; then
  record HIGH API-003 "fundstack verify uses deprecated treasury env keys"
fi
CHECKS=$((CHECKS + 1))

echo ">> C · Deployment config/registry alignment"
bash scripts/gates/check-web3-env-catalog-gate.sh >/dev/null
CHECKS=$((CHECKS + 1))
if [[ -f "$DE_CFG" && -f "$REGISTRY" ]]; then
  de_ledger="$("$PY" -c "import json; print(json.load(open('$DE_CFG'))['entries'][0]['COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS'].lower())")"
  reg_ledger="$(grep 'country_pool_net_profit_ledger_address:' "$REGISTRY" | tail -1 | sed -E 's/.*"([^"]+)".*/\1/' | tr '[:upper:]' '[:lower:]')"
  [[ "$de_ledger" == "$reg_ledger" ]] || record CRITICAL DEP-CRIT-001 "DE ledger mismatch cfg=$de_ledger registry=$reg_ledger"
fi
if grep -qE '\| `TREASURY_ADDRESS` \|' docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md 2>/dev/null; then
  record LOW DOC-001 "WEB3-SYSTEM-MASTER-MAP still maps bare TREASURY_ADDRESS"
fi
if ! [[ -f docs/runbook/WEB3-TREASURY-ENV-KEYS-OPERATOR-GUIDE.md ]]; then
  record LOW DOC-001 "missing WEB3-TREASURY-ENV-KEYS-OPERATOR-GUIDE.md"
fi
CHECKS=$((CHECKS + 1))

echo ">> F · Tokenomics spot check"
if grep -q '10_000_000' frontend/lib/governance/governanceParamsTokenomicsModel.ts 2>/dev/null; then
  : # TOKEN-001 PASS
else
  record HIGH TOKEN-001 "frontend TTG supply constant missing or drifted from 10M SSOT"
fi
CHECKS=$((CHECKS + 1))

echo ">> Registry sepolia_de ACTIVE"
reg_active="$("$PY" - <<'PY'
import re
from pathlib import Path
t = Path("registry/vacancy-v1-runtime-deployment-status.v1.yaml").read_text(encoding="utf-8")
m = re.search(r"sepolia_de:.*?status:\s*(\w+)", t, re.S)
print(m.group(1) if m else "")
PY
)"
[[ "$reg_active" == "ACTIVE" ]] || record CRITICAL VAC-CRIT-001 "vacancy sepolia_de.status=$reg_active expected ACTIVE"
CHECKS=$((CHECKS + 1))

VERDICT="PASS"
if [[ "$OPEN_CRITICAL" -gt 0 ]]; then
  VERDICT="FAIL"
elif [[ "$OPEN_HIGH" -gt 0 ]]; then
  VERDICT="WARN"
fi

UTC_NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u)"

# Append gate run summary to drift report footer (idempotent section marker)
mkdir -p "$(dirname "$DRIFT_MD")"
if [[ ! -f "$DRIFT_MD" ]]; then
  echo "# WEB3 Alignment Drift Report v2" >"$DRIFT_MD"
  echo "" >>"$DRIFT_MD"
  echo "See \`registry/web3-final-alignment-matrix.v2.yaml\` for full register." >>"$DRIFT_MD"
fi

{
  echo ""
  echo "## Latest gate run"
  echo ""
  echo "**Generated:** $UTC_NOW"
  echo "**Result:** \`WEB3_FULL_ALIGNMENT_GATE: $VERDICT\`"
  echo ""
  echo "| Severity | Open (this run) |"
  echo "|----------|-----------------|"
  echo "| CRITICAL | $OPEN_CRITICAL |"
  echo "| HIGH | $OPEN_HIGH |"
  echo "| MEDIUM | $OPEN_MEDIUM |"
  echo "| LOW | $OPEN_LOW |"
  echo ""
  if [[ ${#FINDINGS[@]} -gt 0 ]]; then
    echo "### Automated findings"
    echo ""
    for f in "${FINDINGS[@]}"; do
      echo "- $f"
    done
  fi
} >>"$DRIFT_MD"

echo ""
echo "WEB3_FULL_ALIGNMENT_GATE: $VERDICT"
if [[ "$VERDICT" == "PASS" ]]; then
  echo "PHASE2_5_WEB3_HARDENING_READY: PASS"
  echo "TT_PHASE2_WEB3_RUNTIME_READY: PASS"
fi
echo "  critical=$OPEN_CRITICAL high=$OPEN_HIGH medium=$OPEN_MEDIUM low=$OPEN_LOW checks=$CHECKS"
echo "SSOT: $MATRIX_V2"
echo "Drift: $DRIFT_MD"
echo "Audit: $AUDIT_MD"

[[ "$VERDICT" != "FAIL" ]]
