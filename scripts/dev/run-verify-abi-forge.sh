#!/usr/bin/env bash
# 调用 verify-abi-forge.py（优先 python3，其次 python）。项目根执行。
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"
if command -v python3 >/dev/null 2>&1; then
  exec python3 scripts/dev/verify-abi-forge.py
fi
if command -v python >/dev/null 2>&1; then
  exec python scripts/dev/verify-abi-forge.py
fi
echo "run-verify-abi-forge: need python3 or python on PATH" >&2
exit 1
