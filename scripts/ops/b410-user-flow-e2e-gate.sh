#!/usr/bin/env bash
# B-410：**b409** **×2** **；** **可选** **Playwright** **。**
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
bash scripts/ops/b409-order-state-primary-acceptance.sh
bash scripts/ops/b409-order-state-exception-acceptance.sh
if [[ "${B410_RUN_PLAYWRIGHT:-}" == "1" ]]; then
  (cd frontend && npm run e2e)
fi
