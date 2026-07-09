#!/usr/bin/env bash
# Phase ② Staging · configure Fly tt-api-staging for Cloudflare R2 + CDN (NOT localtunnel).
#
#   cp scripts/dev/staging-media-r2-cdn.env.example scripts/dev/.env.staging-media-r2.local
#   bash scripts/dev/configure-staging-media-r2-cdn.sh
#
# SSOT: docs/runbook/TT-MEDIA-THREE-TIER-ARCHITECTURE.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${STAGING_MEDIA_R2_ENV:-$ROOT/scripts/dev/.env.staging-media-r2.local}"
FLY_APP="${FLY_API_APP:-tt-api-staging}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${STAGING_MEDIA_EVID:-$ROOT/evidence/GO_media_r2_cdn_migration/${STAMP}}"
mkdir -p "$EVID"

fail() { echo "FAIL: $*" >&2; exit 1; }
ok() { echo "OK: $*"; }

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE — cp scripts/dev/staging-media-r2-cdn.env.example"

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
  fail "PUBLIC_BASE_URL must be CDN (e.g. https://cdn.traveltrust.app), not localtunnel/loopback"
fi

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"

PREFIXES="${TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES:-${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}}"
REGION="${COMMUNITY_MEDIA_S3_REGION:-auto}"
FORCE="${COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE:-0}"

ok "staging media R2+CDN · app=$FLY_APP · public=${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}"

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
  "schema": "traveltrust.media_r2_cdn_staging_config.v1",
  "stamp": "${STAMP}",
  "fly_app": "${FLY_APP}",
  "COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL": "${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}",
  "COMMUNITY_MEDIA_S3_BUCKET": "${COMMUNITY_MEDIA_S3_BUCKET}",
  "localtunnel": "DEPRECATED",
  "architecture": "registry/media-three-tier-architecture.v1.yaml"
}
EOF

API_BASE="https://${FLY_APP}.fly.dev"
sleep 8
CAP="$(curl -sf "${API_BASE}/api/v1/community/media/capabilities" || echo '{}')"
echo "$CAP" | tee "$EVID/capabilities.json"
echo "$CAP" | grep -q '"public_video_publish_ready":true' \
  && ok "capabilities public_video_publish_ready=true" \
  || echo "WARN: public_video_publish_ready not true yet — check R2 HeadBucket / secrets rollout"

echo "evidence=$EVID"
echo "configure-staging-media-r2-cdn: OK"
