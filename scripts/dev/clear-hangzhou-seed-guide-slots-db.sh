#!/usr/bin/env bash
# ① 本地 · 独立入口：清理 f0e0b101-* 向导档期 DB 占位（API 启动前调用）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/clear-hangzhou-seed-guide-slots-db.sh
source "$ROOT/scripts/dev/lib/clear-hangzhou-seed-guide-slots-db.sh"
clear_hangzhou_seed_guide_slots_db
