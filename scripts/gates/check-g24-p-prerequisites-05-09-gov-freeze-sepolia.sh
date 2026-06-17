#!/usr/bin/env bash
# G24-P-05～09 · TTG Gov Freeze V1 · Sepolia broadcast 前置闸（② · 窄切片）
#
#   PHASE2_CHAIN_DEPLOY_ENV=scripts/dev/.env.phase2-chain-deploy.local \
#   bash scripts/gates/check-g24-p-prerequisites-05-09-gov-freeze-sepolia.sh
#
# SSOT: docs/spec/governance-token/country-pool-settlement-gate2.4-prerequisites-checklist.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVID="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/g24-p-prerequisites-05-09"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SEPOLIA_CHAIN_ID=11155111
mkdir -p "$EVID"

fail() { echo "G24-P-05-09: FAIL $*" >&2; echo "G24_P_05_09_SUMMARY: FAIL $*" >>"$EVID/g24-p-05-09-${STAMP}.log"; exit 1; }
pass_line() { echo "G24-P-05-09: PASS $*"; echo "G24_P_05_09_CHECK: PASS $*" >>"$EVID/g24-p-05-09-${STAMP}.log"; }

LOG="$EVID/g24-p-05-09-${STAMP}.log"
: >"$LOG"

PY="python"
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  PY="python3"
fi

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"

load_env() {
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$ENV_FILE"
}

merge_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    export "$key=$val"
  done < "$f"
}

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

load_env

export USDC_TOKEN_ADDRESS="${USDC_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"

command -v cast >/dev/null 2>&1 || fail "cast required"
command -v forge >/dev/null 2>&1 || fail "forge required"

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "G24-P-05: CHAIN_RPC_URL required"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "G24-P-05: PRIVATE_KEY required"
[[ -n "${GOVERNANCE_TOKEN_ADDRESS:-}" ]] || fail "G24-P-05: GOVERNANCE_TOKEN_ADDRESS required"
[[ -n "${USDC_TOKEN_ADDRESS:-}" ]] || fail "G24-P-05: USDC_TOKEN_ADDRESS or FUND_STACK_TOKEN_ADDRESS required"
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" && "$TIMELOCK_ADMIN_ADDRESS" != *"..."* ]] \
  || fail "G24-P-05: TIMELOCK_ADMIN_ADDRESS required"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "G24-P-05: chain_id=$CHAIN_ID need Sepolia $SEPOLIA_CHAIN_ID"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
pass_line "G24-P-05 chain RPC + Sepolia + env keys present"

# G24-P-05 · ② 链切片 G-1/G-2（非 staging Stripe 全栈）
if [[ "$PRIVATE_KEY" == *mainnet* ]] || [[ "${CHAIN_RPC_URL,,}" == *mainnet* ]]; then
  fail "G24-P-05: mainnet RPC/key pattern forbidden for ② slice"
fi
pass_line "G24-P-05 G-1 testnet key/RPC isolation (chain slice)"

BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0)"
MIN_WEI=$((200000000000000000))
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "G24-P-05 G-2: deployer balance ${BAL_WEI} wei < 0.20 ETH"
fi
pass_line "G24-P-05 G-2 chain reachable + deployer funded"

# G24-P-09 · Phase2ControlPlane · non-Anvil admin ≠ deployer
[[ "$TIMELOCK_ADMIN_ADDRESS" != "$DEPLOYER" ]] \
  || fail "G24-P-09 R-02: TIMELOCK_ADMIN_ADDRESS must not equal deployer on Sepolia"
ADMIN_CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0x)"
[[ "$ADMIN_CODE" != "0x" ]] || fail "G24-P-09: TIMELOCK_ADMIN_ADDRESS has no code on Sepolia"
pass_line "G24-P-09 Phase2ControlPlane admin=Safe ≠ deployer"

# G24-P-06 · Safe allowlist 预案 + GovFreeze 脚本 wired
[[ -f "$ROOT/docs/runbook/TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN.md" ]] \
  || fail "G24-P-06: missing Safe execution plan"
grep -q "configureGovernanceTimelockViaSafe" "$ROOT/contracts/script/DeployGovFreezeV1Stack.s.sol" \
  || fail "G24-P-06: DeployGovFreezeV1Stack must use Safe path"
grep -q "setAllowedExecutionTarget" "$ROOT/contracts/script/DeployGovFreezeV1Stack.s.sol" \
  || fail "G24-P-06: treasury allowlist missing in deploy script"
if [[ "$ADMIN_CODE" != "0x" ]]; then
  [[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" && "$TIMELOCK_SAFE_OWNER_KEYS" != *"..."* ]] \
    || fail "G24-P-06: TIMELOCK_SAFE_OWNER_KEYS required for Safe Phase B"
fi
pass_line "G24-P-06 Safe allowlist plan + DeployGovFreezeV1Stack wired"

# G24-P-07 · pilot DE registry JSON（CountryPoolNetProfitLedger triplet · 链上读或先 broadcast stack）
LEDGER="${COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS:-}"
if [[ -z "$LEDGER" || "$LEDGER" == "0x0000000000000000000000000000000000000000" ]]; then
  if is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
    bash "$ROOT/scripts/dev/phase2-sepolia-broadcast-country-pool-net-profit-stack.sh"
  APPEND="$(ls -t "$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/country-pool-net-profit-stack"/*/phase2-env-append-*.env 2>/dev/null | head -1 || true)"
  if [[ -z "$APPEND" || ! -f "$APPEND" ]]; then
    APPEND="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/country-pool-net-profit-stack/latest-skip.env"
  fi
  [[ -n "$APPEND" && -f "$APPEND" ]] && merge_env_file "$APPEND"
    LEDGER="${COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS:-}"
  fi
fi
[[ -n "$LEDGER" && "$LEDGER" != "0x0000000000000000000000000000000000000000" ]] \
  || fail "G24-P-07: COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS required (set env or run net-profit stack broadcast)"

STEWARD_VAULT="${COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS:-}"
UNALLOC_VAULT="${COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS:-}"
SETTLEMENT_TOKEN="${COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS:-${SETTLEMENT_TOKEN_ADDRESS:-}}"

if [[ -z "$STEWARD_VAULT" ]]; then
  STEWARD_VAULT="$(cast call "$LEDGER" "stewardPathVault()(address)" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
fi
if [[ -z "$UNALLOC_VAULT" ]]; then
  UNALLOC_VAULT="$(cast call "$LEDGER" "unallocatedStewardPathVault()(address)" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
fi
if [[ -z "$SETTLEMENT_TOKEN" ]]; then
  SETTLEMENT_TOKEN="$(cast call "$LEDGER" "settlementToken()(address)" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
fi

for addr in "$STEWARD_VAULT" "$UNALLOC_VAULT" "$SETTLEMENT_TOKEN"; do
  [[ -n "$addr" && "$addr" != "0x0000000000000000000000000000000000000000" ]] \
    || fail "G24-P-07: ledger vault read empty ($addr)"
done

JURIS="$ROOT/config/jurisdiction_country_pool_net_profit.sepolia.json"
export G24_LEDGER="$LEDGER" G24_STEWARD_VAULT="$STEWARD_VAULT" G24_UNALLOC_VAULT="$UNALLOC_VAULT"
export G24_SETTLEMENT_TOKEN="$SETTLEMENT_TOKEN" G24_JURIS="$JURIS"
$PY - <<'PY'
import json, os, pathlib
out = pathlib.Path(os.environ["G24_JURIS"])
doc = {
    "schema_version": 1,
    "description": "D-4555-B DE pilot · Sepolia addresses (G24-P-07 · filled from on-chain ledger reads)",
    "chain_id": 11155111,
    "entries": [{
        "jurisdiction": "DE",
        "COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS": os.environ["G24_LEDGER"],
        "COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS": os.environ["G24_STEWARD_VAULT"],
        "COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS": os.environ["G24_UNALLOC_VAULT"],
        "COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS": os.environ["G24_SETTLEMENT_TOKEN"],
    }],
}
out.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
print("wrote", out)
PY
pass_line "G24-P-07 DE registry → config/jurisdiction_country_pool_net_profit.sepolia.json"

# G24-P-08 · jurisdiction + stake pool（既有 Sepolia pool · GovFreeze 将部署新 Proxy）
[[ -n "${REGION_STEWARD_STAKE_POOL_ADDRESS:-}" ]] \
  || fail "G24-P-08: REGION_STEWARD_STAKE_POOL_ADDRESS required (legacy pool anchor)"
POOL_CODE="$(cast code "$REGION_STEWARD_STAKE_POOL_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0x)"
[[ "$POOL_CODE" != "0x" ]] || fail "G24-P-08: REGION_STEWARD_STAKE_POOL has no code"
pass_line "G24-P-08 Sepolia stake pool + jurisdiction registry present"

export G24_STAMP="$STAMP" G24_EVID="$EVID"
$PY - <<'PY'
import json, os
report = {
    "gate_ids": ["G24-P-05", "G24-P-06", "G24-P-07", "G24-P-08", "G24-P-09"],
    "stamp_utc": os.environ["G24_STAMP"],
    "phase": "②",
    "scope": "TTG-TOKENOMICS-FREEZE-V1 GovFreeze Sepolia pre-broadcast",
    "verdict": "PASS",
    "jurisdiction_registry": "config/jurisdiction_country_pool_net_profit.sepolia.json",
}
path = os.path.join(os.environ["G24_EVID"], f"g24-p-05-09-audit-{os.environ['G24_STAMP']}.json")
open(path, "w", encoding="utf-8").write(json.dumps(report, indent=2))
print(path)
PY

echo "G24_P_05_09_SUMMARY: PASS stamp=${STAMP}"
exit 0
