#!/usr/bin/env bash
# V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER — Phase A
# Deploy Exact-Match ProjectPoolV2 + schedule PM UUPS upgrade + Fee setProjectPool
# Auth: Owner written auth this session + TRAVELTRUST_MAINNET_BROADCAST_OK=1
# FORBID: rebuild unfrozen bytecode · source/param edit · TT_PRODUCTION_GO · Guide Bond/Staging/www
# Timelock delay=172800 → Phase B execute after ETA (separate resume script)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${TTG_V9_MAINNET_ENV:-$ROOT/scripts/dev/.env.mainnet-phase3-deploy.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_pool_v2_pm_treasury_mainnet_cutover"
PM_PIN_EV="$ROOT/evidence/GO_ttg_v9_pm_treasury_governed_sepolia"
POOL_PIN_EV="$ROOT/evidence/GO_ttg_v9_project_pool_v2_sepolia"
MAINNET_CHAIN_ID=1
NORM_MARKETING="0xe1e732EfBf9B010a9204054467256d3d93f3CdD4"
TL="0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f"
PM="0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b"
FEE="0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970"
LEGACY_POOL="0x7B21b421981A3B61cc08c8E22D4fd690E457Df37"
USDC="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
PM_PIN_SHA="968d9ca61f00be35395d913e8e6a86759643eaf992836101817f4fb3854b34cb"
POOL_PIN_SHA="a93ae30f436a4c1a75faee8b6b7d5d7e24904481a159bc746bab7a4bbf0cbaa3"
SALT_UPGRADE="$(python -c "print('0x'+format(9001,'064x'))")"
SALT_FEE="$(python -c "print('0x'+format(9002,'064x'))")"

fail() { echo "V9_MN_CUTOVER_A: STOP $*" >&2; exit 2; }
ok() { echo "V9_MN_CUTOVER_A: OK $*"; }
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

RPC_CANDIDATES=()
pick_rpc() {
  local _rpc _cid
  for _rpc in "${RPC_CANDIDATES[@]}"; do
    [[ -n "$_rpc" ]] || continue
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$MAINNET_CHAIN_ID" ]] || continue
    echo "$_rpc"; return 0
  done
  return 1
}

artifact_sha() {
  python - "$1" <<'PY'
import hashlib,json,sys
from pathlib import Path
j=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8',errors='ignore'))
bc=j['deployedBytecode']['object']
if bc.startswith('0x'): bc=bc[2:]
print(hashlib.sha256(bytes.fromhex(bc)).hexdigest())
PY
}

assert_exact_match_runtime() {
  local addr="$1" art="$2" pin="$3"
  local tmp
  tmp="$(mktemp)"
  cast code --rpc-url "$CHAIN_RPC_URL" "$addr" >"$tmp"
  python - "$tmp" "$art" "$pin" <<'PY'
import hashlib, json, sys
from pathlib import Path
on = Path(sys.argv[1]).read_text(encoding="utf-8").strip()
if not on.startswith("0x"):
    raise SystemExit("bad on-chain code")
on_b = bytearray.fromhex(on[2:])
j = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8", errors="ignore"))
art = j["deployedBytecode"]["object"]
if art.startswith("0x"):
    art = art[2:]
art_b = bytes.fromhex(art)
pin = sys.argv[3]
art_sha = hashlib.sha256(art_b).hexdigest()
if art_sha != pin:
    raise SystemExit(f"artifact sha {art_sha} != pin {pin}")
if len(on_b) != len(art_b):
    raise SystemExit(f"len mismatch on={len(on_b)} art={len(art_b)}")
norm = bytearray(on_b)
i = 0
while i < len(art_b):
    if art_b[i] == 0 and norm[i] != 0:
        j = i
        while j < len(art_b) and art_b[j] == 0:
            j += 1
        if (j - i) >= 20:
            for k in range(i, j):
                norm[k] = 0
            i = j
            continue
        raise SystemExit(f"non-immutable mismatch at byte {i}")
    elif art_b[i] != norm[i]:
        raise SystemExit(f"bytecode mismatch at byte {i}")
    i += 1
if bytes(norm) != art_b:
    raise SystemExit("runtime not Exact-Match after immutable normalize")
print("exact_match_ok")
PY
  rm -f "$tmp"
}

forge_create_offline() {
  local artifact="$1"; shift
  local attempt=1 out_file err_file
  out_file="$(mktemp)"; err_file="$(mktemp)"
  while [[ $attempt -le 6 ]]; do
    CHAIN_RPC_URL="$(pick_rpc)" || true
    if ( cd "$ROOT/contracts" && FOUNDRY_PROFILE=ttg_v9 forge create --offline \
      --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --json \
      "$artifact" "$@" >"$out_file" 2>"$err_file" ); then
      if python - "$out_file" <<'PY'
import json,re,sys
from pathlib import Path
raw=Path(sys.argv[1]).read_text(encoding='utf-8',errors='ignore')
m=re.search(r'\{[^{}]*"deployedTo"[^{}]*\}', raw, re.S)
if not m:
    start=raw.find('{'); end=raw.rfind('}')
    if start<0 or end<=start: raise SystemExit(raw[:200])
    obj=json.loads(raw[start:end+1])
else:
    obj=json.loads(m.group(0))
print(obj['deployedTo'])
PY
      then
        rm -f "$out_file" "$err_file"; return 0
      fi
    fi
    sleep 4; attempt=$((attempt+1))
  done
  cat "$out_file" >&2 || true; cat "$err_file" >&2 || true
  rm -f "$out_file" "$err_file"
  fail "forge create --offline $artifact"
}

cast_send_retry() {
  local attempt=1 err; err="$(mktemp)"
  while [[ $attempt -le 8 ]]; do
    CHAIN_RPC_URL="$(pick_rpc)" || true
    if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" "$@" >/dev/null 2>"$err"; then
      rm -f "$err"; return 0
    fi
    sleep 3; attempt=$((attempt+1))
  done
  cat "$err" >&2 || true; rm -f "$err"; return 1
}

snap_pm() {
  local out="$1"
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
  } >"$out"
}

mkdir -p "$EVIDENCE"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
load_env_file "$ENV_FILE"

is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}" || fail "set TRAVELTRUST_MAINNET_BROADCAST_OK=1"
is_truthy "${TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK:-}" && fail "refusing Sepolia rehearsal flag on Mainnet"
is_truthy "${TRAVELTRUST_TTG_V9_PM_TREASURY_SEPOLIA_OK:-}" && fail "refusing Sepolia PM flag on Mainnet"

# Hard gate: Final Pre-Broadcast Security + Source Hygiene PASS required
HYGIENE_PASS="$EVIDENCE/V9_MAINNET_FINAL_PRE_BROADCAST_SECURITY_SOURCE_HYGIENE_PASS.json"
HYGIENE_STOP="$EVIDENCE/V9_MAINNET_FINAL_PRE_BROADCAST_SECURITY_SOURCE_HYGIENE_STOP.json"
[[ -f "$HYGIENE_PASS" ]] || fail "missing $HYGIENE_PASS — run V9_MAINNET_FINAL_PRE_BROADCAST_SECURITY_AND_SOURCE_HYGIENE_GATE to PASS first (see $HYGIENE_STOP)"
python - "$HYGIENE_PASS" <<'PY' || fail "hygiene PASS stamp invalid"
import json,sys
from pathlib import Path
j=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
assert j.get('verdict')=='PASS' or j.get('stamp')=='V9_MAINNET_FINAL_PRE_BROADCAST_SECURITY_SOURCE_HYGIENE_PASS'
assert j.get('tt_production_go','NO_GO')=='NO_GO'
print('hygiene_pass_ok')
PY
ok "Pre-Broadcast Security+Source Hygiene PASS present"

[[ -f "$PM_PIN_EV/V9_PM_TREASURY_GOVERNED_SEPOLIA_FREEZE_STOP.json" ]] \
  || fail "missing PM Sepolia Freeze STOP"
[[ -f "$POOL_PIN_EV/V9_PROJECT_POOL_V2_SEPOLIA_SECURITY_FREEZE_STOP.json" ]] \
  || fail "missing PoolV2 Sepolia Freeze STOP"
[[ -f "$PM_PIN_EV/V9_PRIMARY_MARKET_TREASURY_GOVERNED_EXACT_MATCH_ARTIFACT.json" ]] \
  || fail "missing PM Exact-Match artifact"
[[ -f "$POOL_PIN_EV/V9_PROJECT_POOL_V2_EXACT_MATCH_ARTIFACT.json" ]] \
  || fail "missing PoolV2 Exact-Match artifact"

# FORBID rebuild: gate on existing out-ttg-v9 artifacts only (--offline deploy)
PM_ART="$ROOT/contracts/out-ttg-v9/TtgBatchPrimaryMarket.sol/TtgBatchPrimaryMarket.json"
POOL_ART="$ROOT/contracts/out-ttg-v9/TtgV9ProjectPoolV2.sol/TtgV9ProjectPoolV2.json"
[[ "$(artifact_sha "$PM_ART")" == "$PM_PIN_SHA" ]] || fail "PM artifact != frozen pin (do not rebuild)"
[[ "$(artifact_sha "$POOL_ART")" == "$POOL_PIN_SHA" ]] || fail "PoolV2 artifact != frozen pin (do not rebuild)"
ok "Exact-Match artifacts match frozen pins (no rebuild)"

RPC_CANDIDATES=(
  "${CHAIN_RPC_URL:-}"
  "https://ethereum.publicnode.com"
  "https://ethereum-rpc.publicnode.com"
)
CHAIN_RPC_URL="$(pick_rpc)" || fail "no Mainnet RPC"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY"
[[ "$PRIVATE_KEY" != 0x* && "$PRIVATE_KEY" != 0X* ]] && export PRIVATE_KEY="0x${PRIVATE_KEY}"
DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "$(lc "$DEPLOYER")" == "$(lc "$NORM_MARKETING")" ]] || fail "deployer $DEPLOYER != Norm Marketing"

# Live gates
[[ "$(cast chain-id --rpc-url "$CHAIN_RPC_URL")" == "$MAINNET_CHAIN_ID" ]] || fail "not chain_id=1"
[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" "admin()(address)")")" == "$(lc "$NORM_MARKETING")" ]] \
  || fail "Timelock admin mismatch"
DELAY="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" "delay()(uint256)")")"
[[ "$DELAY" == "172800" ]] || fail "delay=$DELAY != 172800"
[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "timelock()(address)")")" == "$(lc "$TL")" ]] \
  || fail "PM timelock mismatch"
[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "usdcTreasury()(address)")")" == "$(lc "$LEGACY_POOL")" ]] \
  || fail "PM treasury not legacy pool (unexpected)"
[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$FEE" "owner()(address)")")" == "$(lc "$TL")" ]] \
  || fail "FeeRouter owner != Timelock"
[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$FEE" "projectPool()(address)")")" == "$(lc "$LEGACY_POOL")" ]] \
  || fail "Fee projectPool not legacy (unexpected)"
[[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$PM" "usdc()(address)")")" == "$(lc "$USDC")" ]] \
  || fail "PM usdc != Circle"
LEGACY_BAL="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$LEGACY_POOL")")"
ok "live gates PASS delay=$DELAY legacy_usdc=$LEGACY_BAL"

# Record Owner auth for this wave
python - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
ev=Path(r"$EVIDENCE")
payload={
  "stamp": "V9_OWNER_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_AUTHORIZATION_RECORDED",
  "machine_key": "V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER",
  "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "chain_id": 1,
  "owner_auth": "written_this_session",
  "candidates": {
    "project_pool_v2_exact_match_sha256": "$POOL_PIN_SHA",
    "pm_treasury_governed_exact_match_sha256": "$PM_PIN_SHA",
    "sepolia_status_required": "SEPOLIA_REALITY_PASS_EXACT_MATCH_SECURITY_FREEZE_STOP",
  },
  "forbidden": [
    "rebuild_unfrozen_bytecode",
    "ad_hoc_source_or_param_edit",
    "guide_bond",
    "staging_full_reality",
    "official_www_production_pin",
    "other_v9_contract_edits",
    "tt_production_go_flip",
  ],
  "tt_production_go": "NO_GO",
}
(ev/"V9_OWNER_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_AUTHORIZATION_RECORDED.json").write_text(
  json.dumps(payload, indent=2)+"\n", encoding="utf-8")
print("auth recorded")
PY

# Resume if Pool already deployed
PARTIAL="$EVIDENCE/phase_a.addresses.env"
if [[ -f "$PARTIAL" ]]; then
  # shellcheck disable=SC1090
  source "$PARTIAL"
  ok "resume POOL_V2=$POOL_V2 IMPL=$POOL_IMPL PM_IMPL=$PM_IMPL"
else
  # ① Deploy ProjectPoolV2 Exact-Match (offline)
  POOL_IMPL="$(forge_create_offline src/ttg-v9/TtgV9ProjectPoolV2.sol:TtgV9ProjectPoolV2)"
  assert_exact_match_runtime "$POOL_IMPL" "$POOL_ART" "$POOL_PIN_SHA"
  ok "PoolV2 impl Exact-Match $POOL_IMPL"

  POOL_INIT="$(cast calldata "initialize(address,address,address,uint256)" "$TL" "$TL" "$USDC" 3000)"
  POOL_V2="$(forge_create_offline src/ttg-v9/TtgV9ERC1967Proxy.sol:TtgV9ERC1967Proxy \
    --constructor-args "$POOL_IMPL" "$POOL_INIT")"
  ok "PoolV2 proxy $POOL_V2"

  # Verify economics / ACL
  [[ "$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "capBps()(uint256)")")" == "3000" ]] \
    || fail "capBps"
  [[ "$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "periodSeconds()(uint256)")")" == "7776000" ]] \
    || fail "periodSeconds"
  [[ "$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "MAX_CAP_BPS()(uint256)")")" == "10000" ]] \
    || fail "MAX_CAP_BPS"
  [[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "owner()(address)")")" == "$(lc "$TL")" ]] \
    || fail "pool owner"
  [[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "spender()(address)")")" == "$(lc "$TL")" ]] \
    || fail "pool spender"
  [[ "$(lc "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "reserveToken()(address)")")" == "$(lc "$USDC")" ]] \
    || fail "reserveToken != Circle USDC"
  echo "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL_V2" "version()(string)")" \
    | grep -q project_pool_v2 || fail "pool version"
  ok "PoolV2 proxy economics/ACL Exact-Match PASS"

  # Deploy PM treasury_governed impl (offline Exact-Match) for upgrade target
  PM_IMPL="$(forge_create_offline src/ttg-v9/TtgBatchPrimaryMarket.sol:TtgBatchPrimaryMarket)"
  assert_exact_match_runtime "$PM_IMPL" "$PM_ART" "$PM_PIN_SHA"
  ok "PM treasury_governed impl Exact-Match $PM_IMPL"

  cat >"$PARTIAL" <<EOF
POOL_V2=$POOL_V2
POOL_IMPL=$POOL_IMPL
PM_IMPL=$PM_IMPL
TL=$TL
PM=$PM
FEE=$FEE
LEGACY_POOL=$LEGACY_POOL
USDC=$USDC
DEPLOYER=$DEPLOYER
SALT_UPGRADE=$SALT_UPGRADE
SALT_FEE=$SALT_FEE
PM_PIN_SHA=$PM_PIN_SHA
POOL_PIN_SHA=$POOL_PIN_SHA
EOF
fi

# Pre-upgrade PM snap
snap_pm "$EVIDENCE/pm_pre_upgrade.snap"
ok "PM pre-upgrade snap"

# Allow Timelock targets
for t in "$PM" "$FEE" "$POOL_V2"; do
  cast_send_retry "$TL" "setAllowedExecutionTarget(address,bool)" "$t" true \
    || fail "setAllowedExecutionTarget $t"
done
ok "allowed targets PM/FEE/POOL_V2"

# Schedule ② PM upgrade (execute after 48h)
UP_DATA="$(cast calldata "upgradeToAndCall(address,bytes)" "$PM_IMPL" 0x)"
ID_UP="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$PM" 0 "$UP_DATA" "$SALT_UPGRADE" | awk '{print $1}')"
mapfile -t opu < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_UP")
if [[ "${opu[1]}" == "true" ]]; then
  ok "upgrade already executed"
elif [[ -z "${opu[0]%% *}" || "${opu[0]%% *}" == "0" ]]; then
  cast_send_retry "$TL" "schedule(address,uint256,bytes,bytes32)" "$PM" 0 "$UP_DATA" "$SALT_UPGRADE" \
    || fail "schedule upgrade"
  ok "scheduled PM upgrade id=$ID_UP"
else
  ok "upgrade already scheduled readyAt=${opu[0]%% *}"
fi

# Schedule ④ Fee setProjectPool (can execute same ETA as upgrade; ③ setTreasury after upgrade)
FEE_DATA="$(cast calldata "setProjectPool(address)" "$POOL_V2")"
ID_FEE="$(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$FEE" 0 "$FEE_DATA" "$SALT_FEE" | awk '{print $1}')"
mapfile -t opf < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_FEE")
if [[ "${opf[1]}" == "true" ]]; then
  ok "fee setProjectPool already executed"
elif [[ -z "${opf[0]%% *}" || "${opf[0]%% *}" == "0" ]]; then
  cast_send_retry "$TL" "schedule(address,uint256,bytes,bytes32)" "$FEE" 0 "$FEE_DATA" "$SALT_FEE" \
    || fail "schedule fee setProjectPool"
  ok "scheduled Fee setProjectPool id=$ID_FEE"
else
  ok "fee already scheduled readyAt=${opf[0]%% *}"
fi

# Refresh readyAt
mapfile -t opu < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_UP")
mapfile -t opf < <(cast call --rpc-url "$CHAIN_RPC_URL" "$TL" \
  "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_FEE")
ETA_UP="${opu[0]%% *}"
ETA_FEE="${opf[0]%% *}"
NOW="$(cast block --rpc-url "$CHAIN_RPC_URL" --field timestamp)"

python - <<PY
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
ev=Path(r"$EVIDENCE")
eta_up=int("$ETA_UP"); eta_fee=int("$ETA_FEE"); now=int("$NOW")
payload={
  "stamp": "V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_PHASE_A_SCHEDULED_WAIT",
  "machine_key": "V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER",
  "phase": "A_DEPLOY_AND_SCHEDULE",
  "verdict": "WAIT_TIMELOCK_ETA",
  "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "chain_id": 1,
  "tt_production_go": "NO_GO",
  "addresses": {
    "solo_timelock": "$TL",
    "primary_market": "$PM",
    "country_fee_router": "$FEE",
    "legacy_phase1_project_pool": "$LEGACY_POOL",
    "project_pool_v2_proxy": "$POOL_V2",
    "project_pool_v2_impl": "$POOL_IMPL",
    "pm_treasury_governed_impl": "$PM_IMPL",
    "circle_usdc": "$USDC",
  },
  "exact_match": {
    "pool_v2_sha256": "$POOL_PIN_SHA",
    "pm_sha256": "$PM_PIN_SHA",
  },
  "scheduled": {
    "id_pm_upgrade": "$ID_UP",
    "id_fee_set_project_pool": "$ID_FEE",
    "salt_upgrade": "$SALT_UPGRADE",
    "salt_fee": "$SALT_FEE",
    "eta_pm_upgrade": eta_up,
    "eta_fee_set_project_pool": eta_fee,
    "eta_pm_upgrade_utc": datetime.fromtimestamp(eta_up, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "eta_fee_utc": datetime.fromtimestamp(eta_fee, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "now": now,
    "wait_seconds_upgrade": max(0, eta_up-now),
  },
  "phase_b_after_eta": [
    "execute PM upgrade id",
    "verify PM 0-drift + Exact-Match + version treasury_governed",
    "schedule setUsdcTreasury(POOL_V2) (requires live setter)",
    "execute Fee setProjectPool",
  ],
  "phase_c_after_second_eta": [
    "execute setUsdcTreasury(POOL_V2)",
    "Mainnet Reality (Fee path; PM buy gated on seededBatchCount>0)",
    "label LEGACY_PHASE1_PROJECT_POOL + FREEZE STOP",
  ],
  "note_seeded_batch_count_0": "Mainnet PM seededBatchCount=0 — write buy Reality blocked until separate Timelock seedBatches; Fee path Reality still required after cutover wiring",
  "forbidden": ["early_execute_before_eta","hot_fix","redeploy_bypass","tt_production_go_flip"],
}
(ev/"V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER_PHASE_A_SCHEDULED_WAIT.json").write_text(
  json.dumps(payload, indent=2)+"\n", encoding="utf-8")
# append op ids to partial
open(ev/"phase_a.addresses.env","a",encoding="utf-8").write(
  f"ID_UP=$ID_UP\nID_FEE=$ID_FEE\nETA_UP={eta_up}\nETA_FEE={eta_fee}\n")
print("PHASE_A_WAIT eta_up", eta_up, "wait_s", max(0,eta_up-now))
PY

ok "PHASE A COMPLETE — WAIT Timelock ETA then run phase-b execute script"
echo "V9_MN_CUTOVER_A: DONE"
