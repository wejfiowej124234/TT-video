#!/usr/bin/env bash
# Check-G：校验 evidence 包内 dual_score_signoff.v1.json（Runbook §2.7.4）。
# 用法：bash scripts/check-dual-score-gate.sh PATH/to/dual_score_signoff.v1.json
#       bash scripts/check-dual-score-gate.sh self-test
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PY=
for cand in python3 python; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" -c "import json" >/dev/null 2>&1; then
    PY=$cand
    break
  fi
done
if [ -z "${PY}" ]; then
  echo "check-dual-score-gate: need python3 or python on PATH" >&2
  exit 127
fi
exec "$PY" "${ROOT}/scripts/dev/validate_dual_score_signoff.py" "$@"
