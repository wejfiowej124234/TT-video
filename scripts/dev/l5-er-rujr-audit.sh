#!/usr/bin/env bash
# L5 Enterprise Reliability · RUJR (Real User Journey Replay) audit (163)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 ER RUJR Audit =="
check "pes journey model" "rg -q 'PES_PERSONA_JOURNEYS' '$ROOT/frontend/lib/pesJourneyReviewModel.ts'"
check "RUJR e2e replay" "rg -q 'pesJourneyReviewModel' '$ROOT/frontend/e2e/pes-real-user-journey-review.spec.ts'"
check "journey replay helper" "test -f '$ROOT/frontend/e2e/helpers/pesJourneyReview.ts'"
check "RUJR aggregate" "rg -q 'buildPesJourneyReviewReport' '$ROOT/frontend/lib/pesJourneyReviewAggregate.ts'"
check "synth report 48 runs" "python -c \"import json,sys; r=json.load(open(sys.argv[1],encoding='utf-8')); assert r.get('totalRuns',0)>=48\" '$ROOT/frontend/evidence/pes-rujr-20260607/rujr-report-synth.json'"
check "reliability manifest 5 roles" "python -c \"import json,sys; m=json.load(open(sys.argv[1],encoding='utf-8')); assert set(m['roles'])>=set(['traveler','guide','merchant','ops','admin'])\" '$ROOT/evidence/l5_enterprise_reliability/reliability_manifest.v1.json'"
check "frca harness" "test -f '$ROOT/scripts/dev/five-role-full-chain-audit.py'"
[[ "$fail" -eq 0 ]] && echo "TT_RUJR: RUJR_L5_GO" || { echo "TT_RUJR: HOLD"; exit 2; }
