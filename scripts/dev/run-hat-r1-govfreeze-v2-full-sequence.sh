#!/usr/bin/env bash
# GovFreeze V2 · 浏览器逐页验收 → HAT-R1 Phase A 全序列
#
#   export HAT_R1_LIVE_WALLET_OK=1
#   export HAT_R1_WALLET_PK=0x...   # 真人 Sepolia 钱包
#   bash scripts/dev/run-hat-r1-govfreeze-v2-full-sequence.sh
#
# 可选：HAT_R1_SKIP_BROWSER_ACCEPT=1（仅调试 · 默认须 browser PASS_MACHINE + 人工签核）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

for arg in "$@"; do
  case "$arg" in
    --skip-browser) export HAT_R1_SKIP_BROWSER_ACCEPT=1 ;;
    --skip-playwright) BROWSER_EXTRA=(--skip-playwright) ;;
    --preflight-only) PREFLIGHT_ONLY=1 ;;
  esac
done

step() { echo "HAT_R1_FULL_SEQUENCE: $*"; }

step "1/2 · G24-BROWSER-ACCEPT-01"
if [[ "${HAT_R1_SKIP_BROWSER_ACCEPT:-0}" != "1" ]]; then
  bash "$ROOT/scripts/dev/run-gov-freeze-v2-browser-page-acceptance.sh" "${BROWSER_EXTRA[@]:-}"
  [[ -f "$ROOT/evidence/GO_gov_freeze_v2_browser_acceptance/latest/PASS.json" ]] \
    || { echo "HAT_R1_FULL_SEQUENCE: FAIL missing browser PASS.json" >&2; exit 2; }
  if [[ "${HAT_R1_BROWSER_ACCEPT_OK:-}" != "1" ]]; then
    echo "HAT_R1_FULL_SEQUENCE: PAUSE — 完成 HUMAN-PAGE-ACCEPTANCE-CHECKLIST.md 签核后:"
    echo "  export HAT_R1_BROWSER_ACCEPT_OK=1"
    echo "  bash $0"
    exit 0
  fi
else
  step "skip browser (--skip-browser)"
fi

step "2/2 · HAT-R1 preflight + Phase A"
bash "$ROOT/scripts/dev/run-hat-r1-sepolia-live-wallet.sh" --preflight-only
[[ "${PREFLIGHT_ONLY:-0}" == "1" ]] && exit 0

[[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
  echo "HAT_R1_FULL_SEQUENCE: set HAT_R1_LIVE_WALLET_OK=1 and HAT_R1_WALLET_PK for Phase A txs"
  exit 0
}

bash "$ROOT/scripts/dev/run-hat-r1-sepolia-live-wallet.sh" --phase a

EVID="$(ls -td "$ROOT/evidence/GO_hat_r1_sepolia"/*/ 2>/dev/null | head -1)"
if [[ -n "$EVID" ]] && curl -sf -o /dev/null "${HAT_R1_FRONTEND_BASE:-http://127.0.0.1:3012}/governance" 2>/dev/null; then
  step "L1 · per-step Playwright（前端已启动）"
  for s in step-00-preflight step-01-purchase step-02-stake step-03-seat-application \
    step-04-proposal-create step-05-vote step-06-queue; do
    node "$ROOT/scripts/dev/capture-hat-r1-screenshots.mjs" \
      --step="$s" --out="$EVID/$s/screenshots" 2>/dev/null || true
  done
fi

echo "HAT_R1_FULL_SEQUENCE: DONE evidence=${EVID}"
echo "TT_HAT_R1_FULL_SEQUENCE: PASS phase=a"
