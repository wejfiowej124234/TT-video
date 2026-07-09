#!/usr/bin/env bash
# Live Closure Chain · TT_LIVE_CLOSURE_CHAIN_VERDICT 查询（双真源之一）
#
#   bash scripts/ops/p2fc-query-live-closure-verdict.sh [--refresh]
#
# 推荐统一入口：bash scripts/ops/p2fc-query-runtime-adjudication.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARGS=()
[[ "${1:-}" == "--refresh" ]] && { ARGS+=(--refresh); shift; }

exec bash "$ROOT/scripts/ops/p2fc-query-runtime-adjudication.sh" "${ARGS[@]}"
