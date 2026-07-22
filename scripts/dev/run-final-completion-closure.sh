#!/usr/bin/env bash
# Final Completion Closure sequence (no ACTIVE flip · no Production GO · no fake FG-15 PASS)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export API_BASE="${API_BASE:-http://127.0.0.1:8080}"

echo "== 1/4 Release Identity re-pin =="
python "$ROOT/scripts/dev/run-final-completion-release-identity-repin.py"

echo "== 2/4 FG-15 48H Observation START (SKIPPED · DEPRECATED under FINAL RELEASE) =="
echo "final-completion-closure: skip run-fg15-observation-48h-start.py (historical FG-15-A path)"
# Was: python ... run-fg15-observation-48h-start.py || true
# Active observation track: evidence/GO_fg15_observation_48h_candidate_v2 (ELAPSED)

echo "== 3/4 Owner Sign-off Package (unsigned · await FG-15) =="
python "$ROOT/scripts/dev/run-owner-completion-signoff-package.py"

echo "== 4/4 PSG Completion Recalculate =="
python "$ROOT/scripts/dev/run-psg-completion-matrix-recalculate.py"

echo "FINAL-COMPLETION-CLOSURE: done · ACTIVE_FLIP=FORBIDDEN · production_go=FORBIDDEN"
