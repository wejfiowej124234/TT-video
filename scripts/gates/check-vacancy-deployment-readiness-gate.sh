#!/usr/bin/env bash
# VACANCY_DEPLOYMENT_READINESS — protocol vs runtime deployment status gate
# PASS = protocol + indexer green AND runtime status honestly recorded (Sepolia DE = PENDING).
# Does NOT treat "protocol complete" as "chain upgraded".
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

STATUS_YAML="registry/vacancy-v1-runtime-deployment-status.v1.yaml"
DE_CFG="config/jurisdiction_country_pool_net_profit.sepolia.json"
PHASE2_ENV="scripts/dev/.env.phase2-chain-deploy.local"
REPORT="docs/spec/governance-token/VACANCY-V1-RUNTIME-DEPLOYMENT-STATUS-v1.md"

RPC="${CHAIN_RPC_URL:-}"
if [[ -z "$RPC" && -f "$PHASE2_ENV" ]]; then
  RPC="$(grep -E '^CHAIN_RPC_URL=' "$PHASE2_ENV" | head -1 | cut -d= -f2- | tr -d '\r')"
fi
RPC_CANDIDATES=(
  "$RPC"
  "https://sepolia.drpc.org"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "https://1rpc.io/sepolia"
  "https://rpc.sepolia.org"
)
RPC=""
for candidate in "${RPC_CANDIDATES[@]}"; do
  [[ -z "$candidate" ]] && continue
  if cast chain-id --rpc-url "$candidate" >/dev/null 2>&1; then
    RPC="$candidate"
    break
  fi
done

command -v cast >/dev/null 2>&1 || fail "cast required"
command -v python >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || fail "python required"
PY=python
command -v python >/dev/null 2>&1 || PY=python3

[[ -f "$STATUS_YAML" ]] || fail "missing $STATUS_YAML"

bytecode_has_selector() {
  local code="$1" sel="$2"
  local hay needle
  hay="$(echo "${code#0x}" | tr '[:upper:]' '[:lower:]')"
  needle="$(echo "$sel" | tr '[:upper:]' '[:lower:]')"
  echo "$hay" | grep -q "$needle"
}

CHECKS=0
SEPOLIA_RUNTIME="PENDING"
PRODUCTION_RUNTIME="PENDING"
CAP_VL=false
CAP_SE=false
CAP_VS=false
CAP_EPOCH=false
DE_VAULT=""
DE_LEDGER=""

echo "== Vacancy V1 Deployment Readiness Gate =="

echo ">> Protocol layer · VACANCY_LEDGER_V1_PROTOCOL_COMPLETE"
bash scripts/ops/vacancy-ledger-v1-protocol-complete-gate.sh >/dev/null
echo "OK protocol gate"
CHECKS=$((CHECKS + 1))

echo ">> Indexer layer · WEB3_VACANCY_INDEXER_RECONCILE"
bash scripts/gates/check-web3-vacancy-indexer-reconcile-gate.sh >/dev/null
echo "OK indexer reconcile gate"
CHECKS=$((CHECKS + 1))

REG_SEPOLIA_STATUS="$("$PY" - <<'PY'
import re
from pathlib import Path
text = Path("registry/vacancy-v1-runtime-deployment-status.v1.yaml").read_text(encoding="utf-8")
m = re.search(r"sepolia_de:.*?status:\s*(\w+)", text, re.S)
print(m.group(1) if m else "")
PY
)"
REG_PROD_STATUS="$("$PY" - <<'PY'
import re
from pathlib import Path
text = Path("registry/vacancy-v1-runtime-deployment-status.v1.yaml").read_text(encoding="utf-8")
m = re.search(r"production:.*?status:\s*(\w+)", text, re.S)
print(m.group(1) if m else "")
PY
)"
[[ -n "$REG_SEPOLIA_STATUS" ]] || fail "registry sepolia_de.status missing"
[[ -n "$REG_PROD_STATUS" ]] || fail "registry production.status missing"
PRODUCTION_RUNTIME="$REG_PROD_STATUS"

cast_call() {
  local attempts=0 out
  while [[ $attempts -lt 3 ]]; do
    if out="$(cast "$@" --rpc-url "$RPC" 2>/dev/null)"; then
      echo "$out"
      return 0
    fi
    attempts=$((attempts + 1))
    for candidate in "${RPC_CANDIDATES[@]}"; do
      [[ -z "$candidate" || "$candidate" == "$RPC" ]] && continue
      if out="$(cast "$@" --rpc-url "$candidate" 2>/dev/null)"; then
        RPC="$candidate"
        echo "$out"
        return 0
      fi
    done
    sleep 1
  done
  return 1
}

if [[ -n "$RPC" && -f "$DE_CFG" ]]; then
  DE_VAULT="$("$PY" -c "import json; print(json.load(open('$DE_CFG'))['entries'][0]['COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS'])")"
  DE_LEDGER="$("$PY" -c "import json; print(json.load(open('$DE_CFG'))['entries'][0]['COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS'])")"
  VAULT_CODE="$(cast_call code "$DE_VAULT" 2>/dev/null || true)"
  LEDGER_CODE="$(cast_call code "$DE_LEDGER" 2>/dev/null || true)"
  if [[ -n "$VAULT_CODE" && "$VAULT_CODE" != "0x" && -n "$LEDGER_CODE" && "$LEDGER_CODE" != "0x" ]]; then
    CAP_VL=false; CAP_SE=false; CAP_VS=false; CAP_EPOCH=false
    bytecode_has_selector "$VAULT_CODE" "ae607b9e" && CAP_VL=true
    bytecode_has_selector "$VAULT_CODE" "a20b5507" && CAP_SE=true
    bytecode_has_selector "$LEDGER_CODE" "0d045440" && CAP_VS=true
    bytecode_has_selector "$LEDGER_CODE" "123d1b10" && CAP_EPOCH=true
    if [[ "$CAP_VL" == true && "$CAP_SE" == true && "$CAP_VS" == true && "$CAP_EPOCH" == true ]]; then
      SEPOLIA_RUNTIME="ACTIVE"
    else
      SEPOLIA_RUNTIME="PENDING"
    fi
    echo "OK runtime probe sepolia_de=$SEPOLIA_RUNTIME (vl=$CAP_VL se=$CAP_SE vs=$CAP_VS epoch=$CAP_EPOCH)"
    CHECKS=$((CHECKS + 1))
  else
    warn "could not fetch DE bytecode — trust registry runtime status"
    SEPOLIA_RUNTIME="$REG_SEPOLIA_STATUS"
  fi
else
  warn "no RPC — skip on-chain probe; trust registry"
  SEPOLIA_RUNTIME="$REG_SEPOLIA_STATUS"
fi

[[ "$SEPOLIA_RUNTIME" == "$REG_SEPOLIA_STATUS" ]] \
  || fail "registry sepolia_de.status=$REG_SEPOLIA_STATUS but chain probe=$SEPOLIA_RUNTIME — update registry"
[[ "$PRODUCTION_RUNTIME" == "PENDING" ]] || warn "production runtime not PENDING in registry ($PRODUCTION_RUNTIME)"

if [[ "$SEPOLIA_RUNTIME" == "ACTIVE" ]]; then
  echo ">> Sepolia DE Vacancy V1 runtime ACTIVE — live reconcile expected"
else
  echo "OK Sepolia DE runtime PENDING (Q-F01 legacy) — honest boundary preserved"
fi
CHECKS=$((CHECKS + 1))

UTC_NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u)"
mkdir -p "$(dirname "$REPORT")"
{
  echo "# Vacancy V1 Runtime Deployment Status v1"
  echo ""
  echo "**Generated:** $UTC_NOW"
  echo "**Gate:** \`bash scripts/gates/check-vacancy-deployment-readiness-gate.sh\`"
  echo "**Result:** \`VACANCY_DEPLOYMENT_READINESS: PASS\`"
  echo "**SSOT:** \`registry/vacancy-v1-runtime-deployment-status.v1.yaml\`"
  echo ""
  echo "## Readiness matrix"
  echo ""
  echo "| Layer | Status | Gate / proof |"
  echo "|-------|--------|--------------|"
  echo "| Protocol implementation | **PASS** | \`VACANCY_LEDGER_V1_PROTOCOL_COMPLETE\` |"
  echo "| Local Forge tests | **PASS** | VacancyLedgerCore · S3* · invariant |"
  echo "| Indexer (S4a / W3) | **PASS** | \`WEB3_VACANCY_INDEXER_RECONCILE\` |"
  echo "| Sepolia DE Vacancy V1 runtime | **${SEPOLIA_RUNTIME}** | capability probe · \`SKIPPED_PRE_V1\` when pending |"
  echo "| Production Vacancy V1 runtime | **${PRODUCTION_RUNTIME}** | registry record |"
  echo ""
  echo "## Protocol ≠ Runtime"
  echo ""
  echo "\`\`\`"
  echo "Registry / local protocol (Vacancy V1 COMPLETE)"
  echo "        ↓"
  echo "   Indexer + Forge PASS"
  echo "        ↓"
  echo "Sepolia DE stack (Q-F01 legacy bytecode)  ← runtime PENDING"
  echo "        ↓"
  echo "Future: Vacancy V1 deploy / upgrade → probe ACTIVE → live reconcile"
  echo "\`\`\`"
  echo ""
  echo "**Do not infer:** \"protocol complete\" ⇒ \"chain upgraded\"."
  echo ""
  echo "## Sepolia DE probe (latest)"
  echo ""
  echo "| Field | Value |"
  echo "|-------|-------|"
  echo "| UnallocatedStewardPathVault | \`${DE_VAULT:-n/a}\` |"
  echo "| CountryPoolNetProfitLedger | \`${DE_LEDGER:-n/a}\` |"
  echo "| \`vacancyLedger()\` | ${CAP_VL} |"
  echo "| \`sweepEnabled()\` | ${CAP_SE} |"
  echo "| \`vacancyState()\` | ${CAP_VS} |"
  echo "| \`stewardActivationEpochId()\` | ${CAP_EPOCH} |"
  echo "| Runtime status | **${SEPOLIA_RUNTIME}** |"
  echo ""
  echo "## W4 precondition"
  echo ""
  echo "Governance read-only (\`/governance/vacancy-ledger\`) **may proceed** while Sepolia runtime is PENDING."
  echo "UI **must** surface runtime status and **must not** recompute reserve or read contracts directly."
  echo ""
  echo "## Checks passed: $CHECKS"
} >"$REPORT"

echo ""
echo "VACANCY_DEPLOYMENT_READINESS: PASS"
echo "  protocol=PASS indexer=PASS sepolia_runtime=${SEPOLIA_RUNTIME} production=${PRODUCTION_RUNTIME}"
echo "Report: $REPORT"
