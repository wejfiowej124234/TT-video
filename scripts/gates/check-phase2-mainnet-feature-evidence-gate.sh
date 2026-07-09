#!/usr/bin/env bash
# Gate: Phase ③ Mainnet requires Sepolia E2E evidence per RULE-PH2-001
#
#   bash scripts/gates/check-phase2-mainnet-feature-evidence-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVID="$ROOT/evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json"

[[ -f "$EVID" ]] || {
  echo "check-phase2-mainnet-feature-evidence-gate: FAIL missing lifecycle validation evidence" >&2
  echo "  run: node scripts/dev/run-sepolia-full-web3-lifecycle-validation.cjs" >&2
  exit 2
}

command -v node >/dev/null 2>&1 || { echo "check-phase2-mainnet-feature-evidence-gate: FAIL node required" >&2; exit 2; }

VERDICT="$(node -e "
const j=require(process.argv[1]);
console.log(j.verdict||'UNKNOWN');
" "$EVID")"

case "$VERDICT" in
  SEPOLIA_FULL_WEB3_LIFECYCLE_PASS)
    echo "check-phase2-mainnet-feature-evidence-gate: PASS ($VERDICT)"
    ;;
  SEPOLIA_FULL_WEB3_LIFECYCLE_IN_PROGRESS)
    echo "check-phase2-mainnet-feature-evidence-gate: WARN $VERDICT — Phase ③ still blocked" >&2
    exit 2
    ;;
  *)
    echo "check-phase2-mainnet-feature-evidence-gate: FAIL $VERDICT — RULE-PH2-001 not satisfied" >&2
    echo "  Any mainnet Web3 feature needs Sepolia on-chain E2E evidence first." >&2
    exit 2
    ;;
esac

# Also require phase boundary (no mainnet auth without explicit flag)
# shellcheck source=scripts/dev/lib/web3-phase-boundary.sh
source "$ROOT/scripts/dev/lib/web3-phase-boundary.sh"
web3_refuse_mainnet_broadcast_unless_phase3 1 "phase2-mainnet-feature-evidence-gate" || {
  echo "check-phase2-mainnet-feature-evidence-gate: OK mainnet still gated (expected without TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED)"
}
