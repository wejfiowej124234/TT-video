#!/usr/bin/env bash
# G-0 证据：自留 run-go-local-phase1-acceptance.sh 全量 exit 0 日志
#
# 用法（仓库根 · API + DATABASE_URL 已就绪）：
#   bash scripts/dev/record-go-local-phase1-acceptance.sh
#
# 输出：evidence/GO_local_phase1/acceptance.latest.log
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OUT_DIR="$ROOT/frontend/evidence/GO_local_phase1"
OUT_LOG="$OUT_DIR/acceptance.latest.log"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$OUT_DIR"

{
  echo "# GO_local_phase1 acceptance log · $STAMP (UTC)"
  echo "# cmd: bash scripts/dev/run-go-local-phase1-acceptance.sh"
  echo ""
} >"$OUT_LOG"

set +e
bash "$ROOT/scripts/dev/run-go-local-phase1-acceptance.sh" 2>&1 | tee -a "$OUT_LOG"
rc=${PIPESTATUS[0]}
set -e

{
  echo ""
  echo "# exit_code=$rc · recorded=$STAMP"
} >>"$OUT_LOG"

if [[ "$rc" -ne 0 ]]; then
  echo "record-go-local-phase1-acceptance: FAIL exit $rc (see $OUT_LOG)" >&2
  exit "$rc"
fi

echo "record-go-local-phase1-acceptance: OK → $OUT_LOG"
grep -q "TT_GO_LOCAL_PHASE1: OK" "$OUT_LOG" || {
  echo "record-go-local-phase1-acceptance: FAIL missing TT_GO_LOCAL_PHASE1: OK in log" >&2
  exit 1
}
