#!/usr/bin/env bash
# L5 Enterprise Business & Governance · Governance audit (165)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 BG Governance Audit =="
check "governance hub" "test -f '$ROOT/frontend/app/governance/GovernanceHubPageMain.tsx'"
check "safe deploy flow test" "test -f '$ROOT/contracts/test/GovernanceSafeDeployFlow.t.sol'"
check "timelock SSOT" "rg -q 'timelock_delay_ssot' '$ROOT/crates/api/src/chain_off/governance_timelock_delay_ssot.rs'"
check "ITG audit harness" "test -f '$ROOT/scripts/dev/identity-trust-governance-deep-audit.py'"
check "governance proposals" "rg -q 'governance_proposals' '$ROOT/crates/api/src/routes/governance_proposals.rs'"
check "governance local gate" "test -f '$ROOT/scripts/gates/governance-matrix-local-gate.sh'"
check "region steward role" "rg -q 'region_steward' '$ROOT/crates/api/src/routes/admin/mod.rs'"
[[ "$fail" -eq 0 ]] && echo "TT_GOVERNANCE: GOVERNANCE_GO" || { echo "TT_GOVERNANCE: HOLD"; exit 2; }
