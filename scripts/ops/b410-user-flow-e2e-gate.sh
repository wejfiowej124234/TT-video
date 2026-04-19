#!/usr/bin/env bash
# B-410 · 用户主路径闸：**`b409-*`** **acceptance** **串联** **；** **可选** **`B410_RUN_PLAYWRIGHT=1`** **时** **`frontend`** **`npm run e2e`** **。**
#
# 用法（仓库根）：**`bash scripts/ops/b410-user-flow-e2e-gate.sh`**
#
# 互证：**[`docs/runbook/TT-B410-USER-FLOW-E2E-ORDER-STATE-UNIFIED-001.md`](../../docs/runbook/TT-B410-USER-FLOW-E2E-ORDER-STATE-UNIFIED-001.md)**。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

bash "${ROOT}/scripts/ops/b409-order-state-primary-acceptance.sh"
bash "${ROOT}/scripts/ops/b409-order-state-exception-acceptance.sh"

if [[ "${B410_RUN_PLAYWRIGHT:-}" == "1" ]]; then
  if [[ ! -d "${ROOT}/frontend/node_modules" ]]; then
    echo "b410-user-flow-e2e-gate: B410_RUN_PLAYWRIGHT=1 but frontend/node_modules missing (npm ci in frontend/)" >&2
    exit 11
  fi
  echo "b410-user-flow-e2e-gate: running Playwright e2e (frontend)…" >&2
  (cd "${ROOT}/frontend" && npm run e2e)
else
  echo "b410-user-flow-e2e-gate: skip Playwright (set B410_RUN_PLAYWRIGHT=1 and install frontend deps to run)" >&2
fi

echo "b410-user-flow-e2e-gate: ok" >&2
