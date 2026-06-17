#!/usr/bin/env bash
# SUPERSEDED · Phase ② · L5 满分关闭编排（单人维护者 · Sebastian Ward · 须 G-01～G-08 全 AND 方可 G-09 自签）
#
# **毕业序 SSOT：** `scripts/dev/run-phase2-graduation-closure-program.sh`
# 本脚本保留兼容；顺序已修正为 Soak → TN-P1-010。
#
# 用法：
#   bash scripts/dev/run-phase2-l5-full-score-closure.sh          # 全序（含 72h soak 启动）
#   bash scripts/dev/run-phase2-l5-full-score-closure.sh --audit-only
#
# 诚实边界：本脚本 **不** 伪造满分 · soak 72h wall-clock **不可** 跳过 · ② 毕业 **≠** ③ Production GO
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

AUDIT_ONLY=0
[[ "${1:-}" == "--audit-only" ]] && AUDIT_ONLY=1

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"

echo "TT_PHASE2_L5_FULL_SCORE_CLOSURE: START $(date -u +%Y%m%dT%H%M%SZ)"
echo "maintainer: Sebastian Ward (solo Owner · G-09 self-sign after G-01～G-08)"
echo "WARN: prefer run-phase2-graduation-closure-program.sh for graduation path"

if [[ "$AUDIT_ONLY" == "0" ]]; then
  echo ""
  echo "== Step 1/4: TN-P1-009 P2FC 72h soak START (wall-clock · stays OPEN until COMPLETED.json) =="
  if [[ ! -f "$COMPLETED" ]]; then
    bash "$ROOT/scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh"
  else
    echo "P2FC soak already COMPLETED — skip launch"
  fi

  echo ""
  echo "== Step 2/4: TN-P1-010 indexer reconcile (post-soak only) =="
  if [[ -f "$COMPLETED" ]]; then
    bash "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh"
  else
    echo "SKIP: TN-P1-010 blocked until $COMPLETED exists"
  fi

  echo ""
  echo "== Step 3/4: D24 surface staging (5 OPEN surfaces) =="
  bash "$ROOT/scripts/dev/record-tn-p1-d24-surface-staging-evidence.sh"
fi

echo ""
echo "== Step 4/4: graduation governance audit =="
bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh"

EVID="$(ls -td "$ROOT/evidence/GO_phase2_testnet_graduation"/*/ 2>/dev/null | head -1)"
echo ""
echo "TT_PHASE2_L5_FULL_SCORE_CLOSURE: DONE"
echo "latest_audit: ${EVID:-unknown}"
echo ""
echo "G-09 solo sign-off ONLY when audit shows:"
echo "  TT_TESTNET_GRADUATION: CLOSED · TT_PHASE2_L5_COMPOSITE_SCORE: 10"
echo "  (§14.1 full AND — no relative scoring / main-path substitute)"
echo "Template: docs/runbook/evidence-templates/PHASE2-TESTNET-OWNER-SIGNOFF-SOLO.md"
