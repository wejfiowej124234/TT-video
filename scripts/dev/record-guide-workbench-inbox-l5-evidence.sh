#!/usr/bin/env bash
# ① Guide Workbench Inbox L5 — 已并入全页证据脚本（向后兼容别名）
#
# 用法（仓库根）：
#   bash scripts/dev/record-guide-workbench-inbox-l5-evidence.sh
#   → 等价 bash scripts/dev/record-guide-workbench-l5-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec bash "$ROOT/scripts/dev/record-guide-workbench-l5-evidence.sh"
