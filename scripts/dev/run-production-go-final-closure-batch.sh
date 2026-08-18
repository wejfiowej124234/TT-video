#!/usr/bin/env bash
# Production GO Final Closure Batch · file-only gate
#
#   bash scripts/dev/run-production-go-final-closure-batch.sh
#
# Does not recast L7, bake www, rewrite STOP counts, or flip TT_PRODUCTION_GO.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat >&2 <<'EOF'
usage: bash scripts/dev/run-production-go-final-closure-batch.sh
  File-only Final Closure Batch gate.
  Does not recast L7, bake www, rewrite STOP required_before_go=8, or flip TT_PRODUCTION_GO.
EOF
  exit 2
fi
if [[ -n "${1:-}" ]]; then
  echo "TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH: FAIL unknown argv $1" >&2
  exit 2
fi

python scripts/gates/check-production-go-final-closure-batch.py
