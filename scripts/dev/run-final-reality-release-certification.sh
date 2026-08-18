#!/usr/bin/env bash
# Final Reality / Release Certification · read-only (cite, do not recast)
#
#   bash scripts/dev/run-final-reality-release-certification.sh
#
# Default fetches Official www identity + API /meta.
# Offline file-only: TT_FINAL_REALITY_CERT_SKIP_LIVE=1 (not a full production-reality cert).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat >&2 <<'EOF'
usage: bash scripts/dev/run-final-reality-release-certification.sh
  Read-only release certification of current Official production reality.
  Does not recast L7, bake www, execute CI-02 B, repeat 1 USDC, or flip TT_PRODUCTION_GO.
EOF
  exit 2
fi
if [[ -n "${1:-}" ]]; then
  echo "TT_FINAL_REALITY_RELEASE_CERTIFICATION: STOP unknown argv $1" >&2
  exit 2
fi

python scripts/gates/check-final-reality-release-certification.py
