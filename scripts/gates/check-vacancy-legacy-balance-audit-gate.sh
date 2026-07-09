#!/usr/bin/env bash
# VACANCY_LEGACY_BALANCE_AUDIT_GATE — W6.5-B read-only Q-F01 triplet balance/epoch audit.
# No chain writes. SSOT: registry/vacancy-runtime-migration-inventory.v1.yaml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

INVENTORY="registry/vacancy-runtime-migration-inventory.v1.yaml"
REPORT="docs/spec/governance-token/VACANCY-QF01-HISTORICAL-BALANCE-AUDIT-v1.md"

command -v cast >/dev/null 2>&1 || fail "cast (foundry) required"

TOKEN="${COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS:-0x241948bE49a778490c8A4Ae8D98b7537fE001f63}"
LEDGER="${COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS:-0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa}"
RPC="${CHAIN_RPC_URL:-}"
RPC_CANDIDATES=(
  "$RPC"
  "https://sepolia.drpc.org"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "https://rpc.sepolia.org"
  "https://1rpc.io/sepolia"
)
RPC=""
for candidate in "${RPC_CANDIDATES[@]}"; do
  [[ -z "$candidate" ]] && continue
  if cast call "$TOKEN" "decimals()(uint8)" --rpc-url "$candidate" >/dev/null 2>&1 \
    && cast call "$LEDGER" "latestEpochId()(uint256)" --rpc-url "$candidate" >/dev/null 2>&1; then
    RPC="$candidate"
    break
  fi
done
[[ -n "$RPC" ]] || fail "no working Sepolia RPC"
STEWARD="${COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS:-0x6B3391c0b6297A5866c0bB7AD06dA99E08F0a3fb}"
UNALLOC="${UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS:-0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0}"

[[ -f "$INVENTORY" ]] || fail "missing $INVENTORY"
[[ -f "$REPORT" ]] || fail "missing $REPORT"

echo "== Vacancy Legacy Balance Audit Gate (W6.5-B) =="
echo "RPC: $RPC"

DECIMALS="$(cast call "$TOKEN" "decimals()(uint8)" --rpc-url "$RPC" 2>/dev/null)" || fail "RPC/decimals call failed"
UNALLOC_BAL="$(cast call "$TOKEN" "balanceOf(address)(uint256)" "$UNALLOC" --rpc-url "$RPC")" || fail "unalloc balanceOf failed"
STEWARD_BAL="$(cast call "$TOKEN" "balanceOf(address)(uint256)" "$STEWARD" --rpc-url "$RPC")" || fail "steward balanceOf failed"
LEDGER_BAL="$(cast call "$TOKEN" "balanceOf(address)(uint256)" "$LEDGER" --rpc-url "$RPC")" || fail "ledger balanceOf failed"
LATEST_EPOCH="$(cast call "$LEDGER" "latestEpochId()(uint256)" --rpc-url "$RPC")" || fail "latestEpochId failed"
EPOCH_STATUS="$(cast call "$LEDGER" "epochStatus(uint256)(uint8)" "$LATEST_EPOCH" --rpc-url "$RPC")" || fail "epochStatus failed"

echo "OK token decimals=$DECIMALS"
echo "OK unalloc_balance_raw=$UNALLOC_BAL steward_balance_raw=$STEWARD_BAL ledger_balance_raw=$LEDGER_BAL"
echo "OK latestEpochId=$LATEST_EPOCH epochStatus=$EPOCH_STATUS (4=SPLIT_COMPLETED)"

# Q-F01 probe: vacancyLedger() 4-tuple — V1 succeeds post-W7; Q-F01 legacy reverts
if cast call "$UNALLOC" "vacancyLedger()(uint256,uint256,uint256,uint256)" --rpc-url "$RPC" >/dev/null 2>&1; then
  warn "vacancyLedger() succeeded — runtime may already be V1; verify inventory"
else
  echo "OK vacancyLedger probe reverted (expected Q-F01 legacy)"
fi

MIGRATION="$(grep -m1 'recommended_case:' "$INVENTORY" | sed 's/.*recommended_case: *//')"
echo "Inventory migration case: ${MIGRATION:-see yaml}"

if [[ "$UNALLOC_BAL" == "0" && "$STEWARD_BAL" == "0" && "$EPOCH_STATUS" == "4" ]]; then
  echo "VACANCY_LEGACY_BALANCE_AUDIT_GATE: PASS (Case A candidate — verify report)"
elif [[ "$UNALLOC_BAL" != "0" || "$STEWARD_BAL" != "0" ]]; then
  echo "VACANCY_LEGACY_BALANCE_AUDIT_GATE: PASS (Case B — token migration required; see report)"
else
  warn "Review epoch/open state manually"
  echo "VACANCY_LEGACY_BALANCE_AUDIT_GATE: WARN"
fi

echo "Report: $REPORT"
echo "Inventory: $INVENTORY"
