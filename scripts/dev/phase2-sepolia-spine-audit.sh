#!/usr/bin/env bash
# Phase ② · Sepolia 已部署主脊（序 1～4）env / registry / 链上 owner 对拍
#
#   bash scripts/dev/phase2-sepolia-spine-audit.sh
#   CHAIN_RPC_URL=https://1rpc.io/sepolia bash scripts/dev/phase2-sepolia-spine-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"
EVIDENCE="${PHASE2_SPINE_AUDIT_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/spine-audit/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

fail() { echo "phase2-sepolia-spine-audit: FAIL $*" >&2; exit 2; }
pass() { echo "  SPINE PASS: $*"; }
ok() { echo "phase2-sepolia-spine-audit: OK $*"; }

load_env() {
  [[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
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

load_env
DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
TL="${TIMELOCK_ADDRESS:-}"
SAFE="${TIMELOCK_ADMIN_ADDRESS:-}"
[[ -n "$TL" && "$TL" != *"..."* ]] || fail "TIMELOCK_ADDRESS unset"

pick_rpc() {
  local r
  for r in "${PHASE2_VERIFY_RPC_URL:-}" "https://ethereum-sepolia-rpc.publicnode.com" "https://1rpc.io/sepolia" "https://sepolia.drpc.org"; do
    [[ -z "$r" ]] && continue
    if cast chain-id --rpc-url "$r" >/dev/null 2>&1; then
      echo "$r"
      return 0
    fi
  done
  return 1
}

RPC="$(pick_rpc)" || fail "no working Sepolia RPC for spine audit"
export PHASE2_VERIFY_RPC_URL="$RPC"
export CHAIN_RPC_URL="$RPC"

mkdir -p "$EVIDENCE"
REPORT="$EVIDENCE/spine-audit-${TS}.json"

registry_val() {
  local key="$1"
  node - "$REGISTRY" "$key" <<'NODE'
const fs=require('fs');
const [path, key]=process.argv.slice(2);
const y=fs.readFileSync(path,'utf8');
const m=y.match(new RegExp(`${key}:\\s*"([^"]+)"`));
if(m) console.log(m[1]);
else if(y.includes(`${key}: null`)) console.log('null');
NODE
}

_eq_addr() {
  local label="$1" a="$2" b="$3"
  [[ "${a,,}" == "${b,,}" ]] || fail "$label: $a != $b"
  pass "$label"
}

_check_owner_timelock() {
  local label="$1" addr="$2" sig="$3"
  [[ -n "$addr" && "$addr" != *"..."* ]] || fail "$label address unset"
  local got
  got="$(cast call "$addr" "$sig" --rpc-url "$RPC" 2>/dev/null || echo "")"
  [[ -n "$got" ]] || fail "$label cast failed"
  _eq_addr "$label.owner→Timelock" "$got" "$TL"
  [[ "${got,,}" != "${DEPLOYER,,}" ]] || fail "$label owner is deployer EOA (R-02)"
  pass "$label.owner≠deployer"
}

echo "phase2-sepolia-spine-audit: registry ↔ env ..."
for pair in \
  "GOVERNANCE_TOKEN_ADDRESS:governance_token_address" \
  "GOVERNOR_ADDRESS:governor_address" \
  "TIMELOCK_ADDRESS:timelock_address" \
  "ESCROW_FACTORY_ADDRESS:escrow_factory_address" \
  "FEE_ROUTER_ADDRESS:fee_router_address" \
  "REGION_STEWARD_STAKE_POOL_ADDRESS:region_steward_stake_pool_address" \
  "COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS:country_pool_redemption_epoch_cn_address"; do
  ENV_KEY="${pair%%:*}"
  REG_KEY="${pair##*:}"
  ENV_VAL="${!ENV_KEY:-}"
  REG_VAL="$(registry_val "$REG_KEY")"
  [[ -n "$ENV_VAL" && "$ENV_VAL" != *"..."* ]] || fail "$ENV_KEY unset in env"
  [[ "$REG_VAL" != "null" && -n "$REG_VAL" ]] || fail "registry $REG_KEY is null"
  _eq_addr "env/registry $ENV_KEY" "$ENV_VAL" "$REG_VAL"
done

echo "phase2-sepolia-spine-audit: on-chain control plane ..."
TL_ADMIN="$(cast call "$TL" "admin()(address)" --rpc-url "$RPC")"
GOV="$(cast call "$TL" "governor()(address)" --rpc-url "$RPC")"
_eq_addr "Timelock.admin→Safe" "$TL_ADMIN" "$SAFE"
_eq_addr "Timelock.governor→GOVERNOR" "$GOV" "${GOVERNOR_ADDRESS:-}"
[[ "${TL_ADMIN,,}" != "${DEPLOYER,,}" ]] || fail "Timelock.admin is deployer"
pass "Timelock.admin≠deployer"

run_verify_with_rpc_fallback() {
  local script="$1"
  shift
  local r
  for r in "${PHASE2_VERIFY_RPC_URL:-}" "https://ethereum-sepolia-rpc.publicnode.com" "https://1rpc.io/sepolia" "https://sepolia.drpc.org"; do
    [[ -z "$r" ]] && continue
    export PHASE2_VERIFY_RPC_URL="$r"
    export CHAIN_RPC_URL="$r"
    if bash "$script" "$@"; then
      pass "verify via $r"
      return 0
    fi
    sleep 2
  done
  return 1
}

echo "phase2-sepolia-spine-audit: seq 2 FundStack bindings ..."
run_verify_with_rpc_fallback "$ROOT/scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh" \
  || fail "fundstack verify failed"

echo "phase2-sepolia-spine-audit: seq 3 Steward pool ..."
run_verify_with_rpc_fallback "$ROOT/scripts/dev/phase2-sepolia-steward-pool-verify-bindings.sh" \
  --deployer "$DEPLOYER" \
  || fail "steward pool verify failed"

echo "phase2-sepolia-spine-audit: seq 4 Redemption epoch ..."
run_verify_with_rpc_fallback "$ROOT/scripts/dev/phase2-sepolia-redemption-epoch-verify-bindings.sh" \
  --deployer "$DEPLOYER" \
  || fail "redemption epoch verify failed"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_deployed_spine_audit.v1",
  "timestamp_utc": "$TS",
  "chain_id": 11155111,
  "rpc": "$RPC",
  "deployer": "$DEPLOYER",
  "timelock": "$TL",
  "timelock_admin_safe": "$SAFE",
  "sequences_verified": [1, 2, 3, 4],
  "env_registry_pairs_ok": true,
  "fundstack_verify": "phase2-sepolia-fundstack-verify-bindings.sh",
  "steward_verify": "phase2-sepolia-steward-pool-verify-bindings.sh",
  "redemption_verify": "phase2-sepolia-redemption-epoch-verify-bindings.sh",
  "addresses": {
    "governance_token": "${GOVERNANCE_TOKEN_ADDRESS:-}",
    "governor": "${GOVERNOR_ADDRESS:-}",
    "timelock": "$TL",
    "fee_router": "${FEE_ROUTER_ADDRESS:-}",
    "region_vault": "${REGION_VAULT_ADDRESS:-}",
    "treasury": "${TREASURY_ADDRESS:-}",
    "reserve_vault": "${RESERVE_VAULT_ADDRESS:-}",
    "escrow_factory": "${ESCROW_FACTORY_ADDRESS:-}",
    "region_steward_stake_pool": "${REGION_STEWARD_STAKE_POOL_ADDRESS:-}",
    "steward_ttg": "${STEWARD_TTG_ADDRESS:-${GOVERNANCE_TOKEN_ADDRESS:-}}",
    "country_pool_redemption_epoch_cn": "${COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS:-}",
    "redemption_asset": "${REDEMPTION_ASSET_ADDRESS:-}"
  },
  "ssot": "docs/runbook/TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md"
}
EOF

ok "report → $REPORT"
echo "TT_PHASE2_SEPOLIA_SPINE_AUDIT: OK (seq 1–4 env/registry/on-chain consistent)"
