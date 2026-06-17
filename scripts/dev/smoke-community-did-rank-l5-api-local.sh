#!/usr/bin/env bash
# ① 本地：社区 L5 扩展 API + 排行榜 SSR 烟测（非 ②③ GO）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
API="${API_BASE:-http://127.0.0.1:8080}"

echo "== smoke-community-did-rank-l5-api-local =="
echo "API_BASE=$API"

curl -fsS "$API/api/v1/community/explore/destinations" | head -c 400
echo ""
curl -fsS "$API/api/v1/community/feed?limit=3&q=travel" | head -c 400
echo ""

echo "OK: smoke-community-did-rank-l5-api-local"
