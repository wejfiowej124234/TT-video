#!/usr/bin/env bash
# Admin Phase ① 正式收口（L5 绿集 + backlog 闸 · 非 ②③ GO）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# Windows 命令行过长时：node scripts/dev/run-admin-l5-green.mjs
if command -v node >/dev/null 2>&1; then
  node scripts/dev/run-admin-l5-green.mjs
else
  bash scripts/dev/run-admin-l5-green.sh
fi
bash scripts/dev/run-web3-itinerary-l5-green.sh
bash scripts/dev/check-admin-phase2-prep-toolchain.sh

echo "TT_ADMIN_PHASE1_CLOSURE: PASS (① local · admin L5 green · not Phase 02/03 GO)"
echo "optional prep: bash scripts/dev/run-admin-remaining-local-prep.sh"
