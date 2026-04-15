#!/usr/bin/env bash
# 本地等价「三门禁全部通过」：顺序执行 Batch-1 → Batch-2 → Batch-3 gate（与 CI broadcast-batch-blockers.yml 一致）。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
bash scripts/gates/broadcast-batch-1-blockers.sh
bash scripts/gates/broadcast-batch-2-blockers.sh
bash scripts/gates/broadcast-batch-3-blockers.sh
echo "broadcast-batch-all-required: OK"
