#!/usr/bin/env bash
# PER-S-01 · staging REGISTRY_ADDRESS — Fly secret + /meta verify (② only).
# Usage:
#   bash scripts/dev/apply-per-s01-staging-registry-fly.sh           # dry-run
#   TRAVELTRUST_PER_S01_FLY_OK=1 bash scripts/dev/apply-per-s01-staging-registry-fly.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="${FLY_STAGING_API_APP:-tt-api-staging}"
API_BASE="https://${APP}.fly.dev"
EXAMPLE="$ROOT/deploy/fly/tt-web-staging/build.env.example"

fail() { echo "PER-S-01: FAIL $*"; exit 1; }
ok() { echo "PER-S-01: OK $*"; }

REG="$(grep -E '^NEXT_PUBLIC_REGISTRY_ADDRESS=' "$EXAMPLE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' || true)"
[[ -n "$REG" ]] || fail "empty REGISTRY in example"
[[ "$REG" == 0x* ]] || fail "invalid REGISTRY in example: $REG"

echo "PER-S-01: target REGISTRY_ADDRESS=$REG app=$APP"

if [[ "${TRAVELTRUST_PER_S01_FLY_OK:-0}" != "1" ]]; then
  echo "PER-S-01: dry-run — set TRAVELTRUST_PER_S01_FLY_OK=1 to fly secrets set REGISTRY_ADDRESS"
  exit 0
fi

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

fly secrets set "REGISTRY_ADDRESS=${REG}" "TRAVELTRUST_DEPLOYMENT_PROFILE=staging" -a "$APP"
ok "fly secrets set REGISTRY_ADDRESS + TRAVELTRUST_DEPLOYMENT_PROFILE"

for i in 1 2 3 4 5 6 7 8; do
  sleep 10
  meta_reg="$(curl -sf --max-time 45 "${API_BASE}/meta" 2>/dev/null | python -c "import json,sys; d=json.load(sys.stdin); print(((d.get('chain') or {}).get('contracts') or {}).get('registry_address') or '')" 2>/dev/null || true)"
  if [[ -n "$meta_reg" ]]; then
    ok "meta.registry_address=$meta_reg (attempt $i)"
    echo "TT_PER_S01_STAGING_REGISTRY: PASS"
    exit 0
  fi
  echo "PER-S-01: waiting for meta.registry_address (attempt $i)..."
done
fail "meta.registry_address still null after fly secrets"
