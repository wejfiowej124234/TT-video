#!/usr/bin/env bash
# Web3 phase boundary — refuse Ethereum Mainnet broadcast unless Phase ③ explicitly authorized
# AND Mainnet Fund-Safety Cutover Hard Gate PASSes.
#
#   source scripts/dev/lib/web3-phase-boundary.sh
#   web3_refuse_mainnet_broadcast_unless_phase3 "$CHAIN_ID" "context label"
#
# Phase ③ requires ALL:
#   TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1
#   + bash scripts/gates/check-mainnet-cutover-hard-gate.sh exit 0
#     (evidence axes — env alone NEVER unlocks live mainnet)
#
# Default discipline: only ① Anvil (31337) and ② Sepolia (11155111) are active.
set -euo pipefail

WEB3_MAINNET_CHAIN_ID=1
WEB3_SEPOLIA_CHAIN_ID=11155111
WEB3_ANVIL_CHAIN_ID=31337

# Resolved at source time (reliable when functions run later)
WEB3_PHASE_BOUNDARY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

web3_is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

web3_mainnet_cutover_hard_gate_pass() {
  local gate="${WEB3_PHASE_BOUNDARY_ROOT}/scripts/gates/check-mainnet-cutover-hard-gate.sh"
  if [[ ! -f "$gate" ]]; then
    echo "web3-phase-boundary: REFUSE — missing check-mainnet-cutover-hard-gate.sh" >&2
    return 2
  fi
  bash "$gate"
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
      echo "  - Mainnet Cutover Hard Gate: AUTHORIZED_FOR_WAVE|FULL_GO (fund-safety axes)" >&2
      echo "  - Then: R-01 · Shadow Launch · G6 · Owner auth · Wave 1→2→3 from package" >&2
      echo "  - Only then: export TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1" >&2
      echo "  SSOT: registry/mainnet-cutover-hard-gate.v1.yaml" >&2
      echo "  SSOT: registry/web3-three-phase-closure-discipline.v1.yaml" >&2
      return 2
    fi
    # Env alone is insufficient — fund-safety hard gate must PASS
    echo "web3-phase-boundary: Phase ③ env set — enforcing Mainnet Cutover Hard Gate for $context" >&2
    if ! web3_mainnet_cutover_hard_gate_pass; then
      echo "web3-phase-boundary: REFUSE $context — hard gate CUTOVER_REFUSED (env alone cannot unlock)" >&2
      echo "web3-phase-boundary: SSOT: registry/mainnet-cutover-hard-gate.v1.yaml" >&2
      echo "web3-phase-boundary: Runbook: docs/runbook/TT-MAINNET-CUTOVER-HARD-GATE-LATEST.md" >&2
      return 2
    fi
    echo "web3-phase-boundary: WARN mainnet path cleared for $context — hard gate PASS + Phase ③ env"
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
