#!/usr/bin/env bash
# PER-AUDIT3 · staging Fly: guide staking + CORS 3012-only + SSOT parity (② Owner).
# Usage:
#   bash scripts/dev/apply-per-audit3-staging-fly.sh           # dry-run
#   TRAVELTRUST_PER_AUDIT3_FLY_OK=1 bash scripts/dev/apply-per-audit3-staging-fly.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="${FLY_STAGING_API_APP:-tt-api-staging}"
EXAMPLE="$ROOT/deploy/fly/tt-web-staging/build.env.example"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

guide="$(grep -E '^NEXT_PUBLIC_GUIDE_STAKING_ADDRESS=' "$EXAMPLE" | head -1 | cut -d= -f2- | tr -d '\r' || true)"
govtok="$(grep -E '^NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=' "$EXAMPLE" | head -1 | cut -d= -f2- | tr -d '\r' || true)"
cors="${WEB},http://localhost:3012,http://127.0.0.1:3012"

[[ "$guide" == 0x* ]] || { echo "FAIL missing guide in $EXAMPLE"; exit 1; }

echo "PER-AUDIT3: STAKING_ADDRESS=$guide GUIDE_STAKING_ADDRESS=$guide CORS=$cors"

if [[ "${TRAVELTRUST_PER_AUDIT3_FLY_OK:-0}" != "1" ]]; then
  echo "dry-run — set TRAVELTRUST_PER_AUDIT3_FLY_OK=1 to apply"
  exit 0
fi

command -v fly >/dev/null || { echo "FAIL fly CLI"; exit 1; }
fly auth whoami >/dev/null || { echo "FAIL fly auth"; exit 1; }

set_args=(
  "STAKING_ADDRESS=${guide}"
  "GUIDE_STAKING_ADDRESS=${guide}"
  "CORS_ORIGINS=${cors}"
)
[[ -n "$govtok" && "$govtok" == 0x* ]] && set_args+=("GOVERNANCE_TOKEN_ADDRESS=${govtok}" "GOVERNANCE_VOTES_TOKEN_ADDRESS=${govtok}")

fly secrets set "${set_args[@]}" -a "$APP"
echo "PER-AUDIT3: fly secrets set OK; deploying API..."
fly deploy -c "$ROOT/deploy/fly/tt-api-staging/fly.toml" \
  --build-arg "TRAVELTRUST_BUILD_GIT_SHA=$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo local)" \
  -a "$APP"

sleep 15
bash "$ROOT/scripts/dev/verify-staging-ssot-parity.sh"
echo "TT_PER_AUDIT3_STAGING: PASS"
