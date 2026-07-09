#!/usr/bin/env bash
# 150 · E2E-A-01 cold start campaign consumer gate (static SSOT)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC="$ROOT/docs/handbook/engineering/150-E2E-A-01-ColdStart-Campaign-Consumer-Report.md"
rg -q 'E2E_A_01_COLD_START_CAMPAIGN_CONSUMER_GO' "$DOC" || { echo "E2E-A-01 cold start consumer gate: FAIL" >&2; exit 2; }
echo "E2E-A-01 cold start consumer gate: PASS"
echo "E2E_A_01_COLD_START_CAMPAIGN_CONSUMER_GO"
