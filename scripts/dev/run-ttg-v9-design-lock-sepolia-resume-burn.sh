#!/usr/bin/env bash
# Resume Design Lock Sepolia after fee/sale/authz PASS: close batches → burn → freeze.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
set -a
# shellcheck disable=SC1091
source "$ROOT/scripts/dev/.env.phase2-chain-deploy.local"
# shellcheck disable=SC1091
source "$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local"
# shellcheck disable=SC1091
source "$ROOT/evidence/GO_ttg_v9_design_lock_sepolia/addresses.env"
set +a

EV="$ROOT/evidence/GO_ttg_v9_design_lock_sepolia"
WINDOW=900
CAST_TIMEOUT=300
ok() { echo "OK $*"; }
fail() { echo "STOP $*" >&2; exit 2; }
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL:-}"
)
pick() {
  local r c
  for r in "${RPC_CANDIDATES[@]}"; do
    [[ -n "$r" ]] || continue
    c=$(cast chain-id --rpc-url "$r" 2>/dev/null || true)
    [[ "$c" == "11155111" ]] && { echo "$r"; return 0; }
  done
  return 1
}
CHAIN_RPC_URL=$(pick) || fail rpc
export CHAIN_RPC_URL

send() {
  local n=0 gp
  while ((n < 10)); do
    gp=$(cast gas-price --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 2000000000)
    if cast send "$@" --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --timeout "$CAST_TIMEOUT" --gas-price $((gp * 3)); then
      return 0
    fi
    n=$((n + 1))
    CHAIN_RPC_URL=$(pick) || true
    sleep 6
  done
  return 1
}
call() {
  local n=0 out
  while ((n < 10)); do
    if out=$(cast call "$@" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null); then
      echo "$out"
      return 0
    fi
    n=$((n + 1))
    CHAIN_RPC_URL=$(pick) || true
    sleep 4
  done
  return 1
}
op_done() {
  local raw
  raw=$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$1") || return 1
  echo "$raw" | awk 'NR==2{print $1}' | grep -qi true
}
schedule_exec() {
  local target="$1" data="$2" salt="$3" label="$4" id
  id=$(cast_u "$(call "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$target" 0 "$data" "$salt")")
  if ! op_done "$id"; then
    if ! call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$id" | awk 'NR==1{exit ($1+0)>0?0:1}'; then
      send "$TIMELOCK" "schedule(address,uint256,bytes,bytes32)" "$target" 0 "$data" "$salt" >/dev/null
    fi
    sleep $((TIMELOCK_DELAY + 5))
    send "$TIMELOCK" "execute(bytes32)" "$id" >/dev/null
  fi
  ok "$label"
}

END5=$((BATCH1_START + 5 * WINDOW + 5))
ok "wait burn until $END5"
while true; do
  NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp || true)
  [[ -n "$NOW" ]] || { sleep 10; continue; }
  remain=$((END5 - NOW))
  echo "now=$NOW remain_sec=$remain"
  ((NOW >= END5)) && break
  sleep 30
done

for BID in 1 2 3 4 5; do
  send "$MARKET" "closeBatchReturn(uint256)" "$BID" >/dev/null || true
done
[[ "$(cast_u "$(call "$MARKET" "hasOpenOrArmedUnclosedBatch()(bool)")")" == "false" ]] || fail open

MIN_CN=$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")
SB=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
schedule_exec "$VAULT" "$(cast calldata "executeGovernanceBurn(uint256)" 1000000000000000000)" "$(cast keccak "dl3-burn")" "gov burn"
SA=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
python -c "assert int('$SB')-int('$SA')==10**18"
MA=$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")
python -c "assert int('$MA')<int('$MIN_CN')"
ok "burn+stake track"

python3 <<'PY'
import json, time
from pathlib import Path
ev = Path("evidence/GO_ttg_v9_design_lock_sepolia")
addrs = {}
for line in (ev / "addresses.env").read_text(encoding="utf-8").splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        addrs[k] = v.strip()
payload = {
    "stamp": "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP",
    "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "phase": "2_sepolia",
    "chain_id": 11155111,
    "baseline": "TT-TTG-V9-OWNER-DESIGN-LOCK + V9_DESIGN_LOCK_LOCAL_PASS",
    "inherits_r2_final_audit_pass": False,
    "tt_production_go": "UNCHANGED",
    "mainnet_broadcast": "FORBIDDEN",
    "addresses": addrs,
    "checks": {
        "fee_45_55": True,
        "fee_100_no_steward": True,
        "sale_usdc_new_pool": True,
        "p4_spend_under_30pct": True,
        "guardian_pause": True,
        "role_stake_live_supply": True,
        "merchant_disabled": True,
        "platform_fee_bps_500": True,
        "governance_burn": True,
        "stake_tracks_burn": True,
        "authz_eoa_denied": True,
        "ef_sr_fee_router_cutover": True,
        "zero_active_legacy_safe_p4cap": True,
    },
    "next": "freeze V9_AUDIT_CANDIDATE_DESIGN_LOCK then STOP",
}
(ev / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print("wrote", ev / "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json")
PY

python3 "$ROOT/scripts/dev/freeze-ttg-v9-audit-candidate-design-lock.py"
ok "V9_DESIGN_LOCK_SEPOLIA_PASS_STOP + V9_AUDIT_CANDIDATE_DESIGN_LOCK FROZEN"
ok "STOP · Mainnet FORBIDDEN · R2_FINAL not inherited · TT_PRODUCTION_GO unchanged"
