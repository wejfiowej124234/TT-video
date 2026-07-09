#!/usr/bin/env bash
# Web3 phase boundary — refuse Ethereum Mainnet broadcast unless Phase ③ explicitly authorized.
#
#   source scripts/dev/lib/web3-phase-boundary.sh
#   web3_refuse_mainnet_broadcast_unless_phase3 "$CHAIN_ID" "context label"
#
# Phase ③ requires ALL:
#   TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1
#   + registry/web3-three-phase-closure-discipline.v1.yaml phase3_mainnet_authorized (future)
#
# Default discipline: only ① Anvil (31337) and ② Sepolia (11155111) are active.
set -euo pipefail

WEB3_MAINNET_CHAIN_ID=1
WEB3_SEPOLIA_CHAIN_ID=11155111
WEB3_ANVIL_CHAIN_ID=31337

web3_is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

web3_refuse_mainnet_broadcast_unless_phase3() {
  local chain_id="${1:-}"
  local context="${2:-web3 broadcast}"

  if [[ "$chain_id" == "$WEB3_MAINNET_CHAIN_ID" ]]; then
    if ! web3_is_truthy "${TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED:-}"; then
      echo "web3-phase-boundary: REFUSE $context on chain_id=1 (Ethereum Mainnet)" >&2
      echo "web3-phase-boundary: Phase ③ NOT authorized — complete pipeline first:" >&2
      echo "  ① Development → ② Staging/Sepolia Production Validation (②-A…②-F)" >&2
      echo "  - ②-D Web3 Lifecycle: SEPOLIA_FULL_WEB3_LIFECYCLE_PASS (RULE-PH2-001)" >&2
      echo "  - Phase ② Exit Review: PHASE2_EXIT_REVIEW_PASS" >&2
      echo "  - Mainnet Deployment Package: MAINNET_DEPLOYMENT_PACKAGE_GENERATED (RULE-DEPLOY-001)" >&2
      echo "  - Then: R-01 · Shadow Launch · G6 · Owner auth · Wave 1→2→3 from package" >&2
      echo "  - Only then: export TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1" >&2
      echo "  SSOT: registry/web3-three-phase-closure-discipline.v1.yaml" >&2
      return 2
    fi
    echo "web3-phase-boundary: WARN mainnet broadcast authorized for $context — Phase ③ gate satisfied"
  fi
  return 0
}

web3_assert_phase12_chain() {
  local chain_id="${1:-}"
  local context="${2:-operation}"
  case "$chain_id" in
    "$WEB3_ANVIL_CHAIN_ID"|"$WEB3_SEPOLIA_CHAIN_ID") return 0 ;;
    "$WEB3_MAINNET_CHAIN_ID")
      web3_refuse_mainnet_broadcast_unless_phase3 "$chain_id" "$context"
      ;;
    *)
      echo "web3-phase-boundary: WARN unknown chain_id=$chain_id for $context" >&2
      return 0
      ;;
  esac
}
