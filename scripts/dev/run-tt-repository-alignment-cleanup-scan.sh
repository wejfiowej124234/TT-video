#!/usr/bin/env bash
# TT_REPOSITORY_ALIGNMENT_CLEANUP_PROGRAM · 全仓一致性扫描（GovFreeze V2 SSOT）
#
#   bash scripts/dev/run-tt-repository-alignment-cleanup-scan.sh
#
# 禁止：治理逻辑复审计 · 新覆盖率矩阵 · Tokenomics 设计评估
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_R1_ROOT="$(hat_r1_resolve_evid_dir "$ROOT")"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_repository_alignment_cleanup/${STAMP}"
mkdir -p "$EVID"

step() { echo "TT_REPO_ALIGN_STEP: $*"; }

step "0 · GovFreeze V2 baseline gate (read-only)"
bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >/dev/null

step "0a · P3 evidence archive (move stale stamps · keep baseline anchors)"
python "$ROOT/scripts/dev/archive-tt-repo-alignment-stale-evidence.py" --apply

step "1 · Full-repo alignment inventory"
python "$ROOT/scripts/dev/gen-tt-repository-alignment-inventory.py" --out-dir "$EVID" --stamp "$STAMP"

step "2 · Link baseline anchors (read-only)"
cat >"$EVID/BASELINE-ANCHORS.json" <<JSON
{
  "baseline_id": "GOV-FREEZE-V2-CLEAN-BASELINE",
  "ssot_doc": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
  "execution_ssot": "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
  "phase_a": "${HAT_R1_ROOT#"$ROOT"/}",
  "four_ledger": "evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z",
  "govfreeze_v2_baseline_freeze": "evidence/GO_phase2_gov_freeze_v2_clean_baseline/freeze/latest-stamp.txt",
  "ai_pre_human_uat_pass": "evidence/GO_ai_pre_human_uat/20260616T105001Z",
  "cert_session": "evidence/GO_ttg_cert/20260616T100918Z",
  "archive_evidence_index": "evidence/archive-evidence/ARCHIVE-EVIDENCE-INDEX.v1.json",
  "forbidden": ["governance logic re-audit", "new coverage matrix", "tokenomics redesign", "delete final evidence"]
}
JSON

echo "$STAMP" >"$ROOT/evidence/GO_repository_alignment_cleanup/latest-stamp.txt"
ln -sfn "$STAMP" "$ROOT/evidence/GO_repository_alignment_cleanup/latest" 2>/dev/null || true

cat "$EVID/PROGRAM-RUN-SUMMARY.txt"
echo "TT_REPO_ALIGN: OK evidence=$EVID"
echo "Checklist: $EVID/REPOSITORY-ALIGNMENT-EXECUTION-CHECKLIST.md"
