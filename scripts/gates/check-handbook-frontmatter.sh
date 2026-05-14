#!/usr/bin/env bash
# Handbook Version / frontmatter hygiene (delegates to Python).
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"
pick_py() {
  if [[ -n "${PYTHON:-}" ]] && command -v "${PYTHON}" >/dev/null 2>&1 && "${PYTHON}" -c "import sys" >/dev/null 2>&1; then
    echo "${PYTHON}"
    return 0
  fi
  for c in python python3; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys" >/dev/null 2>&1; then
      echo "$c"
      return 0
    fi
  done
  return 1
}
py="$(pick_py)" || {
  echo "check-handbook-frontmatter: need python or python3 on PATH (or set PYTHON)" >&2
  exit 2
}
"$py" scripts/gates/check-handbook-frontmatter.py
