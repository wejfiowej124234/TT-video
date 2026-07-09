#!/usr/bin/env bash
# Phase ② · Sepolia · DeployEscrowFactoryV2 --broadcast (PG-P0-ESC Layer B preflight)
#
# Does NOT replace V1 EscrowFactory on Sepolia — deploys V2 alongside for bilateral drill.
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-broadcast-escrow-factory-v2.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/web3-phase-boundary.sh
source "$ROOT/scripts/dev/lib/web3-phase-boundary.sh"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${ESCROW_V2_BROADCAST_EVIDENCE:-$ROOT/evidence/GO_production_readiness/escrow-v2-factory-broadcast/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
SEPOLIA_CHAIN_ID=11155111

fail() { echo "phase2-sepolia-broadcast-escrow-factory-v2: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-escrow-factory-v2: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 (Owner explicit Sepolia authorize)"
fi

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"

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

load_env

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset"
[[ -n "${TIMELOCK_ADDRESS:-}" && "$TIMELOCK_ADDRESS" != *"..."* ]] || fail "TIMELOCK_ADDRESS unset"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "${CHAIN_ID:-}")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "refusing broadcast: chain_id=$CHAIN_ID (required $SEPOLIA_CHAIN_ID)"
web3_assert_phase12_chain "$CHAIN_ID" "phase2-sepolia-broadcast-escrow-factory-v2"
web3_refuse_mainnet_broadcast_unless_phase3 "$CHAIN_ID" "phase2-sepolia-broadcast-escrow-factory-v2" || fail "mainnet broadcast refused — use Phase ③ script after gates"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-broadcast-${TS}.log"

echo "phase2-sepolia-broadcast-escrow-factory-v2: broadcasting..."
(
  cd "$ROOT/contracts"
  forge script script/DeployEscrowFactoryV2.s.sol:DeployEscrowFactoryV2 \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
)

grep -q "ESCROW_FACTORY_V2_BINDING_CHECK: OK" "$LOG" || fail "log missing ESCROW_FACTORY_V2_BINDING_CHECK: OK"

BROADCAST_JSON="$ROOT/contracts/broadcast/DeployEscrowFactoryV2.s.sol/${SEPOLIA_CHAIN_ID}/run-latest.json"
FACTORY_V2=""
if [[ -f "$BROADCAST_JSON" ]] && command -v node >/dev/null 2>&1; then
  FACTORY_V2="$(node - "$BROADCAST_JSON" <<'NODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const txs = data.transactions || [];
for (let i = txs.length - 1; i >= 0; i--) {
  const tx = txs[i];
  if (tx.contractName === 'EscrowFactoryV2' && tx.contractAddress) {
    console.log(tx.contractAddress);
    break;
  }
}
NODE
)"
fi

if [[ -z "$FACTORY_V2" ]]; then
  FACTORY_V2="$(grep -Eo 'EscrowFactoryV2 0x[a-fA-F0-9]{40}' "$LOG" | tail -1 | awk '{print $2}' || true)"
fi

[[ -n "$FACTORY_V2" ]] || fail "could not extract EscrowFactoryV2 address from broadcast"

ENV_APPEND="$EVIDENCE/escrow-factory-v2.env"
{
  echo "# PG-P0-ESC EscrowFactoryV2 Sepolia broadcast $TS"
  echo "ESCROW_FACTORY_V2_ADDRESS=$FACTORY_V2"
  echo "NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS=$FACTORY_V2"
} > "$ENV_APPEND"

ok "EscrowFactoryV2=$FACTORY_V2"
ok "env snippet: $ENV_APPEND"
echo "Next: bash scripts/dev/merge-escrow-factory-v2-sepolia-wiring.sh --env-snippet $ENV_APPEND"
