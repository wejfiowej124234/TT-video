#!/usr/bin/env bash
# DOMAIN-Z · DOCUMENTATION_AND_OPERATIONAL_ALIGNMENT_AUDIT · DOA-01～DOA-20
#
#   bash scripts/dev/run-doa-audit-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §14
# Success: TT_DOA_AUDIT: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${DOA_AUDIT_OUT:-$ROOT/evidence/doa-audit/${STAMP}}"
fail=0

run_step() {
  local label="$1"
  shift
  echo "== $label =="
  if "$@"; then
    echo "OK   $label"
  else
    echo "FAIL $label"
    fail=1
  fi
}

mkdir -p "$OUT"
echo "== DOMAIN-Z · DOA gate · out=$OUT =="

# DOA-01 README
run_step "DOA-01 README + TT-9618" \
  test -f "$ROOT/README.md" \
  && test -f "$ROOT/docs/runbook/TT-9618-onboarding-local-testnet.md"

# DOA-02 Runbook index
run_step "DOA-02 runbook README" test -f "$ROOT/docs/runbook/README.md"

# DOA-03 spec path registry
run_step "DOA-03 spec-path registry validator" \
  python "$ROOT/registry/validate-spec-path-dependencies-registry.py"

# DOA-04 handbook (light)
run_step "DOA-04 handbook frontmatter" bash "$ROOT/scripts/check-handbook-frontmatter.sh"

# DOA-05 env
run_step "DOA-05 .env.example" test -f "$ROOT/.env.example" || test -f "$ROOT/.env"

# DOA-06 Docker / local stack
run_step "DOA-06 start-api-with-seed README" \
  test -f "$ROOT/scripts/dev/start-api-with-seed-README.md"

# DOA-07 Seed
run_step "DOA-07 seed script" \
  test -f "$ROOT/scripts/dev/start-api-with-seed.bat" \
  || test -f "$ROOT/scripts/dev/start-api-with-seed.sh"

# DOA-08 migrations dir
run_step "DOA-08 sqlx migrations" test -d "$ROOT/crates/api/migrations"

# DOA-09 schema scripts
run_step "DOA-09 ensure-api-db-migrations" \
  test -f "$ROOT/scripts/dev/ensure-api-db-migrations.ps1" \
  || test -f "$ROOT/scripts/dev/ensure-api-db-migrations.sh"

# DOA-10 API routes
if [[ "${SKIP_DOA_ROUTES:-}" != "1" ]]; then
  run_step "DOA-10 run-check-04-routes" bash "$ROOT/scripts/run-check-04-routes.sh"
else
  echo "SKIP DOA-10 run-check-04-routes (SKIP_DOA_ROUTES=1)"
fi

# DOA-11 frontend routes (93 helper)
run_step "DOA-11 check-spec93-routes" python "$ROOT/scripts/check-spec93-routes-vs-app.py"

# DOA-12 ABI
run_step "DOA-12 check-55-s13 ABI" bash "$ROOT/scripts/check-55-s13.sh"

# DOA-13 indexer SSOT doc
run_step "DOA-13 chain/indexer runbook" \
  test -f "$ROOT/docs/runbook/TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md"

# DOA-14 admin README
run_step "DOA-14 admin app README" test -f "$ROOT/frontend/app/admin/README.md"

# DOA-15 RBAC matrix smoke
run_step "DOA-15 smoke-admin-rbac-matrix" \
  test -f "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh"

# DOA-16 audit one-shot scripts
run_step "DOA-16 master+pf+doa gates" \
  test -f "$ROOT/scripts/dev/run-full-system-audit-master-gate.sh" \
  && test -f "$ROOT/scripts/dev/run-product-forensic-audit-gate.sh" \
  && test -f "$ROOT/scripts/dev/run-doa-audit-gate.sh"

# DOA-17 testnet deploy
run_step "DOA-17 phase2 testnet scripts" \
  test -f "$ROOT/docs/runbook/PHASE2-START-CHECKLIST.md"

# DOA-18 CI/local parity
run_step "DOA-18 dev-preflight" test -f "$ROOT/scripts/dev-preflight.sh"

# DOA-19 ops runbook
run_step "DOA-19 ops RUNBOOK" test -f "$ROOT/ops/RUNBOOK.md"

# DOA-20 backup/DR
run_step "DOA-20 DR backup script" \
  test -f "$ROOT/scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh"

python "$ROOT/scripts/dev/generate-doa-registry-stub.py" "$OUT/doa-audit-registry.v1.json"
run_step "DOA artifacts bundle" python "$ROOT/scripts/dev/generate-doa-artifacts.py" "$OUT"

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_DOA_AUDIT: OK"
  echo "Evidence: $OUT"
  echo "Verdicts: KEEP / UPDATE / DEPRECATE / REMOVE — see doa-audit-registry.v1.json"
  exit 0
fi

echo "TT_DOA_AUDIT: FAIL"
exit 1
