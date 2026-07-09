#!/usr/bin/env bash
# 149 · Operations E2E acceptance gate (static SSOT · 150 closes consumer)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC="$ROOT/docs/handbook/engineering/149-Operations-E2E-Acceptance-Report.md"
rg -q 'OPERATIONS_E2E_ACCEPTANCE_GO' "$DOC" || { echo "Operations E2E acceptance gate: FAIL" >&2; exit 2; }
echo "Operations E2E acceptance gate: PASS"
echo "OPERATIONS_E2E_ACCEPTANCE_GO"
