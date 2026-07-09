#!/usr/bin/env bash
# Provision Cloudflare R2 bucket + CORS + (optional) custom domain, then Fly secrets.
#
# Requires:
#   CLOUDFLARE_API_TOKEN · CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID)
#   scripts/dev/.env.staging-media-r2.local (see staging-media-r2-cdn.env.example)
#
#   bash scripts/dev/provision-staging-media-r2-cdn.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${STAGING_MEDIA_R2_ENV:-$ROOT/scripts/dev/.env.staging-media-r2.local}"
ACCOUNT_ID="${CF_ACCOUNT_ID:-${CLOUDFLARE_ACCOUNT_ID:-}}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
BUCKET="${COMMUNITY_MEDIA_S3_BUCKET:-traveltrust-community-media}"
CDN_ORIGIN="${STAGING_WEB_ORIGIN:-https://tt-web-staging.fly.dev}"

fail() { echo "FAIL: $*" >&2; exit 1; }
ok() { echo "OK: $*"; }

[[ -f "$ENV_FILE" ]] && { set -a; # shellcheck disable=SC1090
  source "$ENV_FILE"; set +a; }
BUCKET="${COMMUNITY_MEDIA_S3_BUCKET:-$BUCKET}"
ACCOUNT_ID="${CF_ACCOUNT_ID:-${CLOUDFLARE_ACCOUNT_ID:-$ACCOUNT_ID}}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-$API_TOKEN}"

[[ -n "$API_TOKEN" ]] || fail "set CLOUDFLARE_API_TOKEN"
[[ -n "$ACCOUNT_ID" ]] || fail "set CF_ACCOUNT_ID"

export CLOUDFLARE_API_TOKEN="$API_TOKEN"

ok "wrangler R2 bucket ensure: $BUCKET"
npx --yes wrangler r2 bucket create "$BUCKET" 2>/dev/null || true

CORS_JSON="$(mktemp)"
cat >"$CORS_JSON" <<EOF
[
  {
    "AllowedOrigins": ["${CDN_ORIGIN}", "http://127.0.0.1:3012", "http://localhost:3012"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
EOF

ok "apply R2 CORS"
npx --yes wrangler r2 bucket cors set "$BUCKET" --file "$CORS_JSON" --force

rm -f "$CORS_JSON"

if [[ -z "${COMMUNITY_MEDIA_S3_ENDPOINT:-}" ]]; then
  export COMMUNITY_MEDIA_S3_ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
fi

ok "sync Fly secrets via configure-staging-media-r2-cdn.sh"
bash "$ROOT/scripts/dev/configure-staging-media-r2-cdn.sh"

echo "provision-staging-media-r2-cdn: OK"
