#!/usr/bin/env bash
# R-003 Runbook §3.1 → CI：当 main 上存在 evidence/GO_20260418/.r003-go-frozen 时，
# 禁止 PR / push 修改该证据目录，并强制 report.json 机读为 release_gate=GO。
#
# 用法（在仓库根）：
#   bash scripts/ci/r003-go-staging-freeze-gate.sh <base_sha> <head_sha>
#
# 若 base 上无冻结标记，exit 0（门禁未启用，避免占位 NO_GO 阶段全红）。

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

BASE="${1:?base sha}"
HEAD="${2:?head sha}"

EV="evidence/GO_20260418"
MARKER="$EV/.r003-go-frozen"

if ! git cat-file -e "${BASE}:${MARKER}" 2>/dev/null; then
  echo "r003-go-freeze: no ${MARKER} at base ${BASE:0:7}… — freeze CI inactive (commit marker after GO sign-off to arm)."
  exit 0
fi

echo "r003-go-freeze: marker present on base — enforcing zero diff under ${EV} and release_gate=GO."

if ! git diff --exit-code "${BASE}" "${HEAD}" -- "${EV}"; then
  echo "::error title=R-003 frozen evidence modified::Runbook §3.1: ${EV} must not change while ${MARKER} exists on base. Use a new evidence/GO_YYYYMMDD + run_id for further runs (R-004)."
  exit 1
fi

py="python3"
if ! command -v python3 >/dev/null 2>&1; then
  py="python"
fi
"${py}" scripts/validate-regression-report.py "${EV}/report.json" --fail-on-no-go --require-go

echo "r003-go-freeze: OK (${EV}/report.json is GO and tree unchanged vs base for ${EV})."
