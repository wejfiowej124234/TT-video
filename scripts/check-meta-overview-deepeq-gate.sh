#!/usr/bin/env bash
# B-424 · **`GET /meta`** **↔** **`GET …/admin/observability/overview`**：**build** **+** **indexer** **深相等** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

if ! command -v jq >/dev/null 2>&1; then
  echo "check-meta-overview-deepeq-gate: jq is required" >&2
  exit 1
fi
if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "check-meta-overview-deepeq-gate: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then JSON=true
  else echo "check-meta-overview-deepeq-gate: unknown option: $a" >&2; exit 1
  fi
done

tmpm="$(mktemp)"
tmpo="$(mktemp)"
trap 'rm -f "$tmpm" "$tmpo"' EXIT

code_m="$(curl -sS -o "$tmpm" -w "%{http_code}" "${BASE}/meta")"
code_o="$(curl -sS -o "$tmpo" -w "%{http_code}" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
  "${BASE}/api/v1/admin/observability/overview")"

if [[ "$code_m" != "200" || "$code_o" != "200" ]]; then
  echo "check-meta-overview-deepeq-gate: HTTP meta=${code_m} overview=${code_o}" >&2
  exit 2
fi

if ! jq -e --slurpfile m "$tmpm" --slurpfile o "$tmpo" '($m[0].build) == ($o[0].meta.build)' >/dev/null; then
  echo "check-meta-overview-deepeq-gate: Leg1 mismatch: meta.build != overview.meta.build" >&2
  exit 3
fi

if ! jq -e --slurpfile m "$tmpm" --slurpfile o "$tmpo" '($m[0].indexer) == ($o[0].overview.indexer)' >/dev/null; then
  echo "check-meta-overview-deepeq-gate: Leg2 mismatch: meta.indexer != overview.indexer" >&2
  exit 4
fi

if $JSON; then
  jq -n \
    --arg schema "traveltrust.meta_overview_deepeq_gate.v1" \
    --arg verdict "GO" \
    '{schema_version: $schema, verdict: $verdict, legs: ["build_deepeq","indexer_deepeq"]}'
else
  echo "check-meta-overview-deepeq-gate: ok" >&2
fi
