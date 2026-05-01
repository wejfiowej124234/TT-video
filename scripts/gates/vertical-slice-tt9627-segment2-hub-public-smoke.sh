#!/usr/bin/env bash
# TT-9627 §2 · 编排：公开读面「/market 列表 + /community/explore 首屏」① 机读一键。
# 串行：vertical-slice-03（内含 02）→ vertical-slice-04（health + feed + stats）。
#
# Usage (API must be listening):
#   bash scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh
# Optional: chained from ci-local when TT9627_SEGMENT2_API_SMOKE=1 (see ci-local-delivery-minimum.sh).

set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export BASE="${BASE:-${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8080}}"

bash "$_HERE/vertical-slice-03-market-hub-public-smoke.sh"
bash "$_HERE/vertical-slice-04-community-explore-public-smoke.sh"

echo "pass: vertical-slice-tt9627-segment2-hub-public-smoke (03 + 04)"
exit 0
