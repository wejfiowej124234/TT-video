#!/usr/bin/env bash
# Wave 2 · G2 Formal Acceptance — release process only (no platform development).
#
#   bash scripts/dev/run-production-readiness-wave-2-g2-formal.sh
#
# Prerequisites (machine keys):
#   TT_G2_REALITY_VERIFICATION: COMPLETE
#   TT_EVIDENCE_INTEGRITY_AUDIT: PASS
#   TT_WAVE2_FORMAL_ACCEPTANCE: READY
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/wave-2-g2/${STAMP}"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

VERIFY_DIR="$(ls -1d evidence/GO_production_readiness/g2-reality-verification/*/ 2>/dev/null | sort | tail -1 || true)"
VERIFY_SIGNOFF="${VERIFY_DIR}g2-reality-verification-signoff.json"

fail() { echo "PR-WAVE-2-G2-FORMAL: FAIL $*"; exit 1; }
ok() { echo "PR-WAVE-2-G2-FORMAL: OK $*"; }
step() { echo ""; echo "=== $* ==="; }

mkdir -p "$EVID"
exec > >(tee -a "$EVID/run.log") 2>&1

echo "=== Wave 2 G2 Formal Acceptance · $STAMP ==="
echo "commit=$SHA verification_baseline=${VERIFY_DIR:-none}"

step "0 · Preflight machine keys"
rg -q 'TT_G2_REALITY_VERIFICATION: COMPLETE' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_G2_REALITY_VERIFICATION not COMPLETE"
rg -q 'TT_EVIDENCE_INTEGRITY_AUDIT: PASS' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_EVIDENCE_INTEGRITY_AUDIT not PASS"
rg -q 'TT_WAVE2_FORMAL_ACCEPTANCE: READY' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_WAVE2_FORMAL_ACCEPTANCE not READY"
ok "Preflight machine keys satisfied"

step "0a · Evidence Integrity Audit (pre-Formal)"
bash scripts/dev/run-evidence-integrity-audit.sh G2 2>&1 | tee "$EVID/evidence-integrity-audit.log"
mkdir -p evidence/GO_production_readiness/evidence-integrity/latest
LATEST_INTEGRITY="$(ls -1d evidence/GO_production_readiness/evidence-integrity/*/ 2>/dev/null | sort | tail -1 || true)"
[[ -n "$LATEST_INTEGRITY" ]] && cp -f "${LATEST_INTEGRITY}evidence-integrity-audit.json" \
  evidence/GO_production_readiness/evidence-integrity/latest/evidence-integrity-audit.json 2>/dev/null || true

step "1 · Link Reality Verification evidence (no reuse without baseline ref)"
[[ -n "$VERIFY_SIGNOFF" && -f "$VERIFY_SIGNOFF" ]] || fail "Missing g2-reality-verification signoff"
cp -f "$VERIFY_SIGNOFF" "$EVID/g2-reality-verification-signoff.json"
for sub in security-b001 security-b002 performance-b001 monitoring-b001 production-runtime-identity; do
  if [[ -d "${VERIFY_DIR}${sub}" ]]; then
    rm -rf "$EVID/${sub}"
    cp -a "${VERIFY_DIR}${sub}" "$EVID/${sub}"
  fi
done
ok "Verification evidence linked from ${VERIFY_DIR}"

step "2 · Production Runtime Identity guard (Formal attestation)"
bash scripts/dev/run-production-runtime-identity-guard.sh 2>&1 | tee "$EVID/production-runtime-identity-guard.log" \
  || fail "Production Runtime Identity guard"
GUARD_EVID="$(ls -1d evidence/GO_production_readiness/production-runtime-identity/*/ 2>/dev/null | sort | tail -1 || true)"
[[ -n "$GUARD_EVID" ]] && cp -a "$GUARD_EVID" "$EVID/production-runtime-identity-formal" || true

step "3 · Prod monitoring baseline (Formal)"
bash scripts/dev/smoke-g2-prod-monitoring-baseline.sh "$EVID/monitoring-b001" 2>&1 | tee "$EVID/monitoring-baseline.log" \
  || fail "Prod monitoring baseline"

step "4 · Formal Acceptance sign-off"
node scripts/dev/validate-g2-formal-acceptance.cjs \
  --evidence-dir "$EVID" \
  --verification-signoff "$EVID/g2-reality-verification-signoff.json" \
  2>&1 | tee "$EVID/g2-formal-acceptance.log"

step "5 · Matrix sync (Formal)"
node scripts/dev/sync-production-readiness-g2-matrix.cjs \
  --signoff "$EVID/g2-formal-acceptance-signoff.json" \
  --evidence-dir "$EVID/matrix-sync" \
  --mode formal 2>&1 | tee "$EVID/matrix-sync.log"

step "6 · G2 Gate validate"
node scripts/dev/validate-production-readiness-g2-gate.cjs \
  --evidence-dir "$EVID" 2>&1 | tee "$EVID/g2-gate.log"

step "7 · Master Matrix validate"
node scripts/dev/validate-production-readiness-master-matrix.cjs 2>&1 | tee "$EVID/master-matrix.log"

ok "Wave 2 G2 Formal Acceptance COMPLETE"
echo "Evidence: $EVID"
echo "TT_WAVE2_FORMAL_ACCEPTANCE: COMPLETE"
echo "TT_PRODUCTION_READINESS_G2_GATE: PASS (see matrix + g2-gate-signoff.json)"
echo "TT_PRODUCTION_GO: NO_GO"
