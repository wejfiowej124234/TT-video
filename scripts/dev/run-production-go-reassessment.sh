#!/usr/bin/env bash
# Production GO reassessment · read-only classify (do not recast)
#
#   bash scripts/dev/run-production-go-reassessment.sh
#
# Default fetches Official www identity + API /meta (cite, do not recast L7).
# Offline file-only: TT_GO_REASSESSMENT_SKIP_LIVE=1
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat >&2 <<'EOF'
usage: bash scripts/dev/run-production-go-reassessment.sh
  Read-only total-gate reclassification.
  Does not recast L7, bake www, execute CI-02 B, repeat 1 USDC, or flip TT_PRODUCTION_GO.
EOF
  exit 2
fi
if [[ -n "${1:-}" ]]; then
  echo "TT_PRODUCTION_GO_REASSESSMENT: STOP unknown argv $1" >&2
  exit 2
fi

python scripts/gates/check-production-go-reassessment.py
