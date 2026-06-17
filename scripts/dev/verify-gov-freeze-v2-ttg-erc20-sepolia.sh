#!/usr/bin/env bash
# GovFreeze V2 · TTG ERC20 approve/allowance/transferFrom 链上验收（Stake 前置）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "GOV_FREEZE_V2_TTG_ERC20_VERIFY: FAIL $*" >&2; exit 2; }
pass() { echo "GOV_FREEZE_V2_TTG_ERC20_VERIFY: PASS $*"; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

RPC="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
TTG="${GOVERNANCE_TOKEN_ADDRESS:-}"
POOL="${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-${GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS:-}}"
PM="${PRIMARY_MARKET_ADDRESS:-${GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS:-}}"
GOV="${GOVERNOR_ADDRESS:-${GOV_FREEZE_V2_GOVERNOR_ADDRESS:-}}"
PROBE="${TTG_ERC20_PROBE_WALLET:-0x0000000000000000000000000000000000000001}"

[[ -n "$TTG" ]] || fail "GOVERNANCE_TOKEN_ADDRESS unset"
[[ -n "$POOL" ]] || fail "stake pool unset"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${GOV_FREEZE_V2_TTG_EVID_DIR:-$ROOT/evidence/GO_phase2_gov_freeze_v2_ttg_erc20/${STAMP}}"
mkdir -p "$EVID"

checks=0
ok() { checks=$((checks + 1)); echo "TTG CHECK PASS: $*"; }

# pool.ttg() wired
pool_ttg="$(cast call "$POOL" "ttg()(address)" --rpc-url "$RPC" | awk '{print $1}')"
[[ "${pool_ttg,,}" == "${TTG,,}" ]] && ok "StakePool.ttg wired" || fail "StakePool.ttg=${pool_ttg} want ${TTG}"

if [[ -n "$PM" ]]; then
  pm_ttg="$(cast call "$PM" "ttg()(address)" --rpc-url "$RPC" | awk '{print $1}')"
  [[ "${pm_ttg,,}" == "${TTG,,}" ]] && ok "PrimaryMarket.ttg wired" || fail "PrimaryMarket.ttg=${pm_ttg}"
fi

if [[ -n "$GOV" ]]; then
  gov_ttg="$(cast call "$GOV" "token()(address)" --rpc-url "$RPC" | awk '{print $1}')"
  [[ "${gov_ttg,,}" == "${TTG,,}" ]] && ok "Governor.token wired" || fail "Governor.token=${gov_ttg}"
fi

# approve + allowance (eth_call from probe wallet — must not revert)
if ! cast call "$TTG" "approve(address,uint256)(bool)" "$POOL" 1 --from "$PROBE" --rpc-url "$RPC" >/dev/null 2>&1; then
  fail "approve() reverts on ${TTG} (legacy token without ERC20 approve?)"
fi
ok "approve() callable"

if ! cast call "$TTG" "allowance(address,address)(uint256)" "$PROBE" "$POOL" --rpc-url "$RPC" >/dev/null 2>&1; then
  fail "allowance() reverts on ${TTG}"
fi
ok "allowance() callable"

cat >"$EVID/gov-freeze-v2-ttg-erc20-verify.json" <<EOF
{
  "stamp_utc": "${STAMP}",
  "verdict": "PASS",
  "checks": ${checks},
  "governance_token": "${TTG}",
  "stake_pool": "${POOL}",
  "primary_market": "${PM}",
  "governor": "${GOV}"
}
EOF

pass "checks=${checks} report=${EVID}/gov-freeze-v2-ttg-erc20-verify.json"
exit 0
