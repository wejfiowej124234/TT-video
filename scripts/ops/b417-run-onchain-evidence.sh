#!/usr/bin/env bash
# B-417 · **一键** **链上** **证据** **入口** **：** **默认** **`B417_CHAIN_MODE=1`** **并** **落盘** **`evidence/b417_governance_execution_runs/run_<UTC>/`** **（** **可** **被** **`B417_RECORD_DIR`** **覆盖** **）** **，** **委托** **`b417-governance-execution-automation.sh`** **。**
#
# 用法（仓库根）：**`bash scripts/ops/b417-run-onchain-evidence.sh`**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export B417_CHAIN_MODE="${B417_CHAIN_MODE:-1}"
if [[ -z "${B417_RECORD_DIR:-}" ]]; then
  export B417_RECORD_DIR="${ROOT}/evidence/b417_governance_execution_runs/run_$(date -u +%Y%m%dT%H%M%SZ)_local"
fi

exec bash "${ROOT}/scripts/ops/b417-governance-execution-automation.sh" "$@"
