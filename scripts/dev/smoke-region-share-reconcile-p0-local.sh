#!/usr/bin/env bash
# Local smoke · BE-RS-01 (unit + gate; live API optional)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "== smoke-region-share-reconcile-p0-local =="
bash "$ROOT/scripts/dev/run-sprint170-be-rs01-implementation-gate.sh"

if [[ -n "${INTERNAL_API_SECRET:-}" && -n "${API_BASE_URL:-}" ]]; then
  echo "-- live internal reconcile --"
  bash "$ROOT/scripts/ops/region-share-reconcile.sh"
fi

echo "SMOKE_BE_RS_01: OK"
