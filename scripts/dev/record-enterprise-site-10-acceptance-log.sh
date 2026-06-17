#!/usr/bin/env bash
# G-0 补充证据：自留 run-enterprise-site-10-local.sh 全量 exit 0 日志（① 全站企业 10）
#
# 用法（仓库根 · API + DATABASE_URL 已就绪）：
#   bash scripts/dev/record-enterprise-site-10-acceptance-log.sh
#
# 输出：frontend/evidence/GO_local_phase1/site10.acceptance.latest.log
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OUT_DIR="$ROOT/frontend/evidence/GO_local_phase1"
OUT_LOG="$OUT_DIR/site10.acceptance.latest.log"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$OUT_DIR"

{
  echo "# GO_local_phase1 · site10 acceptance log · $STAMP (UTC)"
  echo "# cmd: bash scripts/dev/run-enterprise-site-10-local.sh"
  echo "# SSOT: docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md"
  echo ""
} >"$OUT_LOG"

set +e
bash "$ROOT/scripts/dev/run-enterprise-site-10-local.sh" 2>&1 | tee -a "$OUT_LOG"
rc=${PIPESTATUS[0]}
set -e

{
  echo ""
  echo "# exit_code=$rc · recorded=$STAMP"
} >>"$OUT_LOG"

if [[ "$rc" -ne 0 ]]; then
  echo "record-enterprise-site-10-acceptance: FAIL exit $rc (see $OUT_LOG)" >&2
  exit "$rc"
fi

echo "record-enterprise-site-10-acceptance: OK → $OUT_LOG"
grep -q "TT_ENTERPRISE_SITE_10_LOCAL: OK" "$OUT_LOG" || {
  echo "record-enterprise-site-10-acceptance: FAIL missing TT_ENTERPRISE_SITE_10_LOCAL: OK in log" >&2
  exit 1
}
