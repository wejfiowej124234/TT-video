#!/usr/bin/env bash
# O-S4 · Cold start campaigns deployment operations gate (static SSOT)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC="$ROOT/docs/handbook/engineering/144-O-S4-Cold-Start-Campaigns-Deployment-Operations-Report.md"
rg -q 'O_S4_COLD_START_CAMPAIGNS_DEPLOYMENT_OPERATIONS_GO' "$DOC" || { echo "O-S4 cold start deployment ops gate: FAIL" >&2; exit 2; }
echo "O-S4 cold start deployment ops gate: PASS"
echo "O_S4_COLD_START_CAMPAIGNS_DEPLOYMENT_OPERATIONS_GO"
