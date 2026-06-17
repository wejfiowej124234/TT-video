#!/usr/bin/env bash
# GovFreeze V1 · 本地 UI 巡检（治理相关页 · ① vitest 契约 · 非浏览器 E2E）
#
#   bash scripts/dev/audit-gov-freeze-v1-governance-ui-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/ui-audit/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$EVID"
LOG="$EVID/vitest-governance-ui.log"

fail() { echo "audit-gov-freeze-v1-governance-ui: FAIL $*" >&2; exit 2; }

PAGES=(
  "/governance"
  "/governance/params"
  "/governance/proposals"
  "/governance/delegate"
  "/governance/distribution-claim"
  "/governance/distribution-accruals"
  "/governance/fee-routes"
  "/governance/vault-forwards"
  "/governance/steward-region-workbench"
)

VITEST_FILES=(
  "app/governance/governanceHubPage.contract.test.ts"
  "app/governance/params/governanceParamsPage.contract.test.ts"
  "lib/governance/governanceParamsTtgTokenomicsFreeze.test.ts"
  "lib/governance/governanceParamsTreasuryPolicy.test.ts"
  "lib/governance/governanceParamsGlobalTreasuryUsagePolicy.test.ts"
  "lib/governance/countryPoolFundraiseGovernanceV1.test.ts"
  "lib/governance/stewardWorkbench.contract.test.ts"
  "lib/governance/governanceParamsPageL5FullClosure.contract.test.ts"
  "lib/governance/governanceProposalsL5.test.ts"
  "lib/apiClient/governance/ttgExchange.test.ts"
  "lib/governance/protocolSsot.v1.contract.test.ts"
  "app/governance/distribution-claim/distributionClaimPage.contract.test.ts"
  "app/governance/distribution-accruals/distributionAccrualsPages.contract.test.ts"
  "lib/p5-4GovernanceRoutes.smoke.test.ts"
)

{
  echo "# GovFreeze V1 · governance UI route inventory"
  for p in "${PAGES[@]}"; do echo "$p"; done
} >"$EVID/routes-inventory.txt"

(
  cd "$ROOT/frontend"
  npm test -- --run "${VITEST_FILES[@]}" 2>&1 | tee "$LOG"
) || fail "vitest governance UI contracts"

PY="python"
command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1 && PY="python3"
export G24_UI_EVID="$EVID"
$PY <<'PY'
import json, os, pathlib
evid = pathlib.Path(os.environ["G24_UI_EVID"])
report = {
  "audit_id": "gov-freeze-v1-governance-ui-local",
  "phase": "①",
  "routes": [l.strip() for l in (evid / "routes-inventory.txt").read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")],
  "vitest_suites": [
    "governanceHubPage.contract",
    "governanceParamsPage.contract",
    "governanceParamsTtgTokenomicsFreeze",
    "governanceParamsTreasuryPolicy",
    "governanceParamsGlobalTreasuryUsagePolicy",
    "countryPoolFundraiseGovernanceV1",
    "stewardWorkbench.contract",
    "governanceParamsPageL5FullClosure.contract",
    "governanceProposalsL5",
    "ttgExchange (Primary Market quote)",
    "protocolSsot.v1.contract",
    "distributionClaimPage.contract",
    "distributionAccrualsPages.contract",
    "p5-4GovernanceRoutes.smoke",
  ],
  "verdict": "PASS",
}
(evid / "ui-audit-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print("wrote", evid / "ui-audit-report.json")
PY

echo "GOV_FREEZE_V1_UI_AUDIT: PASS evidence=$EVID"
exit 0
