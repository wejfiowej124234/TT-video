#!/usr/bin/env bash
# Phase ② · 在 Sepolia 部署 Gnosis Safe 作为 TIMELOCK_ADMIN（R-02 · G-05）
#
# Safe owners = TIMELOCK_SAFE_OWNER_KEYS（逗号分隔私钥）· threshold = TIMELOCK_SAFE_THRESHOLD
# 默认：单独生成 admin owner 密钥（≠ deployer）· 1-of-1 Safe
#
#   cp scripts/dev/.env.phase2-chain-deploy.local.example scripts/dev/.env.phase2-chain-deploy.local
#   # 填 CHAIN_RPC_URL + PRIVATE_KEY（deployer · 付 gas）
#   bash scripts/dev/provision-phase2-timelock-admin-safe.sh
#
# 输出：TIMELOCK_ADMIN_ADDRESS 写入 .env.phase2-chain-deploy.local
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EXAMPLE="$ROOT/scripts/dev/.env.phase2-chain-deploy.local.example"

fail() { echo "provision-phase2-timelock-admin-safe: FAIL $*" >&2; exit 2; }
ok() { echo "provision-phase2-timelock-admin-safe: OK $*"; }

[[ -f "$ENV_FILE" ]] || cp "$EXAMPLE" "$ENV_FILE"

load_env() {
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$ENV_FILE"
}

set_env_key() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    local tmp
    tmp="$(mktemp)"
    while IFS= read -r line || [[ -n "$line" ]]; do
      if [[ "$line" == "${key}="* ]]; then
        echo "${key}=${val}"
      else
        echo "$line"
      fi
    done < "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

load_env

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset in $ENV_FILE"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset in $ENV_FILE"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
THRESHOLD="${TIMELOCK_SAFE_THRESHOLD:-1}"

# 已有有效 Safe 且 ≠ deployer → 跳过部署
if [[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" && "$TIMELOCK_ADMIN_ADDRESS" != *"..."* ]]; then
  ADMIN_LC="$(echo "$TIMELOCK_ADMIN_ADDRESS" | tr '[:upper:]' '[:lower:]')"
  DEPLOYER_LC="$(echo "$DEPLOYER" | tr '[:upper:]' '[:lower:]')"
  CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
  if [[ "$ADMIN_LC" != "$DEPLOYER_LC" && "$CODE" != "0x" ]]; then
    ok "TIMELOCK_ADMIN_ADDRESS already set ($TIMELOCK_ADMIN_ADDRESS)"
    exit 0
  fi
fi

# 生成或使用 admin owner（须 ≠ deployer）
OWNER_KEYS="${TIMELOCK_SAFE_OWNER_KEYS:-}"
if [[ -z "$OWNER_KEYS" ]]; then
  ADMIN_OWNER_KEY="$(cast wallet new 2>/dev/null | awk '/Private key:/ {print $3}')"
  [[ -n "$ADMIN_OWNER_KEY" ]] || fail "could not generate admin owner key"
  OWNER_KEYS="$ADMIN_OWNER_KEY"
  ok "generated admin owner key (save locally — written to $ENV_FILE as TIMELOCK_SAFE_OWNER_KEYS)"
fi

OWNERS=()
IFS=',' read -ra KEY_PARTS <<< "$OWNER_KEYS"
for pk in "${KEY_PARTS[@]}"; do
  pk="$(echo "$pk" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -n "$pk" ]] || continue
  addr="$(cast wallet address --private-key "$pk")"
  if [[ "$(echo "$addr" | tr '[:upper:]' '[:lower:]')" == "$(echo "$DEPLOYER" | tr '[:upper:]' '[:lower:]')" ]]; then
    fail "Safe owner must not be deployer EOA ($DEPLOYER)"
  fi
  OWNERS+=("$addr")
done
[[ ${#OWNERS[@]} -ge 1 ]] || fail "no Safe owners"
[[ "$THRESHOLD" -le ${#OWNERS[@]} ]] || fail "threshold $THRESHOLD > owners ${#OWNERS[@]}"

# Sepolia · Safe v1.3.0（safe-global/safe-deployments）
export SAFE_PROXY_FACTORY="${SAFE_PROXY_FACTORY:-0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2}"
export SAFE_SINGLETON="${SAFE_SINGLETON:-0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552}"
export SAFE_FALLBACK_HANDLER="${SAFE_FALLBACK_HANDLER:-0x0000000000000000000000000000000000000000}"

OWNERS_CSV="$(IFS=,; echo "${OWNERS[*]}")"
export SAFE_OWNERS="$OWNERS_CSV"
export SAFE_THRESHOLD="$THRESHOLD"

LOG="$(mktemp)"
(
  cd "$ROOT/contracts"
  forge script script/DeployPhase2TimelockAdminSafe.s.sol:DeployPhase2TimelockAdminSafe \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
) || fail "Safe deploy script failed — see log"

SAFE_ADDR="$(grep -E 'Phase2TimelockAdminSafe:' "$LOG" | tail -1 | awk '{print $NF}' || true)"
[[ -n "$SAFE_ADDR" && "$SAFE_ADDR" == 0x* ]] || fail "could not parse Safe address from forge log"

set_env_key "TIMELOCK_ADMIN_ADDRESS" "$SAFE_ADDR"
set_env_key "TIMELOCK_SAFE_OWNER_KEYS" "$OWNER_KEYS"
set_env_key "TIMELOCK_SAFE_THRESHOLD" "$THRESHOLD"
set_env_key "CHAIN_ID" "${CHAIN_ID:-11155111}"

ok "TIMELOCK_ADMIN_ADDRESS=$SAFE_ADDR (Gnosis Safe · owners=${#OWNERS[@]} threshold=$THRESHOLD)"
ok "deployer=$DEPLOYER (gas payer only · not Timelock.admin)"
echo "  Next: bash scripts/gates/check-phase2-chain-broadcast-pregate.sh"
