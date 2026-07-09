#!/usr/bin/env bash
# Deployment 三态治理 · 统一入口（①→②→③ 顺序 · 禁止混合 / 无状态部署）
#
#   bash scripts/ops/run-deployment-three-state.sh sync --preflight
#   TESTNET_FREEZE_OVERRIDE=1 bash scripts/ops/run-deployment-three-state.sh sync --through-parity
#
#   FIX_DEPLOY_LEDGER_ID=BOOK-P0-04 TESTNET_FREEZE_OVERRIDE=1 \
#     bash scripts/ops/run-deployment-three-state.sh fix --deploy --parity
#
#   TESTNET_MANUAL_VERIFY_PASS=1 bash scripts/ops/run-deployment-three-state.sh freeze --freeze-soak
#
# SSOT: docs/runbook/TT-DEPLOYMENT-THREE-STATE-GOVERNANCE.md
# 末行: TT_DEPLOYMENT_THREE_STATE: PASS state=<sync|fix|freeze>
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export DEPLOYMENT_THREE_STATE_ROOT="$ROOT"
# shellcheck source=scripts/ops/lib/deployment-three-state-lib.sh
source "$ROOT/scripts/ops/lib/deployment-three-state-lib.sh"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/DEPLOYMENT_THREE_STATE/$STAMP"
STATE=""
PASSTHRU=()

usage() {
  sed -n '2,14p' "$0" | sed 's/^# \?//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    sync|fix|freeze)
      STATE="$1"
      export DEPLOYMENT_STATE="$1"
      shift
      ;;
    -h|--help) usage ;;
    *) PASSTHRU+=("$1"); shift ;;
  esac
done

[[ -n "$STATE" ]] || {
  echo "TT_DEPLOYMENT_THREE_STATE: BLOCKED missing state subcommand (sync|fix|freeze)" >&2
  usage
}

mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

echo "== Deployment Three-State · $STAMP · state=${STATE} =="
echo "  SSOT: docs/runbook/TT-DEPLOYMENT-THREE-STATE-GOVERNANCE.md"
echo "  sha=$(git -C "$ROOT" rev-parse HEAD)"

deployment_three_state_assert_no_mixed

case "$STATE" in
  fix)
    deployment_three_state_assert_fix_preconditions
    ;;
  freeze)
    [[ "${TESTNET_MANUAL_VERIFY_PASS:-}" == "1" ]] \
      || echo "  warn: TESTNET_MANUAL_VERIFY_PASS not set — freeze-soak will BLOCK at orchestrator"
    export DO_FREEZE_SOAK=0
    export DO_DEPLOY=0
    for arg in "${PASSTHRU[@]}"; do
      [[ "$arg" == "--freeze-soak" ]] && export DO_FREEZE_SOAK=1
    done
    deployment_three_state_assert_no_mixed
    ;;
  sync)
    export FIX_DEPLOY_LEDGER_ID=""
    ;;
esac

deployment_three_state_write_classification "$ROOT" "$STAMP" "$EVID"
echo "  classification=$EVID/classification.json"

ORCH="$ROOT/scripts/ops/run-testnet-sync-package.sh"
case "$STATE" in
  sync|fix|freeze)
    bash "$ORCH" "${PASSTHRU[@]}"
    ;;
esac

echo "TT_DEPLOYMENT_THREE_STATE: PASS state=${STATE} evidence=$EVID"
exit 0
