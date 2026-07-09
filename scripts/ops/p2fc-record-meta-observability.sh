#!/usr/bin/env bash
# ② · /meta 408/503 观测记录（fallback · 不 redeploy · 不阻断 Soak/TN-P1-010）
#
#   bash scripts/ops/p2fc-record-meta-observability.sh
#   bash scripts/ops/p2fc-record-meta-observability.sh --watch
#
# 末行：TT_META_OBSERVABILITY: EXEC_CHAIN_OK|EXEC_CHAIN_WARN
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
WATCH=0
POLL_SEC="${P2FC_META_OBS_POLL_SEC:-300}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    -h|--help)
      sed -n '2,10p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

# shellcheck source=scripts/ops/lib/p2fc-meta-observability-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-meta-observability-lib.sh"

run_once() {
  p2fc_record_meta_observability "$API" "$WEB" "${P2FC_META_OBS_OUT:-$ROOT/evidence/P2FC_SOAK_72H_STAGING/meta-observability}" || true
}

if [[ "$WATCH" -eq 1 ]]; then
  while true; do
    run_once
    sleep "$POLL_SEC"
  done
fi

run_once
