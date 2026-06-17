#!/usr/bin/env bash
# L5 Product Excellence · User Journey audit (162)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 PE User Journey Audit =="
check "pes journey model" "rg -q 'PES_PERSONA_JOURNEYS' '$ROOT/frontend/lib/pesJourneyReviewModel.ts'"
check "RUJR e2e" "rg -q 'pesJourneyReviewModel' '$ROOT/frontend/e2e/pes-real-user-journey-review.spec.ts'"
check "journey manifest 5 roles" "python -c \"import json,sys; m=json.load(open(sys.argv[1],encoding='utf-8')); assert set(m['roles'])>=set(['traveler','guide','merchant','ops','admin'])\" '$ROOT/evidence/l5_product_excellence/journey_manifest.v1.json'"
check "cold start states" "rg -q 'ConsumerSurfaceStatePanel' '$ROOT/frontend/components/coldStartCampaign/ColdStartCampaignSurfaceSection.tsx'"
check "me referrals page" "rg -q 'data-tt-me-referrals-page' '$ROOT/frontend/app/me/referrals/MeReferralsPageMain.tsx'"
check "frca harness" "test -f '$ROOT/scripts/dev/five-role-full-chain-audit.py'"
[[ "$fail" -eq 0 ]] && echo "TT_USER_JOURNEY: USER_JOURNEY_L5_GO" || { echo "TT_USER_JOURNEY: HOLD"; exit 2; }
