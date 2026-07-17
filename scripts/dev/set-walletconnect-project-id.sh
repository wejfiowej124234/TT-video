#!/usr/bin/env bash
# OA-01 · Inject NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (local build env only · never commit secrets)
#
#   bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>'
#
# Writes (gitignored where applicable):
#   deploy/fly/tt-web-staging/build.env.local
#   frontend/.env.local
#
# Does NOT deploy. Does NOT print the full Project ID.
# Next: node scripts/dev/probe-walletconnect-project-id.cjs
# Then (Owner): bash scripts/dev/deploy-tt-web-staging.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ID="${1:-}"

fail() { echo "set-walletconnect-project-id: FAIL $*" >&2; exit 2; }
ok() { echo "set-walletconnect-project-id: OK $*"; }

[[ -n "$ID" ]] || fail "usage: $0 '<32-hex-project-id>'"
[[ "$ID" =~ ^[0-9a-fA-F]{32}$ ]] || fail "Project ID must be exactly 32 hex chars"

upsert() {
  local file="$1"
  local key="NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
  mkdir -p "$(dirname "$file")"
  if [[ ! -f "$file" ]]; then
    if [[ "$file" == *"build.env.local" ]]; then
      local ex="$ROOT/deploy/fly/tt-web-staging/build.env.example"
      [[ -f "$ex" ]] && cp "$ex" "$file" || touch "$file"
    else
      touch "$file"
    fi
  fi
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    # portable in-place: rewrite via temp
    local tmp
    tmp="$(mktemp)"
    awk -v k="$key" -v v="$ID" 'BEGIN{FS=OFS="="} $1==k{$0=k"="v} {print}' "$file" >"$tmp"
    mv "$tmp" "$file"
  else
    printf '\n%s=%s\n' "$key" "$ID" >>"$file"
  fi
}

upsert "$ROOT/deploy/fly/tt-web-staging/build.env.local"
upsert "$ROOT/frontend/.env.local"

MASK="${ID:0:4}…${ID: -4}"
ok "injected (masked=$MASK) into build.env.local + frontend/.env.local"
ok "next: node scripts/dev/probe-walletconnect-project-id.cjs"
ok "then (Owner): bash scripts/dev/deploy-tt-web-staging.sh"
ok "do NOT git add .env.local / build.env.local"
