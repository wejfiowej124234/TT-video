#!/usr/bin/env bash
# Phase ③ · Ethereum Mainnet · EscrowFactoryV2 — STUB / HARD GATE ONLY
#
# DO NOT run until Phase ② Sepolia PASS + R-01 + Shadow Launch + G6 + Owner auth.
#
#   export TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1   # Owner only, after all gates
#   bash scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/web3-phase-boundary.sh
source "$ROOT/scripts/dev/lib/web3-phase-boundary.sh"

MAINNET_CHAIN_ID=1

web3_refuse_mainnet_broadcast_unless_phase3 "$MAINNET_CHAIN_ID" "phase3-mainnet-broadcast-escrow-factory-v2"

# RULE-PH2-001: Sepolia E2E evidence
if [[ -f "$ROOT/scripts/gates/check-phase2-mainnet-feature-evidence-gate.sh" ]]; then
  bash "$ROOT/scripts/gates/check-phase2-mainnet-feature-evidence-gate.sh" || {
    echo "phase3-mainnet-broadcast-escrow-factory-v2: REFUSE — RULE-PH2-001 / Sepolia lifecycle not PASS" >&2
    exit 2
  }
fi

# Phase ② Exit Review
if [[ -f "$ROOT/scripts/gates/check-phase2-exit-review-gate.sh" ]]; then
  bash "$ROOT/scripts/gates/check-phase2-exit-review-gate.sh" || {
    echo "phase3-mainnet-broadcast-escrow-factory-v2: REFUSE — Phase ② Exit Review not PASS" >&2
    exit 2
  }
fi

# Web3 Freeze (RULE-FREEZE-001)
if [[ -f "$ROOT/scripts/gates/check-web3-freeze-gate.sh" ]]; then
  bash "$ROOT/scripts/gates/check-web3-freeze-gate.sh" || {
    echo "phase3-mainnet-broadcast-escrow-factory-v2: REFUSE — Web3 Freeze not PASS or drift detected" >&2
    exit 2
  }
fi

# RULE-DEPLOY-001: Mainnet Deployment Package required
if [[ -f "$ROOT/scripts/gates/check-mainnet-deployment-package-gate.sh" ]]; then
  bash "$ROOT/scripts/gates/check-mainnet-deployment-package-gate.sh" || {
    echo "phase3-mainnet-broadcast-escrow-factory-v2: REFUSE — generate Mainnet Deployment Package first (RULE-DEPLOY-001)" >&2
    exit 2
  }
fi

echo "phase3-mainnet-broadcast-escrow-factory-v2: Phase ③ authorized — deploy Wave 1 from Mainnet Deployment Package" >&2
echo "phase3-mainnet-broadcast-escrow-factory-v2: Use protocol-convergence-deployments mainnet block + DeployEscrowFactoryV2.s.sol" >&2
exit 0
