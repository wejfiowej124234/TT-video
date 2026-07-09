#!/usr/bin/env bash
# 146 · Catalog consumer opt-in cutover gate (static SSOT)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC="$ROOT/docs/handbook/engineering/146-C-S6-Catalog-Consumer-OptIn-Cutover-Report.md"
rg -q 'CATALOG_CONSUMER_OPT_IN_GO' "$DOC" || { echo "C-S6 catalog consumer opt-in gate: FAIL" >&2; exit 2; }
echo "C-S6 catalog consumer opt-in gate: PASS"
echo "CATALOG_CONSUMER_OPT_IN_GO"
