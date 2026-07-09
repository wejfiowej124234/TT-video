#!/usr/bin/env bash
# ② · post-soak 验收链：staging API/Web 全量 /meta 须 200（Graduation 前硬闸）
#
#   bash scripts/ops/p2fc-verify-staging-meta-availability.sh
#   bash scripts/ops/p2fc-verify-staging-meta-availability.sh --strict
#
# 末行：TT_STAGING_META_AVAILABILITY: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
STRICT=0
META_TIMEOUT="${P2FC_META_ACCEPTANCE_TIMEOUT_SEC:-180}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict) STRICT=1; shift ;;
    --api-base) API="${2%/}"; shift 2 ;;
    --web-base) WEB="${2%/}"; shift 2 ;;
    -h|--help)
      sed -n '2,10p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

export PHASE2_REQUIRE_META_GREEN=1
export PHASE2_META_OBSERVABILITY_ONLY=0

# shellcheck source=scripts/ops/lib/p2fc-meta-observability-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-meta-observability-lib.sh"

code_a="$(p2fc_http_code "${API}/meta" "$META_TIMEOUT")"
code_w="$(p2fc_http_code "${WEB}/meta" "$META_TIMEOUT")"
code_mb="$(p2fc_http_code "${API}/meta/build" 45)"

fail=0
[[ "$code_a" == "200" ]] || fail=1
[[ "$code_w" == "200" ]] || fail=1

if [[ "$fail" -ne 0 ]]; then
  echo "TT_STAGING_META_AVAILABILITY: FAIL api/meta=${code_a} web/meta=${code_w} meta_build=${code_mb}" >&2
  p2fc_record_meta_observability "$API" "$WEB" "$ROOT/evidence/P2FC_SOAK_72H_STAGING/meta-observability" || true
  [[ "$STRICT" -eq 1 ]] && exit 2
  exit 2
fi

echo "TT_STAGING_META_AVAILABILITY: PASS api/meta=${code_a} web/meta=${code_w} meta_build=${code_mb}"
exit 0
