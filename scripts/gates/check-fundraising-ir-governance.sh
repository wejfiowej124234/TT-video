#!/usr/bin/env bash
# Wrapper for check-fundraising-ir-governance.py (do not invoke the .py via bash).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1 && python -c "import sys" >/dev/null 2>&1; then
  PY=python
else
  echo "FAIL: need working python3 or python" >&2
  exit 2
fi
exec "$PY" scripts/gates/check-fundraising-ir-governance.py "$@"
