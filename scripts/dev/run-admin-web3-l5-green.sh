#!/usr/bin/env bash
# ① 合并绿集：Admin 工作台 L5 + Web3 行程/市场 L5（非 ②③ GO）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
bash "$ROOT/scripts/dev/run-admin-l5-green.sh"
bash "$ROOT/scripts/dev/run-web3-itinerary-l5-green.sh"
echo "admin-web3-l5-green: exit 0 (① local)"
