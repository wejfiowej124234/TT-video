#!/usr/bin/env bash
# Ensure crates/api SQLx migrations applied (align local PG schema before / with API startup).
# Usage (repo root): bash scripts/dev/ensure-api-db-migrations.sh
# Env: DATABASE_URL (defaults to docker compose local PG when unset).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "$ROOT/.env" ]]; then
    line="$(grep -E '^[[:space:]]*DATABASE_URL=' "$ROOT/.env" | tail -1 || true)"
    if [[ -n "$line" ]]; then
      DATABASE_URL="${line#*=}"
      DATABASE_URL="${DATABASE_URL#\"}"; DATABASE_URL="${DATABASE_URL%\"}"
      export DATABASE_URL
      echo "ensure-api-db-migrations: DATABASE_URL from root .env"
    fi
  fi
fi
: "${DATABASE_URL:=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"
export DATABASE_URL

run_migrate() {
  if command -v sqlx >/dev/null 2>&1; then
    sqlx migrate run --source crates/api/migrations
    return $?
  fi
  if cargo sqlx migrate run --source crates/api/migrations 2>/dev/null; then
    return 0
  fi
  echo "ensure-api-db-migrations: WARN sqlx-cli not on PATH; API will migrate on startup" >&2
  return 0
}

echo "ensure-api-db-migrations: sqlx migrate run (crates/api/migrations)"
run_migrate

probe_pg() {
  local q="$1" label="$2"
  local out
  out="$(docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -t -A -c "$q" 2>/dev/null | tr -d '[:space:]')"
  if [[ "$out" != "1" ]]; then
    echo "ensure-api-db-migrations: FAIL missing $label after migrate" >&2
    return 1
  fi
  return 0
}

if docker ps -q -f "name=^traveltrust-postgres$" >/dev/null 2>&1; then
  probe_pg "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='community_media_assets' LIMIT 1" "community_media_assets" || exit 1
  probe_pg "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='primary_media_asset_id' LIMIT 1" "community_posts.primary_media_asset_id" || exit 1
  probe_pg "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='data_origin' LIMIT 1" "community_posts.data_origin" || exit 1
  probe_pg "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='data_origin' LIMIT 1" "orders.data_origin" || exit 1
  probe_pg "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='guides' AND column_name='data_origin' LIMIT 1" "guides.data_origin" || exit 1
  probe_pg "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='market_listings' AND column_name='data_origin' LIMIT 1" "market_listings.data_origin" || exit 1
  probe_pg "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='order_kind' LIMIT 1" "orders.order_kind" || exit 1
  probe_pg "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wallets' LIMIT 1" "wallets" || exit 1
  probe_pg "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='role_applications' LIMIT 1" "role_applications" || exit 1
  probe_pg "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='did_rank_rank_snapshots' LIMIT 1" "did_rank_rank_snapshots" || exit 1
  echo "ensure-api-db-migrations: OK PG schema (community media + data_origin + identity + did_rank)"
else
  echo "ensure-api-db-migrations: WARN postgres container not running — skip PG schema probe" >&2
fi

echo "ensure-api-db-migrations: OK"
