#!/usr/bin/env bash
# B-409 · **主成功链** **机读** **acceptance** **。**
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
cargo test -p traveltrust-api chain_off::tests_guides_me_orders::p21_order_create_accept_mock_pay_confirm -- --exact
