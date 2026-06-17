#!/usr/bin/env bash
# ① Governance Proposals L5 · 本地烟测（vitest 绿集 + 可选 Playwright 创建页走廊）
# Governance Proposals L5 Closure：/governance/proposals* · steward 发议题走廊
#
# 用法（API 已起 · 可选）：
#   bash scripts/dev/smoke-governance-proposals-l5-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   SKIP_VITEST=1
#   SKIP_PLAYWRIGHT=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
SKIP_VITEST="${SKIP_VITEST:-0}"
SKIP_PLAYWRIGHT="${SKIP_PLAYWRIGHT:-1}"

fail() { echo "GP-PROP-L5-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "GP-PROP-L5-smoke: OK $*"; }

if [[ "$SKIP_VITEST" != "1" ]]; then
  echo "== vitest Governance Proposals L5 contracts =="
  cd "$ROOT/frontend"
  npx vitest run \
    app/governance/proposals/governanceProposalsPage.contract.test.ts \
    app/governance/proposals/governanceProposalCreatePage.contract.test.ts \
    app/governance/proposals/governanceProposalDetailPage.contract.test.ts \
    lib/governance/governanceProposalsL5.test.ts \
    lib/governance/governanceWalletGate.test.ts \
    lib/governance/governanceProposalsL5Closure.contract.test.ts \
    lib/governance/governanceProposalsL5FullClosure.contract.test.ts \
    lib/governance/governanceBlockExplorer.test.ts \
    lib/governance/governanceProposalTemplateCalldata.test.ts \
    components/governance/GovernanceProposalExecutionActionsPanel.contract.test.ts
  cd "$ROOT"
  ok "vitest contracts"
fi

if [[ "$SKIP_PLAYWRIGHT" != "1" ]]; then
  echo "== Playwright governance proposal create L5 probes =="
  cd "$ROOT/frontend"
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="${PLAYWRIGHT_API_PORT:-${API_BASE##*:}}"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/governance-proposal-create-l5.spec.ts
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/governance-proposals-full-l5.spec.ts
  cd "$ROOT"
  ok "playwright create-page probes"
fi

echo "TT_GOVERNANCE_PROPOSALS_L5_SMOKE: OK phase=① list+create+detail+steward-corridor"
echo "GP-PROP-L5-smoke: ALL PASS (① local · Governance Proposals L5 Closure)"
