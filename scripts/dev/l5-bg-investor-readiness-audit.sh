#!/usr/bin/env bash
# L5 Enterprise Business & Governance · Investor Readiness audit (165)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 BG Investor Readiness Audit =="
check "executive summary" "test -f '$ROOT/docs/fundraising/external/02-Investor-Executive-Summary.md'"
check "dataroom index" "test -f '$ROOT/docs/fundraising/data-room/README.md'"
check "fundraising SSOT" "test -f '$ROOT/docs/fundraising/START-HERE-SSOT-001.md'"
check "export dataroom script" "test -f '$ROOT/scripts/export-investor-dataroom.sh'"
check "LP pack gate" "test -f '$ROOT/scripts/gates/release-investor-lp-pack.sh'"
check "pitch deck storyboard" "test -f '$ROOT/docs/fundraising/external/04-PitchDeck-Storyboard.md'"
[[ "$fail" -eq 0 ]] && echo "TT_INVESTOR_READY: INVESTOR_READY_GO" || { echo "TT_INVESTOR_READY: HOLD"; exit 2; }
