#!/usr/bin/env bash
# L5 Enterprise Live Evidence · A11Y live capture audit (164)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 LE A11Y Live Evidence =="
check "a11y live spec" "test -f '$ROOT/frontend/e2e/l5-a11y-live-scan.spec.ts'"
check "scan summary" "test -f '$ROOT/frontend/evidence/l5-a11y-live-scan/scan-summary.json'"
check "scan results jsonl" "test -f '$ROOT/frontend/evidence/l5-a11y-live-scan/scan-results.jsonl'"
check "summary routes>=5" "python -c \"import json,sys; s=json.load(open(sys.argv[1],encoding='utf-8')); assert s.get('routesScanned',0)>=5\" '$ROOT/frontend/evidence/l5-a11y-live-scan/scan-summary.json'"
check "manifest a11y routes" "python -c \"import json,sys; m=json.load(open(sys.argv[1],encoding='utf-8')); assert len(m.get('a11y_live_routes',[]))>=5\" '$ROOT/evidence/l5_enterprise_live_evidence/live_evidence_manifest.v1.json'"
[[ "$fail" -eq 0 ]] && echo "TT_A11Y_LIVE: A11Y_LIVE_GO" || { echo "TT_A11Y_LIVE: HOLD"; exit 2; }
