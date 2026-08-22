#!/usr/bin/env bash
# Official-First · Staging clean rebuild (PRODUCT plane · DESTRUCTIVE staging only).
#
# Owner-approved: TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK=1
#
# Policy:
#   - Official Production motherboard = PRODUCT SSOT
#   - Pre-rebuild read-only backup → wipe Staging DB → fresh Git 157 migrations
#   - Post-migrate governed view refresh (reproducible product structure)
#   - Sanitized seed only (OCS cold-start) · NO Production business data
#   - NEVER touch Production MPG
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

[[ "${TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK:-}" == "1" ]] \
  || { echo "official-first-clean-rebuild-staging: FAIL set TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK=1" >&2; exit 2; }

fail() { echo "official-first-clean-rebuild-staging: FAIL $*" >&2; exit 2; }
info() { echo "official-first-clean-rebuild-staging: $*"; }

export REPO_ROOT="$ROOT"
# shellcheck source=lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"

info "Phase D0 — pre-rebuild read-only capture"
if [[ "${TRAVELTRUST_OFFICIAL_FIRST_STAGING_SKIP_PRE_CAPTURE:-}" == "1" ]]; then
  info "SKIP — TRAVELTRUST_OFFICIAL_FIRST_STAGING_SKIP_PRE_CAPTURE=1"
else
  bash "$ROOT/scripts/dev/official-first-staging-pre-rebuild-capture.sh"
fi

info "Phase D1 — prepare Staging DSN (fly proxy if flycast)"
staging_adm_u01_prepare_dsn || fail "STAGING_DATABASE_URL unavailable"
export DATABASE_URL="$STAGING_DATABASE_URL"
export STAGING_DATABASE_URL

info "Phase D2 — wipe Staging public schema (NOT Production)"
python - <<'PY'
import os, sys
import psycopg
dsn = os.environ["DATABASE_URL"]
with psycopg.connect(dsn, connect_timeout=60) as conn:
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("DROP SCHEMA IF EXISTS public CASCADE")
        cur.execute("CREATE SCHEMA public")
        cur.execute("GRANT ALL ON SCHEMA public TO public")
        cur.execute("CREATE EXTENSION IF NOT EXISTS plpgsql")
print("wiped public schema")
PY

info "Phase D3 — fresh apply Git 157 migrations"
sqlx migrate run --source crates/api/migrations

info "Phase D4 — reproducible product structure: refresh governed views"
python - <<'PY'
import os
import psycopg
from pathlib import Path
sql = Path("scripts/dev/sql/official-first-refresh-governed-views.sql").read_text(encoding="utf-8")
with psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=60) as conn:
    with conn.cursor() as cur:
        cur.execute("SET default_transaction_read_only = off")
        cur.execute(sql)
    conn.commit()
print("governed views refreshed")
PY

info "Phase D5 — verify migration bookkeeping vs Official"
python "$ROOT/scripts/dev/verify-prod-git-migrations-1to1.py" \
  --capture "$EV/OFFICIAL_PROD_SCHEMA_CAPTURE_LATEST.json" \
  --out "$EV/STAGING_REBUILD_MIGRATION_VERIFY_LATEST.json"

MIG_VERDICT="$(python -c "import json;print(json.load(open('evidence/GO_official_product_reality_capture/STAGING_REBUILD_MIGRATION_VERIFY_LATEST.json', encoding='utf-8'))['verdict'])")"
[[ "$MIG_VERDICT" == "MATCH_1TO1" ]] || fail "migration verify $MIG_VERDICT"

info "Phase D6 — schema capture"
bash "$ROOT/scripts/dev/capture-env-schema-readonly.sh" staging

info "Phase D7 — restart Staging API (runtime cache flush; no prod touch)"
if command -v fly >/dev/null 2>&1; then
  fly apps restart tt-api-staging 2>&1 | tee "$EV/staging_rebuild_restart_api_${STAMP}.log" || info "WARN api restart failed"
  fly apps restart tt-web-staging 2>&1 | tee "$EV/staging_rebuild_restart_web_${STAMP}.log" || info "WARN web restart failed"
  sleep 15
fi

info "Phase D8 — sanitized seed (OCS cold-start · no prod PII)"
if [[ "${TRAVELTRUST_OFFICIAL_FIRST_STAGING_OCS_SEED_OK:-}" == "1" ]]; then
  API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}" \
    OCS_EVIDENCE_DIR="$EV/staging_ocs_seed_${STAMP}" \
    bash "$ROOT/scripts/dev/run-official-cold-start-dataset.sh" 2>&1 | tee "$EV/staging_ocs_seed_${STAMP}.log" || info "WARN OCS seed failed — manual retry"
else
  info "SKIP OCS seed — set TRAVELTRUST_OFFICIAL_FIRST_STAGING_OCS_SEED_OK=1 to apply sanitized cold-start"
fi

info "Phase D9 — PRODUCT Reality compare (application layer + HOSTING_ED)"
python "$ROOT/scripts/dev/official-first-product-reality-compare.py"

info "Phase D10 — layered compare artifact"
python "$ROOT/scripts/dev/compare-official-prod-schema-layers.py" \
  --local-capture "$EV/LOCAL_SCHEMA_CAPTURE_LATEST.json" \
  --staging-capture "$EV/STAGING_SCHEMA_CAPTURE_LATEST.json"

python - <<'PY'
import json
from datetime import datetime, timezone
from pathlib import Path
now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
ev = Path('evidence/GO_official_product_reality_capture')
cmp = json.loads((ev/'OFFICIAL_PRODUCT_REALITY_COMPARE_LATEST.json').read_text())
status = json.loads((ev/'OFFICIAL_FIRST_CLEAN_REBUILD_STATUS.json').read_text())
status['recorded_utc'] = now
status['phases']['D_staging_rebuild'] = 'COMPLETE'
status['phases']['E_verify_pass'] = 'COMPLETE' if cmp.get('parity_pass_allowed') else 'RUNTIME_NOT_ZERO'
status['staging_rebuild'] = {
  'stamp': '''$STAMP''',
  'migration_verify': 'STAGING_REBUILD_MIGRATION_VERIFY_LATEST.json',
  'schema_capture': 'STAGING_SCHEMA_CAPTURE_LATEST.json',
  'product_reality_compare': 'OFFICIAL_PRODUCT_REALITY_COMPARE_LATEST.json',
}
status['RUNTIME_PARITY_GAPS'] = cmp.get('RUNTIME_PARITY_GAPS')
status['PRODUCT_AND_DOCUMENTATION_PARITY_PASS'] = cmp.get('PRODUCT_AND_DOCUMENTATION_PARITY_PASS')
(ev/'OFFICIAL_FIRST_CLEAN_REBUILD_STATUS.json').write_text(json.dumps(status, indent=2)+'\n', encoding='utf-8')
print('status updated', cmp.get('RUNTIME_PARITY_GAPS'), cmp.get('PRODUCT_AND_DOCUMENTATION_PARITY_PASS'))
PY

info "DONE stamp=$STAMP — inspect OFFICIAL_PRODUCT_REALITY_COMPARE_LATEST.json"
