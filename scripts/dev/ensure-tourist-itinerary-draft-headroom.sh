#!/usr/bin/env bash
# ① 本地 · 兼容入口 → ensure-tourist-test-account-order-cleanup.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export DRAFT_TARGET="${DRAFT_HEADROOM_TARGET:-${DRAFT_TARGET:-3}}"
export IN_PROGRESS_TARGET="${IN_PROGRESS_TARGET:-2}"
export PURGE_CANCELLED_DB="${PURGE_CANCELLED_DB:-1}"
exec bash "$ROOT/scripts/dev/ensure-tourist-test-account-order-cleanup.sh"
