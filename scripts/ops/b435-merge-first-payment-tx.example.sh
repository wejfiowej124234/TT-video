#!/usr/bin/env bash
# TT-B435 §3.3（替代 stake）：将一笔**真实链上**资金类交易哈希写入 `tx_hashes.json` → `first_payment`。
# 适用：订单托管充值/释放路径、FeeRouter `distribute`、Escrow→FeeRouter 平台费等（须与 Runbook §3.3 五条一致，Explorer 可点开）。
#
# 用法（仓库根）：
#   set -a && source .env && set +a
#   export B435_FIRST_PAYMENT_TX=0x你的交易哈希
#   export B435_TX_HASHES_JSON=evidence/b435_fullstack_fund_testnet_closeout/run_<UTC>/tx_hashes.json   # 可选，有默认
#   bash scripts/ops/b435-merge-first-payment-tx.example.sh
#
# 依赖：jq
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

TX="${B435_FIRST_PAYMENT_TX:-}"
TX="${TX//$'\r'/}"

DEFAULT_JSON="$ROOT/evidence/b435_fullstack_fund_testnet_closeout/run_20260416T122500Z/tx_hashes.json"
JSON="${B435_TX_HASHES_JSON:-$DEFAULT_JSON}"

if [[ -z "$TX" ]]; then
  echo "b435-merge-first-payment-tx: set B435_FIRST_PAYMENT_TX=0x… (Sepolia tx hash)" >&2
  exit 1
fi
if [[ ! "$TX" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
  echo "b435-merge-first-payment-tx: B435_FIRST_PAYMENT_TX must be 0x + 64 hex" >&2
  exit 1
fi
if [[ ! -f "$JSON" ]]; then
  echo "b435-merge-first-payment-tx: file not found: $JSON" >&2
  exit 1
fi
command -v jq >/dev/null 2>&1 || {
  echo "b435-merge-first-payment-tx: need jq" >&2
  exit 1
}

tmp="${JSON}.${BASHPID:-$$}.tmp"
if jq --arg h "$TX" '.first_payment = $h' "$JSON" >"$tmp" && mv -f "$tmp" "$JSON"; then
  echo "Updated first_payment in $JSON"
else
  rm -f "$tmp"
  echo "b435-merge-first-payment-tx: jq merge failed" >&2
  exit 1
fi
