#!/usr/bin/env bash
# Record current baseline after Owner-approved green convergence run.
#
#   bash scripts/dev/record-phase1-convergence-baseline.sh [PEB_OUT_DIR]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PEB="${1:-}"

if [[ -z "$PEB" ]]; then
  latest="$(ls -td "$ROOT/evidence/GO_phase1_convergence/runs/"*/peb 2>/dev/null | head -1 || true)"
  PEB="$latest"
fi

if [[ ! -d "$PEB" ]]; then
  echo "Usage: record-phase1-convergence-baseline.sh <peb_out_dir>"
  exit 1
fi

python "$ROOT/scripts/dev/compare-phase1-convergence-baseline.py" "$PEB" --init-baseline
echo "Baseline updated from: $PEB"
