#!/usr/bin/env bash
# 调用 verify-abi-forge.py（优先 python3，其次 python）。项目根执行。
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"
# Windows 商店占位 `python3.exe` 常在 PATH 首位但 `-c pass` 失败（exit 49）；须探测可执行再选用。
if command -v python3 >/dev/null 2>&1 && python3 -c "pass" 2>/dev/null; then
  exec python3 scripts/dev/verify-abi-forge.py
fi
if command -v python >/dev/null 2>&1 && python -c "pass" 2>/dev/null; then
  exec python scripts/dev/verify-abi-forge.py
fi
echo "run-verify-abi-forge: need working python3 or python on PATH" >&2
exit 1
