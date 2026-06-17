#!/usr/bin/env bash
# L5 Enterprise Live Evidence · Resilience live capture audit (164)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 LE Live Resilience Evidence =="
check "cdia static record" "test -f '$ROOT/evidence/l5_enterprise_live_evidence/cdia-static-record.v1.json'"
check "frca static record" "test -f '$ROOT/evidence/l5_enterprise_live_evidence/frca-static-record.v1.json'"
check "b480 gate record" "test -f '$ROOT/evidence/l5_enterprise_live_evidence/b480-gate-record.v1.json'"
check "cdia harness" "test -f '$ROOT/scripts/dev/cross-domain-integration-audit.py'"
check "frca harness" "test -f '$ROOT/scripts/dev/five-role-full-chain-audit.py'"
check "b480 config" "test -f '$ROOT/config/b480_prod_fault_slo_gate.v1.json'"
check "chaos scenarios" "python -c \"import json,sys; m=json.load(open(sys.argv[1],encoding='utf-8')); assert len(m.get('chaos_scenarios',{}))>=5\" '$ROOT/evidence/l5_enterprise_live_evidence/live_evidence_manifest.v1.json'"
[[ "$fail" -eq 0 ]] && echo "TT_LIVE_RESILIENCE: LIVE_RESILIENCE_GO" || { echo "TT_LIVE_RESILIENCE: HOLD"; exit 2; }
