#!/usr/bin/env bash
# TT-B435 封口辅助：在仓库根依次执行
#   1) b435-merge-first-payment-tx.example.sh（须 B435_FIRST_PAYMENT_TX）
#   2) b435-evidence-internal-curls.example.sh（须 INTERNAL_API_SECRET + ADMIN_BEARER_TOKEN，或 mint 条件）
#
# 用法（仓库根）：
#   set -a && source .env && set +a
#   export B435_FIRST_PAYMENT_TX=0x…
#   export B435_EVIDENCE_RUN_DIR=evidence/b435_fullstack_fund_testnet_closeout/run_20260416T122500Z   # 可选
#   # 可选：与 b435-evidence-internal-curls 相同，传入子 shell（例：B-383 + distribute tx pin）
#   # export B435_INCLUDE_FEE_ROUTER_B383=1 VERIFY_FEE_ROUTER_EVENTS_RPC=1 FEE_ROUTER_VERIFY_TX_HASH=0x…
#   bash scripts/ops/b435-seal-run-bundle.example.sh
#
# Admin：在 .env 设 ADMIN_BEARER_TOKEN=tts_…；或 API 设 TRAVELTRUST_TESTNET_ADMIN_BEARER_MINT=1 且 export B435_AUTO_ADMIN_BEARER_MINT=1。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

RUN="${B435_EVIDENCE_RUN_DIR:-evidence/b435_fullstack_fund_testnet_closeout/run_20260416T122500Z}"
export B435_EVIDENCE_RUN_DIR="$RUN"

if [[ -z "${B435_FIRST_PAYMENT_TX:-}" ]]; then
  echo "b435-seal-run-bundle: set B435_FIRST_PAYMENT_TX=0x… (Sepolia real fund tx)" >&2
  exit 1
fi

echo "=== [1/2] merge first_payment → tx_hashes.json ==="
bash "$ROOT/scripts/ops/b435-merge-first-payment-tx.example.sh"

echo
echo "=== [2/2] indexer-tick / reconcile / overview ==="
bash "$ROOT/scripts/ops/b435-evidence-internal-curls.example.sh"

echo
echo "Done. Check: $RUN/tx_hashes.json reconcile.json overview.json"
