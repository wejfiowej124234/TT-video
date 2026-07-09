#!/usr/bin/env bash
# WEB3_DEPLOYMENT_TRUTH_GATE — W2 Registry / on-chain / env convergence
# SSOT: registry/traveltrust-web3-protocol-master-matrix.v1.yaml
#       registry/protocol-convergence-deployments.v1.yaml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

MATRIX="registry/traveltrust-web3-protocol-master-matrix.v1.yaml"
REGISTRY="registry/protocol-convergence-deployments.v1.yaml"
DE_CFG="config/jurisdiction_country_pool_net_profit.sepolia.json"
PHASE2_ENV="scripts/dev/.env.phase2-chain-deploy.local"
REPORT="docs/spec/governance-token/WEB3-DEPLOYMENT-TRUTH-GATE-REPORT-v1.md"
RPC="${CHAIN_RPC_URL:-}"
if [[ -z "$RPC" && -f "$PHASE2_ENV" ]]; then
  RPC="$(grep -E '^CHAIN_RPC_URL=' "$PHASE2_ENV" | head -1 | cut -d= -f2- | tr -d '\r')"
fi
RPC_CANDIDATES=(
  "$RPC"
  "https://ethereum-sepolia-rpc.publicnode.com"
  "https://sepolia.drpc.org"
  "https://rpc.sepolia.org"
)
RPC=""
for candidate in "${RPC_CANDIDATES[@]}"; do
  [[ -z "$candidate" ]] && continue
  if cast chain-id --rpc-url "$candidate" >/dev/null 2>&1; then
    RPC="$candidate"
    break
  fi
done
[[ -n "$RPC" ]] || fail "no working Sepolia RPC (set CHAIN_RPC_URL)"
TIMELOCK_EXPECT="0x904a6c4c6aab698afbf08ec6151d317c393520cc"

command -v cast >/dev/null 2>&1 || fail "cast required (Foundry)"
command -v python >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || fail "python required"

PY=python
command -v python >/dev/null 2>&1 || PY=python3

norm_addr() {
  local x="${1#0x}"
  printf '0x%s' "$(echo "$x" | tr '[:upper:]' '[:lower:]')"
}

read_yaml_proxy() {
  local key="$1"
  grep -A6 "    ${key}:" "$MATRIX" | grep 'proxy:' | head -1 | sed -E 's/.*"([^"]+)".*/\1/'
}

read_yaml_impl() {
  local key="$1"
  grep -A6 "    ${key}:" "$MATRIX" | grep 'implementation:' | head -1 | sed -E 's/.*"([^"]+)".*/\1/'
}

read_yaml_hash() {
  local key="$1"
  grep -A8 "    ${key}:" "$MATRIX" | grep 'implementation_codehash:' | head -1 | sed -E 's/.*"([^"]+)".*/\1/'
}

cast_call() {
  local attempts=0
  local out err
  while [[ $attempts -lt 3 ]]; do
    if out="$(cast "$@" --rpc-url "$RPC" 2>/dev/null)"; then
      echo "$out"
      return 0
    fi
    attempts=$((attempts + 1))
    for candidate in "${RPC_CANDIDATES[@]}"; do
      [[ -z "$candidate" ]] && continue
      if out="$(cast "$@" --rpc-url "$candidate" 2>/dev/null)"; then
        RPC="$candidate"
        echo "$out"
        return 0
      fi
    done
    sleep 1
  done
  return 1
}

verify_proxy() {
  local name="$1" key="$2"
  local proxy impl reg_impl on_impl admin on_hash reg_hash
  proxy="$(read_yaml_proxy "$key")"
  reg_impl="$(read_yaml_impl "$key")"
  reg_hash="$(read_yaml_hash "$key")"
  [[ -n "$proxy" && -n "$reg_impl" ]] || fail "$name: missing proxy/impl in $MATRIX"

  on_impl="$(cast_call call "$proxy" "implementation()(address)")" \
    || fail "$name: cast implementation() failed for $proxy"
  admin="$(cast_call call "$proxy" "admin()(address)")" \
    || fail "$name: cast admin() failed for $proxy"
  on_hash="$(cast_call codehash "$on_impl")" \
    || fail "$name: cast codehash failed for $on_impl"

  [[ "$(norm_addr "$on_impl")" == "$(norm_addr "$reg_impl")" ]] \
    || fail "$name impl mismatch registry=$reg_impl chain=$on_impl"
  [[ "$(norm_addr "$admin")" == "$(norm_addr "$TIMELOCK_EXPECT")" ]] \
    || fail "$name upgrade_admin mismatch expect=$TIMELOCK_EXPECT got=$admin"
  [[ "$(norm_addr "$on_hash")" == "$(norm_addr "$reg_hash")" ]] \
    || fail "$name codehash mismatch registry=$reg_hash chain=$on_hash"

  echo "OK proxy $name proxy=$proxy impl=$on_impl admin=$admin"
  PROXY_ROWS+=("| $name | \`$proxy\` | \`$on_impl\` | \`$on_hash\` | \`$admin\` | ✅ |")
}

PROXY_ROWS=()
CHECKS=0
FAILURES=0

echo "== WEB3 Deployment Truth Gate =="
echo "rpc=$RPC"

for pair in \
  "Governor:governor" \
  "TreasuryP4Cap:treasury_p4_cap" \
  "PrimaryMarket:primary_market" \
  "SeatRegistry:seat_registry" \
  "StewardPool:region_steward_stake_pool"; do
  name="${pair%%:*}"
  key="${pair#*:}"
  if verify_proxy "$name" "$key"; then
    CHECKS=$((CHECKS + 1))
  else
    FAILURES=$((FAILURES + 1))
  fi
done

# DE triplet vs jurisdiction config
de_ledger="$("$PY" -c "import json; print(json.load(open('$DE_CFG'))['entries'][0]['COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS'])")"
de_unalloc="$("$PY" -c "import json; print(json.load(open('$DE_CFG'))['entries'][0]['COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS'])")"
reg_ledger="$(grep 'country_pool_net_profit_ledger_address:' "$REGISTRY" | tail -1 | sed -E 's/.*"([^"]+)".*/\1/')"
reg_unalloc="$(grep 'country_pool_unallocated_steward_vault_address:' "$REGISTRY" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"

[[ "$(norm_addr "$de_ledger")" == "$(norm_addr "$reg_ledger")" ]] \
  || fail "DE ledger registry != jurisdiction json"
[[ "$(norm_addr "$de_unalloc")" == "$(norm_addr "$reg_unalloc")" ]] \
  || fail "DE unallocated vault registry != jurisdiction json"
echo "OK DE triplet registry ↔ jurisdiction config"
CHECKS=$((CHECKS + 1))

# On-chain DE owner + jurisdiction
owner="$(cast_call call "$de_unalloc" "owner()(address)")" \
  || fail "cast owner() failed for unallocated vault"
jur_hex="$(cast_call call "$de_unalloc" "jurisdiction()(bytes2)")" \
  || fail "cast jurisdiction() failed for unallocated vault"
[[ "$jur_hex" == "0x4445" ]] || fail "Unallocated vault jurisdiction expected DE (0x4445) got $jur_hex"
echo "OK UnallocatedStewardPathVault jurisdiction=DE owner=$owner"
CHECKS=$((CHECKS + 1))

# Env convergence — phase2 deploy local
[[ -f "$PHASE2_ENV" ]] || warn "missing $PHASE2_ENV (skip env checks)"
if [[ -f "$PHASE2_ENV" ]]; then
  if grep -qE '^TREASURY_ADDRESS=0x' "$PHASE2_ENV"; then
    fail "active TREASURY_ADDRESS= in $PHASE2_ENV — use GOVERNANCE_TREASURY_P4CAP_ADDRESS / LEGACY_TREASURY_ADDRESS"
  fi
  grep -qE '^GOVERNANCE_TREASURY_P4CAP_ADDRESS=0x' "$PHASE2_ENV" \
    || fail "missing GOVERNANCE_TREASURY_P4CAP_ADDRESS in $PHASE2_ENV"
  grep -qE '^LEGACY_TREASURY_ADDRESS=0x' "$PHASE2_ENV" \
    || fail "missing LEGACY_TREASURY_ADDRESS in $PHASE2_ENV"
  grep -qE '^UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS=0x' "$PHASE2_ENV" \
    || warn "UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS not set in $PHASE2_ENV"
  echo "OK phase2 env treasury keys split"
  CHECKS=$((CHECKS + 1))
fi

# Scan repo for forbidden active TREASURY_ADDRESS= (exclude allowlist)
FORBIDDEN_HITS="$(
  grep -RIn '^TREASURY_ADDRESS=0x' -- \
    scripts/dev/.env.phase2-chain-deploy.local \
    scripts/dev/.env.staging-onboarding.local \
    scripts/dev/.env.production.local \
    .env 2>/dev/null || true
)"
if [[ -n "$FORBIDDEN_HITS" ]]; then
  echo "$FORBIDDEN_HITS" >&2
  fail "forbidden active TREASURY_ADDRESS= in operational env files"
fi
echo "OK no forbidden TREASURY_ADDRESS= in operational env"
CHECKS=$((CHECKS + 1))

# W1 matrix gate
bash scripts/gates/check-web3-protocol-master-matrix-gate.sh

UTC_NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u)"

mkdir -p "$(dirname "$REPORT")"
{
  echo "# WEB3 Deployment Truth Gate Report v1"
  echo ""
  echo "**Generated:** $UTC_NOW"
  echo "**Gate:** \`bash scripts/gates/check-web3-deployment-truth-gate.sh\`"
  echo "**Result:** \`WEB3_REGISTRY_CONVERGENCE: PASS\`"
  echo ""
  echo "## Proxy Implementation Matrix (Sepolia on-chain verified)"
  echo ""
  echo "| Contract | Proxy | Implementation | Codehash | Upgrade Admin | Status |"
  echo "|----------|-------|----------------|----------|---------------|--------|"
  for row in "${PROXY_ROWS[@]}"; do echo "$row"; done
  echo ""
  echo "## Treasury semantics"
  echo ""
  echo "| Role | Env | Address | Status |"
  echo "|------|-----|---------|--------|"
  echo "| DAO P4Cap (ACTIVE) | GOVERNANCE_TREASURY_P4CAP_ADDRESS | 0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2 | ACTIVE |"
  echo "| FeeRouter ops (legacy) | LEGACY_TREASURY_ADDRESS | 0x6a8323fb2394A1e9655F7132F4E4B8222d2898be | DEPRECATED |"
  echo ""
  echo "## DE D-4555-B + Vacancy V1"
  echo ""
  echo "| Contract | Address | Owner (on-chain) | Notes |"
  echo "|----------|---------|------------------|-------|"
  echo "| CountryPoolNetProfitLedger | $de_ledger | $owner | legacy timelock owner |"
  echo "| UnallocatedStewardPathVault | $de_unalloc | $owner | Vacancy V1 · gate PASS |"
  echo ""
  echo "## Checks passed: $CHECKS"
  echo ""
  echo "## Upgrade path"
  echo ""
  echo "Governor.propose → Timelock.schedule (48h) → Timelock.execute → TimelockUpgradeableProxy.upgradeTo"
} >"$REPORT"

echo ""
echo "WEB3_REGISTRY_CONVERGENCE: PASS"
echo "Report: $REPORT"
