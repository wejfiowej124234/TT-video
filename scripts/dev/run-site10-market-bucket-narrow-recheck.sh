#!/usr/bin/env bash
# ① Site10 · market-escrow 桶窄切片复跑（10 spec · 扩展 phase · 非全矩阵）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/_site10-bucket-narrow-recheck-common.sh
source "$ROOT/scripts/dev/_site10-bucket-narrow-recheck-common.sh"
site10_bucket_narrow_recheck_export_env "$ROOT"

OUT="$ROOT/frontend/evidence/GO_local_phase1/site10-market-bucket-narrow-recheck.latest.log"

SPECS=(
  e2e/market-custom-itinerary-catalog-ui.spec.ts
  e2e/market-custom-itinerary-poi-media-catalog-ui.spec.ts
  e2e/market-custom-itinerary-dual-role-ui.spec.ts
  e2e/market-deep-link.spec.ts
  e2e/b468-market-discovery-full-ui-journey.spec.ts
  e2e/market-pes-funnel-cta.spec.ts
  e2e/market-d8.spec.ts
  e2e/f018-f019-f020-request.spec.ts
  e2e/trust-gate-escrow.spec.ts
  e2e/sprint168-country-market-admin.spec.ts
)

site10_run_bucket_narrow_recheck "$ROOT" "market" "$OUT" "TT_SITE10_MARKET_BUCKET_NARROW_RECHECK: OK" "${SPECS[@]}"
