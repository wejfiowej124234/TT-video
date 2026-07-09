#!/usr/bin/env bash
# Phase ③ Production · configure Fly tt-api-prod for Cloudflare R2 + CDN (prep script — Owner executes at cutover).
#
#   cp scripts/dev/production-media-r2-cdn.env.example scripts/dev/.env.production-media-r2.local
#   bash scripts/dev/configure-production-media-r2-cdn.sh
#
# SSOT: registry/g3-production-cdn-official-assets.v1.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PRODUCTION_MEDIA_R2_ENV:-$ROOT/scripts/dev/.env.production-media-r2.local}"
FLY_APP="${FLY_API_APP:-tt-api-prod}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${PRODUCTION_MEDIA_EVID:-$ROOT/evidence/GO_production_readiness/G3-01/preparation/configure-production-r2-cdn-${STAMP}}"
mkdir -p "$EVID"

fail() { echo "FAIL: $*" >&2; exit 1; }
ok() { echo "OK: $*"; }

if [[ "${PRODUCTION_CDN_DRY_RUN:-1}" == "1" ]]; then
  ok "DRY_RUN — set PRODUCTION_CDN_DRY_RUN=0 to apply Fly secrets"
  cat >"$EVID/configure-production-r2-cdn-dry-run.json" <<EOF
{
  "schema": "traveltrust.g3_production_r2_cdn_configure.v1",
  "mode": "dry_run",
  "fly_app": "${FLY_APP}",
  "env_file_expected": "${ENV_FILE}",
  "note": "Owner cutover step — not executed in prep-only mode"
}
EOF
  echo "evidence=$EVID"
  exit 0
fi

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE — cp scripts/dev/production-media-r2-cdn.env.example"

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

for k in COMMUNITY_MEDIA_S3_BUCKET COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL COMMUNITY_MEDIA_S3_ENDPOINT \
  AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; do
  [[ -n "${!k:-}" ]] || fail "unset $k in $ENV_FILE"
done

if [[ "${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}" == *"loca.lt"* ]] \
  || [[ "${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}" == *"127.0.0.1"* ]]; then
  fail "PUBLIC_BASE_URL must be production CDN (https://cdn.traveltrust.app)"
fi

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"

PREFIXES="${TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES:-${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}}"
REGION="${COMMUNITY_MEDIA_S3_REGION:-auto}"
FORCE="${COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE:-0}"

ok "production media R2+CDN · app=$FLY_APP · public=${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}"

fly secrets set -a "$FLY_APP" \
  "COMMUNITY_MEDIA_S3_BUCKET=${COMMUNITY_MEDIA_S3_BUCKET}" \
  "COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}" \
  "COMMUNITY_MEDIA_S3_ENDPOINT=${COMMUNITY_MEDIA_S3_ENDPOINT}" \
  "COMMUNITY_MEDIA_S3_REGION=${REGION}" \
  "COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE=${FORCE}" \
  "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}" \
  "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}" \
  "TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=${PREFIXES}" \
  --stage

fly secrets deploy -a "$FLY_APP"

cat >"$EVID/r2-cdn-config.json" <<EOF
{
  "schema": "traveltrust.g3_production_r2_cdn_config.v1",
  "stamp": "${STAMP}",
  "environment": "production",
  "fly_app": "${FLY_APP}",
  "COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL": "${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}",
  "COMMUNITY_MEDIA_S3_BUCKET": "${COMMUNITY_MEDIA_S3_BUCKET}",
  "registry": "registry/g3-production-cdn-official-assets.v1.json"
}
EOF

echo "evidence=$EVID"
echo "configure-production-media-r2-cdn: OK"
