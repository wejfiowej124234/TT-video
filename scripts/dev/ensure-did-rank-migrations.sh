#!/usr/bin/env bash
# ① 本地：确保 did-rank 相关 PostgreSQL 迁移已应用（含 did_rank_rank_snapshots）。
# 用法（仓库根）：DATABASE_URL=postgres://… bash scripts/dev/ensure-did-rank-migrations.sh
# 实现：委托全量 API 迁移脚本（与 start-api-with-seed Step 3d 同源）。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec bash "$ROOT/scripts/dev/ensure-api-db-migrations.sh"
