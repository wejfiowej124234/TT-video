#!/usr/bin/env bash
# IMP-EV-001：校验 evidence/GO_* 目录内 manifest.json（及可选 manifest.sha256）。
# 用法：bash scripts/validate-evidence-manifest.sh validate [DIR]
#       bash scripts/validate-evidence-manifest.sh self-test
# 实现：scripts/dev/validate_evidence_manifest.py（Python 3 标准库）。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PY=
for cand in python python3; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" -c "import json" >/dev/null 2>&1; then
    PY=$cand
    break
  fi
done
if [ -z "${PY}" ]; then
  echo "validate-evidence-manifest: need a working python3 or python (stdlib json) on PATH" >&2
  exit 127
fi
exec "$PY" "${ROOT}/scripts/dev/validate_evidence_manifest.py" "$@"
