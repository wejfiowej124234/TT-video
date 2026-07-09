#!/usr/bin/env bash
# 120 · Catalog S5 release freeze gate (static SSOT)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC="$ROOT/docs/handbook/engineering/120-S5-Catalog-Release-Freeze-Report.md"
rg -q 'CATALOG_RELEASE_FREEZE_GO' "$DOC" || { echo "S5 catalog release freeze gate: FAIL" >&2; exit 2; }
echo "S5 catalog release freeze gate: PASS"
echo "CATALOG_RELEASE_FREEZE_GO"
