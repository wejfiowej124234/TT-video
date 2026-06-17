#!/usr/bin/env bash
# L5 Enterprise Live Evidence · RUJR live capture audit (164)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 LE RUJR Live Evidence =="
check "RUJR e2e spec" "rg -q 'pesJourneyReviewModel' '$ROOT/frontend/e2e/pes-real-user-journey-review.spec.ts'"
check "synth 48 runs" "python -c \"import json,sys; r=json.load(open(sys.argv[1],encoding='utf-8')); assert r.get('totalRuns',0)>=48\" '$ROOT/frontend/evidence/pes-rujr-20260607/rujr-report-synth.json'"
check "journey runs capture" "test -f '$ROOT/frontend/evidence/pes-wave41-validation-20260607/journey-runs.jsonl'"
check "rujr live record" "test -f '$ROOT/evidence/l5_enterprise_live_evidence/rujr-live-record.v1.json'"
check "live manifest roles" "python -c \"import json,sys; m=json.load(open(sys.argv[1],encoding='utf-8')); assert set(m['roles'])>=set(['traveler','guide','merchant','ops','admin'])\" '$ROOT/evidence/l5_enterprise_live_evidence/live_evidence_manifest.v1.json'"
check "replay helper" "test -f '$ROOT/frontend/e2e/helpers/pesJourneyReview.ts'"
[[ "$fail" -eq 0 ]] && echo "TT_RUJR_LIVE: RUJR_LIVE_GO" || { echo "TT_RUJR_LIVE: HOLD"; exit 2; }
