#!/usr/bin/env bash
# TTG Tokenomics UI Alignment Audit — SSOT: TTG-TOKENOMICS-FREEZE-V1
# 真人视角 · 治理/Primary Market/Seat/Country Pool/Treasury/收益/退出 全页文案对齐
#
#   bash scripts/dev/run-ttg-tokenomics-ui-alignment-audit.sh
#
# Gate: PASS → 才允许 HAT-R1 preflight / 真人逐步点击
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_ttg_tokenomics_ui_alignment/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/audit-steps.log"
: >"$LOG"

fail() { echo "TTG_TOKENOMICS_UI_ALIGNMENT_AUDIT: FAIL $*" | tee -a "$LOG" >&2; exit 2; }
step() { echo "AUDIT_STEP: $*" | tee -a "$LOG"; }

PAGES=(
  "/governance"
  "/governance/params#gov-params-tokenomics-freeze"
  "/governance/params#gov-params-treasury-policy"
  "/governance/params#gov-params-overview"
  "/governance/proposals"
  "/governance/proposals/new"
  "/governance/delegate"
  "/governance/distribution-claim"
  "/governance/distribution-accruals"
  "/governance/fee-routes"
  "/governance/vault-forwards"
  "/governance/steward-region-workbench"
)

VITEST_FILES=(
  "lib/governance/ttgTokenomicsUiAlignment.contract.test.ts"
  "app/governance/governanceHubPage.contract.test.ts"
  "app/governance/params/governanceParamsPage.contract.test.ts"
  "app/governance/params/governanceParamsParticipatePanel.contract.test.ts"
  "lib/governance/governanceParamsPageL5FullClosure.contract.test.ts"
  "lib/governance/governanceParamsTtgTokenomicsFreeze.test.ts"
  "lib/governance/governanceParamsTreasuryPolicy.test.ts"
  "lib/governance/governanceParamsGlobalTreasuryUsagePolicy.test.ts"
  "lib/governance/countryPoolFundraiseGovernanceV1.test.ts"
  "lib/governance/stewardWorkbench.contract.test.ts"
  "lib/governance/governanceProposalsL5.test.ts"
  "lib/governance/governanceProposalsL5Closure.contract.test.ts"
  "app/governance/proposals/governanceProposalsPage.contract.test.ts"
  "app/governance/proposals/governanceProposalDetailPage.contract.test.ts"
  "app/governance/proposals/governanceProposalCreatePage.contract.test.ts"
  "app/governance/delegate/governanceDelegatePage.contract.test.ts"
  "app/governance/fee-routes/governanceFeeRoutesPage.contract.test.ts"
  "app/governance/vault-forwards/governanceVaultForwardsPage.contract.test.ts"
  "app/governance/distribution-claim/distributionClaimPage.contract.test.ts"
  "app/governance/distribution-accruals/distributionAccrualsPages.contract.test.ts"
  "lib/p5-4GovernanceRoutes.smoke.test.ts"
  "lib/apiClient/governance/ttgExchange.test.ts"
  "lib/governance/protocolSsot.v1.contract.test.ts"
)

{
  echo "# TTG Tokenomics UI alignment · route inventory"
  for p in "${PAGES[@]}"; do echo "$p"; done
} >"$EVID/routes-inventory.txt"

step "1 · SSOT 文档"
[[ -f "$ROOT/docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md" ]] || fail "missing TTG-TOKENOMICS-FREEZE-V1.md"

step "2 · vitest 契约（治理全页 · ${#VITEST_FILES[@]} suites）"
VITEST_LOG="$EVID/vitest-ui-alignment.log"
(
  cd "$ROOT/frontend"
  npm test -- --run "${VITEST_FILES[@]}" 2>&1 | tee "$VITEST_LOG"
) || fail "vitest UI alignment contracts"

step "3 · §6 废止叙事扫描（locales + app/governance）"
PY="python"
command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1 && PY="python3"
export TTG_UI_AUDIT_EVID="$EVID" TTG_UI_AUDIT_ROOT="$ROOT"
$PY "$ROOT/scripts/dev/lib/ttg-tokenomics-ui-alignment-scan.py" >>"$LOG" 2>&1 || fail "forbidden narrative scan"

step "4 · 生成 UI Alignment 报告"
export TTG_UI_AUDIT_EVID="$EVID" TTG_UI_AUDIT_ROOT="$ROOT"
REPORT_VERDICT="$($PY "$ROOT/scripts/dev/lib/ttg-tokenomics-ui-alignment-audit-report.py" 2>&1 | tee -a "$LOG" | grep '^TTG_TOKENOMICS_UI_ALIGNMENT_AUDIT:' | awk '{print $2}' || echo FAIL)"
[[ "$REPORT_VERDICT" == "PASS" ]] || fail "report verdict $REPORT_VERDICT"

ln -sfn "$STAMP" "$ROOT/evidence/GO_ttg_tokenomics_ui_alignment/latest" 2>/dev/null || \
  echo "$STAMP" >"$ROOT/evidence/GO_ttg_tokenomics_ui_alignment/latest-stamp.txt"

echo "TTG_TOKENOMICS_UI_ALIGNMENT_AUDIT: PASS stamp=${STAMP} evidence=${EVID}"
echo "TTG_TOKENOMICS_UI_ALIGNMENT_AUDIT_SUMMARY: PASS"
echo "HAT-R1 gate: UI audit PASS → next: bootstrap --strict PASS → run-hat-r1 --preflight-only"
exit 0
