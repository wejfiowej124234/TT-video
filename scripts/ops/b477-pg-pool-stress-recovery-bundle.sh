#!/usr/bin/env bash
# B-477：PG 连接池压力与恢复验收 + 可选 b473-seal 全栈封口串联。
# 用法见 docs/runbook/TT-B477-PG-POOL-STRESS-RECOVERY-ACCEPTANCE-001.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/gates/_resolve_python_bin.sh
source "$ROOT/scripts/gates/_resolve_python_bin.sh"

export B477_API_BASE="${B477_API_BASE:-http://127.0.0.1:8080}"

exec "$PYTHON_BIN" "${ROOT}/scripts/ops/b477-pg-pool-stress-recovery-acceptance.py" "$@"
