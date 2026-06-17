#!/usr/bin/env bash
# Assert MTM · Final Closure · Repo Align tier/stats machine keys are in sync.
#
#   bash scripts/dev/assert-ttg-stats-triple-sync.sh
#   bash scripts/dev/assert-ttg-stats-triple-sync.sh --write-freeze evidence/GO_ttg_stats_triple_sync_freeze/<stamp>
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WRITE_FREEZE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --write-freeze) WRITE_FREEZE="$2"; shift 2 ;;
    --stamp) STAMP="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

ARGS=(python "$ROOT/scripts/dev/assert-ttg-stats-triple-sync.py" --stamp "$STAMP")
[[ -n "$WRITE_FREEZE" ]] && ARGS+=(--write-freeze "$WRITE_FREEZE")
"${ARGS[@]}"
