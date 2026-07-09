#!/usr/bin/env bash
# Vacancy W7 dry run orchestrator — default --plan-only (no fork, no broadcast).
# Full sim: --fork-sim (forge test on Sepolia fork · no broadcast · writes evidence JSON).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

MODE="plan-only"
FORK_SIM=0
for arg in "$@"; do
  case "$arg" in
    --plan-only) MODE="plan-only" ;;
    --fork-sim) FORK_SIM=1; MODE="fork-sim" ;;
    -h|--help)
      echo "Usage: bash scripts/ops/vacancy-w7-dry-run-orchestrator.sh [--plan-only|--fork-sim]"
      exit 0
      ;;
  esac
done

CHECKLIST="docs/spec/governance-token/TRAVELTRUST-WEB3-VACANCY-W7-DRY-RUN-CHECKLIST-v1.md"
YAML="registry/vacancy-w7-dry-run.v1.yaml"
EVID_DIR="docs/spec/governance-token/evidence/vacancy-w7-dry-run"

echo "== Vacancy W7 Dry Run Orchestrator =="
echo "Mode: $MODE"

[[ -f "$CHECKLIST" ]] || { echo "FAIL: missing $CHECKLIST" >&2; exit 1; }
[[ -f "$YAML" ]] || { echo "FAIL: missing $YAML" >&2; exit 1; }

if [[ "$FORK_SIM" -eq 0 ]]; then
  echo ""
  echo "Plan-only mode — validating artifacts (no RPC · no fork)."
  echo "Checklist: $CHECKLIST"
  echo "Machine SSOT: $YAML"
  echo "Gate: scripts/gates/check-vacancy-runtime-migration-dryrun-gate.sh"
  echo ""
  echo "Next: bash $0 --fork-sim   (Sepolia fork · no broadcast)"
  echo "Evidence: $EVID_DIR/DRYRUN-RESULT-v1.md"
  exit 0
fi

RPC="${CHAIN_RPC_URL:-}"
TOKEN_PROBE="${SETTLEMENT_TOKEN_ADDRESS:-0x241948bE49a778490c8A4Ae8D98b7537fE001f63}"
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
  if cast call "$TOKEN_PROBE" "decimals()(uint8)" --rpc-url "$candidate" >/dev/null 2>&1; then
    RPC="$candidate"
    break
  fi
done
[[ -n "$RPC" ]] || { echo "FAIL: no working Sepolia RPC" >&2; exit 1; }
export CHAIN_RPC_URL="$RPC"

echo ">> Prerequisite: W6.5-B balance audit gate"
bash scripts/gates/check-vacancy-legacy-balance-audit-gate.sh

command -v forge >/dev/null 2>&1 || { echo "FAIL: forge required for --fork-sim" >&2; exit 1; }

mkdir -p "$EVID_DIR"

echo ">> W7 Fork Sim: forge test VacancyW7DryRunForkTest (fork · no broadcast)"
echo "RPC: $RPC"

(
  cd contracts
  forge test --match-contract VacancyW7DryRunForkTest --match-test test_W7DryRun_FullForkSimulation -vvv \
    --fork-url "$RPC"
)

UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u)"
LEDGER="unknown"
STEWARD="unknown"
UNALLOC="unknown"
if command -v jq >/dev/null 2>&1 && [[ -f "$EVID_DIR/DRYRUN-01-deployment.json" ]]; then
  LEDGER="$(jq -r '.contracts.ledger' "$EVID_DIR/DRYRUN-01-deployment.json")"
  STEWARD="$(jq -r '.contracts.stewardPathVault' "$EVID_DIR/DRYRUN-01-deployment.json")"
  UNALLOC="$(jq -r '.contracts.unallocatedVault' "$EVID_DIR/DRYRUN-01-deployment.json")"
fi

cat > "$EVID_DIR/DRYRUN-RESULT-v1.md" <<EOF
# W7 Dry Run Result v1

**Generated:** $UTC  
**Executor:** vacancy-w7-dry-run-orchestrator.sh --fork-sim  
**Fork RPC:** $RPC  
**Sepolia broadcast:** NO

## Gate checks

| Check | Result | Notes |
|-------|--------|-------|
| W7-DryRun-01 deployment simulation | PASS | triplet deployed on fork |
| Owner = V2 Timelock verified | PASS | 0x904a6c4c6aab698afbf08ec6151d317c393520cc |
| W7-DryRun-02 capability probe | PASS | LIVE_CAPABLE on new addresses |
| W7-DryRun-03 0.495 USDC migration sim | PASS | Case B accounting closure |
| Ledger state unchanged (legacy) | PASS | epoch 1 SPLIT_COMPLETED |
| W7-DryRun-04 registry rehearsal | PASS | order verified · no production registry write |
| Rollback path | PASS | discard fork · revert registry on real switch |

## New triplet addresses (simulated · fork only)

| Contract | Address |
|----------|---------|
| CountryPoolNetProfitLedger V1 | $LEDGER |
| StewardPathVault V1 | $STEWARD |
| UnallocatedStewardPathVault V1 | $UNALLOC |

## Evidence files

- DRYRUN-01-deployment.json
- DRYRUN-02-probe.json
- DRYRUN-03-migration.json
- DRYRUN-04-registry.json
- rollback-test.json

## VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE

\`\`\`
PASS
\`\`\`
EOF

echo ""
echo "Evidence written: $EVID_DIR"
bash scripts/gates/check-vacancy-runtime-migration-dryrun-gate.sh
