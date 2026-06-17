#!/usr/bin/env bash
# TN-P1-010 · reconcile-only (post R1 backfill / RPC sync)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    export "$key=$val"
  done < "$f"
}
merge_env "$ROOT/.env"
merge_env "$ROOT/scripts/dev/.env.staging-onboarding.local"
SEC="${INTERNAL_API_SECRET:-}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev"
OUT="${1:-evidence/tmp-recon-only.json}"
curl --noproxy "*" -sS --max-time 120 -X POST \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: ${SEC}" \
  -d '{"persist":true,"rpc_escrow_samples":10,"include_event_log_escrow_coverage":true}' \
  "${API}/api/v1/internal/indexer-reconcile" -o "$OUT"
node -e "
const j=require(process.argv[1]);
const bd=j.orders_projection_reconcile_gate?.breakdown||{};
console.log(JSON.stringify({
  missing_projection: bd.missing_projection,
  reconcile_compound_pass: j.reconcile_compound_pass,
  projection_reconcile_clean: j.projection_reconcile_clean,
  rpc_escrow_samples: j.rpc_escrow_samples
}, null, 2));
if (bd.missing_projection !== 0) process.exit(2);
if (!j.reconcile_compound_pass) process.exit(3);
" "$OUT"
