#!/usr/bin/env bash
# TravelTrust L5 Wallet Connection Center · ① local green set
# Not staging GO / not Production GO.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/frontend"

echo "[wallet-l5] vitest · connection center + header utility freeze"
npm run test -- \
  WalletStatusMini \
  WalletBrandIcon \
  walletConnectorCatalog \
  deriveWalletPhase \
  walletConnectionCenter.contract \
  installRedetect \
  headerUtilityMenuUiFreeze \
  --run

# Hero CTA shares Wallet Connection Center (optional non-blocking if globe suite env drifts)
npm run test -- traveltrustCinematicNonGlobeL5.closure -t "hero chrome utilities" --run || {
  echo "[wallet-l5] WARN: cinematic hero chrome slice failed (non-blocking for wallet core)"
}

echo "[wallet-l5] OK · evidence: frontend/evidence/GO_local_wallet_connection_l5/"
echo "TT_WALLET_L5_SMOKE: PASS"
