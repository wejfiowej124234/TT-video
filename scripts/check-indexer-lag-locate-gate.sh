#!/usr/bin/env bash
# B-425 · **lag_core** **三源** **最小** **一致性** **（** **须** **200** **+** **jq** **）** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

if ! command -v jq >/dev/null 2>&1; then
  echo "check-indexer-lag-locate-gate: jq is required" >&2
  exit 1
fi
if [[ -z "${ADMIN_BEARER_TOKEN:-}" || -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "check-indexer-lag-locate-gate: ADMIN_BEARER_TOKEN and INTERNAL_API_SECRET are required" >&2
  exit 1
fi

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then JSON=true
  else echo "check-indexer-lag-locate-gate: unknown option: $a" >&2; exit 1
  fi
done

tmpm="$(mktemp)"
tmpi="$(mktemp)"
tmph="$(mktemp)"
trap 'rm -f "$tmpm" "$tmpi" "$tmph"' EXIT

code_m="$(curl -sS -o "$tmpm" -w "%{http_code}" "${BASE}/meta")"
code_i="$(curl -sS -o "$tmpi" -w "%{http_code}" \
  -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
  "${BASE}/api/v1/internal/indexer-status")"
code_h="$(curl -sS -o "$tmph" -w "%{http_code}" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
  "${BASE}/api/v1/admin/indexer/health")"

if [[ "$code_m" != "200" || "$code_i" != "200" || "$code_h" != "200" ]]; then
  echo "check-indexer-lag-locate-gate: HTTP meta=${code_m} internal=${code_i} admin_health=${code_h}" >&2
  exit 2
fi

# 最小：chain_id 三源一致（若字段缺失则跳过比对）
mid="$(jq -r '.chain.chain_id // empty' "$tmpm" 2>/dev/null || true)"
iid="$(jq -r '.state.chain_id // .chain_id // empty' "$tmpi" 2>/dev/null || true)"
hid="$(jq -r '.chain_id // empty' "$tmph" 2>/dev/null || true)"
if [[ -n "$mid" && -n "$iid" && -n "$hid" ]]; then
  if [[ "$mid" != "$iid" || "$mid" != "$hid" ]]; then
    echo "check-indexer-lag-locate-gate: chain_id mismatch meta=${mid} internal=${iid} health=${hid}" >&2
    exit 3
  fi
fi

if $JSON; then
  jq -n \
    --arg schema "traveltrust.indexer_lag_locate_gate.v1" \
    --arg verdict "GO" \
    --argjson lag_snapshot "{}" \
    '{schema_version:$schema, verdict:$verdict, lag_snapshot:$lag_snapshot}'
else
  echo "check-indexer-lag-locate-gate: ok" >&2
fi
