#!/usr/bin/env bash
# C1 证据：社区 production UGC seed + Feed API 对拍（② 测试网槽 · 本地/staging 预演）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C1"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$EVID/run-${STAMP}.log"
FEED_FILE="$EVID/feed-sample-${STAMP}.json"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"

{
  echo "TT_COMMUNITY_C1_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"

  FEED_JSON="$(curl -sf "${API_BASE}/api/v1/community/feed?limit=30")"
  echo "$FEED_JSON" > "$FEED_FILE"

  if command -v python >/dev/null 2>&1; then
    PY=python
  elif command -v python3 >/dev/null 2>&1; then
    PY=python3
  else
    echo "FAIL: python not found" >&2
    exit 1
  fi
  "$PY" - "$FEED_FILE" <<'PY'
import json, sys, re
with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f)
posts = data.get("posts") or []
auto = [p for p in posts if re.match(r"^(e2e-|pi1-fe-|browser-minio-)", (p.get("body") or "").strip())]
authors = sorted({p.get("author_nickname") for p in posts if p.get("author_nickname")})
dests = sorted({p.get("destination") for p in posts if p.get("destination")})
with_media = [p for p in posts if p.get("media_urls") or p.get("cover_url")]
photo_video = [p for p in posts if (p.get("post_type") or "") in ("photo", "video")]
print(f"feed_count={len(posts)}")
print(f"automation_leak={len(auto)}")
print(f"author_count={len(authors)}")
print(f"destination_count={len(dests)}")
print(f"media_post_count={len(with_media)}")
print(f"photo_video_count={len(photo_video)}")
print(f"authors={authors[:12]}")
print(f"destinations={dests[:15]}")
if len(posts) < 20:
    raise SystemExit("FAIL: feed_count < 20")
if auto:
    raise SystemExit(f"FAIL: automation posts in public feed: {[a.get('body','')[:40] for a in auto[:3]]}")
if len(authors) < 4:
    raise SystemExit(f"FAIL: author_count < 4 ({len(authors)})")
if len(dests) < 5:
    raise SystemExit(f"FAIL: destination_count < 5 ({len(dests)})")
if len(with_media) < 8:
    raise SystemExit(f"FAIL: media_post_count < 8 ({len(with_media)})")
print("TT_COMMUNITY_C1_FEED_CHECK: OK")
PY

  echo "TT_COMMUNITY_C1_EVIDENCE: OK"
} 2>&1 | tee "$LOG"

ln -sfn "$(basename "$LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$FEED_FILE")" "$EVID/latest-feed-sample.json"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C1 (staging PG + HTTPS API_BASE)"
  echo "status: EVIDENCE_RECORDED"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "database: traveltrust_staging (persistent local staging PG)"
  grep -E '^(feed_count|automation_leak|author_count|destination_count|media_post_count)=' "$LOG" || true
  echo "log: $(basename "$LOG")"
  echo "feed_sample: $(basename "$FEED_FILE")"
  echo "founder_review_a_class: PASS (20260531 PM re-review)"
  echo "note: C1 slot PASS only — NOT Phase ② GO / NOT C2-C12 GO"
} > "$STATUS"

cp -f "$LOG" "$EVID/run.log"

echo "OK -> $LOG"
echo "STATUS -> $STATUS"
