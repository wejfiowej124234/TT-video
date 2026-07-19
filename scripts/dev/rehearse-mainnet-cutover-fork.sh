#!/usr/bin/env bash
# Mainnet cutover fork rehearsal — NO live chain_id=1 broadcast
#
#   export MAINNET_FORK_RPC_URL="https://…"   # Ethereum mainnet RPC (read)
#   bash scripts/dev/rehearse-mainnet-cutover-fork.sh
#
# Starts anvil --fork-url, records chain id of fork tip, optional bytecode smoke,
# writes evidence LATEST. Never runs forge --broadcast against live mainnet.
#
# SSOT axis: AXIS-03 · registry/mainnet-cutover-hard-gate.v1.yaml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID_DIR="$ROOT/evidence/GO_production_readiness/mainnet-fork-rehearsal"
mkdir -p "$EVID_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="$EVID_DIR/run_$STAMP"
mkdir -p "$RUN_DIR"
LATEST="$EVID_DIR/MAINNET-FORK-REHEARSAL-LATEST.json"

RPC="${MAINNET_FORK_RPC_URL:-${ETH_MAINNET_RPC_URL:-}}"
ANVIL_PORT="${MAINNET_FORK_ANVIL_PORT:-8549}"

write_fail() {
  local reason="$1"
  node -e "
const fs=require('fs');
const out={
  schema:'traveltrust.mainnet_fork_rehearsal.v1',
  generated_utc:new Date().toISOString(),
  verdict:'FAIL',
  chain_forked:0,
  bytecode_checks:'FAIL',
  broadcast_to_live_mainnet:false,
  reason:process.argv[1],
  note:'Fix RPC / anvil / cast then re-run. Never forge --broadcast to live 1 from this harness.'
};
fs.writeFileSync(process.argv[2], JSON.stringify(out,null,2)+'\\n');
fs.writeFileSync(process.argv[3], JSON.stringify(out,null,2)+'\\n');
" "$reason" "$LATEST" "$RUN_DIR/result.json"
  echo "rehearse-mainnet-cutover-fork: FAIL — $reason" >&2
  exit 1
}

if [[ -z "$RPC" ]]; then
  write_fail "MAINNET_FORK_RPC_URL (or ETH_MAINNET_RPC_URL) not set — refuse to invent fork"
fi

if ! command -v anvil >/dev/null 2>&1; then
  write_fail "anvil not in PATH (install Foundry)"
fi
if ! command -v cast >/dev/null 2>&1; then
  write_fail "cast not in PATH (install Foundry)"
fi

# Confirm upstream is mainnet before forking
UP_CID="$(cast chain-id --rpc-url "$RPC" 2>/dev/null || true)"
if [[ "$UP_CID" != "1" ]]; then
  write_fail "upstream RPC chain_id=$UP_CID (need 1 for mainnet fork rehearsal)"
fi

# Kill stale anvil on port if any (best-effort)
if command -v lsof >/dev/null 2>&1; then
  lsof -ti:"$ANVIL_PORT" 2>/dev/null | xargs -r kill 2>/dev/null || true
fi

anvil --fork-url "$RPC" --port "$ANVIL_PORT" --silent >"$RUN_DIR/anvil.log" 2>&1 &
ANVIL_PID=$!
cleanup() {
  kill "$ANVIL_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for anvil
ok=0
for _ in $(seq 1 40); do
  if cast chain-id --rpc-url "http://127.0.0.1:$ANVIL_PORT" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 0.25
done
[[ "$ok" -eq 1 ]] || write_fail "anvil did not become ready on port $ANVIL_PORT"

FORK_CID="$(cast chain-id --rpc-url "http://127.0.0.1:$ANVIL_PORT")"
# Anvil fork of mainnet reports chain id 1
if [[ "$FORK_CID" != "1" ]]; then
  write_fail "fork anvil chain_id=$FORK_CID (expected 1)"
fi

BLOCK="$(cast block-number --rpc-url "http://127.0.0.1:$ANVIL_PORT" 2>/dev/null || echo 0)"

# Bytecode smoke: Circle USDC mainnet (known third-party) must have code
USDC_MAINNET="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
CODE="$(cast code "$USDC_MAINNET" --rpc-url "http://127.0.0.1:$ANVIL_PORT" 2>/dev/null || echo "0x")"
BC="FAIL"
if [[ -n "$CODE" && "$CODE" != "0x" && "$CODE" != "0x0" ]]; then
  BC="PASS"
fi

# Dry wave order record (no broadcast)
WAVE_ORDER='["Wave1_EscrowFactoryV2_FeeRouter","Wave2_Governance","Wave3_Extended"]'
cat >"$RUN_DIR/wave_dry_order.json" <<EOF
{
  "wave_order": $WAVE_ORDER,
  "broadcast_to_live_mainnet": false,
  "note": "Order only — execute deploys only after hard gate AUTHORIZED_FOR_WAVE"
}
EOF

if [[ "$BC" != "PASS" ]]; then
  write_fail "bytecode smoke FAIL — USDC mainnet code empty on fork"
fi

node -e "
const fs=require('fs');
const out={
  schema:'traveltrust.mainnet_fork_rehearsal.v1',
  generated_utc:new Date().toISOString(),
  verdict:'REHEARSAL_PASS',
  chain_forked:1,
  upstream_chain_id:1,
  fork_chain_id:Number(process.argv[1]),
  fork_block:Number(process.argv[2]),
  bytecode_checks:'PASS',
  bytecode_smoke_address:process.argv[3],
  broadcast_to_live_mainnet:false,
  anvil_port:Number(process.argv[4]),
  run_dir:process.argv[5],
  wave_dry_order:['Wave1_EscrowFactoryV2_FeeRouter','Wave2_Governance','Wave3_Extended'],
  note:'Fork rehearsal only — does not authorize live mainnet broadcast or user funds'
};
fs.writeFileSync(process.argv[6], JSON.stringify(out,null,2)+'\\n');
fs.writeFileSync(process.argv[7], JSON.stringify(out,null,2)+'\\n');
" "$FORK_CID" "$BLOCK" "$USDC_MAINNET" "$ANVIL_PORT" "$RUN_DIR" "$LATEST" "$RUN_DIR/result.json"

echo "rehearse-mainnet-cutover-fork: REHEARSAL_PASS chain_forked=1 block=$BLOCK" >&2
echo "rehearse-mainnet-cutover-fork: evidence $LATEST" >&2
exit 0
