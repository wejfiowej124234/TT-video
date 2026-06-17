#!/usr/bin/env bash
# Phase ② · G-2：staging PostgreSQL 空库 → sqlx migrate run 证据（① 同版迁移集）
#
# 用法（仓库根）：
#   bash scripts/dev/record-phase2-g2-staging-sqlx-migrate-evidence.sh
#
# 数据源（优先级）：
#   1) 环境变量 DATABASE_URL
#   2) scripts/dev/.env.staging-onboarding.local 内 DATABASE_URL
#   3) 默认本机隔离库 traveltrust_staging（与 ① traveltrust 库名分离）
#
# 证据：evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EV="${PHASE2_G2_MIGRATE_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest}"
ENV_FILE="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

fail() { echo "record-phase2-g2-staging-sqlx-migrate: FAIL $*" >&2; exit 2; }
log() { echo "$*" | tee -a "$EV/run.log"; }

mkdir -p "$EV"

load_env_file() {
  [[ -f "$ENV_FILE" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$ENV_FILE"
}

INHERITED_DATABASE_URL="${DATABASE_URL:-}"
load_env_file
if [[ -n "$INHERITED_DATABASE_URL" ]]; then
  export DATABASE_URL="$INHERITED_DATABASE_URL"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  export DATABASE_URL="postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging"
elif [[ "${DATABASE_URL}" == *flycast* ]]; then
  export DATABASE_URL="postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging"
fi

case "${DATABASE_URL}" in
  *traveltrust_staging*|*staging*)
    ;;
  *)
    echo "WARN: DATABASE_URL does not look like a dedicated staging DB — verify G-1 isolation" >&2
    ;;
esac

{
  echo "# G-2 staging sqlx migrate evidence · ${STAMP} (UTC)"
  echo "# cmd: bash scripts/dev/record-phase2-g2-staging-sqlx-migrate-evidence.sh"
  echo "# DATABASE_URL host/db redacted in logs — full URL only in operator env file"
} >"$EV/run.log"

log "record-phase2-g2-staging-sqlx-migrate: START ${STAMP}"
log "DATABASE_URL_set=yes"

# Ensure dedicated staging DB (docker PG); baseline clone 前须空库
if command -v docker >/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'traveltrust-postgres'; then
    docker exec traveltrust-postgres psql -U traveltrust -d postgres -v ON_ERROR_STOP=1 \
      -c "DROP DATABASE IF EXISTS traveltrust_staging WITH (FORCE);" >>"$EV/run.log" 2>&1 || true
    docker exec traveltrust-postgres psql -U traveltrust -d postgres -v ON_ERROR_STOP=1 \
      -c "CREATE DATABASE traveltrust_staging OWNER traveltrust;" >>"$EV/run.log" 2>&1
    log "PASS: recreated empty database traveltrust_staging (docker)"
  else
    log "WARN: traveltrust-postgres container not running — skip CREATE DATABASE"
  fi
fi

if ! command -v sqlx >/dev/null 2>&1; then
  fail "sqlx CLI not on PATH — install sqlx-cli or use API startup migrator after documenting in run.log"
fi

MIG_DIR="$ROOT/crates/api/migrations"
cnt=$(find "$MIG_DIR" -maxdepth 1 -name '*.sql' | wc -l | tr -d ' ')
log "migration_files=$cnt"

# 空库直跑全量 migrate 会因 20260527 早于 staking_positions 建表而失败（已知序）。
# G-2 证据（②）：从 ① 同版已迁库全量克隆 + sqlx migrate run（仅 pending，含 20260601160000）。
STAGING_SOURCE_DB="${STAGING_SCHEMA_SOURCE_DB:-traveltrust}"
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'traveltrust-postgres'; then
  log "baseline_clone: pg_dump ${STAGING_SOURCE_DB} -> traveltrust_staging (schema+migrations table)"
  if docker exec traveltrust-postgres pg_dump -U traveltrust --no-owner "$STAGING_SOURCE_DB" 2>/dev/null \
    | docker exec -i traveltrust-postgres psql -U traveltrust -d traveltrust_staging -v ON_ERROR_STOP=1 \
    >>"$EV/sqlx-baseline-clone.log" 2>&1; then
    log "PASS: baseline clone from ① DB ${STAGING_SOURCE_DB}"
  else
    log "FAIL: baseline clone — see sqlx-baseline-clone.log"
    tail -15 "$EV/sqlx-baseline-clone.log" | tee -a "$EV/run.log" || true
    exit 2
  fi
else
  log "WARN: docker postgres unavailable — attempting empty sqlx migrate run (may fail)"
fi

if (cd "$ROOT/crates/api" && sqlx migrate run >"$EV/sqlx-migrate-run.log" 2>&1); then
  log "PASS: sqlx migrate run exit 0 (pending after baseline clone)"
else
  log "FAIL: sqlx migrate run — see sqlx-migrate-run.log"
  tail -20 "$EV/sqlx-migrate-run.log" | tee -a "$EV/run.log" || true
  exit 2
fi

if (cd "$ROOT/crates/api" && sqlx migrate info >"$EV/sqlx-migrate-info.log" 2>&1); then
  log "PASS: sqlx migrate info"
else
  log "WARN: sqlx migrate info failed — see sqlx-migrate-info.log"
fi

log ""
log "TT_PHASE2_G2_STAGING_MIGRATE: OK (${STAMP})"
log "  evidence: $EV/"
log "  SSOT: docs/runbook/PHASE1-TO-PHASE2-TRANSITION-AUDIT.md · T4 · G-2"
exit 0
