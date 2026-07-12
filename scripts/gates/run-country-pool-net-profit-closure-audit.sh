#!/usr/bin/env bash
# GAP-IDX-NP-004 · Country Pool Net Profit closure audit — ① local · no broadcast
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
PY="python"
if ! command -v python >/dev/null 2>&1; then
  command -v python3 >/dev/null 2>&1 && PY="python3"
fi
export NP004_EVID="${NP004_EVID:-$ROOT/evidence/GO_country_pool_net_profit_closure}"
"$PY" scripts/dev/run-country-pool-net-profit-closure-audit.py
