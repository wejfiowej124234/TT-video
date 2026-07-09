#!/usr/bin/env bash
# Gate: Phase ② Exit Review must PASS before Mainnet Deployment Package or Phase ③.
#
#   bash scripts/gates/check-phase2-exit-review-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVID="$ROOT/evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json"

[[ -f "$EVID" ]] || {
  echo "check-phase2-exit-review-gate: FAIL missing exit review evidence" >&2
  echo "  run: node scripts/dev/run-phase2-exit-review.cjs" >&2
  exit 2
}

VERDICT="$(node -e "console.log(require(process.argv[1]).verdict||'UNKNOWN')" "$EVID")"

case "$VERDICT" in
  PHASE2_EXIT_REVIEW_PASS)
    echo "check-phase2-exit-review-gate: PASS ($VERDICT)"
    ;;
  PHASE2_EXIT_REVIEW_IN_PROGRESS)
    echo "check-phase2-exit-review-gate: WARN $VERDICT — freeze + package generation blocked" >&2
    exit 2
    ;;
  *)
    echo "check-phase2-exit-review-gate: FAIL $VERDICT" >&2
    exit 2
    ;;
esac
