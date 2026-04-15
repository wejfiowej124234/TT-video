#!/usr/bin/env bash
# Validate docs/AI任务卡索引.md overview (A,E,B,C,D). See check-ai-task-card-index-overview.py.
set -euo pipefail
_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_root="$(cd "$_here/.." && pwd)"
exec python3 "$_here/check-ai-task-card-index-overview.py" "$@"
