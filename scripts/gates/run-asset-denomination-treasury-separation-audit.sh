#!/usr/bin/env bash
# Asset Denomination & Treasury Separation Audit — ① local · no broadcast
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
PY="python"
if ! command -v python >/dev/null 2>&1; then
  command -v python3 >/dev/null 2>&1 && PY="python3"
fi
export ASSET_TREASURY_EVID="${ASSET_TREASURY_EVID:-$ROOT/evidence/GO_asset_denomination_treasury_separation_audit}"
"$PY" registry/validate-asset-denomination-treasury-separation.py
"$PY" scripts/dev/run-asset-denomination-treasury-separation-audit.py
