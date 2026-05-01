#!/usr/bin/env bash
# TT-9627 §1 · API 竖切编排：先跑主脊公开半脊（02），再视 chain_off 跑 guides 竖切（01）。
# 须 API 已监听；与 `ci-local-delivery-minimum.sh` 尾段可选串联（`TT9627_SEGMENT1_API_SMOKE=1`）。
#
# Usage:
#   bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh
#   BASE=http://127.0.0.1:3012 bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh

set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export BASE="${BASE:-${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8080}}"

STATE="$(mktemp)"
trap 'rm -f "$STATE"' EXIT
export VS02_CHAIN_OFF_STATE_FILE="$STATE"

bash "$_HERE/vertical-slice-02-main-spine.sh"

MOUNTED="$(head -n1 "$STATE" || true)"
if [[ "$MOUNTED" == "true" ]]; then
  bash "$_HERE/vertical-slice-01-guides-catalog.sh"
else
  echo "skip: vertical-slice-01-guides-catalog (chain_off not mounted on order_messages)"
fi

echo "pass: vertical-slice-tt9627-segment1-api-smoke (02 + conditional 01)"
exit 0
