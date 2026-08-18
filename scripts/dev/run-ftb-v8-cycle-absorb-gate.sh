#!/usr/bin/env bash
# FTB V8 Cycle absorb · file-only (no L7 recast, no www bake, no GO flip)
#
#   bash scripts/dev/run-ftb-v8-cycle-absorb-gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat >&2 <<'EOF'
usage: bash scripts/dev/run-ftb-v8-cycle-absorb-gate.sh
  File-only: parent 20260812 stays OLD; living FTB is V8 Cycle ACTIVE.
  Does not recast L7. Does not claim Production GO.
EOF
  exit 2
fi
if [[ -n "${1:-}" ]]; then
  echo "TT_FTB_V8_CYCLE_ABSORB: STOP unknown argv $1" >&2
  exit 2
fi

python scripts/gates/check-ftb-v8-cycle-absorb.py
