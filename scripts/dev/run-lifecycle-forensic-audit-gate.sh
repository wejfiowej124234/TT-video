#!/usr/bin/env bash
# Lifecycle Forensic Audit — DOMAIN-R · K · E · CA · UXA (convergence bundle)
#
#   bash scripts/dev/run-lifecycle-forensic-audit-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §15–§19
# Success: TT_LIFECYCLE_FORENSIC_AUDIT: OK
# SKIP_LFC_ROUTES=1 · SKIP_PF_OVERLAY=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${LFC_AUDIT_OUT:-$ROOT/evidence/lifecycle-forensic-audit/${STAMP}}"
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
echo "== Lifecycle Forensic Audit (R+K+E+CA+UXA) · out=$OUT =="

# --- DOMAIN-R Requirements Traceability ---
run_step "R-01/10 93 spec SSOT" test -f "$ROOT/docs/spec/93-全站功能验证矩阵-域别回归清单.md"
run_step "R-02 96-20 alignment spec" test -f "$ROOT/docs/spec/96-20-前后端页面对齐与UI生产级审计报告.md"
run_step "R-03 04 API SSOT" test -f "$ROOT/docs/spec/04-后端与API.md"
run_step "R-10 check-spec93-routes" python "$ROOT/scripts/check-spec93-routes-vs-app.py"
if [[ "${SKIP_LFC_ROUTES:-}" != "1" ]]; then
  run_step "R-11 run-check-04-routes" bash "$ROOT/scripts/run-check-04-routes.sh"
else
  echo "SKIP R-11 run-check-04-routes (SKIP_LFC_ROUTES=1)"
fi

# --- DOMAIN-K Knowledge & Bus Factor ---
run_step "K-01 solo-dev-rhythm" test -f "$ROOT/docs/solo-dev-rhythm.md"
run_step "K-02 SOLO-MAINTAINER index" \
  test -f "$ROOT/frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md"
run_step "K-05 ops RUNBOOK" test -f "$ROOT/ops/RUNBOOK.md"
run_step "K-08 handbook engineering" bash "$ROOT/scripts/check-handbook-frontmatter.sh"

# --- DOMAIN-E Economic Sustainability ---
run_step "E-01 fee_schedule spec" test -f "$ROOT/docs/spec/artifacts/onboarding-fee-schedule.v1.md"
run_step "E-02 fee_schedule code" test -f "$ROOT/crates/api/src/routes/onboarding/fee_schedule_v1.rs"
run_step "E-05 PHASE2 economics gate doc" test -f "$ROOT/docs/runbook/PHASE2-REPOSITORY-STATUS.md"

# --- DOMAIN-CA Code Architecture ---
run_step "CA-01 api crate" test -d "$ROOT/crates/api/src"
run_step "CA-04 frontend lib layer" test -d "$ROOT/frontend/lib"
run_step "CA-10 API contract check-55-s13" bash "$ROOT/scripts/check-55-s13.sh"
run_step "CA-12 spec path registry" python "$ROOT/registry/validate-spec-path-dependencies-registry.py"
run_step "CA-15 migrations" test -d "$ROOT/crates/api/migrations"

# --- DOMAIN-UXA UX/UI Design Governance ---
run_step "UXA-01 86 design spec" test -f "$ROOT/docs/spec/86-UI-双系统未来风-风格与动效技术规格.md"
run_step "UXA-02 FIVE-MAIN freeze" \
  test -f "$ROOT/frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md"
run_step "UXA-05 92 F/X/G" test -f "$ROOT/docs/spec/92-P0-全站UI分区控制表-金融体验灰区与动效裁决.md"
run_step "UXA-12 mobile responsive" bash "$ROOT/scripts/dev/l5-pe-mobile-responsive-audit.sh"
run_step "UXA-15 account-nav tracker" \
  test -f "$ROOT/frontend/evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json"
run_step "UXA-18 admin design boundary" test -f "$ROOT/frontend/app/admin/README.md"

python "$ROOT/scripts/dev/generate-lifecycle-forensic-registry-stub.py" "$OUT/lifecycle-forensic-registry.v1.json"
run_step "Lifecycle artifacts bundle" python "$ROOT/scripts/dev/generate-lifecycle-forensic-artifacts.py" "$OUT"

if [[ "${SKIP_PF_OVERLAY:-}" != "1" ]]; then
  echo "== PF overlay (optional matrices) =="
  if env SKIP_PF_ROUTES=1 bash "$ROOT/scripts/dev/run-product-forensic-audit-gate.sh"; then
    echo "OK   PF overlay"
  else
    echo "WARN PF overlay non-fatal"
  fi
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_LIFECYCLE_FORENSIC_AUDIT: OK"
  echo "Evidence: $OUT"
  echo "Verdicts: KEEP · MERGE · RETIRE · REFACTOR · UPDATE · DEPRECATE · REMOVE"
  exit 0
fi

echo "TT_LIFECYCLE_FORENSIC_AUDIT: FAIL"
exit 1
