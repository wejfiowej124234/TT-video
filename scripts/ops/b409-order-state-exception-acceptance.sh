#!/usr/bin/env bash
# B-409 · **异常链** **created→cancelled** **。**
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
cargo test -p traveltrust-api chain_off::tests_guides_me_orders::p21_order_cancel_created -- --exact
