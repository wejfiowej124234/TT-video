#!/usr/bin/env bash
# TT_FULL_SYSTEM_ALIGNMENT_STABILITY_PROGRAM — 9-batch enterprise alignment (GovFreeze V2 SSOT)
#
#   bash scripts/dev/run-tt-full-system-alignment-stability-program.sh
#
# Forbidden: Tokenomics · GovFreeze V2 · MTM 146 governance logic re-audit
# Allowed: consistency · traceability · repo cleanliness · BROKEN/NEEDS_FIX detection
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_R1_ROOT="$(hat_r1_resolve_evid_dir "$ROOT")"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_full_system_alignment_stability/${STAMP}"
mkdir -p "$EVID"

step() { echo "TT_FULL_SYS_ALIGN_STEP: $*"; }

step "0 · GovFreeze V2 baseline gate (read-only · no re-audit)"
bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >/dev/null

step "1 · Repository alignment sub-scan (Batch 8 input · no logic re-audit)"
bash "$ROOT/scripts/dev/run-tt-repository-alignment-cleanup-scan.sh" 2>&1 | tail -3 | tee "$EVID/repo-align-subscan.log" || true
REPO_STAMP="$(cat "$ROOT/evidence/GO_repository_alignment_cleanup/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
if [[ -n "$REPO_STAMP" && -f "$ROOT/evidence/GO_repository_alignment_cleanup/${REPO_STAMP}/REPOSITORY-ALIGNMENT-INVENTORY.v1.json" ]]; then
  cp "$ROOT/evidence/GO_repository_alignment_cleanup/${REPO_STAMP}/REPOSITORY-ALIGNMENT-INVENTORY.v1.json" \
    "$EVID/REPOSITORY-ALIGNMENT-INVENTORY-LINK.v1.json"
fi

step "2 · Batches 1–9 inventory"
python "$ROOT/scripts/dev/gen-tt-full-system-alignment-stability-inventory.py" \
  --out-dir "$EVID" \
  --stamp "$STAMP"

step "3 · Baseline anchors (read-only)"
cat >"$EVID/BASELINE-ANCHORS.json" <<JSON
{
  "baseline_id": "GOV-FREEZE-V2-CLEAN-BASELINE",
  "ssot_doc": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
  "execution_ssot": "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
  "phase_a": "${HAT_R1_ROOT#"$ROOT"/}",
  "four_ledger": "evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z",
  "ai_pre_human_uat": "evidence/GO_ai_pre_human_uat/latest-stamp.txt",
  "cert_session": "evidence/GO_ttg_cert/latest-stamp.txt",
  "repo_alignment_link": "REPOSITORY-ALIGNMENT-INVENTORY-LINK.v1.json",
  "forbidden_rerun": [
    "governance token design audit",
    "Tokenomics matrix",
    "GovFreeze V2 assert re-audit",
    "MTM 146 logic re-audit",
    "Enterprise HAT re-audit"
  ]
}
JSON

echo "$STAMP" >"$ROOT/evidence/GO_full_system_alignment_stability/latest-stamp.txt"
ln -sfn "$STAMP" "$ROOT/evidence/GO_full_system_alignment_stability/latest" 2>/dev/null || true

cat "$EVID/PROGRAM-RUN-SUMMARY.txt"
echo "TT_FULL_SYS_ALIGN: OK evidence=$EVID"
echo "Checklist: $EVID/FULL-SYSTEM-ALIGNMENT-EXECUTION-CHECKLIST.md"
