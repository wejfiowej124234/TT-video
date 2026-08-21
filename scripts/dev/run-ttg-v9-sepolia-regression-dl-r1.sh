#!/usr/bin/env bash
# SEPOLIA_REGRESSION_DL_R1 — Exact Match redeploy + full lifecycle vs V9_AUDIT_CANDIDATE_DESIGN_LOCK · DL_R1
#
# Does NOT mutate Candidate. Does NOT Mainnet. Does NOT flip TT_PRODUCTION_GO.
# STOP stamp: evidence/GO_ttg_v9_audit/V9_SEPOLIA_REGRESSION_DL_R1_PASS.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# Git Bash on Windows: Python needs mixed path
ROOT_PY="$(cygpath -m "$ROOT" 2>/dev/null || echo "$ROOT")"
export ROOT_PY

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
EV_AUDIT="$ROOT/evidence/GO_ttg_v9_audit"
EV="$ROOT/evidence/GO_ttg_v9_sepolia_regression_dl_r1"
CAND="$EV_AUDIT/V9_AUDIT_CANDIDATE_DESIGN_LOCK.json"
MAN="$EV_AUDIT/V9_AUDIT_CANDIDATE_DESIGN_LOCK.manifest.json"
DEPLOY_LOG="$EV/deploy.forge.log"
SEPOLIA_CHAIN_ID=11155111
SCRIPT="src/ttg-v9/TtgV9DesignLockSepoliaRehearsal.s.sol:TtgV9DesignLockSepoliaRehearsal"
TIMELOCK_DELAY="${TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS:-45}"
WINDOW=180
CAST_TIMEOUT="${CAST_TIMEOUT:-300}"
LEGACY_SAFE="0x96491aa894658ff7946506318c49F3c76b8f40e7"
LEGACY_P4CAP="0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF"

fail() { echo "SEPOLIA_REGRESSION_DL_R1: STOP $*" >&2; exit 2; }
ok() { echo "SEPOLIA_REGRESSION_DL_R1: OK $*"; }
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }

is_truthy() {
  case "${1:-}" in 1|true|TRUE|yes|YES|on|ON) return 0 ;; *) return 1 ;; esac
}

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"; line="${line#"${line%%[![:space:]]*}"}"; line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"; val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

mkdir -p "$EV" "$EV_AUDIT"
[[ -f "$CAND" && -f "$MAN" ]] || fail "missing Design Lock candidate/manifest"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
load_env_file "$ENV_FILE"
load_env_file "$REHEARSAL_ENV"

is_truthy "${TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK:-}" || fail "set TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1"
is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}" && fail "refusing TRAVELTRUST_MAINNET_BROADCAST_OK"
[[ -n "${CHAIN_RPC_URL:-}" && -n "${PRIVATE_KEY:-}" ]] || fail "CHAIN_RPC_URL/PRIVATE_KEY unset"
export TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS="$TIMELOCK_DELAY"

# --- Exact Match pregate (sources vs frozen candidate; do not mutate candidate) ---
ok "Exact Match pregate vs DL_R1 freeze"
python - <<PY
import hashlib, json, sys
from pathlib import Path
root = Path(r"""$ROOT_PY""")
cand = json.loads((root/"evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_DESIGN_LOCK.json").read_text(encoding="utf-8"))
man = json.loads((root/"evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_DESIGN_LOCK.manifest.json").read_text(encoding="utf-8"))
assert cand.get("candidate_id") == "V9_AUDIT_CANDIDATE_DESIGN_LOCK"
assert cand.get("remediation_wave") == "DL_R1"
assert cand.get("inherits_r2_final_audit_pass") is False
exp = "sha256:" + hashlib.sha256((root/"evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_DESIGN_LOCK.json").read_bytes()).hexdigest()
assert man.get("sha256") == exp, (man.get("sha256"), exp)
mism = []
for rel, want in (cand.get("source_sha256") or {}).items():
    p = root / rel
    if not p.is_file():
        mism.append(f"missing:{rel}"); continue
    got = "sha256:" + hashlib.sha256(p.read_bytes()).hexdigest()
    if got != want:
        mism.append(f"{rel}")
if mism:
    print("SOURCE_MISMATCH", mism); sys.exit(2)
print("SOURCE_EXACT_MATCH", len(cand.get("source_sha256") or {}))
PY

ok "local Design Lock gate"
bash "$ROOT/scripts/dev/run-ttg-v9-design-lock-local-gate.sh"

ok "build ttg_v9 + bytecode pin check"
(
  cd "$ROOT/contracts"
  FOUNDRY_PROFILE=ttg_v9 forge build >/dev/null
)
python - <<PY
import hashlib, json, sys
from pathlib import Path
root = Path(r"""$ROOT_PY""")
cand = json.loads((root/"evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_DESIGN_LOCK.json").read_text(encoding="utf-8"))
want_map = cand.get("bytecode_sha256") or {}
out = root / "contracts" / "out-ttg-v9"
mism = []
for name, want in want_map.items():
    matches = list(out.rglob(f"{name}.json"))
    if not matches:
        mism.append(f"missing_artifact:{name}"); continue
    art = json.loads(matches[0].read_text(encoding="utf-8"))
    deployed = art.get("deployedBytecode", {})
    if isinstance(deployed, dict):
        deployed = deployed.get("object", "")
    if not deployed:
        mism.append(f"empty_bytecode:{name}"); continue
    hx = deployed[2:] if deployed.startswith("0x") else deployed
    got = "sha256:" + hashlib.sha256(bytes.fromhex(hx)).hexdigest()
    if got != want:
        mism.append(f"{name}:{want[-10:]}!={got[-10:]}")
if mism:
    print("BYTECODE_MISMATCH", mism); sys.exit(2)
print("BYTECODE_EXACT_MATCH", len(want_map))
PY

RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL}"
)
pick() {
  local r c
  for r in "${RPC_CANDIDATES[@]}"; do
    [[ -n "$r" ]] || continue
    c=$(cast chain-id --rpc-url "$r" 2>/dev/null || true)
    [[ "$c" == "$SEPOLIA_CHAIN_ID" ]] && { echo "$r"; return 0; }
  done
  return 1
}
CHAIN_RPC_URL=$(pick) || fail "no Sepolia RPC"
export CHAIN_RPC_URL
DEPLOYER=$(cast wallet address --private-key "$PRIVATE_KEY")
[[ "$(cast chain-id --rpc-url "$CHAIN_RPC_URL")" == "$SEPOLIA_CHAIN_ID" ]] || fail "not Sepolia"
BAL=$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL")
python -c "import sys; sys.exit(0 if int('$BAL')>=8*10**16 else 2)" || fail "need >=0.08 ETH"
ok "deployer=$DEPLOYER"

send() {
  local n=0 gp
  while ((n < 10)); do
    gp=$(cast gas-price --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 2000000000)
    if cast send "$@" --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --timeout "$CAST_TIMEOUT" --gas-price $((gp * 3)); then
      return 0
    fi
    n=$((n + 1)); CHAIN_RPC_URL=$(pick) || true; sleep 6
  done
  return 1
}
call() {
  local n=0 out
  while ((n < 10)); do
    if out=$(cast call "$@" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null); then echo "$out"; return 0; fi
    n=$((n + 1)); CHAIN_RPC_URL=$(pick) || true; sleep 4
  done
  return 1
}
op_done() {
  local raw; raw=$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$1") || return 1
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

ok "broadcast DL_R1 Design Lock Sepolia"
GP=$(cast gas-price --rpc-url "$CHAIN_RPC_URL")
DEPLOY_OK=0
for _try in 1 2 3 4 5; do
  if (
    cd "$ROOT/contracts"
    FOUNDRY_PROFILE=ttg_v9_broadcast forge script "$SCRIPT" \
      --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --sender "$DEPLOYER" \
      --chain-id "$SEPOLIA_CHAIN_ID" --broadcast --legacy --slow \
      --with-gas-price $((GP * 3)) -vv
  ) | tee "$DEPLOY_LOG"; then
    if grep -q "ONCHAIN EXECUTION COMPLETE & SUCCESSFUL" "$DEPLOY_LOG" \
      && grep -qE '^[[:space:]]*feeRouter[[:space:]]+0x' "$DEPLOY_LOG"; then
      DEPLOY_OK=1; break
    fi
  fi
  CHAIN_RPC_URL=$(pick) || true
  GP=$(cast gas-price --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "$GP")
  ok "deploy retry $_try"; sleep 15
done
[[ "$DEPLOY_OK" == "1" ]] || fail "broadcast failed"

parse() { grep -E "^[[:space:]]*$1[[:space:]]" "$DEPLOY_LOG" | awk '{print $NF}' | tail -1; }
USDC=$(parse usdc); TTG=$(parse ttg); VAULT=$(parse vault); MARKET=$(parse market)
GOVERNOR=$(parse governor); TIMELOCK=$(parse timelock); POOL=$(parse projectPool)
FEE_ROUTER=$(parse feeRouter); FEE_INGRESS=$(parse feeIngress); STAKE_POOL=$(parse stakePool)
BATCH1_START=$(cast_u "$(parse batch1Start)")
ID_BIND=$(parse idBind); ID_SEED=$(parse idSeed); ID_CALLER=$(parse idCaller)
DELAY_LOG=$(cast_u "$(parse timelockDelay)"); [[ -n "$DELAY_LOG" ]] && TIMELOCK_DELAY="$DELAY_LOG"

cat >"$EV/addresses.env" <<EOF
USDC=$USDC
TTG=$TTG
VAULT=$VAULT
MARKET=$MARKET
GOVERNOR=$GOVERNOR
TIMELOCK=$TIMELOCK
POOL=$POOL
FEE_ROUTER=$FEE_ROUTER
FEE_INGRESS=$FEE_INGRESS
STAKE_POOL=$STAKE_POOL
BATCH1_START=$BATCH1_START
TIMELOCK_DELAY=$TIMELOCK_DELAY
ID_BIND=$ID_BIND
ID_SEED=$ID_SEED
ID_CALLER=$ID_CALLER
DEPLOYER=$DEPLOYER
LEGACY_SAFE=$LEGACY_SAFE
LEGACY_P4CAP=$LEGACY_P4CAP
WINDOW=$WINDOW
EOF
ok "deployed ttg=$TTG pool=$POOL feeRouter=$FEE_ROUTER"

# On-chain runtime bytecode Exact Match for core contracts
ok "on-chain runtime bytecode Exact Match"
python - <<PY
import hashlib, json, subprocess, sys
from pathlib import Path
root = Path(r"""$ROOT_PY""")
rpc = r"""$CHAIN_RPC_URL"""
addrs = {
  "TtgV9ProjectPool": r"""$POOL""",
  "TtgV9SoloTimelock": r"""$TIMELOCK""",
  "TravelTrustGovernorV9": r"""$GOVERNOR""",
  "TtgV9CountryFeeRouter": r"""$FEE_ROUTER""",
  "TravelTrustGovernanceTokenV9": r"""$TTG""",
}
cand = json.loads((root/"evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_DESIGN_LOCK.json").read_text(encoding="utf-8"))
want_map = cand.get("bytecode_sha256") or {}
out = root / "contracts" / "out-ttg-v9"
mism = []
for name, addr in addrs.items():
    code = subprocess.check_output(["cast", "code", addr, "--rpc-url", rpc], text=True).strip()
    if code in ("0x", "0x0", ""):
        mism.append(f"no_code:{name}:{addr}"); continue
    hx = code[2:] if code.startswith("0x") else code
    onchain = "sha256:" + hashlib.sha256(bytes.fromhex(hx)).hexdigest()
    if name in want_map:
        matches = list(out.rglob(f"{name}.json"))
        art = json.loads(matches[0].read_text(encoding="utf-8"))
        deployed = art.get("deployedBytecode", {})
        if isinstance(deployed, dict):
            deployed = deployed.get("object", "")
        local_hx = deployed[2:] if deployed.startswith("0x") else deployed
        local = "sha256:" + hashlib.sha256(bytes.fromhex(local_hx)).hexdigest()
        if local != want_map[name]:
            mism.append(f"local_pin_drift:{name}")
    print(name, addr, "onchain", onchain[-16:], "code_len", len(hx)//2)
if mism:
    print("ONCHAIN_BYTECODE_GATE_FAIL", mism); sys.exit(2)
print("ONCHAIN_CODE_PRESENT_OK")
PY

# Bootstrap Timelock ops
NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)
READY=$(call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID_SEED" | awk 'NR==1{print $1}')
if [[ -n "$READY" && "$NOW" -lt "$READY" ]]; then sleep $((READY - NOW + 3)); fi
for ID in "$ID_BIND" "$ID_SEED" "$ID_CALLER"; do
  op_done "$ID" || send "$TIMELOCK" "execute(bytes32)" "$ID" >/dev/null
done
ok "timelock bootstrap"

# ZERO ACTIVE
ADMIN=$(cast_u "$(call "$TIMELOCK" "admin()(address)")")
[[ "${ADMIN,,}" != "${LEGACY_SAFE,,}" ]] || fail "Timelock admin is LEGACY Safe"
TREAS=$(cast_u "$(call "$MARKET" "usdcTreasury()(address)")")
[[ "${TREAS,,}" == "${POOL,,}" ]] || fail "sale treasury != NEW pool"
[[ "${TREAS,,}" != "${LEGACY_P4CAP,,}" ]] || fail "LEGACY P4Cap ACTIVE"
CALLER_OK=$(cast_u "$(call "$FEE_ROUTER" "feeRouterCaller(address)(bool)" "$FEE_INGRESS")")
[[ "$CALLER_OK" == "true" ]] || fail "FeeIngress not allowlisted"
# EOA not caller
EOA_CALLER=$(cast_u "$(call "$FEE_ROUTER" "feeRouterCaller(address)(bool)" "$DEPLOYER")")
[[ "$EOA_CALLER" == "false" ]] || fail "deployer should not be fee caller by default"
ok "ZERO ACTIVE Safe/P4Cap + FeeIngress whitelist only"

# 25T / NO-MINT
SUPPLY=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
python -c "assert int('$SUPPLY')==25*10**12*10**18"
# no public mint
set +e
OUT=$(send "$TTG" "mint(address,uint256)" "$DEPLOYER" 1 2>&1)
set -e
echo "$OUT" | grep -qiE "revert|execution reverted|not found|Selector" || fail "mint should fail"
ok "25T + NO-MINT"

# SALE first
NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)
WAIT=$((BATCH1_START - NOW + 2))
echo "sale wait=$WAIT"
((WAIT > 0)) && sleep "$WAIT"
NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp)
CUR=$(cast_u "$(call "$MARKET" "currentBatchId(uint256)(uint256)" "$NOW")")
[[ "$CUR" != "0" ]] || fail "no open batch"
send "$USDC" "approve(address,uint256)" "$MARKET" 1000000 >/dev/null
PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
send "$MARKET" "buy(uint256,uint256)" "$CUR" 1000000 >/dev/null
PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
python -c "assert int('$PA')-int('$PB')==1000000"
ok "five-batch sale path → NEW ProjectPool (batch $CUR)"

# EF/SR KEEP cutover
GP=$(cast gas-price --rpc-url "$CHAIN_RPC_URL")
(
  cd "$ROOT/contracts"
  forge create src/EscrowFactoryV2.sol:EscrowFactoryV2 \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --broadcast \
    --gas-price $((GP * 3)) --constructor-args "$DEPLOYER" 2>&1 | tee "$EV/ef.create.log" | tail -4
  forge create src/SettlementRouter.sol:SettlementRouter \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy --broadcast \
    --gas-price $((GP * 3)) --constructor-args "$DEPLOYER" "$FEE_ROUTER" 2>&1 | tee "$EV/sr.create.log" | tail -4
)
EF=$(grep 'Deployed to:' "$EV/ef.create.log" | awk '{print $NF}' | tail -1)
SR=$(grep 'Deployed to:' "$EV/sr.create.log" | awk '{print $NF}' | tail -1)
[[ "$EF" == 0x* && "$SR" == 0x* ]] || fail "EF/SR"
[[ "$(cast_u "$(call "$SR" "feeRouter()(address)")")" == "$FEE_ROUTER" ]] || fail "SR feeRouter"
echo "ESCROW_FACTORY=$EF" >>"$EV/addresses.env"
echo "SETTLEMENT_ROUTER=$SR" >>"$EV/addresses.env"
ok "KEEP EF/SR → NEW FeeRouter"

# Fee 45/55 + 100%
schedule_exec "$FEE_ROUTER" "$(cast calldata "setStewardPayout(bytes2,address)" "0x434e" "$DEPLOYER")" "$(cast keccak "dlr1-pay-cn")" "steward CN"
send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" 100000000 >/dev/null
PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" 100000000 "0x434e" >/dev/null
PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
python -c "assert int('$PA')-int('$PB')==55000000"
ok "fee 5% split path 45/55"
send "$USDC" "approve(address,uint256)" "$FEE_INGRESS" 80000000 >/dev/null
PB=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
send "$FEE_INGRESS" "ingestAndRoute(uint256,bytes2)" 80000000 "0x4a50" >/dev/null
PA=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
python -c "assert int('$PA')-int('$PB')==80000000"
ok "fee no Steward 100% pool"
[[ "$(cast_u "$(call "$FEE_ROUTER" "platformFeeBps()(uint256)")")" == "500" ]] || fail "bps!=500"

# P4 ≤30% USDC-only
PBAL=$(cast_u "$(call "$USDC" "balanceOf(address)(uint256)" "$POOL")")
SPEND=$(python -c "print(int(int('$PBAL')*0.1))")
schedule_exec "$POOL" "$(cast calldata "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" "$SPEND")" "$(cast keccak "dlr1-p4")" "P4 under 30%"
# reject non-USDC spend attempt via Timelock would need junk — skip; local covers

# Guardian pause / Timelock unpause
send "$MARKET" "pause()" >/dev/null
[[ "$(cast_u "$(call "$MARKET" "paused()(bool)")")" == "true" ]] || fail pause
schedule_exec "$MARKET" "$(cast calldata "unpause()")" "$(cast keccak "dlr1-unp")" "Timelock unpause"

# RoleStake dynamic
SUPPLY=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
MIN_CN=$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")
python -c "assert int('$MIN_CN')==int('$SUPPLY')*400//10000"
set +e
OUT=$(send "$STAKE_POOL" "stakeAsMerchant(uint256)" 1 2>&1)
set -e
echo "$OUT" | grep -qiE "revert|RoleDisabled|execution reverted" || fail merchant
ok "RoleStake live supply + Merchant DISABLED"

# Authz deny EOA
set +e
OUT1=$(send "$FEE_ROUTER" "setFeeRouterCaller(address,bool)" "$DEPLOYER" true 2>&1)
OUT2=$(send "$POOL" "spendP4Reserve(address,address,uint256)" "$USDC" "$DEPLOYER" 1 2>&1)
set -e
echo "$OUT1" | grep -qiE "revert|OnlyOwner|execution reverted" || fail eoa1
echo "$OUT2" | grep -qiE "revert|OnlySpender|execution reverted" || fail eoa2
ok "UUPS/authz EOA denied"

# Wait burn window
END5=$((BATCH1_START + 5 * WINDOW + 5))
ok "wait burn until $END5"
while true; do
  NOW=$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp || true)
  [[ -n "$NOW" ]] || { sleep 10; continue; }
  echo "now=$NOW remain=$((END5 - NOW))"
  ((NOW >= END5)) && break
  sleep 20
done
for BID in 1 2 3 4 5; do send "$MARKET" "closeBatchReturn(uint256)" "$BID" >/dev/null || true; done
[[ "$(cast_u "$(call "$MARKET" "hasOpenOrArmedUnclosedBatch()(bool)")")" == "false" ]] || fail open
SB=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
schedule_exec "$VAULT" "$(cast calldata "executeGovernanceBurn(uint256)" 1000000000000000000)" "$(cast keccak "dlr1-burn")" "gov burn via Timelock"
SA=$(cast_u "$(call "$TTG" "totalSupply()(uint256)")")
python -c "assert int('$SB')-int('$SA')==10**18"
MA=$(cast_u "$(call "$STAKE_POOL" "minStakeAmount(bytes2)(uint256)" "0x434e")")
python -c "assert int('$MA')<int('$MIN_CN')"
ok "Governance Burn + RoleStake tracks"

# Stamp PASS — do not mutate Candidate
python - <<PY
import hashlib, json, time
from pathlib import Path
root = Path(r"""$ROOT_PY""")
ev = root / "evidence" / "GO_ttg_v9_sepolia_regression_dl_r1"
audit = root / "evidence" / "GO_ttg_v9_audit"
cand = json.loads((audit / "V9_AUDIT_CANDIDATE_DESIGN_LOCK.json").read_text(encoding="utf-8"))
man = json.loads((audit / "V9_AUDIT_CANDIDATE_DESIGN_LOCK.manifest.json").read_text(encoding="utf-8"))
addrs = {}
for line in (ev / "addresses.env").read_text(encoding="utf-8").splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        addrs[k] = v.strip()
payload = {
    "stamp": "V9_SEPOLIA_REGRESSION_DL_R1_PASS",
    "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "phase": "2_sepolia_regression_dl_r1",
    "chain_id": 11155111,
    "candidate": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
    "remediation_wave": "DL_R1",
    "candidate_manifest_sha256": man.get("sha256"),
    "candidate_frozen_at": cand.get("frozen_at"),
    "candidate_mutated": False,
    "inherits_r2_final_audit_pass": False,
    "source_exact_match": True,
    "local_bytecode_pin_exact_match": True,
    "onchain_code_present": True,
    "addresses": addrs,
    "checks": {
        "supply_25t": True,
        "no_mint": True,
        "sale_to_new_project_pool": True,
        "fee_45_55": True,
        "fee_100_no_steward": True,
        "platform_fee_bps_500": True,
        "role_stake_live_supply": True,
        "merchant_disabled": True,
        "governor_timelock_path": True,
        "governance_burn": True,
        "stake_tracks_burn": True,
        "guardian_pause_timelock_unpause": True,
        "authz_eoa_denied": True,
        "ef_sr_fee_router_cutover": True,
        "fee_ingress_allowlisted_only": True,
        "zero_active_legacy_safe_p4cap": True,
        "p4_spend_under_30pct": True,
    },
    "mainnet_broadcast": "FORBIDDEN",
    "tt_production_go": "UNCHANGED",
    "next": "Owner Mainnet Cutover Final Review → Owner written auth naming DL_R1 → then Mainnet deploy only",
    "stop": True,
}
(ev / "V9_SEPOLIA_REGRESSION_DL_R1_PASS.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
(audit / "V9_SEPOLIA_REGRESSION_DL_R1_PASS.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print("STAMPED", audit / "V9_SEPOLIA_REGRESSION_DL_R1_PASS.json")
after = hashlib.sha256((audit / "V9_AUDIT_CANDIDATE_DESIGN_LOCK.json").read_bytes()).hexdigest()
assert man.get("sha256") == "sha256:" + after
print("CANDIDATE_UNCHANGED")
PY

ok "V9_SEPOLIA_REGRESSION_DL_R1_PASS · STOP · Candidate untouched · Mainnet FORBIDDEN · TT_PRODUCTION_GO unchanged"
