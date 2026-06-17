#!/usr/bin/env bash
# PRA partial closing gap · 本地 spine 预检（可单独跑）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/pra-local-spine-lib.sh
source "$ROOT/scripts/dev/lib/pra-local-spine-lib.sh"
ensure_pra_local_spine_api
echo "TT_CHECK_PRA_LOCAL_SPINE: OK"
