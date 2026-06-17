#!/usr/bin/env bash
# BE-DAO-01 · Governance UAT implementation gate (Sprint 171)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { local name="$1"; shift; if "$@"; then echo "OK   $name"; else echo "FAIL $name"; fail=1; fi; }

echo "== Sprint 171 BE-DAO-01 Implementation Gate =="

for s in b417-sepolia-preflight.sh b417-governor-queue-testnet.sh b417-governance-execution-automation.sh b417-run-onchain-evidence.sh b417-evidence-pack-verify.sh; do
  check "$s" test -f "$ROOT/scripts/ops/$s"
done
check "b417-list-proposal-states.sh" test -f "$ROOT/scripts/ops/b417-list-proposal-states.sh"
check "b417-chain-step-lib.sh" test -f "$ROOT/scripts/ops/b417-chain-step-lib.sh"
check "evidence README" test -f "$ROOT/evidence/b417_governance_execution_runs/README.md"
check "171 evidence chain json" test -f "$ROOT/evidence/business_expansion/sprint171_governance_uat_evidence_chain.v1.json"
check "172 report" test -f "$ROOT/docs/handbook/engineering/172-BE-DAO-01-Governance-UAT-Implementation-Report.md"
check "admin execution-uat page" test -f "$ROOT/frontend/app/admin/governance/execution-uat/page.tsx"

orchestration=0
for s in b417-governance-execution-automation.sh b417-run-onchain-evidence.sh b417-evidence-pack-verify.sh b417-governor-queue-testnet.sh b417-sepolia-preflight.sh; do
  test -f "$ROOT/scripts/ops/$s" && orchestration=$((orchestration + 1))
done
echo "INFO B-417 orchestration scripts: ${orchestration}/5"
[[ "$orchestration" -eq 5 ]] && echo "OK   orchestration complete" || { echo "FAIL orchestration"; fail=1; }

# dry-run stub path (LINE-B minimal env)
export B417_RECORD_DIR="${ROOT}/evidence/b417_governance_execution_runs/run_$(date -u +%Y%m%dT%H%M%SZ)_gate_stub"
mkdir -p "$B417_RECORD_DIR"
unset B417_CHAIN_MODE
bash "$ROOT/scripts/ops/b417-governance-execution-automation.sh" >/dev/null && echo "OK   dry-run automation" || { echo "FAIL dry-run"; fail=1; }
jq -e '.dry_run == true and .execution_verdict == "GO"' "$B417_RECORD_DIR/b417-governance-execution-report.json" >/dev/null && echo "OK   dry-run report schema" || { echo "FAIL dry-run schema"; fail=1; }
bash "$ROOT/scripts/ops/b417-evidence-pack-verify.sh" "$B417_RECORD_DIR" >/dev/null 2>&1 && { echo "FAIL stub must not pass chain verify"; fail=1; } || echo "OK   stub correctly fails chain verify"

bash "$ROOT/scripts/ops/b417-evidence-pack-verify.sh" "$ROOT/evidence/b417_governance_execution_runs/run_20260417T0810Z" >/dev/null && echo "OK   historical Sepolia pack verify" || { echo "FAIL historical verify"; fail=1; }

cd "$ROOT/contracts"
forge test --match-test test_COMP_B089_governor_full_cycle_propose_vote_queue_execute -vv >/dev/null 2>&1 && echo "OK   Foundry B-089 full cycle" || { echo "FAIL Foundry B-089"; fail=1; }

cd "$ROOT/frontend"
npx vitest run app/admin/governance/execution-uat/adminGovernanceExecutionUat.contract.test.ts --silent 2>/dev/null && echo "OK   admin contract test" || { echo "FAIL contract"; fail=1; }

audit_out="$(bash "$ROOT/scripts/dev/run-sprint169-be-rs01-be-dao01-enterprise-audit.sh" 2>&1)" || true
if printf '%s' "$audit_out" | grep -q "BE_DAO_01: GO"; then
  echo "OK   169 dao audit probe"
else
  echo "FAIL 169 dao audit"
  fail=1
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "BE_DAO_01_GO"
  exit 0
fi
echo "BE_DAO_01_HOLD"
exit 2
