#!/usr/bin/env bash
# FundStack · Anvil 本地（GuideIdentityStakingPool + Registry + MockERC20 USDC）
# Sourced by deploy-fundstack-anvil-local.sh · smoke-guide-identity-stake-anvil.sh

fundstack_anvil_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd
}

fundstack_anvil_fail() { echo "fundstack-anvil: FAIL $*" >&2; exit 1; }
fundstack_anvil_ok() { echo "fundstack-anvil: OK $*"; }

FUNDSTACK_ANVIL_RPC="${FUNDSTACK_ANVIL_RPC:-http://127.0.0.1:${ANVIL_PORT:-8545}}"
FUNDSTACK_ANVIL_DEPLOYER_PK="${FUNDSTACK_ANVIL_DEPLOYER_PK:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
FUNDSTACK_ANVIL_STAKER_PK="${FUNDSTACK_ANVIL_STAKER_PK:-0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d}"

fundstack_anvil_env_file_path() {
  echo "$(fundstack_anvil_root)/scripts/dev/.env.fundstack-anvil.local"
}

fundstack_anvil_ensure_tools() {
  command -v forge >/dev/null 2>&1 || fundstack_anvil_fail "forge not found"
  command -v cast >/dev/null 2>&1 || fundstack_anvil_fail "cast not found"
}

fundstack_anvil_contract_has_code() {
  local addr="$1" rpc="$2"
  [[ -n "$addr" && "$addr" == 0x* ]] || return 1
  local code
  code="$(cast code "$addr" --rpc-url "$rpc" 2>/dev/null || echo "0x")"
  [[ -n "$code" && "$code" != "0x" ]]
}

fundstack_anvil_parse_deploy_addr() {
  local label="$1" deploy_out="$2"
  echo "$deploy_out" | grep -F "$label" | grep -oE '0x[a-fA-F0-9]{40}' | head -1
}

fundstack_anvil_ensure_anvil() {
  local rpc="$FUNDSTACK_ANVIL_RPC"
  if [[ "${ANVIL_ALREADY_RUNNING:-0}" == "1" ]]; then
    cast chain-id --rpc-url "$rpc" >/dev/null 2>&1 \
      || fundstack_anvil_fail "ANVIL_ALREADY_RUNNING=1 but nothing on $rpc"
    fundstack_anvil_ok "using existing anvil at $rpc"
    return 0
  fi
  if cast chain-id --rpc-url "$rpc" >/dev/null 2>&1; then
    fundstack_anvil_ok "anvil already listening on $rpc"
    return 0
  fi
  command -v anvil >/dev/null 2>&1 || fundstack_anvil_fail "anvil not found"
  anvil --port "${ANVIL_PORT:-8545}" --silent >/dev/null 2>&1 &
  local pid=$!
  for _ in $(seq 1 30); do
    if cast chain-id --rpc-url "$rpc" >/dev/null 2>&1; then
      fundstack_anvil_ok "started anvil on $rpc (pid $pid)"
      return 0
    fi
    sleep 0.5
  done
  fundstack_anvil_fail "anvil did not become ready on $rpc"
}

fundstack_anvil_try_reuse_deploy() {
  local rpc="$FUNDSTACK_ANVIL_RPC"
  fundstack_anvil_load_dotenv GUIDE_STAKING_ADDRESS
  fundstack_anvil_load_dotenv SETTLEMENT_TOKEN
  fundstack_anvil_load_dotenv REGISTRY_ADDRESS
  fundstack_anvil_load_dotenv STAKING_PROVIDER_ADDRESS
  fundstack_anvil_load_dotenv ESCROW_FACTORY_ADDRESS
  fundstack_anvil_load_dotenv FEE_ROUTER_ADDRESS
  local pool="${GUIDE_STAKING_ADDRESS:-}"
  local token="${SETTLEMENT_TOKEN:-}"
  local registry="${REGISTRY_ADDRESS:-}"
  local provider="${STAKING_PROVIDER_ADDRESS:-}"
  local factory="${ESCROW_FACTORY_ADDRESS:-}"
  local fee_router="${FEE_ROUTER_ADDRESS:-}"
  [[ -n "$pool" && -n "$token" && -n "$registry" && -n "$provider" && -n "$factory" ]] || return 1
  fundstack_anvil_contract_has_code "$pool" "$rpc" || return 1
  fundstack_anvil_contract_has_code "$token" "$rpc" || return 1
  fundstack_anvil_contract_has_code "$registry" "$rpc" || return 1
  fundstack_anvil_contract_has_code "$provider" "$rpc" || return 1
  fundstack_anvil_contract_has_code "$factory" "$rpc" || return 1
  [[ -z "$fee_router" ]] || fundstack_anvil_contract_has_code "$fee_router" "$rpc" || return 1
  export FUNDSTACK_ANVIL_GUIDE_POOL="$pool"
  export FUNDSTACK_ANVIL_PROVIDER_POOL="$provider"
  export FUNDSTACK_ANVIL_TOKEN="$token"
  export FUNDSTACK_ANVIL_REGISTRY="$registry"
  export FUNDSTACK_ANVIL_FACTORY="$factory"
  export FUNDSTACK_ANVIL_FEE_ROUTER="$fee_router"
  export FUNDSTACK_ANVIL_CHAIN_ID="$(cast chain-id --rpc-url "$rpc")"
  fundstack_anvil_ok "reuse deploy guide_pool=$pool provider=$provider token=$token"
  return 0
}

fundstack_anvil_load_dotenv() {
  local key="$1"
  [[ -n "${!key:-}" ]] && return 0
  local root envf line v=""
  root="$(fundstack_anvil_root)"
  for envf in "$root/scripts/dev/.env.fundstack-anvil.local" "$root/.env"; do
    [[ -f "$envf" ]] || continue
    if [[ "$envf" == "$root/.env" ]]; then
      line="$(awk '
        /^# --- BEGIN TT FUNDSTACK ANVIL LOCAL/ { inblock=1; next }
        /^# --- END TT FUNDSTACK ANVIL LOCAL/ { inblock=0; next }
        inblock && $0 ~ /^[[:space:]]*'"${key}"'=/ { sub(/^[[:space:]]*'"${key}"'=/, ""); print; exit }
      ' "$envf" 2>/dev/null || true)"
      [[ -n "$line" ]] && v="${line//$'\r'/}"
    else
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$line" =~ ^[[:space:]]*${key}= ]]; then
          v="${line#*=}"
          v="${v//$'\r'/}"
        fi
      done <"$envf"
    fi
  done
  [[ -n "$v" ]] || return 0
  export "$key=$v"
}

fundstack_anvil_deploy() {
  local root rpc deploy_out
  root="$(fundstack_anvil_root)"
  rpc="$FUNDSTACK_ANVIL_RPC"
  fundstack_anvil_ensure_tools
  cd "$root/contracts"
  deploy_out="$(PRIVATE_KEY="$FUNDSTACK_ANVIL_DEPLOYER_PK" forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$rpc" --broadcast 2>&1)" || fundstack_anvil_fail "forge Deploy.s.sol failed"

  export FUNDSTACK_ANVIL_GUIDE_POOL="$(fundstack_anvil_parse_deploy_addr "GuideIdentityStakingPool" "$deploy_out")"
  export FUNDSTACK_ANVIL_PROVIDER_POOL="$(fundstack_anvil_parse_deploy_addr "ProviderIdentityStakingPool" "$deploy_out")"
  export FUNDSTACK_ANVIL_TOKEN="$(fundstack_anvil_parse_deploy_addr "MockERC20" "$deploy_out")"
  export FUNDSTACK_ANVIL_REGISTRY="$(fundstack_anvil_parse_deploy_addr "Registry" "$deploy_out")"
  export FUNDSTACK_ANVIL_FACTORY="$(fundstack_anvil_parse_deploy_addr "EscrowFactory" "$deploy_out")"
  export FUNDSTACK_ANVIL_FEE_ROUTER="$(fundstack_anvil_parse_deploy_addr "FeeRouter" "$deploy_out")"
  export FUNDSTACK_ANVIL_CHAIN_ID="$(cast chain-id --rpc-url "$rpc")"

  [[ -n "$FUNDSTACK_ANVIL_GUIDE_POOL" ]] || fundstack_anvil_fail "parse GuideIdentityStakingPool failed"
  [[ -n "$FUNDSTACK_ANVIL_TOKEN" ]] || fundstack_anvil_fail "parse MockERC20 failed"
  [[ -n "$FUNDSTACK_ANVIL_REGISTRY" ]] || fundstack_anvil_fail "parse Registry failed"
  fundstack_anvil_ok "deployed guide_pool=$FUNDSTACK_ANVIL_GUIDE_POOL token=$FUNDSTACK_ANVIL_TOKEN registry=$FUNDSTACK_ANVIL_REGISTRY"
}

fundstack_anvil_write_env_file() {
  local envf
  envf="$(fundstack_anvil_env_file_path)"
  cat >"$envf" <<EOF
# Generated by deploy-fundstack-anvil-local.sh — ① Anvil FundStack (Guide identity stake)
# Re-run deploy after anvil reset. Do not commit secrets from this file.
CHAIN_RPC_URL=${FUNDSTACK_ANVIL_RPC}
CHAIN_ID=${FUNDSTACK_ANVIL_CHAIN_ID}
SETTLEMENT_TOKEN=${FUNDSTACK_ANVIL_TOKEN}
GUIDE_STAKING_ADDRESS=${FUNDSTACK_ANVIL_GUIDE_POOL}
STAKING_PROVIDER_ADDRESS=${FUNDSTACK_ANVIL_PROVIDER_POOL}
REGISTRY_ADDRESS=${FUNDSTACK_ANVIL_REGISTRY}
ESCROW_FACTORY_ADDRESS=${FUNDSTACK_ANVIL_FACTORY}
FEE_ROUTER_ADDRESS=${FUNDSTACK_ANVIL_FEE_ROUTER}
P3_CHAIN_OFF=0
FUNDSTACK_ANVIL_DEPLOYER_PK=${FUNDSTACK_ANVIL_DEPLOYER_PK}
EOF
  fundstack_anvil_ok "wrote $envf"
}

fundstack_anvil_apply_root_env() {
  local root envf block_begin block_end
  root="$(fundstack_anvil_root)"
  envf="$(fundstack_anvil_env_file_path)"
  [[ -f "$envf" ]] || fundstack_anvil_fail "missing $envf — run deploy-fundstack-anvil-local.sh first"
  # shellcheck disable=SC1090
  source "$envf"
  # shellcheck source=scripts/dev/lib/anvil-local-env-lib.sh
  source "$root/scripts/dev/lib/anvil-local-env-lib.sh"
  anvil_env_supersede_sepolia_top_level

  block_begin="# --- BEGIN TT FUNDSTACK ANVIL LOCAL (managed by deploy-fundstack-anvil-local.sh) ---"
  block_end="# --- END TT FUNDSTACK ANVIL LOCAL ---"
  local root_env="$root/.env"
  [[ -f "$root_env" ]] || touch "$root_env"

  local tmp kept inside=0
  tmp="$(mktemp)"
  kept="$(mktemp)"
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$block_begin" ]]; then inside=1; continue; fi
    if [[ "$line" == "$block_end" ]]; then inside=0; continue; fi
    [[ "$inside" -eq 1 ]] && continue
    if [[ "$line" =~ ^[[:space:]]*CHAIN_RPC_URL= ]] \
      || [[ "$line" =~ ^[[:space:]]*CHAIN_ID= ]] \
      || [[ "$line" =~ ^[[:space:]]*SETTLEMENT_TOKEN= ]] \
      || [[ "$line" =~ ^[[:space:]]*GUIDE_STAKING_ADDRESS= ]] \
      || [[ "$line" =~ ^[[:space:]]*STAKING_PROVIDER_ADDRESS= ]] \
      || [[ "$line" =~ ^[[:space:]]*REGISTRY_ADDRESS= ]] \
      || [[ "$line" =~ ^[[:space:]]*ESCROW_FACTORY_ADDRESS= ]] \
      || [[ "$line" =~ ^[[:space:]]*FEE_ROUTER_ADDRESS= ]] \
      || [[ "$line" =~ ^[[:space:]]*P3_CHAIN_OFF= ]]; then
      [[ "$line" != \#* ]] && line="# [superseded by TT FUNDSTACK ANVIL LOCAL] $line"
    fi
    printf '%s\n' "$line" >>"$kept"
  done <"$root_env"

  {
    cat "$kept"
    echo ""
    echo "$block_begin"
    echo "CHAIN_RPC_URL=${CHAIN_RPC_URL}"
    echo "CHAIN_ID=${CHAIN_ID}"
    echo "SETTLEMENT_TOKEN=${SETTLEMENT_TOKEN}"
    echo "GUIDE_STAKING_ADDRESS=${GUIDE_STAKING_ADDRESS}"
    echo "STAKING_PROVIDER_ADDRESS=${STAKING_PROVIDER_ADDRESS}"
    echo "REGISTRY_ADDRESS=${REGISTRY_ADDRESS}"
    echo "ESCROW_FACTORY_ADDRESS=${ESCROW_FACTORY_ADDRESS}"
    echo "FEE_ROUTER_ADDRESS=${FEE_ROUTER_ADDRESS}"
    echo "STAKING_ADDRESS=${GUIDE_STAKING_ADDRESS}"
    echo "GUIDE_STAKING_POOL_ADDRESS=${GUIDE_STAKING_ADDRESS}"
    echo "PROVIDER_STAKING_POOL_ADDRESS=${STAKING_PROVIDER_ADDRESS}"
    echo "P3_CHAIN_OFF=${P3_CHAIN_OFF:-0}"
    echo "$block_end"
  } >"$tmp"
  mv "$tmp" "$root_env"
  rm -f "$kept"
  anvil_env_supersede_sepolia_top_level
  fundstack_anvil_ok "merged FundStack block into $root_env (restart traveltrust-api to load)"
}
