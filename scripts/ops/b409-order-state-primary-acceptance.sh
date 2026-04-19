#!/usr/bin/env bash
# B-409 · 主成功链 acceptance（**机读**）：**HTTP/chain_off** 单测名 **（** **可能** **0** **条** **—** **历史** **改名** **）** **+** **`p21_order_create_accept_mock_pay_confirm`** **（** **必** **绿** **）** **。**
#
# 用法（仓库根）：**`bash scripts/ops/b409-order-state-primary-acceptance.sh`**
#
# 互证：**[`docs/runbook/TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md`](../../docs/runbook/TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md)**、**[`docs/runbook/TT-B410-USER-FLOW-E2E-ORDER-STATE-UNIFIED-001.md`](../../docs/runbook/TT-B410-USER-FLOW-E2E-ORDER-STATE-UNIFIED-001.md)**。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "b409-order-state-primary-acceptance: tt_b409_chain_off_http_order_created_accepted_escrowed (optional; 0 tests ok if renamed)" >&2
cargo test -p traveltrust-api tt_b409_chain_off_http_order_created_accepted_escrowed -- --exact

echo "b409-order-state-primary-acceptance: chain_off::tests_guides_me_orders::p21_order_create_accept_mock_pay_confirm" >&2
cargo test -p traveltrust-api chain_off::tests_guides_me_orders::p21_order_create_accept_mock_pay_confirm -- --exact

echo "b409-order-state-primary-acceptance: ok" >&2
