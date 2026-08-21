#!/usr/bin/env bash
# TTG_V9_PM_SEPOLIA_REHEARSAL
#
# ② Sepolia-only · chain_id 11155111 · mock TTG/USDC · V9 Batch PM Norm caps/prices
# Owner auth: TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1
# KEEP: Mainnet TTG / OLD PM / Governor / Timelock / live P4Cap / Money Path / Region-83
# FORBID: Mainnet inventory migrate · OLD PM cutover · Agent co-sign · keys in repo
# STOP stamp: V9_PM_SEPOLIA_PASS_STOP (not Production GO)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V9_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v9-sepolia-rehearsal.local}"
V8_REHEARSAL_ENV="${TTG_V8_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v8-sepolia-rehearsal.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_sepolia_rehearsal"
DEPLOY_LOG="$EVIDENCE/deploy.forge.log"
SEPOLIA_CHAIN_ID=11155111
SCRIPT="src/ttg-v9/TtgV9SepoliaRehearsal.s.sol:TtgV9SepoliaRehearsal"
WINDOW=480
BUY_USDC=1000000

fail() { echo "TTG_V9_PM_SEPOLIA_REHEARSAL: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_PM_SEPOLIA_REHEARSAL: OK $*"; }

cast_u() {
  # cast often prints "123 [1.23e2]" — keep leading integer only
  echo "$1" | awk '{print $1}' | tr -d '\r'
}

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE (need CHAIN_RPC_URL)"
load_env_file "$ENV_FILE"
load_env_file "$V8_REHEARSAL_ENV"
load_env_file "$REHEARSAL_ENV"

if ! is_truthy "${TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK:-}"; then
  fail "set TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1 (Owner ② Sepolia V9 rehearsal only)"
fi
if is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}"; then
  fail "refusing: TRAVELTRUST_MAINNET_BROADCAST_OK is set"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
# Prefer full-state Sepolia RPCs (forge needs eth_getCode). 1rpc free plan is cast-only.
RPC_CANDIDATES=(
  "https://sepolia.gateway.tenderly.co"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "${CHAIN_RPC_URL}"
)
pick_sepolia_rpc() {
  local _rpc _cid _code
  for _rpc in "${RPC_CANDIDATES[@]}"; do
    _cid="$(cast chain-id --rpc-url "$_rpc" 2>/dev/null || true)"
    [[ "$_cid" == "$SEPOLIA_CHAIN_ID" ]] || continue
    _code="$(cast code 0x0000000000000000000000000000000000000001 --rpc-url "$_rpc" 2>/dev/null || true)"
    # Accept any non-error response (EOA = 0x)
    if [[ "$_code" == 0x* ]]; then
      echo "$_rpc"
      return 0
    fi
  done
  return 1
}
CHAIN_RPC_URL="$(pick_sepolia_rpc)" || fail "no healthy full-state Sepolia RPC among candidates"
ok "using Sepolia RPC host=$(python -c "from urllib.parse import urlparse; print(urlparse('$CHAIN_RPC_URL').netloc)")"

[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset (Owner-local env only)"
if [[ "$PRIVATE_KEY" != 0x* && "$PRIVATE_KEY" != 0X* ]]; then
  export PRIVATE_KEY="0x${PRIVATE_KEY}"
fi
command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"
command -v python >/dev/null 2>&1 || fail "python not found"

mkdir -p "$EVIDENCE"

if [[ "${V9_SEPOLIA_RESUME:-0}" != "1" ]]; then
  ok "① local V9 forge tests"
  bash "$ROOT/scripts/dev/run-ttg-v9-forge.sh" || fail "local V9 tests failed"
fi

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || true)"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "refusing broadcast: chain_id=${CHAIN_ID:-unset} (required Sepolia $SEPOLIA_CHAIN_ID)"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL_WEI="0"
for _try in 1 2 3 4 5 6; do
  _raw="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || true)"
  BAL_WEI="$(cast_u "${_raw:-0}")"
  [[ -n "$BAL_WEI" && "$BAL_WEI" =~ ^[0-9]+$ ]] || BAL_WEI="0"
  if [[ "$(python -c "print(int('${BAL_WEI}') >= int('50000000000000000'))")" == "True" ]]; then
    break
  fi
  sleep 3
done
MIN_WEI="50000000000000000" # 0.05 ETH Sepolia
if [[ "$(python -c "print(int('${BAL_WEI}') < int('${MIN_WEI}'))")" == "True" ]]; then
  fail "deployer Sepolia ETH below 0.05 (have ${BAL_WEI} wei)"
fi
ok "Sepolia deployer funded (address only, no key logged)"

: > "$EVIDENCE/txs.tsv"

if [[ "${V9_SEPOLIA_RESUME:-0}" == "1" ]]; then
  [[ -f "$DEPLOY_LOG" ]] || fail "resume requires $DEPLOY_LOG"
  ok "resume drill from existing deploy log (no re-deploy)"
else
  ok "broadcast deploy (mock TTG/USDC + Vault + BatchPM + rehearsal seed)"
  DEPLOY_OK=0
  for _try in 1 2 3 4 5; do
    if (
      cd "$ROOT/contracts"
      FOUNDRY_PROFILE=ttg_v9_broadcast forge script "$SCRIPT" \
        --rpc-url "$CHAIN_RPC_URL" \
        --private-key "$PRIVATE_KEY" \
        --sender "$DEPLOYER" \
        --chain-id "$SEPOLIA_CHAIN_ID" \
        --broadcast \
        --legacy \
        --slow \
        -vv
    ) | tee "$DEPLOY_LOG"; then
      if grep -q "ONCHAIN EXECUTION COMPLETE & SUCCESSFUL" "$DEPLOY_LOG" \
        && grep -qE '^[[:space:]]*market[[:space:]]+0x' "$DEPLOY_LOG"; then
        DEPLOY_OK=1
        break
      fi
    fi
    # Rotate RPC on flake (full-state only)
    CHAIN_RPC_URL="$(pick_sepolia_rpc)" || true
    [[ -n "${CHAIN_RPC_URL:-}" ]] || fail "lost Sepolia RPC mid-retry"
    ok "deploy broadcast retry $_try after RPC flake (rpc host=$(python -c "from urllib.parse import urlparse; print(urlparse('$CHAIN_RPC_URL').netloc)"))"
    # Let pending/replaced nonces settle before retry.
    sleep 25
  done
  [[ "$DEPLOY_OK" == "1" ]] || fail "forge broadcast failed after retries"
fi

USDC="$(grep -E '^[[:space:]]*usdc[[:space:]]' "$DEPLOY_LOG" | awk '{print $NF}' | tail -1)"
TTG="$(grep -E '^[[:space:]]*ttg[[:space:]]' "$DEPLOY_LOG" | awk '{print $NF}' | tail -1)"
VAULT="$(grep -E '^[[:space:]]*vault[[:space:]]' "$DEPLOY_LOG" | awk '{print $NF}' | tail -1)"
MARKET="$(grep -E '^[[:space:]]*market[[:space:]]' "$DEPLOY_LOG" | awk '{print $NF}' | tail -1)"
TEST_P4CAP="$(grep -E '^[[:space:]]*testP4Cap[[:space:]]' "$DEPLOY_LOG" | awk '{print $NF}' | tail -1)"
BATCH1_START="$(cast_u "$(grep -E '^[[:space:]]*batch1Start[[:space:]]' "$DEPLOY_LOG" | awk '{print $NF}' | tail -1)")"

[[ "$USDC" == 0x* && "$TTG" == 0x* && "$VAULT" == 0x* && "$MARKET" == 0x* && "$TEST_P4CAP" == 0x* ]] || fail "parse deploy addresses failed"
[[ -n "$BATCH1_START" ]] || fail "parse batch1Start failed"
ok "deployed market=$MARKET vault=$VAULT"

append_tx() {
  local label="$1" hash="$2"
  [[ "$hash" == 0x* && ${#hash} -eq 66 ]] || fail "missing tx hash for $label (got '$hash')"
  printf '%s\t%s\n' "$label" "$hash" >> "$EVIDENCE/txs.tsv"
  ok "tx $label $hash"
}

send() {
  local label="$1"
  shift
  local out hash status
  out="$(cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --json "$@" 2>&1)" || {
    echo "$out" >&2
    fail "cast send failed: $label"
  }
  hash="$(OUT_JSON="$out" python - <<'PY'
import json, os, re
t = os.environ.get("OUT_JSON", "")
try:
    d = json.loads(t)
    print(d.get("transactionHash") or d.get("hash") or "")
except Exception:
    m = re.search(r"0x[a-fA-F0-9]{64}", t)
    print(m.group(0) if m else "")
PY
)"
  append_tx "$label" "$hash"
  status="$(cast receipt --rpc-url "$CHAIN_RPC_URL" "$hash" --json 2>/dev/null | python -c "import sys,json; print(json.load(sys.stdin).get('status',''))" || true)"
  [[ "$status" == "0x1" || "$status" == "1" ]] || fail "tx reverted: $label $hash status=$status"
}

expect_revert() {
  local label="$1"
  shift
  if cast send --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" "$@" >/dev/null 2>&1; then
    fail "expected revert: $label"
  fi
  ok "expected revert OK: $label"
}

wait_until() {
  local target
  target="$(cast_u "$1")"
  [[ -n "$target" && "$target" =~ ^[0-9]+$ ]] || fail "wait_until bad target '$1'"
  local now
  while true; do
    now="$(rpc_ts)"
    [[ -n "$now" && "$now" =~ ^[0-9]+$ ]] || {
      sleep 3
      continue
    }
    if [[ "$(python -c "print(int('$now') >= int('$target'))")" == "True" ]]; then
      break
    fi
    sleep 5
  done
}

batch_field() {
  # $1=batchId $2=1-based line (start=1 end=2 cap=3 px=4 sold=5 alloc=6 armed=7 closed=8 frozen=9)
  local out=""
  local _try
  for _try in 1 2 3 4 5 6 7 8; do
    out="$(
      cast call --rpc-url "$CHAIN_RPC_URL" "$MARKET" \
        "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)" "$1" 2>/dev/null \
        | sed -n "$2p"
    )"
    out="$(cast_u "$out")"
    if [[ -n "$out" ]]; then
      echo "$out"
      return 0
    fi
    sleep 2
  done
  fail "batch_field empty batch=$1 line=$2"
}

rpc_ts() {
  local out=""
  local _try
  for _try in 1 2 3 4 5 6; do
    out="$(cast_u "$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp 2>/dev/null || true)")"
    if [[ -n "$out" && "$out" =~ ^[0-9]+$ ]]; then
      echo "$out"
      return 0
    fi
    sleep 2
  done
  echo ""
}

rpc_ts() {
  local out=""
  local _try
  for _try in 1 2 3 4 5 6 7 8; do
    out="$(cast_u "$(cast block --rpc-url "$CHAIN_RPC_URL" -f timestamp 2>/dev/null || true)")"
    if [[ -n "$out" && "$out" =~ ^[0-9]+$ ]]; then
      echo "$out"
      return 0
    fi
    # Rotate full-state RPC when timestamp reads flake.
    CHAIN_RPC_URL="$(pick_sepolia_rpc)" || true
    sleep 2
  done
  echo ""
}

wait_until() {
  local target
  target="$(cast_u "$1")"
  [[ -n "$target" && "$target" =~ ^[0-9]+$ ]] || fail "wait_until bad target '$1'"
  local now
  local spun=0
  while true; do
    now="$(rpc_ts)"
    [[ -n "$now" && "$now" =~ ^[0-9]+$ ]] || {
      spun=$((spun + 1))
      [[ "$spun" -lt 60 ]] || fail "rpc_ts unavailable for too long while waiting for $target"
      sleep 3
      continue
    }
    if [[ "$(python -c "print(int('$now') >= int('$target'))")" == "True" ]]; then
      break
    fi
    # Hard stop if we somehow overslept far past target (avoid eating later batches).
    if [[ "$(python -c "print(int('$now') > int('$target') + 120)")" == "True" ]]; then
      break
    fi
    sleep 3
  done
}

# Do not pre-wait on forge-log start (simulation vs chain + RPC flake can burn windows).
ok "begin five-batch drill"

for id in 1 2 3 4 5; do
  B_START="$(batch_field "$id" 1)"
  B_END="$(batch_field "$id" 2)"
  B_PX="$(batch_field "$id" 4)"
  NOW="$(rpc_ts)"
  if [[ "$(python -c "print(int('$NOW') >= int('$B_END'))")" == "True" ]]; then
    fail "batch $id window already ended before drill (start=$B_START end=$B_END now=$NOW) — re-deploy fresh"
  fi
  wait_until "$B_START"

  # Buy first (window time is scarce under flaky RPC). Pause/vault checks after purchase.
  if [[ "$id" -eq 2 ]]; then
    expect_revert "buy_expired_batch1_during_batch2" "$MARKET" "buy(uint256,uint256)" 1 "$BUY_USDC"
  fi

  TTG_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")"
  SINK_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$TEST_P4CAP")")"
  send "buy_batch_${id}" "$MARKET" "buy(uint256,uint256)" "$id" "$BUY_USDC"
  TTG_AFTER="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$DEPLOYER")")"
  SINK_AFTER="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$USDC" "balanceOf(address)(uint256)" "$TEST_P4CAP")")"
  DELTA_TTG="$(python -c "print(int('$TTG_AFTER')-int('$TTG_BEFORE'))")"
  DELTA_USDC="$(python -c "print(int('$SINK_AFTER')-int('$SINK_BEFORE'))")"
  [[ "$DELTA_USDC" == "$BUY_USDC" ]] || fail "USDC sink delta != $BUY_USDC (got $DELTA_USDC) batch $id"
  QUOTE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$MARKET" "quoteTtg(uint256,uint256)(uint256)" "$id" "$BUY_USDC")")"
  [[ "$DELTA_TTG" == "$QUOTE" ]] || fail "TTG out != quote batch $id ($DELTA_TTG vs $QUOTE)"
  ok "batch $id px=$B_PX buy_ok ttgOut=$DELTA_TTG usdcToTestP4Cap=$DELTA_USDC"

  FROZEN="$(batch_field "$id" 9)"
  [[ "$FROZEN" == "true" || "$FROZEN" == "1" ]] || fail "batch $id not frozen after buy"

  if [[ "$id" -eq 1 ]]; then
    send "pause" "$MARKET" "pause()"
    expect_revert "buy_while_paused" "$MARKET" "buy(uint256,uint256)" 1 "$BUY_USDC"
    send "unpause" "$MARKET" "unpause()"
    expect_revert "vault_pull_not_market" "$VAULT" "pull(uint256)" 1
  fi

  wait_until "$B_END"

  VAULT_BEFORE="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")"
  if [[ "$id" -eq 5 ]]; then
    send "closeBatchBurn_5" "$MARKET" "closeBatchBurn(uint256)" 5
    ok "batch5 Timelock BURN close"
  else
    send "closeBatchReturn_${id}" "$MARKET" "closeBatchReturn(uint256)" "$id"
    VAULT_AFTER="$(cast_u "$(cast call --rpc-url "$CHAIN_RPC_URL" "$TTG" "balanceOf(address)(uint256)" "$VAULT")")"
    [[ "$(python -c "print(int('$VAULT_AFTER') > int('$VAULT_BEFORE'))")" == "True" ]] || fail "RETURN did not increase vault inventory batch $id"
    ok "batch $id RETURN_TO_PUBLIC_VAULT"
  fi
done

python - <<PY
import json, time
from pathlib import Path
evidence = Path(r"""$ROOT""") / "evidence" / "GO_ttg_v9_sepolia_rehearsal"
txs = []
for line in (evidence / "txs.tsv").read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    label, tx = line.split("\t", 1)
    txs.append({"label": label, "tx": tx})
payload = {
  "stamp": "V9_PM_SEPOLIA_PASS_STOP",
  "phase": "②",
  "chain_id": $SEPOLIA_CHAIN_ID,
  "not_production_go": True,
  "keep_mainnet": ["TTG", "OLD_PM", "Governor", "Timelock", "P4Cap_live", "Money_Path", "Region-83"],
  "deployer": "$DEPLOYER",
  "addresses": {
    "usdc_mock": "$USDC",
    "ttg_mock": "$TTG",
    "vault": "$VAULT",
    "market": "$MARKET",
    "test_p4cap_sink": "$TEST_P4CAP",
  },
  "window_seconds": $WINDOW,
  "buy_usdc_raw_per_batch": $BUY_USDC,
  "prices_usdc_raw_per_whole_ttg": [1, 3, 5, 7, 9],
  "close_policy": {"batches_1_to_4": "RETURN_TO_PUBLIC_VAULT", "batch_5": "BURN_TIMELOCK"},
  "transactions": txs,
  "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
(evidence / "V9_PM_SEPOLIA_PASS_STOP.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
(evidence / "v9-sepolia-rehearsal.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print("wrote", evidence / "V9_PM_SEPOLIA_PASS_STOP.json")
PY

ok "V9_PM_SEPOLIA_PASS_STOP issued; Mainnet KEEP; TT_PRODUCTION_GO unchanged"
