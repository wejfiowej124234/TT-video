#!/usr/bin/env bash
# Vertical slice 04: TT-9627 §2 — /community/explore public read APIs (① smoke).
# Aligns with frontend app/community/explore/page.tsx: getFeed (routes.community.feed) and
# topic/stats entry (routes.community.statsPostsByTag — same path as EXPLORE_TOPIC_LINKS tags).
#
# Usage (API must be listening):
#   bash scripts/gates/vertical-slice-04-community-explore-public-smoke.sh
#   BASE=http://127.0.0.1:8080 bash scripts/gates/vertical-slice-04-community-explore-public-smoke.sh

set -euo pipefail
BASE="${BASE:-${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8080}}"
BASE="${BASE%/}"

echo "vertical-slice-04-community-explore: BASE=$BASE"

if ! command -v curl >/dev/null 2>&1; then
  echo "error: curl required" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq required" >&2
  exit 1
fi

curl -sfS "$BASE/health" >/dev/null
echo "ok: GET /health"

FEED_JSON=$(curl -sfS "$BASE/api/v1/community/feed?limit=8&mode=recommend")
echo "$FEED_JSON" | jq -e '.status == "ok"' >/dev/null
echo "$FEED_JSON" | jq -e '.posts | type == "array"' >/dev/null
NP=$(echo "$FEED_JSON" | jq '.posts | length')
echo "GET /api/v1/community/feed?limit=8&mode=recommend posts.length=$NP"

# Same path tag as frontend EXPLORE_TOPIC_LINKS (UTF-8); --data-urlencode keeps curl safe.
STATS_JSON=$(curl -sfS -G "$BASE/api/v1/community/stats/posts-by-tag" --data-urlencode "tag=旅行")
echo "$STATS_JSON" | jq -e '.status == "ok"' >/dev/null
echo "$STATS_JSON" | jq -e '.post_count | type == "number"' >/dev/null
CNT=$(echo "$STATS_JSON" | jq '.post_count')
echo "GET /api/v1/community/stats/posts-by-tag?tag=… post_count=$CNT"

echo "pass: vertical-slice-04 community explore public smoke (health + feed + posts-by-tag)"
exit 0
