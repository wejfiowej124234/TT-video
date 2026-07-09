#!/usr/bin/env bash
# P2FC · post-soak 阻断项全量 L5 预审（只读 · Soak INFLIGHT 不变）
#
# TN-P1-010 依赖链 · Wave1 itineraries/market/escrow/guide · Graduation G01–G08
# 不 deploy · 不重启 soak/watcher · 不改 MR12 策略
#
#   bash scripts/ops/p2fc-run-post-soak-preblock-full-l5-audit.sh
#
# 产出：evidence/P2FC_SOAK_72H_STAGING/post-soak-preblock-l5-audit/
# 末行：TT_P2FC_POST_SOAK_PREBLOCK_L5: PASS|WARN|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$SOAK_DIR/post-soak-preblock-l5-audit/$STAMP"
LOG="$OUT/full-l5-preblock-audit.log"
mkdir -p "$OUT"
exec > >(tee -a "$LOG") 2>&1

echo "TT_P2FC_POST_SOAK_PREBLOCK_L5: START $STAMP read_only=1 no_deploy=1"

# --- soak attest (read-only · exit 2 = INFLIGHT OK) ---
SOAK_LINE="$(P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>&1 || true)"
echo "soak_attest=${SOAK_LINE}"

# --- MR12 lock (read-only) ---
bash "$ROOT/scripts/ops/p2fc-verify-mr12-execution-lock.sh" 2>&1 || true

# --- backlog / wave / dependency (generators only) ---
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-deploy-backlog-layer-review.py" \
  --out-dir "$OUT/layer-review" 2>&1 || true
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-backlog-dependency-impact-graph.py" \
  --out-dir "$OUT/dependency-graph" 2>&1 || true
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-deploy-wave-rollback-plan.py" \
  --out-dir "$OUT/wave-plan" 2>&1 || true
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-meta-503-rca.py" 2>&1 || true

# --- governance + G01–G08 matrix (staging probes read-only) ---
export OPEN_TESTNET_P0_COUNT="${OPEN_TESTNET_P0_COUNT:-0}"
export OPEN_TESTNET_P1_COUNT="${OPEN_TESTNET_P1_COUNT:-0}"
export TT_PHASE2_READINESS="${TT_PHASE2_READINESS:-100}"
GOV_RC=0
bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh" 2>&1 || GOV_RC=$?
EVID="$(ls -td "$ROOT/evidence/GO_phase2_testnet_graduation"/*/ 2>/dev/null | head -1)"
EVID="${EVID%/}"

# --- pre-accept convergence (no --with-local-g02 · no staging deploy) ---
PRE_RC=0
P2FC_PRE_ACCEPT_OUT="$OUT/pre-accept" bash "$ROOT/scripts/ops/p2fc-pre-accept-g02-graduation-convergence.sh" 2>&1 || PRE_RC=$?

# --- L5 stability snapshot (read-only model) ---
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-soak-l5-stability-audit.py" \
  --soak-dir "$SOAK_DIR" 2>&1 | tail -5 || true

# --- synthesize full L5 preblock report ---
SYN_RC=0
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-post-soak-preblock-full-l5-audit.py" \
  --soak-dir "$SOAK_DIR" \
  --evid-dir "${EVID:-}" \
  --out-dir "$OUT" 2>&1 || SYN_RC=$?

# --- copy refs ---
[[ -n "$EVID" && -f "$EVID/graduation-matrix.v1.json" ]] && \
  cp -f "$EVID/graduation-matrix.v1.json" "$OUT/graduation-matrix.v1.json" 2>/dev/null || true
[[ -f "$SOAK_DIR/post-soak-preblock-l5-audit/latest.json" ]] && \
  cp -f "$SOAK_DIR/post-soak-preblock-l5-audit/latest.json" "$OUT/" 2>/dev/null || true

LINE="$(grep -E '^TT_P2FC_POST_SOAK_PREBLOCK_L5:' "$LOG" | tail -1 || true)"
echo "${STAMP} synthesis_rc=${SYN_RC} gov_rc=${GOV_RC} pre_accept_rc=${PRE_RC} ${LINE}" >>"$LOG"
echo "log=$LOG evid_gov=${EVID:-none}"
exit "$SYN_RC"
