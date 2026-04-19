#!/usr/bin/env bash
# B-409 · 异常链 acceptance（**机读**）：**`created → cancelled`** **（** **`p21_order_cancel_created`** **）** **。**
#
# 用法（仓库根）：**`bash scripts/ops/b409-order-state-exception-acceptance.sh`**
#
# 互证：**[`docs/runbook/TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md`](../../docs/runbook/TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md)**。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "b409-order-state-exception-acceptance: chain_off::tests_guides_me_orders::p21_order_cancel_created" >&2
cargo test -p traveltrust-api chain_off::tests_guides_me_orders::p21_order_cancel_created -- --exact

echo "b409-order-state-exception-acceptance: ok" >&2
