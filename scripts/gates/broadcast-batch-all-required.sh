#!/usr/bin/env bash
# 本地等价「broadcast-batch-blockers.yml」：legacy path SSOT gate → Batch-1 → Batch-2 → Batch-3。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
python3 scripts/check_no_legacy_staking_path_as_ssot.py
bash scripts/gates/broadcast-batch-1-blockers.sh
bash scripts/gates/broadcast-batch-2-blockers.sh
bash scripts/gates/broadcast-batch-3-blockers.sh
echo "broadcast-batch-all-required: OK"
