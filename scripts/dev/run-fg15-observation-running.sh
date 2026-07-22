#!/usr/bin/env bash
# DEPRECATED (W6 Hygiene) · FG-15-A observation window — NOT living tip.
# Use Candidate v2 / FG-15-B maintain: run-web3-candidate-v2-fg15b-maintain.sh
# Forensic only: TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1
# FG-15 Observation Window · keep RUNNING
# freeze → sample → elapsed-eval (will refuse until wall-clock end)
# NEVER ACTIVE flip / Production GO / fake ELAPSED PASS
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
if [[ "${TRAVELTRUST_ALLOW_HISTORICAL_BASELINE:-0}" != "1" ]]; then
  echo "DEPRECATED: run-fg15-observation-running.sh — use Candidate v2 maintain" >&2
  echo "Set TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1 to force historical forensic run." >&2
  exit 2
fi
export API_BASE="${API_BASE:-http://127.0.0.1:8080}"

echo "fg15-running: freeze"
python "$ROOT/scripts/dev/run-fg15-observation-window-freeze.py"

echo "fg15-running: sample"
python "$ROOT/scripts/dev/run-fg15-observation-sample.py"

echo "fg15-running: elapsed-eval (expect REFUSE until ends_utc)"
set +e
python "$ROOT/scripts/dev/run-fg15-observation-elapsed-eval.py"
EV=$?
set -e

if [[ "$EV" -eq 0 ]]; then
  echo "fg15-running: ELAPSED PASS — regenerate Owner Sign-off package"
  python "$ROOT/scripts/dev/run-owner-completion-signoff-package.py"
  echo "fg15-running: recalculate"
  python "$ROOT/scripts/dev/run-psg-completion-matrix-recalculate.py"
else
  echo "fg15-running: still RUNNING — no PASS / no signoff / no GO"
fi

echo "fg15-running: ACTIVE_FLIP=FORBIDDEN production_go=FORBIDDEN"
exit 0
