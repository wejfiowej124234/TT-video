#!/usr/bin/env bash
# Source from gate scripts: export PYTHON_BIN (honours pre-set PYTHON_BIN).
# Windows Git Bash may expose a python3 shim that exits non-zero for real work; fall back to python.

if [[ -n "${PYTHON_BIN:-}" ]]; then
  export PYTHON_BIN
elif command -v python3 >/dev/null 2>&1 && python3 -c "pass" >/dev/null 2>&1; then
  export PYTHON_BIN="python3"
else
  export PYTHON_BIN="python"
fi
