#!/usr/bin/env bash
# 串联 check-04-routes-vs-code.py、check-04-frontend-routes-vs-app.py、check-13-1-table1-routes-vs-app.py、
# check-13-1-routes-covered-by-04-frontend-table.py
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"
pick_py() {
  for c in python3 python; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys" >/dev/null 2>&1; then
      echo "$c"
      return 0
    fi
  done
  return 1
}
py="$(pick_py)" || {
  echo "run-check-04-routes: need working python3 or python on PATH" >&2
  exit 2
}
# 与 Build CI 一致：默认 STRICT_WARNINGS=1（未在 04 §3.4 登记的公开 /api/v1 路由将导致失败）
export STRICT_WARNINGS="${STRICT_WARNINGS:-1}"
"$py" scripts/gates/check-04-routes-vs-code.py
"$py" scripts/gates/check-04-frontend-routes-vs-app.py
"$py" scripts/gates/check-13-1-table1-routes-vs-app.py
"$py" scripts/gates/check-13-1-routes-covered-by-04-frontend-table.py
