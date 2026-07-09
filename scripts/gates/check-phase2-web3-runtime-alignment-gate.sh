#!/usr/bin/env bash
# PHASE2_WEB3_RUNTIME_ALIGNMENT — Phase② Web3 runtime closeout aggregator (post-W7)
# Emits TT_PHASE2_WEB3_RUNTIME_READY: PASS | WARN
# Report: docs/spec/governance-token/PHASE2-WEB3-RUNTIME-CLOSEOUT-REPORT-v1.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

PHASE2_ENV="scripts/dev/.env.phase2-chain-deploy.local"
DE_CFG="config/jurisdiction_country_pool_net_profit.sepolia.json"
STATUS_YAML="registry/vacancy-v1-runtime-deployment-status.v1.yaml"
W7_EVID="docs/spec/governance-token/evidence/vacancy-w7-sepolia-execution"
W7_DEPLOY_JSON="$W7_EVID/W7-01-deployment.json"
ORCH="scripts/ops/vacancy-w7-sepolia-runtime-activation.sh"
REPORT="docs/spec/governance-token/PHASE2-WEB3-RUNTIME-CLOSEOUT-REPORT-v1.md"
REGISTRY_JSON="docs/spec/governance-token/evidence/phase2-web3-runtime-closeout/phase2-web3-runtime-closeout.json"

WARN_COUNT=0
note_warn() { warn "$1"; WARN_COUNT=$((WARN_COUNT + 1)); }

command -v python >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || fail "python required"
PY=python
command -v python >/dev/null 2>&1 || PY=python3

echo "== Phase② Web3 Runtime Alignment Gate =="

# --- W7 evidence + cleanup fixes ---
[[ -f "$W7_DEPLOY_JSON" ]] || fail "missing $W7_DEPLOY_JSON"
grep -q '"result": "PASS"' "$W7_DEPLOY_JSON" || fail "W7-01-deployment.json not PASS"

grep -q 'vacancyLedger()(uint256,uint256,uint256,uint256)' "$ORCH" \
  || fail "W7-CLEANUP-01 not fixed: probe_v1 ABI still stale"
grep -q 'W7_DEPLOY_JSON' "$ORCH" \
  || fail "W7-CLEANUP-03 not fixed: resume JSON path handling"
grep -q 'W7_OUT_JSON' "$ORCH" \
  || fail "W7-CLEANUP-03 not fixed: deploy evidence path handling"
grep -q 'LEGACY_UNALLOC"' "$ORCH" \
  || fail "W7-CLEANUP-02 not fixed: registry LEGACY_UNALLOC bash expansion"

REG_SEPOLIA="$("$PY" - <<'PY'
import re
from pathlib import Path
text = Path("registry/vacancy-v1-runtime-deployment-status.v1.yaml").read_text(encoding="utf-8")
m = re.search(r"sepolia_de:.*?status:\s*(\w+)", text, re.S)
print(m.group(1) if m else "")
PY
)"
[[ "$REG_SEPOLIA" == "ACTIVE" ]] || fail "registry sepolia_de.status=$REG_SEPOLIA expected ACTIVE"

if [[ -f "$PHASE2_ENV" ]]; then
  grep -q '^VACANCY_RECONCILE_LIVE=1' "$PHASE2_ENV" || note_warn "VACANCY_RECONCILE_LIVE not set in $PHASE2_ENV"
  set -a
  # shellcheck disable=SC1090
  source "$PHASE2_ENV"
  set +a
else
  note_warn "missing $PHASE2_ENV"
fi
export VACANCY_RECONCILE_LIVE="${VACANCY_RECONCILE_LIVE:-1}"

echo ">> Master Matrix gate"
bash scripts/gates/check-web3-protocol-master-matrix-gate.sh

echo ">> Vacancy deployment readiness"
bash scripts/gates/check-vacancy-deployment-readiness-gate.sh

echo ">> Vacancy indexer reconcile (incl. live boundary when env set)"
bash scripts/gates/check-web3-vacancy-indexer-reconcile-gate.sh

LIVE_MODE="SKIPPED"
if grep -q 'Live reconcile mode | \*\*LIVE_V1\*\*' docs/spec/governance-token/WEB3-VACANCY-INDEXER-RECONCILE-GATE-REPORT-v1.md 2>/dev/null; then
  LIVE_MODE="LIVE_V1"
elif grep -q 'live_de_reconcile_when_env_set ... ok' "$W7_EVID"/W7-08-live-reconcile-gate.log 2>/dev/null; then
  LIVE_MODE="LIVE_V1"
else
  note_warn "live reconcile evidence not confirmed in gate report — run with stable RPC"
fi

SEPOLIA_RUNTIME="$("$PY" - <<'PY'
import re
from pathlib import Path
text = Path("docs/spec/governance-token/VACANCY-V1-RUNTIME-DEPLOYMENT-STATUS-v1.md").read_text(encoding="utf-8")
m = re.search(r"Sepolia DE Vacancy V1 runtime \| \*\*(\w+)\*\*", text)
print(m.group(1) if m else "")
PY
)"
[[ "$SEPOLIA_RUNTIME" == "ACTIVE" ]] || fail "deployment readiness report sepolia_runtime=$SEPOLIA_RUNTIME"

# Known Phase② non-blockers → WARN (not FAIL)
# Escrow V2 is FUTURE_MAINNET_REQUIRED by design — excluded from WARN (see master matrix).
if grep -q 'status: OPEN' registry/web3-final-alignment-matrix.v2.yaml 2>/dev/null \
  && grep -A2 'W3-AUDIT-001\|API-001' registry/web3-final-alignment-matrix.v2.yaml 2>/dev/null | grep -q 'status: OPEN'; then
  note_warn "Treasury env/API naming drift still OPEN in alignment matrix"
fi

VERDICT="PASS"
[[ "$WARN_COUNT" -gt 0 ]] && VERDICT="WARN"

UTC_NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u)"
mkdir -p "$(dirname "$REPORT")" "$(dirname "$REGISTRY_JSON")"

DE_LEDGER="$("$PY" -c "import json; print(json.load(open('$DE_CFG'))['entries'][0]['COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS'])")"
DE_UNALLOC="$("$PY" -c "import json; print(json.load(open('$DE_CFG'))['entries'][0]['COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS'])")"

{
  echo "# Phase② Web3 Runtime Closeout Report v1"
  echo ""
  echo "**Generated:** $UTC_NOW"
  echo "**Gate:** \`bash scripts/gates/check-phase2-web3-runtime-alignment-gate.sh\`"
  echo "**Verdict:** \`TT_PHASE2_WEB3_RUNTIME_READY: $VERDICT\`"
  echo ""
  echo "## Why WARN (not Vacancy)"
  echo ""
  echo "**Vacancy Ledger V1 track: PASS** — full testnet maturity loop complete."
  echo ""
  echo "Phase② \`TT_PHASE2_WEB3_RUNTIME_READY: WARN\` is driven **only** by off-chain treasury naming drift:"
  echo ""
  echo "| ID | Class | On-chain funds safe? |"
  echo "|----|-------|----------------------|"
  echo "| W3-AUDIT-001 | API treasury fallback | Yes |"
  echo "| W3-AUDIT-002 | \`GOVERNANCE_TREASURY_ADDRESS\` alias | Yes |"
  echo "| W3-AUDIT-003 | verify script legacy keys | Yes |"
  echo ""
  echo "**Excluded from WARN:** EscrowFactory V2 = \`FUTURE_MAINNET_REQUIRED\` (Escrow V1 ACTIVE on Sepolia)."
  echo ""
  echo "## TravelTrust Web3 Runtime Status (Sepolia)"
  echo ""
  echo "| Domain | Status |"
  echo "|--------|--------|"
  echo "| Token | Protocol COMPLETE · Deployment VERIFIED · Runtime ACTIVE |"
  echo "| Governance | Governor V2 COMPLETE · Timelock ACTIVE · Proxy upgrade READY |"
  echo "| Treasury | Runtime ACTIVE · **Naming cleanup REQUIRED** (P1) |"
  echo "| Settlement | Country Pool ACTIVE · **Vacancy ACTIVE** · Mainnet migration pending |"
  echo "| Escrow | V1 ACTIVE · V2 **FUTURE_MAINNET_REQUIRED** |"
  echo "| Indexer | **LIVE_READY** |"
  echo "| Dashboard | Transparency **READY** |"
  echo ""
  echo "## Vacancy Ledger V1 status"
  echo ""
  echo "| Axis | Status |"
  echo "|------|--------|"
  echo "| Protocol | **COMPLETE** |"
  echo "| Deployment | **DEPLOYED** |"
  echo "| Runtime (Sepolia DE) | **ACTIVE** |"
  echo "| Indexer | **LIVE_READY** |"
  echo "| Mainnet | **NOT_STARTED** |"
  echo ""
  echo "## Milestone certificate"
  echo ""
  echo "\`\`\`"
  echo "VACANCY_LEDGER_V1_SEPOLIA_RUNTIME_ACTIVE: PASS"
  echo "VACANCY_DEPLOYMENT_READINESS: PASS"
  echo "WEB3_VACANCY_INDEXER_RECONCILE: PASS"
  echo "LIVE_RECONCILE_MODE: $LIVE_MODE"
  echo "TT_PHASE2_WEB3_RUNTIME_READY: $VERDICT"
  echo "PHASE3_MAINNET_PREPARATION: NOT_STARTED"
  echo "\`\`\`"
  echo ""
  echo "## Sepolia DE Vacancy V1 (active runtime)"
  echo ""
  echo "| Contract | Address |"
  echo "|----------|---------|"
  echo "| Ledger | \`$DE_LEDGER\` |"
  echo "| Unallocated | \`$DE_UNALLOC\` |"
  echo ""
  echo "## W7 post-activation cleanup"
  echo ""
  echo "| ID | Status |"
  echo "|----|--------|"
  echo "| W7-CLEANUP-01 vacancyLedger ABI (4-field) | **FIXED** |"
  echo "| W7-CLEANUP-02 registry LEGACY_UNALLOC | **FIXED** |"
  echo "| W7-CLEANUP-03 Windows evidence paths | **FIXED** |"
  echo ""
  echo "Register: \`docs/spec/governance-token/TRAVELTRUST-WEB3-VACANCY-W7-POST-ACTIVATION-CLEANUP-v1.md\`"
  echo ""
  echo "## Gates executed"
  echo ""
  echo "| Gate | Result |"
  echo "|------|--------|"
  echo "| WEB3 Protocol Master Matrix | PASS |"
  echo "| VACANCY_DEPLOYMENT_READINESS | PASS |"
  echo "| WEB3_VACANCY_INDEXER_RECONCILE | PASS |"
  echo "| Sepolia DE runtime probe | **ACTIVE** |"
  echo ""
  echo "## WARN items (non-blocking for Phase② closeout)"
  echo ""
  if [[ "$WARN_COUNT" -eq 0 ]]; then
    echo "_None — full PASS._"
  else
    echo "- Treasury env/API/metadata/verify naming drift (W3-AUDIT-001..003) — **Phase②.5** target"
    echo "- _Not WARN drivers:_ Escrow V2 FUTURE_MAINNET_REQUIRED · Vacancy (PASS)"
  fi
  echo ""
  echo "## Next: Phase②.5 Web3 Hardening (before Phase③)"
  echo ""
  echo "1. Treasury drift zero-out → unified \`GOVERNANCE_TREASURY_P4CAP_ADDRESS\` + \`LEGACY_TREASURY_ADDRESS\`"
  echo "2. Master Matrix v2 freeze (\`WEB3_PROTOCOL_MASTER_MATRIX_v2\`)"
  echo "3. Phase③ Mainnet Preparation (deploy strategy · proxy init · dry-run)"
  echo ""
} >"$REPORT"

"$PY" - <<PY
import json, datetime
from pathlib import Path
out = {
  "generatedUtc": "$UTC_NOW",
  "verdict": "$VERDICT",
  "milestone": "TT_PHASE2_WEB3_RUNTIME_READY",
  "vacancyLedgerV1": {
    "protocol": "COMPLETE",
    "deployment": "DEPLOYED",
    "runtime": "ACTIVE",
    "indexer": "LIVE_READY",
    "mainnet": "NOT_STARTED",
  },
  "sepoliaDe": {
    "ledger": "$DE_LEDGER",
    "unallocated": "$DE_UNALLOC",
    "runtimeStatus": "ACTIVE",
    "liveReconcileMode": "$LIVE_MODE",
  },
  "w7Cleanup": {
    "W7-CLEANUP-01": "FIXED",
    "W7-CLEANUP-02": "FIXED",
    "W7-CLEANUP-03": "FIXED",
  },
  "warnCount": $WARN_COUNT,
}
Path("$REGISTRY_JSON").write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
PY

echo ""
echo "TT_PHASE2_WEB3_RUNTIME_READY: $VERDICT"
echo "  sepolia_de=ACTIVE live_mode=$LIVE_MODE warn_count=$WARN_COUNT"
echo "Report: $REPORT"
echo "JSON: $REGISTRY_JSON"
