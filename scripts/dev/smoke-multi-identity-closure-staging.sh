#!/usr/bin/env bash
# ② 测试网 · multi-demo 多重身份 API 烟测（TN-P1-007 子集）
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   bash scripts/dev/smoke-multi-identity-closure-staging.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export API_BASE="${API_BASE%/}"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy

echo "== smoke-multi-identity-closure-staging API=${API_BASE} =="
curl --noproxy "*" -sS -X POST "${API_BASE}/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' >/dev/null || true
bash "$ROOT/scripts/dev/smoke-multi-identity-closure-local.sh"
echo "TT_SMOKE_MULTI_IDENTITY_CLOSURE_STAGING: OK"
