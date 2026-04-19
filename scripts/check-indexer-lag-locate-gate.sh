#!/usr/bin/env bash
# B-425 · **`lag_core`** **三源** **一致** **（** **最小** **七键** **子集** **）** **：** **`GET /meta`** **、** **`GET …/internal/indexer-status`** **、** **`GET …/admin/indexer/health`** **。**
#
# 环境：**`ADMIN_BEARER_TOKEN`** **、** **`INTERNAL_API_SECRET`** **、** **`jq`** **、** **`curl`** **；** **`API_BASE_URL`** **默认** **`http://127.0.0.1:8080`** **。**
#
# 用法（仓库根）：**`bash scripts/check-indexer-lag-locate-gate.sh`** **[** **`--json`** **]**
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
  if [[ "$a" == "--json" ]]; then JSON=true; else echo "check-indexer-lag-locate-gate: unknown option: $a" >&2; exit 1; fi
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
  echo "check-indexer-lag-locate-gate: HTTP meta=${code_m} internal=${code_i} health=${code_h}" >&2
  exit 2
fi

meta_lag="$(jq -c '{
  finality_n:.finality_n,
  bn:.indexer.checkpoint.block_number,
  li:.indexer.checkpoint.log_index,
  lb:.indexer.lag_blocks,
  lm:.indexer.lag_max_blocks,
  lsf:.indexer.last_seen_finality_n,
  rr:.indexer.replay_required,
  rd:.indexer.reorg_detected
}' "$tmpm")"

int_lag="$(jq -c '{
  finality_n:.state.finality_n,
  bn:.state.checkpoint.block_number,
  li:.state.checkpoint.log_index,
  lb:.state.lag_blocks,
  lm:.state.lag_max_blocks,
  lsf:.state.last_seen_finality_n,
  rr:.state.replay_required,
  rd:.state.reorg_detected
}' "$tmpi")"

hea_lag="$(jq -c '{
  finality_n:.health.finality_n,
  bn:.health.checkpoint.block_number,
  li:.health.checkpoint.log_index,
  lb:.health.lag_blocks,
  lm:.health.lag_max_blocks,
  lsf:.health.last_seen_finality_n,
  rr:.health.replay_required,
  rd:.health.reorg_detected
}' "$tmph")"

if [[ "$meta_lag" != "$int_lag" || "$meta_lag" != "$hea_lag" ]]; then
  echo "check-indexer-lag-locate-gate: lag_core triple mismatch" >&2
  echo "meta:    $meta_lag" >&2
  echo "internal:$int_lag" >&2
  echo "health:  $hea_lag" >&2
  exit 3
fi

if $JSON; then
  jq -n \
    --arg schema "traveltrust.indexer_lag_locate_gate.v1" \
    --arg verdict "GO" \
    --argjson lag "$meta_lag" \
    '{schema_version: $schema, verdict: $verdict, lag_snapshot: $lag}'
else
  echo "check-indexer-lag-locate-gate: ok" >&2
fi
