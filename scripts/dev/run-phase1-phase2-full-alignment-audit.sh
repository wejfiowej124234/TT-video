#!/usr/bin/env bash
# Phase ② · Staging alignment audit（历史名 phase1-phase2 · 仅 ② staging 对拍）
#
#   bash scripts/dev/run-phase1-phase2-full-alignment-audit.sh
#
# SSOT: TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST · TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD
# 诚实边界：② alignment PASS ≠ ③ Production GO · Reliability Freeze 期间不触发 deploy
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"
BASELINE_SHA="$(phase2_resolve_baseline_ssot_sha "$ROOT")"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_graduation/alignment-audit-${STAMP}"
mkdir -p "$EVID"

exec > >(tee -a "$EVID/audit.log") 2>&1
echo "TT_PHASE1_PHASE2_FULL_ALIGNMENT_AUDIT: START ${STAMP}"
echo "baseline_ssot_sha=${BASELINE_SHA}"

LOCAL_SHA="$(git rev-parse HEAD)"
echo "local_head=${LOCAL_SHA}" >"$EVID/git-head.txt"
git status --porcelain >"$EVID/git-status.porcelain" || true

curl --noproxy "*" -sS --max-time 45 "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}/meta" \
  >"$EVID/staging-meta.json" || echo '{"error":"meta_fetch_failed"}' >"$EVID/staging-meta.json"

echo ""
echo "== transition audit (Phase①→②) =="
bash "$ROOT/scripts/dev/run-phase1-to-phase2-transition-audit.sh" 2>&1 | tail -5 || true

echo ""
echo "== staging web alignment =="
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" 2>&1 | tee "$EVID/staging-web-alignment.log" || true

echo ""
echo "== staging API parity (CMS/Growth/Admin) =="
python "$ROOT/scripts/dev/staging-api-parity-probe.py" 2>&1 | tee "$EVID/staging-api-parity.log" || true

echo ""
echo "== Sepolia spine (registry ↔ chain) =="
bash "$ROOT/scripts/dev/phase2-sepolia-spine-audit.sh" 2>&1 | tail -8 | tee "$EVID/sepolia-spine-tail.log" || true

echo ""
echo "== pre-graduation (Phase② closure) =="
OPEN_TESTNET_P0_COUNT=0 OPEN_TESTNET_P1_COUNT=0 TT_PHASE2_READINESS=100 \
  bash "$ROOT/scripts/dev/run-phase2-pre-graduation-audit.sh" 2>&1 | tail -12 || true

node "$ROOT/scripts/dev/emit-phase1-phase2-alignment-gap-report.mjs" \
  --evid-dir "$EVID" \
  --stamp "$STAMP" \
  --local-sha "$LOCAL_SHA"

echo ""
echo "TT_PHASE1_PHASE2_FULL_ALIGNMENT_AUDIT: DONE ${STAMP}"
echo "report: evidence/GO_phase2_testnet_graduation/PHASE1_PHASE2_ALIGNMENT_GAP_REPORT-${STAMP}.md"
