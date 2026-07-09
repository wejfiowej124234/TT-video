#!/usr/bin/env bash
# Gate: Web3 scripts must not target Ethereum Mainnet without Phase ③ authorization.
#
#   bash scripts/gates/check-web3-phase-boundary.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/web3-phase-boundary.sh
source "$ROOT/scripts/dev/lib/web3-phase-boundary.sh"

fail=0

# Mainnet without auth → must fail
if web3_refuse_mainnet_broadcast_unless_phase3 1 "gate self-test" 2>/dev/null; then
  echo "check-web3-phase-boundary: FAIL expected refuse on chain_id=1 without auth" >&2
  fail=1
else
  echo "check-web3-phase-boundary: OK mainnet blocked without TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED"
fi

# Sepolia → must pass
web3_assert_phase12_chain 11155111 "Sepolia" || fail=1

# Anvil → must pass
web3_assert_phase12_chain 31337 "Anvil" || fail=1

# SSOT registry exists
[[ -f "$ROOT/registry/web3-three-phase-closure-discipline.v1.yaml" ]] || {
  echo "check-web3-phase-boundary: FAIL missing registry SSOT" >&2
  fail=1
}

# Phase 3 broadcast stub must refuse without auth
if [[ -f "$ROOT/scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh" ]]; then
  if TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=0 bash "$ROOT/scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh" 2>/dev/null; then
    echo "check-web3-phase-boundary: FAIL phase3 script should refuse without auth" >&2
    fail=1
  else
    echo "check-web3-phase-boundary: OK phase3 script refuses without auth"
  fi
fi

[[ "$fail" -eq 0 ]] || exit 2
echo "check-web3-phase-boundary: PASS"
