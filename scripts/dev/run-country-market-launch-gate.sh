#!/usr/bin/env bash
# BE-GCM-01 · country launch gate probe (static + optional API)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ISO="${1:-CN}"
ISO="$(echo "$ISO" | tr '[:lower:]' '[:upper:]')"

echo "== country-market-launch-gate iso=$ISO =="

test -f "$ROOT/docs/runbook/COUNTRY-MARKET-GO-LIVE-PLAYBOOK.v1.md" || exit 2
test -f "$ROOT/evidence/country_market/$ISO/walkthrough.json" || exit 2
rg -q '"phase"' "$ROOT/evidence/country_market/$ISO/walkthrough.json" || exit 2

echo "TT_COUNTRY_MARKET_LAUNCH_GATE: OK iso=$ISO"
