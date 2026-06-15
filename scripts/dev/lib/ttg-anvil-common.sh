#!/usr/bin/env bash
# Shared helpers for local TTG (Anvil + MockERC20 + RegionStewardStakePool).
# Sourced by deploy-ttg-anvil-local.sh · start-ttg-anvil-local.sh · mint-ttg-anvil-local.sh
# Phase: ② Anvil slice only — not ③ testnet/production GO.

# Plan A · multi-demo@test.com steward seed wallet (Anvil deployer #0 · MetaMask importable)
TTG_ANVIL_MULTI_DEMO_STEWARD_WALLET="${TTG_ANVIL_MULTI_DEMO_STEWARD_WALLET:-0x104FCb93B5e097F92c93Ee4621C487C6C953D212}"

ttg_anvil_root() {
  if [[ -n "${TTG_ANVIL_ROOT:-}" ]]; then
    echo "$TTG_ANVIL_ROOT"
    return 0
  fi
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  echo "$(cd "$here/../../.." && pwd)"
}

ttg_anvil_fail() { echo "ttg-anvil: FAIL $*" >&2; exit 1; }
ttg_anvil_ok() { echo "ttg-anvil: OK $*"; }

ttg_anvil_load_dotenv() {
  local key="$1"
  if [[ -n "${!key:-}" ]]; then
    return 0
  fi
  local root envf
  root="$(ttg_anvil_root)"
  for envf in "$root/.env" "$root/scripts/dev/.env.anvil.local"; do
    [[ -f "$envf" ]] || continue
    local line
    # Prefer Anvil managed block / .env.anvil.local over root Sepolia defaults.
    if [[ "$envf" == "$root/.env" ]]; then
      line="$(awk '
        /^# --- BEGIN TT ANVIL LOCAL/ { inblock=1; next }
        /^# --- END TT ANVIL LOCAL/ { inblock=0; next }
        inblock && $0 ~ /^[[:space:]]*'"${key}"'=/ { sub(/^[[:space:]]*'"${key}"'=/, ""); print; exit }
      ' "$envf" 2>/dev/null || true)"
    else
      line="$(grep -E "^[[:space:]]*${key}=" "$envf" 2>/dev/null | head -1 || true)"
      [[ -n "$line" ]] && line="${line#*=}"
    fi
    [[ -n "$line" ]] || continue
    export "$key=${line}"
    return 0
  done
}

ttg_anvil_ensure_tools() {
  command -v forge >/dev/null 2>&1 || ttg_anvil_fail "forge not found (install Foundry)"
  command -v cast >/dev/null 2>&1 || ttg_anvil_fail "cast not found (install Foundry)"
}

ttg_anvil_state_path() {
  local root
  root="$(ttg_anvil_root)"
  echo "$root/data/anvil_local/anvil-state.json"
}

ttg_anvil_ensure_state_dir() {
  local dir
  dir="$(dirname "$(ttg_anvil_state_path)")"
  mkdir -p "$dir"
}

ttg_anvil_ensure_anvil() {
  local port="${ANVIL_PORT:-8545}"
  TTG_ANVIL_RPC="http://127.0.0.1:${port}"
  export TTG_ANVIL_RPC

  if [[ "${ANVIL_ALREADY_RUNNING:-0}" == "1" ]]; then
    cast chain-id --rpc-url "$TTG_ANVIL_RPC" >/dev/null 2>&1 \
      || ttg_anvil_fail "ANVIL_ALREADY_RUNNING=1 but nothing on $TTG_ANVIL_RPC"
    ttg_anvil_ok "using existing anvil at $TTG_ANVIL_RPC"
    return 0
  fi

  if cast chain-id --rpc-url "$TTG_ANVIL_RPC" >/dev/null 2>&1; then
    ttg_anvil_ok "anvil already listening on $TTG_ANVIL_RPC"
    return 0
  fi

  command -v anvil >/dev/null 2>&1 || ttg_anvil_fail "anvil not found"
  ttg_anvil_ensure_state_dir
  local state_path
  state_path="$(ttg_anvil_state_path)"
  # --state: load on start, dump on exit — keeps imported-wallet ETH across restarts.
  anvil --port "$port" --state "$state_path" --silent >/dev/null 2>&1 &
  TTG_ANVIL_PID=$!
  export TTG_ANVIL_PID
  TTG_ANVIL_STARTED=1
  export TTG_ANVIL_STARTED=1

  local i
  for i in $(seq 1 30); do
    if cast chain-id --rpc-url "$TTG_ANVIL_RPC" >/dev/null 2>&1; then
      if [[ -f "$state_path" ]]; then
        ttg_anvil_ok "started anvil on $TTG_ANVIL_RPC (pid $TTG_ANVIL_PID, restored state)"
      else
        ttg_anvil_ok "started anvil on $TTG_ANVIL_RPC (pid $TTG_ANVIL_PID, new persistent state)"
      fi
      return 0
    fi
    sleep 0.5
  done
  ttg_anvil_fail "anvil did not become ready on $TTG_ANVIL_RPC"
}

ttg_anvil_contract_has_code() {
  local addr="$1"
  local rpc="$2"
  local code
  [[ -n "$addr" && "$addr" == 0x* && "$addr" != 0x0000000000000000000000000000000000000000 ]] || return 1
  code="$(cast code "$addr" --rpc-url "$rpc" 2>/dev/null || true)"
  [[ -n "$code" && "$code" != "0x" ]]
}

# Reuse pool/TTG from scripts/dev/.env.anvil.local when still deployed on chain (skip forge redeploy).
ttg_anvil_try_reuse_deploy() {
  local envf rpc pool ttg
  envf="$(ttg_anvil_env_file_path)"
  [[ -f "$envf" ]] || return 1
  rpc="${TTG_ANVIL_RPC:?}"

  # shellcheck disable=SC1090
  source "$envf"
  pool="${REGION_STEWARD_STAKE_POOL_ADDRESS:-}"
  ttg="${GOVERNANCE_TOKEN_ADDRESS:-${TTG_ANVIL_MOCK_ERC20:-}}"

  ttg_anvil_contract_has_code "$pool" "$rpc" || return 1
  ttg_anvil_contract_has_code "$ttg" "$rpc" || return 1

  # Reject address collisions (FundStack USDC / EscrowFactory reuse false positives).
  local pool_ttg settlement factory_guardian
  pool_ttg="$(cast call "$pool" "ttg()(address)" --rpc-url "$rpc" 2>/dev/null || true)"
  [[ -n "$pool_ttg" && "$pool_ttg" == 0x* ]] || return 1
  ttg_anvil_load_dotenv SETTLEMENT_TOKEN
  settlement="${SETTLEMENT_TOKEN:-}"
  if [[ -n "$settlement" && "${pool,,}" == "${settlement,,}" ]]; then
    return 1
  fi
  factory_guardian="$(cast call "$ttg" "guardian()(address)" --rpc-url "$rpc" 2>/dev/null || true)"
  if [[ -n "$factory_guardian" && "$factory_guardian" == 0x* ]]; then
    return 1
  fi

  TTG_ANVIL_POOL="$pool"
  TTG_ANVIL_TTG="$ttg"
  export TTG_ANVIL_POOL TTG_ANVIL_TTG
  TTG_ANVIL_CHAIN_ID="$(cast chain-id --rpc-url "$rpc")"
  export TTG_ANVIL_CHAIN_ID
  ttg_anvil_ok "reuse existing deploy pool=$pool ttg=$ttg (skip forge)"
  return 0
}

ttg_anvil_collect_fund_wallets() {
  local root list line
  root="$(ttg_anvil_root)"
  list="${TTG_ANVIL_FUND_WALLETS:-}"
  ttg_anvil_load_dotenv TTG_ANVIL_FUND_WALLETS
  list="${TTG_ANVIL_FUND_WALLETS:-$list}"

  local fund_file="$root/scripts/dev/ttg-anvil-fund-wallets.local"
  if [[ -f "$fund_file" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      line="${line%%#*}"
      line="$(echo "$line" | tr -d '[:space:]')"
      [[ -n "$line" && "$line" == 0x* ]] || continue
      if [[ ",$list," != *",$line,"* ]]; then
        list="${list:+$list,}$line"
      fi
    done <"$fund_file"
  fi
  if [[ -z "$list" ]]; then
    list="$TTG_ANVIL_MULTI_DEMO_STEWARD_WALLET"
  fi
  echo "$list"
}

# Top up test wallets with ETH + TTG when below threshold (after deploy or reuse).
ttg_anvil_fund_test_wallets() {
  local rpc pk ttg eth_amount mint_amount min_eth_wei wallets wallet bal ttg_bal
  ttg_anvil_ensure_tools
  rpc="${TTG_ANVIL_RPC:?}"
  ttg_anvil_load_dotenv TTG_ANVIL_DEPLOYER_PK
  pk="${TTG_ANVIL_DEPLOYER_PK:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
  ttg="${TTG_ANVIL_TTG:-}"
  if [[ -z "$ttg" ]]; then
    ttg_anvil_load_dotenv GOVERNANCE_TOKEN_ADDRESS
    ttg="${GOVERNANCE_TOKEN_ADDRESS:-}"
  fi
  [[ -n "$ttg" && "$ttg" == 0x* ]] || return 0

  wallets="$(ttg_anvil_collect_fund_wallets)"
  [[ -n "$wallets" ]] || return 0

  eth_amount="${TTG_ANVIL_FUND_ETH:-10ether}"
  mint_amount="${TTG_ANVIL_FUND_TTG_WEI:-1250000000000000000000000}"
  min_eth_wei="${TTG_ANVIL_FUND_MIN_ETH_WEI:-1000000000000000000}"

  local IFS=','
  for wallet in $wallets; do
    wallet="$(echo "$wallet" | tr -d '[:space:]')"
    [[ -n "$wallet" && "$wallet" == 0x* ]] || continue

    bal="$(cast balance "$wallet" --rpc-url "$rpc" 2>/dev/null || echo 0)"
    if [[ "$bal" -lt "$min_eth_wei" ]]; then
      cast send "$wallet" --value "$eth_amount" --rpc-url "$rpc" --private-key "$pk" >/dev/null \
        || ttg_anvil_fail "ETH fund failed for $wallet"
      ttg_anvil_ok "funded $eth_amount ETH to $wallet"
    else
      ttg_anvil_ok "ETH ok for $wallet (balance >= 1 ETH)"
    fi

    ttg_bal="$(cast call "$ttg" "balanceOf(address)(uint256)" "$wallet" --rpc-url "$rpc" 2>/dev/null | awk '{print $1}' || echo 0)"
    if [[ -z "$ttg_bal" || "$ttg_bal" == "0" ]]; then
      cast send "$ttg" "mint(address,uint256)" "$wallet" "$mint_amount" \
        --rpc-url "$rpc" --private-key "$pk" >/dev/null \
        || ttg_anvil_fail "TTG mint failed for $wallet"
      ttg_anvil_ok "minted TTG to $wallet"
    else
      ttg_anvil_ok "TTG ok for $wallet"
    fi
  done
}

ttg_anvil_deploy_pool() {
  local root rpc
  root="$(ttg_anvil_root)"
  rpc="${TTG_ANVIL_RPC:?}"
  ttg_anvil_ensure_tools

  local deploy_out
  deploy_out="$(cd "$root/contracts" && forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
    --rpc-url "$rpc" --broadcast 2>&1)" || ttg_anvil_fail "forge deploy failed"

  TTG_ANVIL_POOL="$(echo "$deploy_out" | grep -m1 'REGION_STEWARD_STAKE_POOL' | awk '{print $NF}')"
  TTG_ANVIL_TTG="$(echo "$deploy_out" | grep -m1 'STEWARD_TTG_TOKEN' | awk '{print $NF}')"
  export TTG_ANVIL_POOL TTG_ANVIL_TTG

  [[ -n "$TTG_ANVIL_POOL" && "$TTG_ANVIL_POOL" == 0x* ]] \
    || ttg_anvil_fail "could not parse REGION_STEWARD_STAKE_POOL from deploy output"
  [[ -n "$TTG_ANVIL_TTG" && "$TTG_ANVIL_TTG" == 0x* ]] \
    || ttg_anvil_fail "could not parse STEWARD_TTG_TOKEN from deploy output"

  TTG_ANVIL_CHAIN_ID="$(cast chain-id --rpc-url "$rpc")"
  export TTG_ANVIL_CHAIN_ID
  ttg_anvil_ok "deployed pool=$TTG_ANVIL_POOL ttg=$TTG_ANVIL_TTG chain_id=$TTG_ANVIL_CHAIN_ID"
}

ttg_anvil_env_file_path() {
  echo "$(ttg_anvil_root)/scripts/dev/.env.anvil.local"
}

ttg_anvil_write_env_file() {
  local envf deployer_pk
  envf="$(ttg_anvil_env_file_path)"
  deployer_pk="${ANVIL_DEPLOYER_PK:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

  cat >"$envf" <<EOF
# Generated by scripts/dev/deploy-ttg-anvil-local.sh — ② Anvil local TTG (MockERC20)
# Do not commit. Re-run deploy to refresh addresses after anvil reset.
#
# Apply to API: bash scripts/dev/apply-ttg-anvil-env-to-root.sh
# Mint test TTG: bash scripts/dev/mint-ttg-anvil-local.sh 0xYourWallet [amount_wei]

CHAIN_RPC_URL=${TTG_ANVIL_RPC}
CHAIN_ID=${TTG_ANVIL_CHAIN_ID}
GOVERNANCE_TOKEN_ADDRESS=${TTG_ANVIL_TTG}
GOVERNANCE_VOTES_TOKEN_ADDRESS=${TTG_ANVIL_TTG}
REGION_STEWARD_STAKE_POOL_ADDRESS=${TTG_ANVIL_POOL}
TTG_ANVIL_MOCK_ERC20=${TTG_ANVIL_TTG}
TTG_ANVIL_DEPLOYER_PK=${deployer_pk}
TTG_ANVIL_FUND_WALLETS=${TTG_ANVIL_MULTI_DEMO_STEWARD_WALLET}
# Steward stake-status + wallet reads need chain mode (not P3 mock-pay only)
P3_CHAIN_OFF=0
EOF
  ttg_anvil_ok "wrote $envf"
}

ttg_anvil_apply_root_env() {
  local root envf block_begin block_end
  root="$(ttg_anvil_root)"
  envf="$(ttg_anvil_env_file_path)"
  [[ -f "$envf" ]] || ttg_anvil_fail "missing $envf — run deploy-ttg-anvil-local.sh first"

  block_begin="# --- BEGIN TT ANVIL LOCAL (managed by deploy-ttg-anvil-local.sh) ---"
  block_end="# --- END TT ANVIL LOCAL ---"

  # shellcheck disable=SC1090
  source "$envf"

  local root_env="$root/.env"
  if [[ ! -f "$root_env" ]]; then
    touch "$root_env"
  fi

  local tmp kept inside=0
  tmp="$(mktemp)"
  kept="$(mktemp)"
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$block_begin" ]]; then inside=1; continue; fi
    if [[ "$line" == "$block_end" ]]; then inside=0; continue; fi
    [[ "$inside" -eq 1 ]] && continue
    # dotenvy uses the first duplicate key in .env — comment Sepolia chain vars so Anvil block wins after merge.
    if [[ "$line" =~ ^[[:space:]]*CHAIN_RPC_URL= ]] \
      || [[ "$line" =~ ^[[:space:]]*CHAIN_ID= ]] \
      || [[ "$line" =~ ^[[:space:]]*GOVERNANCE_TOKEN_ADDRESS= ]] \
      || [[ "$line" =~ ^[[:space:]]*GOVERNANCE_VOTES_TOKEN_ADDRESS= ]]; then
      if [[ "$line" != \#* ]]; then
        line="# [superseded by TT ANVIL LOCAL] $line"
      fi
    fi
    printf '%s\n' "$line" >>"$kept"
  done <"$root_env"

  {
    cat "$kept"
    echo ""
    echo "$block_begin"
    echo "# ② Anvil · MockERC20 as TTG · protocol-ssot 10M supply units"
    echo "CHAIN_RPC_URL=${CHAIN_RPC_URL}"
    echo "CHAIN_ID=${CHAIN_ID}"
    echo "GOVERNANCE_TOKEN_ADDRESS=${GOVERNANCE_TOKEN_ADDRESS}"
    echo "GOVERNANCE_VOTES_TOKEN_ADDRESS=${GOVERNANCE_VOTES_TOKEN_ADDRESS}"
    echo "REGION_STEWARD_STAKE_POOL_ADDRESS=${REGION_STEWARD_STAKE_POOL_ADDRESS}"
    echo "TTG_ANVIL_MOCK_ERC20=${TTG_ANVIL_MOCK_ERC20}"
    echo "P3_CHAIN_OFF=${P3_CHAIN_OFF:-0}"
    echo "$block_end"
  } >"$tmp"
  mv "$tmp" "$root_env"
  rm -f "$kept"
  # shellcheck source=scripts/dev/lib/anvil-local-env-lib.sh
  source "$root/scripts/dev/lib/anvil-local-env-lib.sh"
  anvil_env_supersede_sepolia_top_level
  ttg_anvil_ok "merged Anvil block into $root_env (restart traveltrust-api to load)"
}

ttg_anvil_print_guide() {
  local envf
  envf="$(ttg_anvil_env_file_path)"
  cat <<EOF

================================================================================
  TravelTrust · 本地治理币 TTG（② Anvil）
================================================================================
  Token (MockERC20):  ${TTG_ANVIL_TTG}
  Stake pool:         ${TTG_ANVIL_POOL}
  RPC:                ${TTG_ANVIL_RPC}
  Chain ID:           ${TTG_ANVIL_CHAIN_ID}

  MetaMask
  --------
  1. 网络：Add network · RPC ${TTG_ANVIL_RPC} · Chain ID ${TTG_ANVIL_CHAIN_ID}
  2. 导入测试账户（Anvil #0 私钥，仅本地）：
     ${ANVIL_DEPLOYER_PK:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}
  3. 导入代币：合约地址 = ${TTG_ANVIL_TTG}（符号可填 TTG，decimals 按 MockERC20=6）

  Mint TTG 到任意钱包
  -------------------
  bash scripts/dev/mint-ttg-anvil-local.sh ${TTG_ANVIL_MULTI_DEMO_STEWARD_WALLET}
  # CN 单辖区质押约需 minStakeAmount(CN) 链上 raw 单位（与 smoke 一致）

  multi-demo 主理人质押（Plan A · ①）
  ------------------------------------
  账号 multi-demo@test.com / Test123!
  申报钱包 ${TTG_ANVIL_MULTI_DEMO_STEWARD_WALLET}（与 Anvil #0 同址 · Step 3c 自动补 ETH+TTG）
  MetaMask：Chain ${TTG_ANVIL_CHAIN_ID} · 导入上列私钥 · 连接该地址
  工作台：/governance?view=region#steward-ttg-stake（walletMatch 后显示 approve/stake）
  旧库仍 0x4d55…0001 时：RESET_DOCKER_DB=1 后重跑 start-api-with-seed 或 POST /auth/seed-test-accounts

  API + 前端
  ----------
  bash scripts/dev/apply-ttg-anvil-env-to-root.sh
  API_LISTEN_PORT=8080 bash scripts/dev/sync-frontend-env-local-from-root.sh
  # 重启 API（须加载根 .env）后：
  curl "http://127.0.0.1:8080/api/v1/steward/stake-status?jurisdiction=CN&wallet=0x..."

  验收（① + ②）
  ------------
  bash scripts/dev/smoke-steward-onboarding-local.sh      # ① 申报链
  ANVIL_ALREADY_RUNNING=1 bash scripts/dev/smoke-steward-stake-anvil.sh  # ② 链上 stake

  文档：scripts/dev/TTG-ANVIL-LOCAL-README.md
  配置：${envf}
================================================================================
EOF
}
