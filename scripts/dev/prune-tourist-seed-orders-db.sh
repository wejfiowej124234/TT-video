#!/usr/bin/env bash
# ① 本地 · 启动前从 PG 清理种子游客积留的已取消订单（hydrate 前执行，避免刷新后「删了又回来」）
#
# 用法（Postgres 已起，API 未起或即将重启）：
#   bash scripts/dev/prune-tourist-seed-orders-db.sh
# 可选：SEED_EMAILS="tourist@test.com guide@test.com" DATABASE_URL=…
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SEED_EMAILS="${SEED_EMAILS:-tourist@test.com}"
DATABASE_URL="${DATABASE_URL:-}"

fail() { echo "prune-tourist-seed-orders-db: FAIL $*" >&2; exit 1; }
ok() { echo "prune-tourist-seed-orders-db: OK $*"; }
warn() { echo "prune-tourist-seed-orders-db: WARN $*" >&2; }

read_env_database_url() {
  local env_file="$ROOT/.env"
  [[ -f "$env_file" ]] || return 0
  local line
  line="$(grep -E '^[[:space:]]*DATABASE_URL[[:space:]]*=' "$env_file" | tail -n1 || true)"
  [[ -n "$line" ]] || return 0
  DATABASE_URL="${line#*=}"
  DATABASE_URL="${DATABASE_URL#"${DATABASE_URL%%[![:space:]]*}"}"
  DATABASE_URL="${DATABASE_URL%"${DATABASE_URL##*[![:space:]]}"}"
  DATABASE_URL="${DATABASE_URL%\"}"
  DATABASE_URL="${DATABASE_URL#\"}"
}

if [[ -z "$DATABASE_URL" ]]; then
  read_env_database_url
fi

run_psql() {
  local sql="$1"
  if [[ -n "$DATABASE_URL" ]]; then
    if command -v psql >/dev/null 2>&1; then
      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atqc "$sql"
      return $?
    fi
    if command -v sqlx >/dev/null 2>&1; then
      sqlx database query --database-url "$DATABASE_URL" "$sql" 2>/dev/null && return 0
    fi
  fi
  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'traveltrust-postgres'; then
    docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -Atqc "$sql"
    return $?
  fi
  return 1
}

if ! run_psql "SELECT 1" >/dev/null 2>&1; then
  warn "Postgres unreachable — skip DB prune (set DATABASE_URL or start traveltrust-postgres)"
  exit 0
fi

total_deleted=0
for email in $SEED_EMAILS; do
  email_sql="${email//\'/\'\'}"
  uid="$(run_psql "SELECT id::text FROM users WHERE lower(email)=lower('${email_sql}') LIMIT 1;" 2>/dev/null || true)"
  uid="${uid//$'\r'/}"
  uid="${uid//$'\n'/}"
  if [[ -z "$uid" ]]; then
    warn "no user for $email — skip"
    continue
  fi

  run_psql "
    DELETE FROM itineraries
    WHERE order_id IN (
      SELECT id FROM orders
      WHERE tourist_id = '${uid}'::uuid AND lower(status) IN ('cancelled','canceled')
    );
  " >/dev/null 2>&1 || true

  n_ord="$(run_psql "
    WITH del AS (
      DELETE FROM orders
      WHERE tourist_id = '${uid}'::uuid AND lower(status) IN ('cancelled','canceled')
      RETURNING id
    )
    SELECT COUNT(*)::text FROM del;
  " 2>/dev/null || echo 0)"
  n_ord="${n_ord//$'\r'/}"
  n_ord="${n_ord//$'\n'/}"
  [[ "$n_ord" =~ ^[0-9]+$ ]] || n_ord=0
  total_deleted=$((total_deleted + n_ord))
  ok "email=$email deleted_cancelled_orders=$n_ord (itineraries cascade attempted)"
done

ok "total_deleted_cancelled=$total_deleted (run before API hydrate; restart API if already running)"
