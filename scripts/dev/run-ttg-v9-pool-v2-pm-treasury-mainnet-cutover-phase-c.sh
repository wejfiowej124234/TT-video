#!/usr/bin/env bash
# V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER — Phase C (after 2nd 48h ETA)
# Execute setUsdcTreasury(V2) · Reality · LEGACY label · FREEZE STOP
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${TTG_V9_MAINNET_ENV:-$ROOT/scripts/dev/.env.mainnet-phase3-deploy.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_pool_v2_pm_treasury_mainnet_cutover"
PARTIAL="$EVIDENCE/phase_a.addresses.env"
MAINNET_CHAIN_ID=1
NORM_MARKETING="0xe1e732EfBf9B010a9204054467256d3d93f3CdD4"

fail() { echo "V9_MN_CUTOVER_C: STOP $*" >&2; exit 2; }
ok() { echo "V9_MN_CUTOVER_C: OK $*"; }
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

[[ -f "$PARTIAL" ]] || fail "missing Phase A addresses"
load_env_file "$ENV_FILE"
# shellcheck disable=SC1090
source "$PARTIAL"
[[ -n "${ID_TREAS:-}" ]] || fail "ID_TREAS missing — run Phase B first"
is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}" || fail "set TRAVELTRUST_MAINNET_BROADCAST_OK=1"
CHAIN_RPC_URL="$(pick_rpc)" || fail "RPC"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY"
[[ "$PRIVATE_KEY" != 0x* ]] && export PRIVATE_KEY="0x${PRIVATE_KEY}"
[[ "$(lc "$(cast wallet address --private-key "$PRIVATE_KEY")")" == "$(lc "$NORM_MARKETING")" ]] || fail "deployer"

NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" --field timestamp)"
mapfile -t opt < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_TREAS")
READY="${opt[0]%% *}"; DONE="${opt[1]}"
[[ "$DONE" == "true" || "$NOW" -ge "$READY" ]] || fail "TOO_EARLY setUsdcTreasury readyAt=$READY now=$NOW"

LEGACY0="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$LEGACY_POOL")")"
V20="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$POOL_V2")")"
CAP0="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "capBps()(uint256)")")"
PER0="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "periodSeconds()(uint256)")")"
SPENT0="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "p4SpentInPeriod()(uint256)")")"

if [[ "$DONE" != "true" ]]; then
  cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TL" "execute(bytes32)" "$ID_TREAS" >/dev/null || fail "execute setUsdcTreasury"
  ok "executed setUsdcTreasury(V2)"
else
  ok "setUsdcTreasury already executed"
fi

[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "usdcTreasury()(address)")")" == "$(lc "$POOL_V2")" ]] \
  || fail "PM usdcTreasury != V2"
[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$FEE" "projectPool()(address)")")" == "$(lc "$POOL_V2")" ]] \
  || fail "Fee projectPool != V2"

LEGACY1="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$LEGACY_POOL")")"
V21="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$POOL_V2")")"
[[ "$LEGACY1" == "$LEGACY0" ]] || fail "legacy USDC changed during treasury cutover"
CAP1="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "capBps()(uint256)")")"
PER1="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "periodSeconds()(uint256)")")"
SPENT1="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "p4SpentInPeriod()(uint256)")")"
[[ "$CAP1" == "$CAP0" && "$CAP1" == "3000" ]] || fail "cap drift"
[[ "$PER1" == "$PER0" && "$PER1" == "7776000" ]] || fail "period drift"
[[ "$SPENT1" == "$SPENT0" ]] || fail "spent drift"
ok "wiring Reality: PM+Fee → V2 · legacy Δ=0 · V2 economics 0-drift"

SEEDED="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "seededBatchCount()(uint256)")")"
BUY_REALITY="SKIPPED_SEEDED_BATCH_COUNT_0"
if [[ "$SEEDED" != "0" ]]; then
  ok "seededBatchCount=$SEEDED — Owner must fund min USDC buy separately if write Reality required this session"
  BUY_REALITY="GATED_MANUAL_MIN_BUY"
else
  ok "PM write-buy Reality blocked: seededBatchCount=0 (no economic param change; separate seedBatches later)"
fi

# LEGACY label + final freeze
python - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
ev=Path(r"$EVIDENCE")
now=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
legacy={
  "stamp": "V9_LEGACY_PHASE1_PROJECT_POOL_LABELED",
  "address": "$LEGACY_POOL",
  "label": "LEGACY_PHASE1_PROJECT_POOL",
  "reason": "Superseded by ProjectPoolV2 after PM setUsdcTreasury + Fee setProjectPool cutover",
  "successor_project_pool_v2": "$POOL_V2",
  "recorded_at_utc": now,
  "tt_production_go": "NO_GO",
}
(ev/"V9_LEGACY_PHASE1_PROJECT_POOL_LABELED.json").write_text(json.dumps(legacy, indent=2)+"\n", encoding="utf-8")
stop={
  "stamp": "V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_FREEZE_STOP",
  "machine_key": "V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER",
  "verdict": "STOP",
  "status": "MAINNET_CUTOVER_WIRING_PASS_FREEZE_STOP",
  "recorded_at_utc": now,
  "tt_production_go": "NO_GO",
  "addresses": {
    "project_pool_v2": "$POOL_V2",
    "pm": "$PM",
    "fee_router": "$FEE",
    "legacy_pool": "$LEGACY_POOL",
    "pm_impl": "$PM_IMPL",
    "pool_impl": "$POOL_IMPL",
  },
  "proofs": {
    "pm_usdcTreasury_is_v2": True,
    "fee_projectPool_is_v2": True,
    "legacy_usdc_delta_during_cutover": 0,
    "v2_cap_bps": 3000,
    "v2_period_seconds": 7776000,
    "pm_buy_write_reality": "$BUY_REALITY",
    "fee_write_reality": "READ_WIRING_PASS_CALLER_GATED",
  },
  "forbidden_next": ["guide_bond","staging","www_production","tt_production_go_flip","other_v9_edits"],
  "next_optional_owner": "After Timelock seedBatches, optional min USDC buy Reality; Fee caller path if needed",
}
(ev/"V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_FREEZE_STOP.json").write_text(
  json.dumps(stop, indent=2)+"\n", encoding="utf-8")
print("FREEZE_STOP stamped")
PY

ok "PHASE C COMPLETE — MAINNET CUTOVER FREEZE STOP"
echo "V9_MN_CUTOVER_C: DONE"
