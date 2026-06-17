#!/usr/bin/env bash
# TravelTrust · Phase ① 收尾治理总标准 · MASTER GATE (v1.13)
#
# Phase ① closure: §11–§12 + all DOMAIN bundles + MA + FZ + QA2 + PEB (last · Owner view)
# SKIP_DOMAIN_X/Z/LIFECYCLE/PLATFORM_GOV/DOMAIN_AG/DOMAIN_MA/DOMAIN_FZ/DOMAIN_QA2/PHASE1_EXECUTIVE_BOARD=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0

run_bundle() {
  local label="$1"
  shift
  echo ""
  echo "======== $label ========"
  if "$@"; then
    echo "OK bundle $label"
  else
    echo "FAIL bundle $label"
    fail=1
  fi
}

echo "== Phase ① Closure Governance · MASTER GATE =="
echo "SSOT: TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md v1.14.0"
echo "TT_PHASE1_CLOSURE_GOVERNANCE: ACTIVE"
echo "Execution convergence: EX = PEB submodule (not a DOMAIN)."

run_bundle "§11 extreme + phase12 subset" \
  bash "$ROOT/scripts/dev/run-full-system-audit-phase12-gate.sh"

run_bundle "§12 governance D61–D76 + DX-01" \
  bash "$ROOT/scripts/dev/run-full-system-audit-governance-gate.sh"

if [[ "${SKIP_DOMAIN_X:-}" != "1" ]]; then
  run_bundle "DOMAIN-X product forensic (PF)" \
    env SKIP_PF_ROUTES="${SKIP_PF_ROUTES:-1}" \
    bash "$ROOT/scripts/dev/run-product-forensic-audit-gate.sh"
else
  echo "SKIP DOMAIN-X (SKIP_DOMAIN_X=1)"
fi

if [[ "${SKIP_DOMAIN_Z:-}" != "1" ]]; then
  run_bundle "DOMAIN-Z documentation & operational alignment (DOA)" \
    env SKIP_DOA_ROUTES="${SKIP_DOA_ROUTES:-1}" \
    bash "$ROOT/scripts/dev/run-doa-audit-gate.sh"
else
  echo "SKIP DOMAIN-Z (SKIP_DOMAIN_Z=1)"
fi

if [[ "${SKIP_LIFECYCLE:-}" != "1" ]]; then
  run_bundle "Lifecycle forensic R+K+E+CA+UXA" \
    env SKIP_LFC_ROUTES="${SKIP_LFC_ROUTES:-1}" SKIP_PF_OVERLAY=1 \
    bash "$ROOT/scripts/dev/run-lifecycle-forensic-audit-gate.sh"
else
  echo "SKIP Lifecycle (SKIP_LIFECYCLE=1)"
fi

if [[ "${SKIP_PLATFORM_GOV:-}" != "1" ]]; then
  run_bundle "Platform governance CX+BA+OPS+TRUST+ADMIN+CS" \
    bash "$ROOT/scripts/dev/run-platform-governance-audit-gate.sh"
else
  echo "SKIP Platform Governance (SKIP_PLATFORM_GOV=1)"
fi

if [[ "${SKIP_DOMAIN_AG:-}" != "1" ]]; then
  run_bundle "DOMAIN-AG administration & governance" \
    bash "$ROOT/scripts/dev/run-admin-governance-audit-gate.sh"
else
  echo "SKIP DOMAIN-AG (SKIP_DOMAIN_AG=1)"
fi

if [[ "${SKIP_DOMAIN_MA:-}" != "1" ]]; then
  run_bundle "DOMAIN-MA meta audit (standard self-audit)" \
    bash "$ROOT/scripts/dev/run-meta-audit-gate.sh"
else
  echo "SKIP DOMAIN-MA (SKIP_DOMAIN_MA=1)"
fi

if [[ "${SKIP_DOMAIN_FZ:-}" != "1" ]]; then
  run_bundle "DOMAIN-FZ freeze governance (closure readiness)" \
    bash "$ROOT/scripts/dev/run-freeze-governance-gate.sh"
else
  echo "SKIP DOMAIN-FZ (SKIP_DOMAIN_FZ=1)"
fi

if [[ "${SKIP_DOMAIN_QA2:-}" != "1" ]]; then
  run_bundle "DOMAIN-QA2 audit quality (convergence)" \
    bash "$ROOT/scripts/dev/run-audit-quality-gate.sh"
else
  echo "SKIP DOMAIN-QA2 (SKIP_DOMAIN_QA2=1)"
fi

if [[ "${SKIP_PHASE1_EXECUTIVE_BOARD:-}" != "1" ]]; then
  run_bundle "PHASE1_EXECUTIVE_BOARD (Owner Executive Freeze Dashboard · last gate)" \
    env SKIP_DOMAIN_FZ=1 SKIP_DOMAIN_QA2=1 \
    bash "$ROOT/scripts/dev/run-phase1-executive-board-gate.sh"
else
  echo "SKIP PHASE1_EXECUTIVE_BOARD (SKIP_PHASE1_EXECUTIVE_BOARD=1)"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_FULL_SYSTEM_AUDIT_MASTER: READY"
  echo "TT_PHASE1_CLOSURE_GOVERNANCE: MASTER_READY"
  echo "TT_PHASE1_CLOSURE_CONVERGENCE: OK"
  echo "TT_PHASE1_EXECUTIVE_BOARD: OK"
  echo "Phase ① local closure: U12 wide table bundles PASS (① only; not ② staging GO)."
  echo "Owner view: evidence/phase1-executive-board/*/EXECUTIVE-FREEZE-DASHBOARD.md"
  echo "EX submodule: .../execution-audit/EXECUTION-DASHBOARD.md"
  echo "Phase ② still requires U12-2 Owner confirm + G-1/G-2 (PHASE2-START)."
  exit 0
fi

echo "TT_FULL_SYSTEM_AUDIT_MASTER: NO-GO"
echo "TT_PHASE1_CLOSURE_GOVERNANCE: NO-GO"
echo "TT_PHASE1_CLOSURE_CONVERGENCE: NO-GO"
echo "TT_PHASE1_EXECUTIVE_BOARD: NO-GO"
exit 1
