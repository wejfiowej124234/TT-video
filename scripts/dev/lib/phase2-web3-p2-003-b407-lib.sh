#!/usr/bin/env bash
# Phase ② · WEB3-P2-003 + B-407 Sprint — Sepolia real token deposit helpers.
set -euo pipefail

P2B407_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

p2b407_root() {
  cd "${P2B407_LIB_DIR}/../../.." && pwd
}

p2b407_strip_cr() { printf '%s' "${1//$'\r'/}"; }

p2b407_normalize_hex_pk() {
  local k
  k="$(p2b407_strip_cr "${1:-}")"
  [[ -z "$k" ]] && { printf '%s' "$k"; return; }
  if [[ "$k" =~ ^0x[0-9a-fA-F]{64}$ ]]; then printf '%s' "$k"; return; fi
  if [[ "$k" =~ ^[0-9a-fA-F]{64}$ ]]; then printf '0x%s' "$k"; return; fi
  printf '%s' "$k"
}

p2b407_order_uuid_to_bytes32() {
  local raw="${1//-/}"
  raw="${raw,,}"
  if [[ ! "$raw" =~ ^[0-9a-f]{32}$ ]]; then
    echo "p2b407: invalid order uuid: $1" >&2
    return 1
  fi
  printf '0x00000000000000000000000000000000%s' "$raw"
}

p2b407_load_env() {
  local root f line key val
  root="$(p2b407_root)"
  for f in \
    "$root/.env" \
    "$root/scripts/dev/.env.staging-onboarding.local" \
    "$root/scripts/dev/.env.phase2-chain-deploy.local" \
    "$root/scripts/dev/.env.staging-secrets.local"; do
    [[ -f "$f" ]] || continue
    while IFS= read -r line || [[ -n "$line" ]]; do
      line="${line%%#*}"
      line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
      [[ -z "$line" || "$line" != *=* ]] && continue
      key="${line%%=*}"
      val="${line#*=}"
      val="${val%\"}"
      val="${val#\"}"
      val="${val%\'}"
      val="${val#\'}"
      # Later files override; skip placeholder private keys from root .env
      if [[ "$key" == "PRIVATE_KEY" || "$key" == B407_*_PK ]]; then
        if p2b407_is_placeholder_val "$val"; then
          continue
        fi
      fi
      export "$key=$val"
    done <"$f"
  done
}

p2b407_is_placeholder_val() {
  local v="${1,,}"
  [[ -z "$v" ]] && return 0
  [[ "$v" == *replace* || "$v" == *changeme* || "$v" == *your_* || "$v" == *xxx* ]] && return 0
  [[ ${#v} -lt 64 ]] && [[ "$v" != 0x* ]] && return 0
  return 1
}

p2b407_rpc_url() {
  p2b407_load_env
  local rpc
  rpc="$(p2b407_strip_cr "${P2B407_RPC_URL:-${CHAIN_RPC_URL:-${B407_RPC_URL:-${RPC_URL:-}}}}")"
  if [[ -z "$rpc" ]]; then
    rpc="https://ethereum-sepolia-rpc.publicnode.com"
  fi
  printf '%s' "$rpc"
}

p2b407_payment_token() {
  p2b407_load_env
  p2b407_strip_cr "${PAYMENT_TOKEN:-${MOCK_ERC20_ADDRESS:-${ESCROW_PAYMENT_TOKEN:-${FUND_STACK_TOKEN_ADDRESS:-}}}}"
}

p2b407_amount_wei() {
  local amt="${1:-100}"
  amt="${amt//,/}"
  if command -v awk >/dev/null 2>&1; then
    awk -v a="$amt" 'BEGIN { printf "%d", a * 1000000 + 0.5 }'
  else
    local int_part="${amt%%.*}"
    echo $((int_part * 1000000))
  fi
}

p2b407_require_cast_forge() {
  for cmd in cast forge jq curl; do
    command -v "$cmd" >/dev/null 2>&1 || {
      echo "p2b407: need $cmd" >&2
      exit 1
    }
  done
}

p2b407_check_pk_decodable() {
  local label="$1" raw="$2"
  local k
  k="$(p2b407_normalize_hex_pk "$raw")"
  if [[ ! "$k" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
    echo "p2b407: ${label} bad format (want 0x + 64 hex)" >&2
    return 2
  fi
  cast wallet address --private-key "$k" >/dev/null 2>&1 || {
    echo "p2b407: ${label} could not decode with cast" >&2
    return 2
  }
  return 0
}

p2b407_preflight_chain_keys() {
  p2b407_load_env
  p2b407_require_cast_forge

  local pk_t pk_g pk_deploy token factory fee_router rpc
  pk_t="$(p2b407_normalize_hex_pk "${B407_TRAVELER_PK:-${P2B407_TRAVELER_PK:-${PRIVATE_KEY:-}}}")"
  pk_g="$(p2b407_normalize_hex_pk "${B407_GUIDE_PK:-${P2B407_GUIDE_PK:-}}")"
  pk_deploy="$(p2b407_normalize_hex_pk "${B407_FACTORY_DEPLOYER_PK:-${B407_RELAYER_PK:-${P2B407_FACTORY_DEPLOYER_PK:-${PRIVATE_KEY:-}}}}")"
  token="$(p2b407_payment_token)"
  factory="$(p2b407_strip_cr "${ESCROW_FACTORY_ADDRESS:-}")"
  fee_router="$(p2b407_strip_cr "${FEE_ROUTER_ADDRESS:-${B407_FEE_ROUTER:-}}")"
  rpc="$(p2b407_rpc_url)"

  [[ -n "$token" ]] || { echo "p2b407-preflight: set PAYMENT_TOKEN or FUND_STACK_TOKEN_ADDRESS" >&2; return 1; }
  [[ -n "$factory" ]] || { echo "p2b407-preflight: set ESCROW_FACTORY_ADDRESS" >&2; return 1; }
  [[ -n "$fee_router" ]] || { echo "p2b407-preflight: set FEE_ROUTER_ADDRESS" >&2; return 1; }

  p2b407_check_pk_decodable "B407_TRAVELER_PK (or PRIVATE_KEY)" "$pk_t" || return 2
  p2b407_check_pk_decodable "B407_GUIDE_PK" "$pk_g" || return 2
  p2b407_check_pk_decodable "B407_FACTORY_DEPLOYER_PK (or B407_RELAYER_PK)" "$pk_deploy" || return 2

  local chain_id="" attempt
  for attempt in 1 2 3 4 5; do
    chain_id="$(cast chain-id --rpc-url "$rpc" 2>/dev/null | tr -d '\r\n' || true)"
    [[ "$chain_id" == "11155111" ]] && break
    sleep 2
  done
  [[ "$chain_id" == "11155111" ]] || {
    echo "p2b407-preflight: expected Sepolia chain_id 11155111 got ${chain_id:-empty} (rpc=${rpc})" >&2
    return 3
  }

  export P2B407_RPC_URL="$rpc"
  export P2B407_TRAVELER_ADDR="$(cast wallet address --private-key "$pk_t" | tr -d '\r\n')"
  export P2B407_GUIDE_ADDR="$(cast wallet address --private-key "$pk_g" | tr -d '\r\n')"
  export P2B407_PAYMENT_TOKEN="$token"
  export P2B407_ESCROW_FACTORY="$factory"
  export P2B407_FEE_ROUTER="$fee_router"
  export P2B407_TRAVELER_PK="$pk_t"
  export P2B407_GUIDE_PK="$pk_g"
  export P2B407_FACTORY_DEPLOYER_PK="$pk_deploy"

  echo "p2b407-preflight: OK traveler=${P2B407_TRAVELER_ADDR} guide=${P2B407_GUIDE_ADDR} token=${token}"
  return 0
}

p2b407_create_escrow_on_chain() {
  local order_id="$1" order_b32="$2" amount_wei="$3" snapshot="${4:-}"
  local root rpc now end dispute schema bps arb chain_id
  root="$(p2b407_root)"
  rpc="$(p2b407_rpc_url)"
  p2b407_load_env

  chain_id="$(cast chain-id --rpc-url "$rpc" | tr -d '\r\n')"
  [[ -z "$snapshot" ]] && snapshot="$(cast keccak "traveltrust/web3-p2-003-b407/${order_id}" | tr -d '\r\n')"
  now="$(date +%s)"
  end="$((now + 7 * 86400))"
  dispute="${B407_DISPUTE_WINDOW_SECONDS:-604800}"
  schema="${B407_ESCROW_SCHEMA_VERSION:-1}"
  bps="${B407_PLATFORM_FEE_BPS:-0}"
  arb="${B407_ARBITRATOR:-0x0000000000000000000000000000000000000000}"

  export ESCROW_FACTORY_ADDRESS="${P2B407_ESCROW_FACTORY:-$ESCROW_FACTORY_ADDRESS}"
  export B407_ORDER_ID_BYTES32="$order_b32"
  export B407_SNAPSHOT_BYTES32="$snapshot"
  export B407_ESCROW_CHAIN_ID="$chain_id"
  export B407_TRAVELER="${P2B407_TRAVELER_ADDR}"
  export B407_GUIDE="${P2B407_GUIDE_ADDR}"
  export B407_FEE_ROUTER="${P2B407_FEE_ROUTER:-$FEE_ROUTER_ADDRESS}"
  export PAYMENT_TOKEN="${P2B407_PAYMENT_TOKEN}"
  export B407_TOTAL_AMOUNT_WEI="$amount_wei"
  export B407_PLATFORM_FEE_BPS="$bps"
  export B407_SERVICE_START="$now"
  export B407_SERVICE_END="$end"
  export B407_DISPUTE_WINDOW_SECONDS="$dispute"
  export B407_ESCROW_SCHEMA_VERSION="$schema"
  export B407_ARBITRATOR="$arb"
  export B407_FACTORY_DEPLOYER_PK="${P2B407_FACTORY_DEPLOYER_PK}"

  (cd "${root}/contracts" && forge script script/CreateEscrowB407.s.sol:CreateEscrowB407 \
    --rpc-url "$rpc" --broadcast -vvv) >&2

  P2B407_ESCROW_ADDRESS="$(cast call "$ESCROW_FACTORY_ADDRESS" "escrowOf(bytes32)(address)" "$order_b32" --rpc-url "$rpc" | tr -d '\r\n' | awk '{print $1}')"
  if [[ -z "$P2B407_ESCROW_ADDRESS" || "${P2B407_ESCROW_ADDRESS,,}" == "0x0000000000000000000000000000000000000000" ]]; then
    echo "p2b407: escrowOf empty after createEscrow" >&2
    return 12
  fi
  export P2B407_ESCROW_ADDRESS
  echo "$P2B407_ESCROW_ADDRESS"
}

p2b407_deposit_real_token() {
  local escrow="$1" amount_wei="$2"
  local rpc pk token approve_hash deposit_out
  rpc="$(p2b407_rpc_url)"
  pk="${P2B407_TRAVELER_PK}"
  token="${P2B407_PAYMENT_TOKEN}"

  if [[ "${ESCROW_MINT_TEST_TOKENS:-1}" == "1" ]]; then
    cast send "$token" "mint(address,uint256)" "${P2B407_TRAVELER_ADDR}" "$amount_wei" \
      --rpc-url "$rpc" --private-key "$pk" --confirmations 1 >/dev/null 2>&1 || true
  fi

  approve_hash="$(cast send "$token" "approve(address,uint256)" "$escrow" "$amount_wei" \
    --rpc-url "$rpc" --private-key "$pk" --json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(s).transactionHash||'')}catch{}})")"
  [[ -n "$approve_hash" ]] || { echo "p2b407: approve tx failed" >&2; return 13; }
  export P2B407_APPROVE_TX="$approve_hash"
  cast receipt "$approve_hash" --rpc-url "$rpc" --confirmations 1 >/dev/null 2>&1 || sleep 5

  deposit_out="$(cast send "$escrow" "deposit(uint256)" "$amount_wei" \
    --rpc-url "$rpc" --private-key "$pk" --json 2>&1)" || {
    echo "p2b407: deposit send failed: $deposit_out" >&2
    return 13
  }
  P2B407_DEPOSIT_TX="$(printf '%s' "$deposit_out" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(s).transactionHash||'')}catch{}})")"
  [[ -n "$P2B407_DEPOSIT_TX" ]] || { echo "p2b407: deposit tx hash missing" >&2; return 13; }

  local st
  st="$(cast call "$escrow" "status()(uint8)" --rpc-url "$rpc" | tr -d '\r\n')"
  st="${st%%[*]}"
  st="${st%% *}"
  [[ "$st" == "2" ]] || { echo "p2b407: expected Escrow status Funded(2) got ${st}" >&2; return 14; }
  export P2B407_ESCROW_STATUS="$st"
}

p2b407_indexer_tick_staging() {
  local api="$1" run_dir="$2"
  p2b407_load_env
  local sec="${INTERNAL_API_SECRET:-}"
  [[ -n "$sec" ]] || { echo "p2b407: INTERNAL_API_SECRET empty — skip indexer-tick" >&2; return 0; }

  mkdir -p "$run_dir"
  local out code
  out="$(mktemp)"
  code="$(
    curl -sS -o "$out" -w "%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      -H "X-Internal-Api-Secret: ${sec}" \
      -d '{}' \
      "${api%/}/api/v1/internal/indexer-tick" 2>/dev/null || echo "000"
  )"
  cp "$out" "${run_dir}/indexer-tick.json" 2>/dev/null || true
  rm -f "$out"
  [[ "$code" == "200" ]] || {
    echo "p2b407: indexer-tick HTTP ${code} (non-fatal if staging indexer disabled)" >&2
    return 0
  }
  echo "p2b407: indexer-tick HTTP 200"
}
