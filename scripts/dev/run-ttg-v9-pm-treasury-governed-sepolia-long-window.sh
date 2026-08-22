#!/usr/bin/env bash
# V9_PM_TREASURY_GOVERNED_LONG_WINDOW_SEPOLIA_REALITY
# WINDOW=3600 · Exact-Match pin 968d9ca6… · frozen ProjectPoolV2
# Auth: TRAVELTRUST_TTG_V9_PM_TREASURY_SEPOLIA_OK=1
# FORBID: Mainnet · TT_PRODUCTION_GO · mutate five-batch production params
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVIDENCE="$ROOT/evidence/GO_ttg_v9_pm_treasury_governed_sepolia"
PIN_SHA=968d9ca61f00be35395d913e8e6a86759643eaf992836101817f4fb3854b34cb
SEPOLIA_CHAIN_ID=11155111
# Reuse prior fresh Timelock + mock USDC/TTG + PoolV2 + Fee (ACL already cut over)
TL=0x7aaEAC6D890EFe85ddA37Cf366ceA585592F91E4
POOL=0xc49C28E9883405087Cb734a48206a5eE7A370Ff0
FEE=0xF3fC481BEE172E8Ad90c65CC25F8e7A906A1DAfb
USDC=0x50D593b4eA94FBF3E2aa0B0C5887CeD7EdA35814
TTG=0x23a888fCe200eDbF8a2D6ae78428B87fc0bA4240
LEGACY=0x000000000000000000000000000000000000bEEF
POOL_V2_FROZEN=0xF59E120F846f07Fc011c9d592CF613e27BFa1F50
WINDOW=3600

fail() { echo "PM_LW_SEPOLIA: STOP $*" >&2; exit 2; }
ok() { echo "PM_LW_SEPOLIA: OK $*"; }
cast_u() { echo "$1" | awk '{print $1}' | tr -d '\r'; }
u_eq() { python -c "import sys; sys.exit(0 if int('$1')==int('$2') else 1)"; }
u_delta_eq() { python -c "import sys; sys.exit(0 if int('$1')-int('$2')==int('$3') else 1)"; }

# Retry cast against rotating Sepolia RPCs (TLS flakes are common).
cast_retry() {
  local attempt=1 out
  while [[ $attempt -le 10 ]]; do
    CHAIN_RPC_URL="$(pick_rpc)" || true
    if [[ -z "${CHAIN_RPC_URL:-}" ]]; then
      sleep 3
      attempt=$((attempt + 1))
      continue
    fi
    if out="$(cast "$@" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null)"; then
      printf '%s\n' "$out"
      return 0
    fi
    sleep 2
    attempt=$((attempt + 1))
  done
  return 1
}

cast_send_retry() {
  local attempt=1 err
  err="$(mktemp)"
  while [[ $attempt -le 12 ]]; do
    CHAIN_RPC_URL="$(pick_rpc)" || true
    if [[ -z "${CHAIN_RPC_URL:-}" ]]; then
      sleep 3
      attempt=$((attempt + 1))
      continue
    fi
    if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" "$@" >/dev/null 2>"$err"; then
      rm -f "$err"
      return 0
    fi
    ok "cast send retry $attempt ($(head -1 "$err" 2>/dev/null | tr -d '\r' | cut -c1-80))"
    sleep 4
    attempt=$((attempt + 1))
  done
  cat "$err" >&2 || true
  rm -f "$err"
  return 1
}
to_b32_u() { python -c "print('0x'+format(int('$1'),'064x'))"; }
lc() { echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d '\r'; }
is_truthy() { case "${1:-}" in 1|true|TRUE|yes|YES|on|ON) return 0 ;; *) return 1 ;; esac; }

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

RPC_CANDIDATES=(
  "https://ethereum-sepolia-rpc.publicnode.com"
  "https://sepolia.gateway.tenderly.co"
  "https://rpc.sepolia.org"
)
pick_rpc() {
  local _rpc _cid
  for _rpc in "${RPC_CANDIDATES[@]}"; do
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$SEPOLIA_CHAIN_ID" ]] || continue
    echo "$_rpc"; return 0
  done
  return 1
}

bytecode_sha_file() {
  local file="$1"
  python - "$file" <<'PY'
import hashlib, sys
c = open(sys.argv[1], encoding="utf-8").read().strip()
if not c.startswith("0x") or len(c) < 10:
    raise SystemExit(f"bad code: {c[:80]!r}")
print(hashlib.sha256(bytes.fromhex(c[2:])).hexdigest())
PY
}

# Artifact Exact-Match gate: on-chain runtime may differ ONLY where artifact has
# zero placeholders for immutables (TtgV9UUPSUpgradeable.__self = address(this)).
assert_exact_match_runtime() {
  local addr="$1"
  local tmp art
  tmp="$(mktemp)"
  cast code --rpc-url "$CHAIN_RPC_URL" "$addr" >"$tmp"
  art="$ROOT/contracts/out-ttg-v9/TtgBatchPrimaryMarket.sol/TtgBatchPrimaryMarket.json"
  python - "$tmp" "$art" "$PIN_SHA" <<'PY'
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
        raise SystemExit(f"bytecode mismatch at byte {i}: on={norm[i]:02x} art={art_b[i]:02x}")
    i += 1
if bytes(norm) != art_b:
    raise SystemExit("runtime not Exact-Match after immutable normalize")
print(f"exact_match_ok artifact_sha={art_sha}")
PY
  rm -f "$tmp"
}

bytecode_sha() {
  local addr="$1"
  local tmp
  tmp="$(mktemp)"
  cast code --rpc-url "$CHAIN_RPC_URL" "$addr" >"$tmp"
  bytecode_sha_file "$tmp"
  rm -f "$tmp"
}

tl_exec() {
  local target="$1" data="$2" salt="$3" label="$4"
  local id ready done_flag attempt=1 err
  err="$(mktemp)"
  id="$(cast_retry call "$TL" \
    "hashOperation(address,uint256,bytes,bytes32)(bytes32)" "$target" 0 "$data" "$salt" | awk '{print $1}')"
  mapfile -t op < <(cast_retry call "$TL" \
    "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$id")
  ready="${op[0]%% *}"
  done_flag="${op[1]}"
  if [[ "$done_flag" == "true" ]]; then ok "skip $label"; rm -f "$err"; return 0; fi
  if [[ -z "$ready" || "$ready" == "0" ]]; then
    cast_send_retry "$TL" "schedule(address,uint256,bytes,bytes32)" "$target" 0 "$data" "$salt" \
      || { rm -f "$err"; fail "schedule $label"; }
    ok "scheduled $label"
    sleep "$((DELAY + 5))"
  else
    ok "wait existing $label"
    sleep "$((DELAY + 5))"
  fi
  while [[ $attempt -le 8 ]]; do
    CHAIN_RPC_URL="$(pick_rpc)" || true
    if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
      "$TL" "execute(bytes32)" "$id" >/dev/null 2>"$err"; then
      ok "executed $label"
      rm -f "$err"
      return 0
    fi
    sleep 5
    attempt=$((attempt + 1))
  done
  cat "$err" >&2 || true
  rm -f "$err"
  fail "execute $label"
}

forge_create() {
  local artifact="$1"; shift
  local attempt=1 out_file err_file
  out_file="$(mktemp)"
  err_file="$(mktemp)"
  while [[ $attempt -le 6 ]]; do
    CHAIN_RPC_URL="$(pick_rpc)" || true
    if ( cd "$ROOT/contracts" && FOUNDRY_PROFILE=ttg_v9_broadcast forge create \
      --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --json \
      "$artifact" "$@" >"$out_file" 2>"$err_file" ); then
      if python - "$out_file" <<'PY'
import json, re, sys
from pathlib import Path
raw = Path(sys.argv[1]).read_text(encoding="utf-8", errors="ignore")
# Prefer full JSON object containing deployedTo (multiline-safe)
m = re.search(r'\{[^{}]*"deployedTo"[^{}]*\}', raw, re.S)
if not m:
    # nested braces fallback
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end <= start:
        raise SystemExit(f"no JSON in forge create output: {raw[:200]!r}")
    obj = json.loads(raw[start : end + 1])
else:
    obj = json.loads(m.group(0))
addr = obj.get("deployedTo")
if not addr or not str(addr).startswith("0x"):
    raise SystemExit(f"bad deployedTo: {obj!r}")
print(addr)
PY
      then
        rm -f "$out_file" "$err_file"
        return 0
      fi
    fi
    sleep 4
    attempt=$((attempt + 1))
  done
  echo "--- forge create stdout ---" >&2
  cat "$out_file" >&2 || true
  echo "--- forge create stderr ---" >&2
  cat "$err_file" >&2 || true
  rm -f "$out_file" "$err_file"
  fail "forge create $artifact"
}

snap_full() {
  local pm="$1" out="$2"
  {
    echo "version=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "version()(string)")"
    echo "usdcTreasury=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "usdcTreasury()(address)")"
    echo "timelock=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "timelock()(address)")"
    echo "guardian=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "guardian()(address)")"
    echo "paused=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "paused()(bool)")"
    echo "seededBatchCount=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "seededBatchCount()(uint256)")")"
    echo "usdc=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "usdc()(address)")"
    echo "ttg=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "ttg()(address)")"
    echo "vault=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "vault()(address)")"
    echo "vaultInventory=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$VAULT" "inventory()(uint256)")")"
    echo "impl=$(cast storage --rpc-url "$CHAIN_RPC_URL" "$pm" 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)"
    local i
    for i in 1 2 3 4 5; do
      echo "batch$i=$(cast call --rpc-url "$CHAIN_RPC_URL" "$pm" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" "$i" | tr '\n' ' ')"
    done
    echo "poolCapBps=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "capBps()(uint256)")")"
    echo "poolPeriod=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "periodSeconds()(uint256)")")"
    echo "poolSpent=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "p4SpentInPeriod()(uint256)")")"
    echo "poolStarted=$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$POOL" "p4PeriodStartedAt()(uint256)")")"
  } >"$out"
}

assert_pm_drift0() {
  # Compare PM fields excluding version + impl (expected on upgrade) and pool*
  # (pool checked separately; RPC flakes can blank a single pool field in snaps).
  diff <(grep -vE '^(version|impl|poolCapBps|poolPeriod|poolSpent|poolStarted)=' "$1") \
       <(grep -vE '^(version|impl|poolCapBps|poolPeriod|poolSpent|poolStarted)=' "$2") >/dev/null \
    || fail "PM state drift ($1 vs $2)"
}

[[ -f "$ROOT/.env" ]] && load_env_file "$ROOT/.env"
load_env_file "${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
load_env_file "${TTG_V8_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v8-sepolia-rehearsal.local}"
load_env_file "${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"

is_truthy "${TRAVELTRUST_TTG_V9_PM_TREASURY_SEPOLIA_OK:-}" || fail "set TRAVELTRUST_TTG_V9_PM_TREASURY_SEPOLIA_OK=1"
is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}" && fail "refusing MAINNET flag"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY"
[[ "$PRIVATE_KEY" != 0x* && "$PRIVATE_KEY" != 0X* ]] && export PRIVATE_KEY="0x${PRIVATE_KEY}"

mkdir -p "$EVIDENCE"
CHAIN_RPC_URL="$(pick_rpc)" || fail "no Sepolia RPC"
DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
DELAY="$(cast_u "$(cast_retry call "$TL" "delay()(uint256)" || fail "timelock delay")")"
ok "deployer=$DEPLOYER delay=$DELAY window=$WINDOW"

# Local pin gate
LOCAL_SHA="$(python - <<'PY'
import hashlib,json
from pathlib import Path
j=json.loads(Path('contracts/out-ttg-v9/TtgBatchPrimaryMarket.sol/TtgBatchPrimaryMarket.json').read_text(encoding='utf-8',errors='ignore'))
bc=j['deployedBytecode']['object']
if bc.startswith('0x'): bc=bc[2:]
print(hashlib.sha256(bytes.fromhex(bc)).hexdigest())
PY
)"
[[ "$LOCAL_SHA" == "$PIN_SHA" ]] || fail "local bytecode != Exact-Match pin"
ok "Exact-Match local pin $PIN_SHA"

if is_truthy "${TT_PM_LW_SKIP_LOCAL_GATES:-}"; then
  ok "skip local layout/forge gates (already PASS this session)"
else
  bash "$ROOT/scripts/dev/check-ttg-v9-pm-treasury-storage-layout.sh" || fail "storage layout"
  ( cd "$ROOT/contracts" && FOUNDRY_PROFILE=ttg_v9 forge test --match-contract 'TtgV9BatchPrimaryMarketTreasuryGoverned' --summary ) \
    || fail "local treasury governed tests"
fi

# PoolV2 baseline (must not drift across PM cutover)
POOL_CAP0="$(cast_u "$(cast_retry call "$POOL" "capBps()(uint256)" || fail "pool capBps")")"
POOL_PER0="$(cast_u "$(cast_retry call "$POOL" "periodSeconds()(uint256)" || fail "pool period")")"
POOL_SPENT0="$(cast_u "$(cast_retry call "$POOL" "p4SpentInPeriod()(uint256)" || fail "pool spent")")"
POOL_START0="$(cast_u "$(cast_retry call "$POOL" "p4PeriodStartedAt()(uint256)" || fail "pool start")")"
[[ "$POOL_CAP0" == "3000" ]] || fail "pool capBps=$POOL_CAP0"
[[ "$POOL_PER0" == "7776000" ]] || fail "pool period=$POOL_PER0"
ok "PoolV2 baseline cap=$POOL_CAP0 period=$POOL_PER0 spent=$POOL_SPENT0"

# Deploy Exact-Match impl (reuse prior verified deploy if present)
if [[ -f "$EVIDENCE/long_window_exact_match_impl.txt" ]]; then
  NEW_IMPL="$(tr -d '\r\n' <"$EVIDENCE/long_window_exact_match_impl.txt")"
  if assert_exact_match_runtime "$NEW_IMPL" 2>/dev/null; then
    ok "reuse Exact-Match impl $NEW_IMPL"
  else
    NEW_IMPL="$(forge_create src/ttg-v9/TtgBatchPrimaryMarket.sol:TtgBatchPrimaryMarket)"
    assert_exact_match_runtime "$NEW_IMPL"
    echo "$NEW_IMPL" >"$EVIDENCE/long_window_exact_match_impl.txt"
    ok "Exact-Match impl on-chain $NEW_IMPL"
  fi
else
  NEW_IMPL="$(forge_create src/ttg-v9/TtgBatchPrimaryMarket.sol:TtgBatchPrimaryMarket)"
  assert_exact_match_runtime "$NEW_IMPL"
  echo "$NEW_IMPL" >"$EVIDENCE/long_window_exact_match_impl.txt"
  ok "Exact-Match impl on-chain $NEW_IMPL (artifact pin $PIN_SHA; __self immutable normalized)"
fi

# Fresh Vault + PreTreasury PM (long window) — resume if partial addresses exist
PARTIAL="$EVIDENCE/lw_partial.addresses.env"
if [[ -f "$PARTIAL" ]]; then
  # shellcheck disable=SC1090
  source "$PARTIAL"
  ok "resume pm=$PM vault=$VAULT impl=$NEW_IMPL"
else
  VAULT_IMPL="$(forge_create src/ttg-v9/TtgPublicSaleVault.sol:TtgPublicSaleVault)"
  VAULT_INIT="$(cast calldata "initialize(address,address)" "$TTG" "$TL")"
  VAULT="$(forge_create src/ttg-v9/TtgV9ERC1967Proxy.sol:TtgV9ERC1967Proxy --constructor-args "$VAULT_IMPL" "$VAULT_INIT")"
  PRE="$(forge_create src/ttg-v9/legacy/TtgBatchPrimaryMarketPreTreasury.sol:TtgBatchPrimaryMarketPreTreasury)"
  PM_INIT="$(cast calldata "initialize(address,address,address,address,address,address)" \
    "$USDC" "$TTG" "$LEGACY" "$VAULT" "$TL" "$DEPLOYER")"
  PM="$(forge_create src/ttg-v9/TtgV9ERC1967Proxy.sol:TtgV9ERC1967Proxy --constructor-args "$PRE" "$PM_INIT")"
  cat >"$PARTIAL" <<EOF
PM=$PM
VAULT=$VAULT
NEW_IMPL=$NEW_IMPL
EOF
  ok "pm=$PM vault=$VAULT"
fi

for t in "$VAULT" "$PM" "$FEE" "$POOL"; do
  cast_send_retry "$TL" "setAllowedExecutionTarget(address,bool)" "$t" true || true
done

tl_exec "$VAULT" "$(cast calldata "bindMarket(address)" "$PM")" "$(to_b32_u 801)" "bindMarket"
INV="$(cast_u "$(cast_retry call "$VAULT" "inventory()(uint256)" || echo 0)")"
if python -c "import sys; sys.exit(0 if int('$INV')>=12500000000000000000000000000000 else 1)"; then
  ok "skip mint TTG (vault inventory already set)"
else
  cast_send_retry "$TTG" "mint(address,uint256)" "$VAULT" 12500000000000000000000000000000 \
    || fail "mint TTG to vault"
fi
USDC_BAL="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$DEPLOYER" || echo 0)")"
if python -c "import sys; sys.exit(0 if int('$USDC_BAL')>=5000000000 else 1)"; then
  ok "skip mint USDC (deployer bal already set)"
else
  cast_send_retry "$USDC" "mint(address,uint256)" "$DEPLOYER" 5000000000 \
    || fail "mint USDC to deployer"
fi

SEEDED="$(cast_u "$(cast_retry call "$PM" "seededBatchCount()(uint256)" || echo 0)")"
if [[ "$SEEDED" -ge 5 ]]; then
  ok "skip seed (already seeded=$SEEDED)"
  # Rebuild FIRST from batch1 start for wait logic
  FIRST="$(cast_u "$(cast_retry call "$PM" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" 1 | head -1)")"
else
  NOW="$(cast_u "$(cast_retry block --field timestamp || fail "block timestamp")")"
  FIRST=$((NOW + 90))
  tl_exec "$PM" "$(cast calldata "seedBatchesRehearsal(uint64,uint64)" "$FIRST" "$WINDOW")" "$(to_b32_u 802)" "seedLong3600"
fi

cast_send_retry "$USDC" "approve(address,uint256)" "$PM" 5000000000 || fail "approve USDC"
NOW2="$(cast_u "$(cast_retry block --field timestamp || fail "block timestamp2")")"
SLEEP=$((FIRST - NOW2 + 12))
[[ "$SLEEP" -gt 0 ]] && { ok "wait batch1 ${SLEEP}s"; sleep "$SLEEP"; }

# Pre-upgrade buy → legacy (skip if already proven on this PM)
SOLD1="$(cast_u "$(cast_retry call "$PM" "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" 1 | sed -n '5p')")"
VER0="$(cast_retry call "$PM" "version()(string)" || true)"
if echo "$VER0" | grep -q treasury_governed; then
  ok "already upgraded — skip pre-upgrade buy"
elif python -c "import sys; sys.exit(0 if int('$SOLD1')>=1000000000000000000000000 else 1)"; then
  ok "skip pre-upgrade buy (batch1 sold already proves legacy path)"
else
  LEGACY0="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$LEGACY" || fail "legacy bal")")"
  POOL0="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$POOL" || fail "pool bal")")"
  TTG_BUYER0="$(cast_u "$(cast_retry call "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER" || fail "ttg bal")")"
  cast_send_retry "$PM" "buy(uint256,uint256)" 1 1000000 || fail "pre-upgrade buy"
  LEGACY1="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$LEGACY" || fail "legacy bal1")")"
  POOL1="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$POOL" || fail "pool bal1")")"
  TTG_BUYER1="$(cast_u "$(cast_retry call "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER" || fail "ttg bal1")")"
  u_delta_eq "$LEGACY1" "$LEGACY0" 1000000 || fail "pre-upgrade USDC not to legacy"
  u_eq "$POOL1" "$POOL0" || fail "pool got pre-upgrade USDC"
  u_delta_eq "$TTG_BUYER1" "$TTG_BUYER0" 1000000000000000000000000 || fail "TTG out != 1e6 ether for 1 USDC batch1"
  ok "pre-upgrade: 1 USDC→legacy · 1e6 TTG out · pool delta=0"
fi

# Confirm legacy received at least 1 USDC on this rehearsal sink (shared 0xbEEF across waves)
LEGACY_NOW="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$LEGACY" || fail "legacy now")")"
python -c "import sys; sys.exit(0 if int('$LEGACY_NOW')>=1000000 else 1)" || fail "legacy sink empty"
ok "legacy sink USDC=$LEGACY_NOW (pre-upgrade path evidenced)"

snap_full "$PM" "$EVIDENCE/lw_pre_upgrade.snap"

# EOA upgrade deny / UUPS upgrade (skip if already Exact-Match treasury_governed)
VER_NOW="$(cast_retry call "$PM" "version()(string)" || true)"
if echo "$VER_NOW" | grep -q treasury_governed; then
  ok "skip upgrade (already $VER_NOW)"
  snap_full "$PM" "$EVIDENCE/lw_post_upgrade.snap"
else
  CHAIN_RPC_URL="$(pick_rpc)" || fail "rpc"
  if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
    "$PM" "upgradeToAndCall(address,bytes)" "$NEW_IMPL" 0x >/dev/null 2>&1; then
    fail "EOA upgrade should revert"
  fi
  ok "EOA upgrade rejected"

  tl_exec "$PM" "$(cast calldata "upgradeToAndCall(address,bytes)" "$NEW_IMPL" 0x)" "$(to_b32_u 803)" "uups_exact_match"
  snap_full "$PM" "$EVIDENCE/lw_post_upgrade.snap"
  assert_pm_drift0 "$EVIDENCE/lw_pre_upgrade.snap" "$EVIDENCE/lw_post_upgrade.snap"
fi
VER="$(cast_retry call "$PM" "version()(string)" || fail "version")"
echo "$VER" | grep -q treasury_governed || fail "version $VER"
IMPL_ADDR="0x$(cast_retry storage "$PM" 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc | tr '[:upper:]' '[:lower:]' | sed 's/^0x//; s/^0*//; s/^/0000000000000000000000000000000000000000/; s/.*\(.\{40\}\)$/\1/')"
assert_exact_match_runtime "$IMPL_ADDR"
ok "upgrade 0-drift · impl Exact-Match · $VER"

# ACL setUsdcTreasury
CHAIN_RPC_URL="$(pick_rpc)" || fail "rpc"
if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" \
  "$PM" "setUsdcTreasury(address)" "$POOL" >/dev/null 2>&1; then
  fail "EOA setUsdcTreasury should revert"
fi
ok "EOA setUsdcTreasury rejected"
tl_exec "$PM" "$(cast calldata "setUsdcTreasury(address)" "$POOL")" "$(to_b32_u 804)" "setUsdcTreasury_V2"
[[ "$(lc "$(cast_retry call "$PM" "usdcTreasury()(address)" || fail "treasury")")" == "$(lc "$POOL")" ]] \
  || fail "treasury not V2"

# Ensure Fee → PoolV2
FEE_POOL="$(cast_retry call "$FEE" "projectPool()(address)" || fail "fee pool")"
if [[ "$(lc "$FEE_POOL")" != "$(lc "$POOL")" ]]; then
  tl_exec "$FEE" "$(cast calldata "setProjectPool(address)" "$POOL")" "$(to_b32_u 805)" "fee_setProjectPool"
fi

# Post-cutover buy → PoolV2 only
LEGACY2="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$LEGACY" || fail "l2")")"
POOL2="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$POOL" || fail "p2")")"
TTG2="$(cast_u "$(cast_retry call "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER" || fail "t2")")"
cast_send_retry "$PM" "buy(uint256,uint256)" 1 1000000 || fail "post-cutover buy"
LEGACY3="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$LEGACY" || fail "l3")")"
POOL3="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$POOL" || fail "p3")")"
TTG3="$(cast_u "$(cast_retry call "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER" || fail "t3")")"
u_eq "$LEGACY3" "$LEGACY2" || fail "legacy delta post-cutover"
u_delta_eq "$POOL3" "$POOL2" 1000000 || fail "V2 USDC delta"
u_delta_eq "$TTG3" "$TTG2" 1000000000000000000000000 || fail "TTG post-cutover"
ok "post-cutover: 1 USDC→PoolV2 100% · legacy delta=0 · TTG out ok"

# FeeRouter → PoolV2
cast_send_retry "$USDC" "mint(address,uint256)" "$FEE" 10000000 || fail "mint fee usdc"
CALLER="$(cast_retry call "$FEE" "feeRouterCaller(address)(bool)" "$DEPLOYER" | awk '{print $1}')"
if [[ "$CALLER" != "true" ]]; then
  tl_exec "$FEE" "$(cast calldata "setFeeRouterCaller(address,bool)" "$DEPLOYER" true)" "$(to_b32_u 806)" "setCaller"
fi
POOL4="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$POOL" || fail "p4")")"
cast_send_retry "$FEE" "routePlatformFee(address,uint256,bytes2)" "$USDC" 10000000 0x4a50 \
  || fail "routePlatformFee"
POOL5="$(cast_u "$(cast_retry call "$USDC" "balanceOf(address)(uint256)" "$POOL" || fail "p5")")"
u_delta_eq "$POOL5" "$POOL4" 10000000 || fail "fee not 100% to V2"
ok "FeeRouter 10 USDC → PoolV2"

# PoolV2 cap/period/spent unchanged by PM cutover buys (buys are deposits, not P4 spend)
POOL_CAP1="$(cast_u "$(cast_retry call "$POOL" "capBps()(uint256)" || fail "cap1")")"
POOL_PER1="$(cast_u "$(cast_retry call "$POOL" "periodSeconds()(uint256)" || fail "per1")")"
POOL_SPENT1="$(cast_u "$(cast_retry call "$POOL" "p4SpentInPeriod()(uint256)" || fail "spent1")")"
POOL_START1="$(cast_u "$(cast_retry call "$POOL" "p4PeriodStartedAt()(uint256)" || fail "start1")")"
[[ "$POOL_CAP1" == "$POOL_CAP0" ]] || fail "cap drift"
[[ "$POOL_PER1" == "$POOL_PER0" ]] || fail "period drift"
[[ "$POOL_SPENT1" == "$POOL_SPENT0" ]] || fail "spent drift"
[[ "$POOL_START1" == "$POOL_START0" ]] || fail "period start drift"
ok "PoolV2 cap/period/spent/start 0-drift"

cat >"$EVIDENCE/long_window.addresses.env" <<EOF
TL=$TL
POOL=$POOL
FEE=$FEE
USDC=$USDC
TTG=$TTG
VAULT=$VAULT
PM=$PM
NEW_IMPL=$NEW_IMPL
LEGACY=$LEGACY
POOL_V2_FROZEN=$POOL_V2_FROZEN
WINDOW=$WINDOW
DEPLOYER=$DEPLOYER
EXACT_MATCH_SHA=$PIN_SHA
EOF
rm -f "$PARTIAL"

ok "LONG_WINDOW SEPOLIA REALITY MATRIX PASS"
echo "PM_LW_SEPOLIA: DONE"
