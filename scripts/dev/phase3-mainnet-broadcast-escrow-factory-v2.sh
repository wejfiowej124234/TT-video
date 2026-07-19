#!/usr/bin/env bash
# Phase ③ · Ethereum Mainnet · EscrowFactoryV2 — STUB / HARD GATE ONLY
#
# DO NOT run until Phase ② Sepolia PASS + R-01 + Shadow Launch + G6 + Owner auth
# AND Mainnet Cutover Hard Gate PASS (fund-safety axes).
#
#   export TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1   # Owner only, after all gates
#   bash scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh
#
# Env alone is insufficient — web3-phase-boundary enforces
# scripts/gates/check-mainnet-cutover-hard-gate.sh (never SKIP).
# This stub still does NOT forge --broadcast to live mainnet.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/web3-phase-boundary.sh
source "$ROOT/scripts/dev/lib/web3-phase-boundary.sh"

MAINNET_CHAIN_ID=1

# Boundary: env + cutover hard gate (AXIS fund-safety). Refuse if either fails.
web3_refuse_mainnet_broadcast_unless_phase3 "$MAINNET_CHAIN_ID" "phase3-mainnet-broadcast-escrow-factory-v2"

# Explicit hard gate call (defense in depth; boundary already ran it)
bash "$ROOT/scripts/gates/check-mainnet-cutover-hard-gate.sh" || {
  echo "phase3-mainnet-broadcast-escrow-factory-v2: REFUSE — Mainnet Cutover Hard Gate" >&2
  exit 2
}

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

echo "phase3-mainnet-broadcast-escrow-factory-v2: hard gates cleared — STUB ONLY (no forge --broadcast)" >&2
echo "phase3-mainnet-broadcast-escrow-factory-v2: Next Owner step: Wave 1 from Mainnet Deployment Package with gas cap" >&2
echo "phase3-mainnet-broadcast-escrow-factory-v2: SSOT: registry/mainnet-cutover-hard-gate.v1.yaml" >&2
echo "phase3-mainnet-broadcast-escrow-factory-v2: STUB_EXIT — live broadcast shell not implemented (PLANNED)" >&2
exit 0
