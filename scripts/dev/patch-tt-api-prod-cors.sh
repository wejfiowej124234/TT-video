#!/usr/bin/env bash
# 锁定 tt-api-prod CORS_ORIGINS（PI3-002）
#
#   PROD_WEB_BASE=https://app.example.com bash scripts/dev/patch-tt-api-prod-cors.sh
set -euo pipefail

APP="${FLY_PROD_API_APP:-tt-api-prod}"
WEB="${PROD_WEB_BASE:?set PROD_WEB_BASE}"
ORIGINS="${CORS_ORIGINS:-${WEB}}"

command -v fly >/dev/null 2>&1 || { echo "fly CLI missing" >&2; exit 2; }
fly auth whoami >/dev/null 2>&1 || { echo "fly not authenticated" >&2; exit 2; }

echo "patch-tt-api-prod-cors: fly secrets set CORS_ORIGINS on $APP …"
fly secrets set "CORS_ORIGINS=${ORIGINS}" -a "$APP"
echo "patch-tt-api-prod-cors: OK"
