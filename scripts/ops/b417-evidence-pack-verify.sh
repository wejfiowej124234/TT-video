#!/usr/bin/env bash
# B-417 · **证据包** **核验** **：** **`b417-governance-execution-report.json`** **须** **存在** **且** **`execution_verdict=="GO"`** **（** **`dry_run==false`** **）** **；** **侧车** **`queue`** **/** **`execute`** **JSON** **须** **存在** **。**
#
# 用法（仓库根）：**`bash scripts/ops/b417-evidence-pack-verify.sh "$B417_RECORD_DIR"`**
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "b417-evidence-pack-verify.sh: jq is required" >&2
  exit 1
fi

DIR="${1:?usage: bash scripts/ops/b417-evidence-pack-verify.sh <record_dir>}"

for f in b417-governance-execution-report.json b417-chain-step-queue.json b417-chain-step-execute.json; do
  if [[ ! -f "${DIR}/${f}" ]]; then
    echo "b417-evidence-pack-verify.sh: missing ${DIR}/${f}" >&2
    exit 2
  fi
done

if ! jq -e '(.execution_verdict == "GO") and (.dry_run == false)' "${DIR}/b417-governance-execution-report.json" >/dev/null; then
  echo "b417-evidence-pack-verify.sh: report must have execution_verdict=GO and dry_run=false" >&2
  jq '{execution_verdict, dry_run}' "${DIR}/b417-governance-execution-report.json" >&2 || true
  exit 3
fi

echo "b417-evidence-pack-verify.sh: ok (${DIR})" >&2
