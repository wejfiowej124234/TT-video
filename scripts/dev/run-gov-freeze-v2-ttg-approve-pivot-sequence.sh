#!/usr/bin/env bash
# GovFreeze V2 · TTG approve 重播 + 全栈切主 + 验收序列
#
# 暂停 HAT-R1 Phase A · 重播含 approve 的 GovernanceVotesToken + 全新 GovFreeze V2 栈
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/run-gov-freeze-v2-ttg-approve-pivot-sequence.sh
#
# 可选：--skip-broadcast（仅 cutover 后验收 · 须已有 latest evidence）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SKIP_BROADCAST=0
for arg in "$@"; do
  case "$arg" in
    --skip-broadcast) SKIP_BROADCAST=1 ;;
  esac
done

step() { echo "TTG_APPROVE_PIVOT: $*"; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || { echo "TTG_APPROVE_PIVOT: FAIL missing $ENV_FILE" >&2; exit 2; }
LEGACY_TTG="$(grep -E '^GOVERNANCE_TOKEN_ADDRESS=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '\r' || true)"
export LEGACY_GOVERNANCE_TOKEN_ADDRESS="${LEGACY_GOVERNANCE_TOKEN_ADDRESS:-$LEGACY_TTG}"
export GOV_FREEZE_V2_DEPLOY_NEW_TTG=1

step "HAT-R1 Phase A PAUSED (TTG approve pivot)"
export HAT_R1_PHASE_A_PAUSED=1

if [[ "$SKIP_BROADCAST" != "1" ]]; then
  step "1/5 · Sepolia broadcast GovFreeze V2 + new GovernanceVotesToken"
  bash "$ROOT/scripts/dev/phase2-sepolia-broadcast-gov-freeze-v2-clean-baseline.sh"
else
  step "1/5 · skip broadcast"
fi

step "2/5 · env/registry/API cutover"
bash "$ROOT/scripts/dev/apply-gov-freeze-v2-sepolia-cutover.sh"

step "3/5 · TTG ERC20 approve/allowance verify"
bash "$ROOT/scripts/dev/verify-gov-freeze-v2-ttg-erc20-sepolia.sh"

step "4/5 · G24 clean-baseline + browser UI acceptance"
bash "$ROOT/scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh"
bash "$ROOT/scripts/dev/run-gov-freeze-v2-browser-page-acceptance.sh" --skip-playwright

step "5/5 · HAT-R1 preflight (no Phase A txs)"
unset HAT_R1_PHASE_A_PAUSED
bash "$ROOT/scripts/dev/run-hat-r1-sepolia-live-wallet.sh" --preflight-only

echo "TTG_APPROVE_PIVOT_SUMMARY: OK"
echo "HAT_R1_TTG_PIVOT: OK — set HAT_R1_PHASE_A_PAUSED=0 HAT_R1_BROWSER_ACCEPT_OK=1 for Phase A"
