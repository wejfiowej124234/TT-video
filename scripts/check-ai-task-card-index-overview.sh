#!/usr/bin/env bash
# Validate docs/AI任务卡索引.md overview (A,E,B,C,D). See check-ai-task-card-index-overview.py.
# Windows Git Bash: PATH may put the Microsoft Store `python3` stub first (often exit 49
# without running the script). Fall back to `py -3` / `python` — same class of issue as
# scripts/gates/check-invariants.sh (~L35).
set -euo pipefail
_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_py="$_here/check-ai-task-card-index-overview.py"

# shellcheck source=scripts/gates/_resolve_python_bin.sh
source "$_here/gates/_resolve_python_bin.sh"

if "$PYTHON_BIN" "$_py" "$@"; then
  exit 0
fi
if command -v py >/dev/null 2>&1 && py -3 "$_py" "$@"; then
  exit 0
fi
exit 1
