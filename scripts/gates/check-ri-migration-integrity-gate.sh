#!/usr/bin/env bash
# RI-01 Migration Integrity Gate — Production deploy preflight
#
# migration files → checksum verify → (optional) database applied → runtime boot/health
#
# Usage (repo root):
#   bash scripts/gates/check-ri-migration-integrity-gate.sh
#   RI_REQUIRE_DB=1 bash scripts/gates/check-ri-migration-integrity-gate.sh   # require live ledger
#   RI_SKIP_HEALTH=1 …                                                      # skip API health
#
# Exit: 0 PASS · 2 FAIL
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export PYTHONUTF8=1
export PYTHONIOENCODING=utf-8
export RI_REQUIRE_DB="${RI_REQUIRE_DB:-0}"
export RI_SKIP_HEALTH="${RI_SKIP_HEALTH:-0}"
export RI_GATE_ONLY=1
export PROD_API_BASE="${PROD_API_BASE:-https://api.web3-ttg.com}"

exec python scripts/dev/run-v65-production-release-integrity-final.py --ri-01-only
