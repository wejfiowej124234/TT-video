#!/usr/bin/env bash
set -euo pipefail
_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

_eng_py_ok_exit() {
  local ec=$1
  [ "$ec" -eq 0 ] || [ "$ec" -eq 1 ]
}

_try_eng_local_links_py() {
  local exe=$1
  if ! command -v "$exe" >/dev/null 2>&1; then
    return 1
  fi
  if ! "$exe" -c "import pathlib" >/dev/null 2>&1; then
    return 1
  fi
  "$exe" "$_here/check-handbook-engineering-local-md-links.py" >/dev/null 2>&1
  local ec=$?
  _eng_py_ok_exit "$ec"
}

_pick_python() {
  if _try_eng_local_links_py python; then
    printf '%s\n' "python"
    return 0
  fi
  if _try_eng_local_links_py python3; then
    printf '%s\n' "python3"
    return 0
  fi
  if command -v py >/dev/null 2>&1 && py -3 -c "import pathlib" >/dev/null 2>&1; then
    py -3 "$_here/check-handbook-engineering-local-md-links.py" >/dev/null 2>&1
    local ec=$?
    if _eng_py_ok_exit "$ec"; then
      printf '%s\n' "py -3"
      return 0
    fi
  fi
  return 1
}

PY=$(_pick_python) || {
  echo "RULE=HBOOK-ENG-PYTHON path=${_here}/check-handbook-engineering-local-md-links.sh msg=no working python" >&2
  exit 1
}

if [ "$PY" = "py -3" ]; then
  exec py -3 "$_here/check-handbook-engineering-local-md-links.py" "$@"
fi
exec "$PY" "$_here/check-handbook-engineering-local-md-links.py" "$@"
