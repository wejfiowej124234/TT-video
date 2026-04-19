#!/usr/bin/env bash
# B-416 L0：**reconcile** **persist:false** **+** **overview** **对拍** **（** **须** **API** **）** **。**
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
if [[ ! -f contracts/src/FeeRouter.sol ]]; then
  echo "b416: contracts/src/FeeRouter.sol missing" >&2
  exit 1
fi
echo "b416-fee-router-write-path-b415-preflight: 请在有 INTERNAL_API_SECRET + ADMIN_BEARER_TOKEN 的环境对拍 reconcile/overview（见 Runbook TT-B416）" >&2
