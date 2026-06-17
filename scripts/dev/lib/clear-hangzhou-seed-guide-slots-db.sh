#!/usr/bin/env bash
# ① 本地 · 清理 E2E 种子向导（f0e0b101-*）DB 中 accepted/escrowed 占位，供 API hydrate 重建干净 guide_slot。
# 须在 API 启动前执行（或随后重启 API）。与 smoke-guide-detail-booking-local.sh 同源。
clear_hangzhou_seed_guide_slots_db() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "clear-hangzhou-seed-guide-slots-db: WARN docker missing — skip"
    return 0
  fi
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'traveltrust-postgres'; then
    echo "clear-hangzhou-seed-guide-slots-db: WARN traveltrust-postgres not running — skip"
    return 0
  fi
  local n
  n="$(docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -t -c \
    "UPDATE orders SET status='cancelled', updated_at=NOW() WHERE status IN ('accepted','escrowed') AND guide_id::text LIKE 'f0e0b101-%' RETURNING id;" 2>/dev/null | grep -c . || true)"
  echo "clear-hangzhou-seed-guide-slots-db: OK cleared ${n} accepted/escrowed rows (f0e0b101-*)"
}
