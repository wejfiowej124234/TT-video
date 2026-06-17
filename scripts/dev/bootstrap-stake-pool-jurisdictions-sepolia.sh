#!/usr/bin/env bash

# Sepolia · Stake Pool 10 国 bootstrap（Timelock schedule → 48h → execute）

#

#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1   # Owner 授权

#   bash scripts/dev/bootstrap-stake-pool-jurisdictions-sepolia.sh schedule

#   bash scripts/dev/bootstrap-stake-pool-jurisdictions-sepolia.sh status

#   # … 等待 Timelock delay（GovFreeze = 48h）…

#   bash scripts/dev/bootstrap-stake-pool-jurisdictions-sepolia.sh execute

#   bash scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh --strict

# ⏸ CANCELLED（G24-CLEAN-BASELINE-01 · 2026-06-16）— 补丁式 schedule/execute 不符合干净基线
# 见 docs/spec/governance-token/G24-CLEAN-BASELINE-01-ROOT-CAUSE-AUDIT-REPORT.md

set -euo pipefail



ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT"

if [[ "${G24_CLEAN_BASELINE_ALLOW_PATCH_BOOTSTRAP:-}" != "1" ]]; then
  echo "bootstrap-stake-pool-jurisdictions-sepolia: CANCELLED — G24-CLEAN-BASELINE-01 FAIL_CLEAN_BASELINE" >&2
  echo "Run: bash scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh" >&2
  exit 3
fi



ACTION="${1:-schedule}"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"

[[ -f "$ENV_FILE" ]] || { echo "bootstrap-stake-pool-jurisdictions-sepolia: FAIL missing env" >&2; exit 2; }



while IFS= read -r line || [[ -n "$line" ]]; do

  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  [[ -z "$line" || "$line" != *=* ]] && continue

  export "${line%%=*}=${line#*=}"

done < "$ENV_FILE"



RPC="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"

POOL="${REGION_STEWARD_STAKE_POOL_ADDRESS:-${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-}}"

TIMELOCK="${TIMELOCK_ADDRESS:-${GOV_FREEZE_V1_TIMELOCK_ADDRESS:-}}"

SAFE="${TIMELOCK_ADMIN_ADDRESS:-}"

[[ -n "$POOL" && -n "$TIMELOCK" && -n "$SAFE" ]] || {

  echo "bootstrap-stake-pool-jurisdictions-sepolia: FAIL pool/timelock/safe unset" >&2

  exit 2

}



STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

EVID="$ROOT/evidence/GO_stake_pool_jurisdiction_bootstrap/sepolia-schedule"

mkdir -p "$EVID"



USE_ONCE="${STAKE_POOL_BOOTSTRAP_USE_ONCE:-0}"

export STAKE_POOL_BOOTSTRAP_USE_ONCE="$USE_ONCE"

export TIMELOCK_ADDRESS="$TIMELOCK"

export REGION_STEWARD_STAKE_POOL_ADDRESS="$POOL"

export TIMELOCK_ADMIN_ADDRESS="$SAFE"



_j_hex() { python -c "print('0x' + '${1}'.encode('ascii').hex())"; }



_op_id() {

  local data="$1" salt="$2"

  cast call "$TIMELOCK" "hashOperation(address,uint256,bytes,bytes32)(bytes32)" \

    "$POOL" 0 "$data" "$salt" --rpc-url "$RPC" 2>/dev/null || true

}



_op_status() {

  local id="$1"

  cast call "$TIMELOCK" "operations(bytes32)(uint256,bool,address,uint256,bytes)" \

    "$id" --rpc-url "$RPC" 2>/dev/null || echo "0 false"

}



_record_ops_json() {

  local out="$EVID/scheduled-operations-${STAMP}.json"

  export BOOT_EVID="$out" BOOT_POOL="$POOL" BOOT_TL="$TIMELOCK" BOOT_RPC="$RPC" BOOT_USE_ONCE="$USE_ONCE"

  python <<'PY'

import json, os, subprocess



pool = os.environ["BOOT_POOL"]

tl = os.environ["BOOT_TL"]

rpc = os.environ["BOOT_RPC"]

use_once = os.environ.get("BOOT_USE_ONCE", "0") == "1"



def j_hex(j):

    return "0x" + j.encode("ascii").hex()



def cast(*args):

    r = subprocess.run(["cast", *args, "--rpc-url", rpc], capture_output=True, text=True)

    return r.stdout.strip() if r.returncode == 0 else ""



def op_id(data, salt):

    return cast("call", tl, "hashOperation(address,uint256,bytes,bytes32)(bytes32)", pool, "0", data, salt).split()[0]



def op_row(op_id, label):

    raw = cast("call", tl, "operations(bytes32)(uint256,bool,address,uint256,bytes)", op_id)

    parts = raw.replace("\n", " ").split()

    ready = int(parts[0]) if parts else 0

    done = parts[1].lower() == "true" if len(parts) > 1 else False

    return {"id": op_id, "label": label, "ready_at_unix": ready, "done": done}



ops = []

if use_once:

    data = subprocess.run(["cast", "calldata", "bootstrapProtocolSsotJurisdictionsOnce()"], capture_output=True, text=True).stdout.strip()

    salt = subprocess.run(["cast", "keccak", "TTG-STAKE-POOL-BOOTSTRAP-ONCE"], capture_output=True, text=True).stdout.strip()

    oid = op_id(data, salt)

    if oid:

        ops.append(op_row(oid, "bootstrapOnce"))

else:

    expect = {"CN": 400, "US": 400, "FR": 450, "ES": 450, "JP": 250, "TH": 250, "SG": 200, "KR": 200, "AU": 150, "AE": 150}

    for j, bps in expect.items():

        jh = j_hex(j)

        enc = subprocess.run(["cast", "abi-encode", "f(string,bytes2,uint256)", "TTG-STAKE-POOL-JURIS", jh, str(bps)], capture_output=True, text=True).stdout.strip()

        salt = subprocess.run(["cast", "keccak", enc], capture_output=True, text=True).stdout.strip()

        data = subprocess.run(["cast", "calldata", "configureJurisdiction(bytes2,uint256)", jh, str(bps)], capture_output=True, text=True).stdout.strip()

        oid = op_id(data, salt)

        if oid:

            ops.append(op_row(oid, f"configureJurisdiction:{j}:{bps}"))



delay = int(cast("call", tl, "delay()(uint256)").split()[0] or 0)

payload = {

    "stamp_utc": os.environ.get("STAMP", ""),

    "pool": pool,

    "timelock": tl,

    "use_bootstrap_once": use_once,

    "timelock_delay_sec": delay,

    "operations": ops,

}

path = os.environ["BOOT_EVID"]

with open(path, "w", encoding="utf-8") as f:

    json.dump(payload, f, indent=2)

print("wrote", path)

for o in ops:

    print(f"OP {o['label']} id={o['id'][:18]}… ready={o['ready_at_unix']} done={o['done']}")

PY

}



case "$ACTION" in

  schedule)

    [[ "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}" == "1" ]] || {

      echo "bootstrap-stake-pool-jurisdictions-sepolia: need TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1" >&2

      exit 2

    }

    [[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" ]] || {

      echo "bootstrap-stake-pool-jurisdictions-sepolia: TIMELOCK_SAFE_OWNER_KEYS required (Safe admin path)" >&2

      exit 2

    }

    LOG="$EVID/schedule-${STAMP}.txt"

    cd "$ROOT/contracts"

    forge script script/BootstrapStakePoolJurisdictionsViaTimelock.s.sol:BootstrapStakePoolJurisdictionsViaTimelock \

      --rpc-url "$RPC" --broadcast -vv 2>&1 | tee "$LOG"

    export STAMP

    _record_ops_json

    DELAY="$(cast call "$TIMELOCK" "delay()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"

    echo "STAKE_POOL_BOOTSTRAP_SCHEDULED: OK delay_sec=${DELAY} evidence=${EVID}"

    echo "next: wait ${DELAY}s then bash scripts/dev/bootstrap-stake-pool-jurisdictions-sepolia.sh execute"

    ;;

  status)

    export STAMP

    _record_ops_json

    bash "$ROOT/scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh" || true

    ;;

  execute)

    EXEC_PK="${STAKE_POOL_EXECUTE_PRIVATE_KEY:-${PRIVATE_KEY:-}}"

    [[ -n "$EXEC_PK" ]] || { echo "bootstrap-stake-pool-jurisdictions-sepolia: PRIVATE_KEY required for execute" >&2; exit 2; }

    NOW="$(date +%s)"

    EXEC_LOG="$EVID/execute-${STAMP}.log"

    : >"$EXEC_LOG"

    EXECUTED=0

    SKIPPED=0

    if [[ "$USE_ONCE" == "1" ]]; then

      DATA="$(cast calldata "bootstrapProtocolSsotJurisdictionsOnce()")"

      SALT="$(cast keccak "TTG-STAKE-POOL-BOOTSTRAP-ONCE")"

      IDS=("$(_op_id "$DATA" "$SALT")")

    else

      IDS=()

      for spec in CN:400 US:400 FR:450 ES:450 JP:250 TH:250 SG:200 KR:200 AU:150 AE:150; do

        J="${spec%%:*}"; BPS="${spec##*:}"

        JH="$(_j_hex "$J")"

        SALT="$(cast keccak "$(cast abi-encode "f(string,bytes2,uint256)" "TTG-STAKE-POOL-JURIS" "$JH" "$BPS")")"

        DATA="$(cast calldata "configureJurisdiction(bytes2,uint256)" "$JH" "$BPS")"

        IDS+=("$(_op_id "$DATA" "$SALT")")

      done

    fi

    for id in "${IDS[@]}"; do

      [[ -n "$id" && "$id" != "0x0000000000000000000000000000000000000000000000000000000000000000" ]] || continue

      read -r READY DONE _ <<<"$(_op_status "$id")"

      READY="${READY:-0}"; DONE="${DONE:-false}"

      if [[ "$DONE" == "true" ]]; then

        echo "skip done $id" | tee -a "$EXEC_LOG"

        SKIPPED=$((SKIPPED + 1))

        continue

      fi

      if [[ "$NOW" -lt "$READY" ]]; then

        echo "too early $id ready_at=$READY now=$NOW" | tee -a "$EXEC_LOG"

        continue

      fi

      cast send "$TIMELOCK" "execute(bytes32)" "$id" --rpc-url "$RPC" --private-key "$EXEC_PK" 2>&1 | tee -a "$EXEC_LOG" || true

      EXECUTED=$((EXECUTED + 1))

    done

    echo "STAKE_POOL_BOOTSTRAP_EXECUTE: executed=${EXECUTED} skipped=${SKIPPED} log=${EXEC_LOG}"

    bash "$ROOT/scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh" --strict

    ;;

  audit)

    bash "$ROOT/scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh" --strict

    ;;

  *)

    echo "usage: $0 schedule|status|execute|audit" >&2

    exit 2

    ;;

esac


