#!/usr/bin/env bash
# Gate: Phase ③ Deployment Prerequisite Review must PASS before Web3 Freeze.
#
#   bash scripts/gates/check-phase3-deployment-prerequisite-review-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVID="$ROOT/evidence/GO_production_readiness/phase3-deployment-prerequisite-review/PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json"

[[ -f "$EVID" ]] || {
  echo "check-phase3-deployment-prerequisite-review-gate: FAIL missing evidence" >&2
  echo "  prerequisite: bash scripts/gates/check-phase2-exit-review-gate.sh" >&2
  echo "  run: node scripts/dev/run-phase3-deployment-prerequisite-review.cjs" >&2
  exit 2
}

VERDICT="$(node -e "console.log(require(process.argv[1]).verdict||'UNKNOWN')" "$EVID")"

case "$VERDICT" in
  PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_PASS)
    echo "check-phase3-deployment-prerequisite-review-gate: PASS ($VERDICT)"
    ;;
  PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_IN_PROGRESS)
    echo "check-phase3-deployment-prerequisite-review-gate: WARN $VERDICT — Web3 Freeze blocked" >&2
    exit 2
    ;;
  *)
    echo "check-phase3-deployment-prerequisite-review-gate: FAIL $VERDICT" >&2
    exit 2
    ;;
esac
