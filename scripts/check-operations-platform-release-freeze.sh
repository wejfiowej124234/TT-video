#!/usr/bin/env bash
# 145 · Operations platform release freeze gate (static SSOT)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC="$ROOT/docs/handbook/engineering/145-Operations-Platform-Release-Freeze-Report.md"
rg -q 'OPERATIONS_PLATFORM_GO' "$DOC" || { echo "Operations platform release freeze gate: FAIL" >&2; exit 2; }
echo "Operations platform release freeze gate: PASS"
echo "OPERATIONS_PLATFORM_GO"
