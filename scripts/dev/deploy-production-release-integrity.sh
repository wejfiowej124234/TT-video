#!/usr/bin/env bash
# RI-02 Production deploy order (fail-closed)
#
# Correct order (hard):
#   1. Backup reminder / optional mpg backup
#   2. Migration compatibility check (RI-01)
#   3. Apply migration (API boot runs sqlx migrator)
#   4. Deploy API
#   5. Health verify
#   6. Deploy FE
#   7. Runtime probe (RI-03 subset)
#
# Forbidden: Deploy FE before API health PASS.
#
# Usage:
#   TRAVELTRUST_V65_PRODUCTION_RELEASE_INTEGRITY_DEPLOY_OK=1 \
#     bash scripts/dev/deploy-production-release-integrity.sh
#
#   … --api-only | --fe-only | --check-only
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "deploy-production-release-integrity: FAIL $*" >&2; exit 2; }
ok() { echo "deploy-production-release-integrity: OK $*"; }
info() { echo "deploy-production-release-integrity: $*"; }

if [[ "${TRAVELTRUST_V65_PRODUCTION_RELEASE_INTEGRITY_DEPLOY_OK:-}" != "1" ]]; then
  fail "set TRAVELTRUST_V65_PRODUCTION_RELEASE_INTEGRITY_DEPLOY_OK=1 (Owner unlock)"
fi

MODE="full"
case "${1:-}" in
  --api-only) MODE="api" ;;
  --fe-only) MODE="fe" ;;
  --check-only) MODE="check" ;;
  ""|--full) MODE="full" ;;
  *) fail "unknown arg: $1" ;;
esac

PROD_API_BASE="${PROD_API_BASE:-https://api.web3-ttg.com}"
PROD_WEB_BASE="${PROD_WEB_BASE:-https://www.web3-ttg.com}"

info "RI-02 step1 Backup — ensure mpg backups enabled (non-blocking reminder)"
if command -v fly >/dev/null 2>&1; then
  bash "$ROOT/scripts/dev/check-fly-pg-backup-status.sh" 2>/dev/null \
    && ok "backup status checked" \
    || info "WARN backup status check skipped/failed — Owner must confirm mpg backups"
else
  info "WARN fly CLI missing — skip backup status"
fi

info "RI-02 step2 Migration compatibility (RI-01 files + prefixes)"
bash "$ROOT/scripts/dev/check-sqlx-migration-prefixes.sh" \
  || fail "duplicate migration prefixes"
# Pre-deploy: file integrity only (DB ledger after API deploy)
RI_REQUIRE_DB=0 RI_SKIP_HEALTH=1 \
  bash "$ROOT/scripts/gates/check-ri-migration-integrity-gate.sh" \
  || fail "RI-01 migration file integrity"

if [[ "$MODE" == "check" ]]; then
  ok "check-only complete (no deploy)"
  exit 0
fi

if [[ "$MODE" == "fe" ]]; then
  info "RI-02 FE-only — require live API health first (refuse FE-before-API)"
  hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${PROD_API_BASE%/}/health" || echo 000)"
  [[ "$hc" == "200" ]] || fail "API health not 200 (got $hc) — deploy API before FE"
  RI_REQUIRE_DB=1 RI_SKIP_HEALTH=0 \
    bash "$ROOT/scripts/gates/check-ri-migration-integrity-gate.sh" \
    || fail "RI-01 post-API ledger/health"
  bash "$ROOT/scripts/dev/deploy-tt-web-production.sh" || fail "FE deploy"
  ok "FE deployed after API health"
  exit 0
fi

info "RI-02 step3–5 Deploy API (migrations apply on boot) + health"
bash "$ROOT/scripts/dev/phase3-production-fly-deploy-and-sync.sh" || fail "API deploy"
hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 45 "${PROD_API_BASE%/}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "API health not 200 after deploy (got $hc)"

info "RI-01 post-deploy: DB ledger + checksum + health"
RI_REQUIRE_DB=1 RI_SKIP_HEALTH=0 \
  bash "$ROOT/scripts/gates/check-ri-migration-integrity-gate.sh" \
  || fail "RI-01 post-deploy ledger"

if [[ "$MODE" == "api" ]]; then
  ok "API-only complete"
  exit 0
fi

info "RI-02 step6 Deploy FE (only after API health PASS)"
bash "$ROOT/scripts/dev/deploy-tt-web-production.sh" || fail "FE deploy"

info "RI-02 step7 Runtime probe (RI-03 subset)"
TRAVELTRUST_V65_PRODUCTION_RELEASE_INTEGRITY_OK=1 \
  python "$ROOT/scripts/dev/run-v65-production-release-integrity-final.py" --ri-03-only \
  || fail "RI-03 runtime probe"

ok "full release integrity deploy order complete · API+FE+probes"
