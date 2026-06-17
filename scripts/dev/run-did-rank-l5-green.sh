#!/usr/bin/env bash
# Phase ① · /did-rank L5 绿集（UI 冻结 + 数据链 contract）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/frontend"
npx vitest run \
  components/did-rank/didRankTheme.contract.test.ts \
  components/did-rank/useDidRankSecondaryBoard.test.ts \
  lib/didRankUtils.test.ts \
  lib/didRankDevPreview.test.ts \
  lib/didRankDevPreviewGate.test.ts \
  lib/marketingRouteTransitionPerf.contract.test.ts
cd "$ROOT"
bash scripts/check-did-rank-no-escrow-prefetch.sh
echo "TT_DID_RANK_L5_GREEN: OK"
