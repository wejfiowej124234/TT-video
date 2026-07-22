#!/usr/bin/env bash
# TT_PSG_PRODUCTION_COMPLETION_MATRIX · S7 Recalculate
# Never flips ACTIVE · never executes Production GO
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
echo "psg-completion-matrix-recalculate: ACTIVE_FLIP=FORBIDDEN production_go=FORBIDDEN"
python "$ROOT/scripts/dev/run-psg-completion-matrix-recalculate.py"
