#!/usr/bin/env bash
# L5 Enterprise Reliability · Chaos & Resilience audit (163)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 ER Chaos & Resilience Audit =="
check "cross-domain audit" "test -f '$ROOT/scripts/dev/cross-domain-integration-audit.py'"
check "cdia probe registry" "test -f '$ROOT/registry/cross-domain-integration-audit-probes.v1.yaml'"
check "b480 fault gate config" "test -f '$ROOT/config/b480_prod_fault_slo_gate.v1.json'"
check "b480 acceptance script" "test -f '$ROOT/scripts/ops/b480-prod-fault-injection-acceptance.py'"
check "ops plane retry" "rg -q 'data-tt-ops-plane-retry' '$ROOT/frontend/components/admin/ops/OpsPlaneFetchStates.tsx'"
check "consumer retry" "rg -q 'data-tt-cold-start-retry' '$ROOT/frontend/components/consumer/ConsumerSurfaceStatePanel.tsx'"
check "catalog fallback honesty" "rg -q 'static-fallback' '$ROOT/frontend/app/community/explore/useCommunityExplorePage.ts'"
check "stripe webhook guard" "test -f '$ROOT/scripts/dev/verify-production-stripe-webhook-signature-static.sh'"
check "chaos scenarios manifest" "python -c \"import json,sys; m=json.load(open(sys.argv[1],encoding='utf-8')); s=m.get('chaos_scenarios',{}); assert len(s)>=5\" '$ROOT/evidence/l5_enterprise_reliability/reliability_manifest.v1.json'"
[[ "$fail" -eq 0 ]] && echo "TT_CHAOS_RESILIENCE: CHAOS_RESILIENCE_GO" || { echo "TT_CHAOS_RESILIENCE: HOLD"; exit 2; }
