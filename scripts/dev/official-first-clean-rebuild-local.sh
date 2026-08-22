#!/usr/bin/env bash
# Official-First · Local clean rebuild (PRODUCT plane · DESTRUCTIVE local only).
#
# Policy:
#   - Official Production = PRODUCT SSOT (not Local history)
#   - Wipe Local PG + old overlays; rebuild from Git (Official-reclaimed migrations)
#   - NO Production user/order/wallet data — sanitized seed only
#   - NO Production DB mutation · NO Web3 Candidate deploy
#
#   TRAVELTRUST_OFFICIAL_FIRST_LOCAL_CLEAN_REBUILD_OK=1 \
#     bash scripts/dev/official-first-clean-rebuild-local.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"

[[ "${TRAVELTRUST_OFFICIAL_FIRST_LOCAL_CLEAN_REBUILD_OK:-}" == "1" ]] \
  || { echo "official-first-clean-rebuild-local: FAIL set TRAVELTRUST_OFFICIAL_FIRST_LOCAL_CLEAN_REBUILD_OK=1" >&2; exit 2; }

echo "official-first-clean-rebuild-local: Phase C — wipe Local PG volume"
docker compose down -v
docker compose up -d postgres
for i in $(seq 1 15); do
  docker exec traveltrust-postgres pg_isready -U traveltrust -d traveltrust >/dev/null 2>&1 && break
  sleep 2
done

export DATABASE_URL="${LOCAL_DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"
echo "official-first-clean-rebuild-local: migrate Git tip (Official-reclaimed)"
sqlx migrate run --source crates/api/migrations

echo "official-first-clean-rebuild-local: verify migration bookkeeping"
python "$ROOT/scripts/dev/verify-prod-git-migrations-1to1.py" \
  --capture "$EV/OFFICIAL_PROD_SCHEMA_CAPTURE_LATEST.json" \
  --out "$EV/LOCAL_REBUILD_MIGRATION_VERIFY_LATEST.json"

echo "official-first-clean-rebuild-local: schema capture"
bash "$ROOT/scripts/dev/capture-env-schema-readonly.sh" local

echo "official-first-clean-rebuild-local: layered compare (expect staging pending)"
python "$ROOT/scripts/dev/compare-official-prod-schema-layers.py" \
  --local-capture "$EV/LOCAL_SCHEMA_CAPTURE_LATEST.json"

echo "official-first-clean-rebuild-local: DONE — inspect LOCAL_SCHEMA_CAPTURE_LATEST.json + compare artifact"
echo "official-first-clean-rebuild-local: seed injection = separate Owner step (sanitized only; no prod PII)"
