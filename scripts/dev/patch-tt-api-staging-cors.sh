#!/usr/bin/env bash
# P0 · 确保 tt-api-staging CORS 含 tt-web-staging（/auth 等仍直连 API）
set -euo pipefail

APP="${FLY_STAGING_API_APP:-tt-api-staging}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
ORIGINS="${WEB},http://localhost:3012,http://127.0.0.1:3012"

echo "patch-tt-api-staging-cors: fly secrets set CORS_ORIGINS on $APP …"
fly secrets set "CORS_ORIGINS=${ORIGINS}" -a "$APP"
echo "patch-tt-api-staging-cors: OK (machines will restart)"
