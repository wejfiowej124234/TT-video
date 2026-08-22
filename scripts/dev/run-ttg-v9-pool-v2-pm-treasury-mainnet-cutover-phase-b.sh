#!/usr/bin/env bash
# V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER — Phase B (after 48h ETA)
# Execute PM upgrade + Fee setProjectPool; schedule setUsdcTreasury(V2); 0-drift check
# Auth: TRAVELTRUST_MAINNET_BROADCAST_OK=1 · refuse early execute
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${TTG_V9_MAINNET_ENV:-$ROOT/scripts/dev/.env.mainnet-phase3-deploy.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_pool_v2_pm_treasury_mainnet_cutover"
PARTIAL="$EVIDENCE/phase_a.addresses.env"
WAIT_STAMP="$EVIDENCE/V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_PHASE_A_SCHEDULED_WAIT.json"
MAINNET_CHAIN_ID=1
NORM_MARKETING="0xe1e732EfBf9B010a9204054467256d3d93f3CdD4"
PM_PIN_SHA="968d9ca61f00be35395d913e8e6a86759643eaf992836101817f4fb3854b34cb"
SALT_TREASURY="$(python -c "print('0x'+format(9003,'064x'))")"

fail() { echo "V9_MN_CUTOVER_B: STOP $*" >&2; exit 2; }
ok() { echo "V9_MN_CUTOVER_B: OK $*"; }
is_truthy() { case "${1:-}" in 1|true|TRUE|yes|YES|on|ON) return 0 ;; *) return 1 ;; esac; }
lc() { echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d '\r'; }
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }

load_env_file() {
  local f="$1"; [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"; line="${line#"${line%%[![:space:]]*}"}"; line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"; val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

pick_rpc() {
  local cands=("${CHAIN_RPC_URL:-}" "https://ethereum.publicnode.com" "https://ethereum-rpc.publicnode.com") _rpc _cid
  for _rpc in "${cands[@]}"; do
    [[ -n "$_rpc" ]] || continue
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$MAINNET_CHAIN_ID" ]] && { echo "$_rpc"; return 0; }
  done
  return 1
}

assert_exact_match_runtime() {
  local addr="$1" art="$2" pin="$3" tmp
  tmp="$(mktemp)"
  cast code --rpc-url "$CHAIN_RPC_URL" "$addr" >"$tmp"
  python - "$tmp" "$art" "$pin" <<'PY'
import hashlib, json, sys
from pathlib import Path
on_b = bytearray.fromhex(Path(sys.argv[1]).read_text().strip()[2:])
j = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8", errors="ignore"))
art = j["deployedBytecode"]["object"]; art = art[2:] if art.startswith("0x") else art
art_b = bytes.fromhex(art); pin = sys.argv[3]
if hashlib.sha256(art_b).hexdigest() != pin: raise SystemExit("pin mismatch")
if len(on_b) != len(art_b): raise SystemExit("len")
norm = bytearray(on_b); i = 0
while i < len(art_b):
    if art_b[i] == 0 and norm[i] != 0:
        j = i
        while j < len(art_b) and art_b[j] == 0: j += 1
        if (j - i) >= 20:
            for k in range(i, j): norm[k] = 0
            i = j; continue
        raise SystemExit(f"mismatch {i}")
    elif art_b[i] != norm[i]:
        raise SystemExit(f"mismatch {i}")
    i += 1
if bytes(norm) != art_b: raise SystemExit("norm fail")
print("exact_match_ok")
PY
  rm -f "$tmp"
}

[[ -f "$PARTIAL" && -f "$WAIT_STAMP" ]] || fail "missing Phase A artifacts"
load_env_file "$ENV_FILE"
# shellcheck disable=SC1090
source "$PARTIAL"
is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}" || fail "set TRAVELTRUST_MAINNET_BROADCAST_OK=1"
CHAIN_RPC_URL="$(pick_rpc)" || fail "no Mainnet RPC"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY"
[[ "$PRIVATE_KEY" != 0x* ]] && export PRIVATE_KEY="0x${PRIVATE_KEY}"
DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "$(lc "$DEPLOYER")" == "$(lc "$NORM_MARKETING")" ]] || fail "deployer"

NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" --field timestamp)"
mapfile -t opu < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_UP")
READY_UP="${opu[0]%% *}"; DONE_UP="${opu[1]}"
[[ "$DONE_UP" == "true" || "$NOW" -ge "$READY_UP" ]] || fail "TOO_EARLY upgrade readyAt=$READY_UP now=$NOW"

if [[ "$DONE_UP" != "true" ]]; then
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TL" "execute(bytes32)" "$ID_UP" >/dev/null || fail "execute upgrade"
  ok "executed PM upgrade"
else
  ok "PM upgrade already executed"
fi

# 0-drift (exclude version+impl)
snap_post() {
  {
    echo "version=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "version()(string)")"
    echo "usdcTreasury=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "usdcTreasury()(address)")"
    echo "timelock=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "timelock()(address)")"
    echo "guardian=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "guardian()(address)")"
    echo "paused=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "paused()(bool)")"
    echo "seededBatchCount=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "seededBatchCount()(uint256)")")"
    echo "usdc=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "usdc()(address)")"
    echo "ttg=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "ttg()(address)")"
    echo "vault=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "vault()(address)")"
    echo "impl=$(cast storage --rpc-url "$CHAIN_RPC_URL" "$PM" 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)"
    local i
    for i in 1 2 3 4 5; do
      echo "batch$i=$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" "$i" | tr '\n' ' ')"
    done
  } >"$EVIDENCE/pm_post_upgrade.snap"
}
snap_post
diff <(grep -vE '^(version|impl)=' "$EVIDENCE/pm_pre_upgrade.snap") \
     <(grep -vE '^(version|impl)=' "$EVIDENCE/pm_post_upgrade.snap") >/dev/null \
  || fail "PM 0-drift FAIL"
VER="$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "version()(string)")"
echo "$VER" | grep -q treasury_governed || fail "version $VER"
IMPL_ADDR="0x$(cast storage --rpc-url "$CHAIN_RPC_URL" "$PM" 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc | tr '[:upper:]' '[:lower:]' | sed 's/^0x//; s/^0*//; s/^/0000000000000000000000000000000000000000/; s/.*\(.\{40\}\)$/\1/')"
assert_exact_match_runtime "$IMPL_ADDR" \
  "$ROOT/contracts/out-ttg-v9/TtgBatchPrimaryMarket.sol/TtgBatchPrimaryMarket.json" "$PM_PIN_SHA"
ok "upgrade 0-drift + Exact-Match + $VER"

# Execute Fee setProjectPool if ready
mapfile -t opf < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_FEE")
READY_FEE="${opf[0]%% *}"; DONE_FEE="${opf[1]}"
NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" --field timestamp)"
if [[ "$DONE_FEE" == "true" ]]; then
  ok "fee setProjectPool already done"
elif [[ "$NOW" -ge "$READY_FEE" ]]; then
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TL" "execute(bytes32)" "$ID_FEE" >/dev/null || fail "execute fee"
  ok "executed Fee setProjectPool"
else
  fail "TOO_EARLY fee readyAt=$READY_FEE"
fi
[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$FEE" "projectPool()(address)")")" == "$(lc "$POOL_V2")" ]] \
  || fail "Fee projectPool != V2"

# Schedule ③ setUsdcTreasury(V2)
# EOA deny
if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$PM" "setUsdcTreasury(address)" "$POOL_V2" >/dev/null 2>&1; then
  fail "EOA setUsdcTreasury should revert"
fi
ok "EOA setUsdcTreasury rejected"
TREAS_DATA="$(cast calldata "setUsdcTreasury(address)" "$POOL_V2")"
ID_TREAS="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$PM" 0 "$TREAS_DATA" "$SALT_TREASURY" | awk '{print $1}')"
mapfile -t opt < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_TREAS")
if [[ "${opt[1]}" == "true" ]]; then
  ok "setUsdcTreasury already executed"
elif [[ -z "${opt[0]%% *}" || "${opt[0]%% *}" == "0" ]]; then
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TL" "schedule(address,uint256,bytes,bytes32)" "$PM" 0 "$TREAS_DATA" "$SALT_TREASURY" >/dev/null \
    || fail "schedule setUsdcTreasury"
  ok "scheduled setUsdcTreasury id=$ID_TREAS"
else
  ok "setUsdcTreasury already scheduled"
fi
mapfile -t opt < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_TREAS")
ETA_TREAS="${opt[0]%% *}"

{
  echo "ID_TREAS=$ID_TREAS"
  echo "SALT_TREASURY=$SALT_TREASURY"
  echo "ETA_TREAS=$ETA_TREAS"
} >>"$PARTIAL"

python - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
ev=Path(r"$EVIDENCE")
eta=int("$ETA_TREAS")
payload={
  "stamp": "V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_PHASE_B_TREASURY_SCHEDULED_WAIT",
  "verdict": "WAIT_TIMELOCK_ETA_SET_USDC_TREASURY",
  "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "pm_upgrade": "EXECUTED_0_DRIFT",
  "fee_set_project_pool": "EXECUTED",
  "id_set_usdc_treasury": "$ID_TREAS",
  "eta_set_usdc_treasury": eta,
  "eta_utc": datetime.fromtimestamp(eta, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "pool_v2": "$POOL_V2",
  "tt_production_go": "NO_GO",
  "next": "phase-c execute setUsdcTreasury + Reality + LEGACY freeze STOP",
}
(ev/"V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_PHASE_B_TREASURY_SCHEDULED_WAIT.json").write_text(
  json.dumps(payload, indent=2)+"\n", encoding="utf-8")
print("PHASE_B_WAIT eta", eta)
PY
ok "PHASE B COMPLETE — WAIT second ETA for setUsdcTreasury"
echo "V9_MN_CUTOVER_B: DONE"
