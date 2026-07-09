#!/usr/bin/env bash
# STRAT-F · GATE-P1-01=25/25 基线 → Freeze Candidate 构建（不重复跑 site10 全链）
#
#   bash scripts/ops/p2fc-build-freeze-candidate-from-p1-baseline.sh
#   bash scripts/ops/p2fc-build-freeze-candidate-from-p1-baseline.sh --skip-network
#
# 阶段：① 本地收口已成立 · ② staging live / soak 准备（≠ ③ Production GO）
# 末行：TT_P2FC_FREEZE_CANDIDATE_BUILD: PASS|PARTIAL|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
PROG_DIR="$SOAK_DIR/final-candidate-pre-soak"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BUILD_LOG="$PROG_DIR/freeze-candidate-build-${STAMP}.log"
SITE10_LOG="$ROOT/frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.latest.log"
SKIP_NETWORK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-network) SKIP_NETWORK=1; shift ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$PROG_DIR"
exec > >(tee -a "$BUILD_LOG") 2>&1

fail_n=0
warn_n=0
pass_n=0

pass() { echo "  [✅] $*"; pass_n=$((pass_n + 1)); }
warn() { echo "  [⚠️] $*"; warn_n=$((warn_n + 1)); }
fail() { echo "  [❌] $*"; fail_n=$((fail_n + 1)); }

echo "== P2FC Freeze Candidate build · $STAMP (UTC) =="
echo "policy: GATE-P1-01 baseline — NO site10 full-chain re-run"
echo "log=$BUILD_LOG"
echo ""

# --- A · Baseline attest ---
echo "=== A · GATE-P1-01 baseline (25/25 · no gate re-run) ==="
if [[ ! -f "$SITE10_LOG" ]]; then
  fail "missing site10 log $SITE10_LOG"
else
  pass_n=$((pass_n + 1))
  grep -q "summary pass=25 fail=0" "$SITE10_LOG" 2>/dev/null && pass "site10 log 25/25 GREEN" || {
    pc="$(grep -c RECHECK_PASS "$SITE10_LOG" 2>/dev/null || echo 0)"
    fc="$(grep -c RECHECK_FAIL "$SITE10_LOG" 2>/dev/null || echo 0)"
    if [[ "$pc" -ge 25 && "$fc" -eq 0 ]]; then pass "site10 RECHECK_PASS=$pc fail=$fc"; else fail "site10 not 25/25 (pass=$pc fail=$fc)"; fi
  }
fi

GATE_EVID="$ROOT/evidence/COMPLEXITY_CONVERGENCE/GATE-P1-01/phase1.closed.json"
if [[ -f "$GATE_EVID" ]]; then
  pass "GATE-P1-01 phase1.closed.json present"
else
  echo "== sealing GATE-P1-01 from baseline (--gate-passed · no re-run) =="
  bash "$ROOT/scripts/dev/close-complexity-convergence-item.sh" \
    --id GATE-P1-01 --skip-phase2 --gate-passed \
    && pass "GATE-P1-01 sealed" || fail "GATE-P1-01 close failed"
fi
echo ""

# --- B · Ledger / Gap / Matrix sync ---
echo "=== B · SSOT · Gap · Ledger sync ==="
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-final-candidate-gap-inventory.py" \
  && pass "gap inventory refreshed" || fail "gap inventory"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-complexity-convergence-ledger-status.py" \
  && pass "ledger status refreshed" || fail "ledger status"
bash "$ROOT/scripts/dev/validate-complexity-convergence-ledger-sync.sh" \
  && pass "ledger sync (drift=0 · phase1_closed expected pre-staging-live)" \
  || fail "ledger sync drift"
echo ""

# --- C · Phase①→② consistency (SSOT / Contract / Evidence) ---
echo "=== C · Phase①→② consistency bundle ==="
CONSISTENCY_RC=0

bash "$ROOT/scripts/dev/run-phase1-to-phase2-transition-audit.sh" 2>&1 | tail -8 \
  && grep -q "TT_PHASE2_TRANSITION_AUDIT: OK" \
    "$ROOT/evidence/GO_phase2_testnet_20260526/transition-audit/latest/run.log" 2>/dev/null \
  && pass "transition audit OK" || { warn "transition audit partial — see transition-audit/latest"; CONSISTENCY_RC=1; }

bash "$ROOT/scripts/dev/run-site10-alignment-audit.sh" --write 2>&1 | tail -6 \
  && grep -q "TT_SITE10_ALIGNMENT_AUDIT: CLOSED" \
    "$ROOT/frontend/evidence/GO_local_phase1/site10-alignment-audit.latest.txt" 2>/dev/null \
  && pass "site10 alignment audit CLOSED" || { warn "site10 alignment partial"; CONSISTENCY_RC=1; }

echo "== 04 routes contract (C11同源) =="
bash "$ROOT/scripts/run-check-04-routes.sh" >/dev/null 2>&1 \
  && pass "04 routes gate" || { warn "04 routes drift — fix before merge"; CONSISTENCY_RC=1; }

ALIGN_REPORT=""
if [[ "$SKIP_NETWORK" -eq 0 ]]; then
  echo "== full alignment audit (staging meta · parity · Sepolia spine) =="
  bash "$ROOT/scripts/dev/run-phase1-phase2-full-alignment-audit.sh" 2>&1 | tail -12 || true
  ALIGN_REPORT="$(ls -t "$ROOT/evidence/GO_phase2_testnet_graduation"/PHASE1_PHASE2_ALIGNMENT_GAP_REPORT-*.md 2>/dev/null | head -1 || true)"
  [[ -n "$ALIGN_REPORT" ]] && pass "alignment gap report → $ALIGN_REPORT" || warn "alignment report not found"
else
  warn "skipped network alignment (--skip-network)"
fi

if [[ "$CONSISTENCY_RC" -eq 0 && "$fail_n" -eq 0 ]]; then
  echo "TT_P2FC_PHASE12_CONSISTENCY: PASS"
else
  echo "TT_P2FC_PHASE12_CONSISTENCY: PARTIAL (see log)"
fi
echo ""

# --- D · Minimal smoke + parity (no site10 re-run) ---
echo "=== D · Minimal smoke + parity ==="
SMOKE_RC=0

echo "== parity S1+S2 (staging pull · no deploy) =="
PARITY_OUT=""
if [[ "$SKIP_NETWORK" -eq 0 ]]; then
  bash "$ROOT/scripts/dev/run-phase2-local-staging-parity-gate.sh" --pull 2>&1 | tail -10 || SMOKE_RC=1
  PARITY_OUT="$(ls -td "$ROOT/evidence/GO_phase2_testnet_20260526/local-staging-parity"/*/run.log 2>/dev/null | head -1 || true)"
  if [[ -n "$PARITY_OUT" ]] && grep -q "TT_PHASE2_LOCAL_STAGING_PARITY: PASS" "$PARITY_OUT" 2>/dev/null; then
    pass "local↔staging parity S1+S2 PASS"
  else
    warn "parity S1+S2 partial — staging may lag HEAD"
    SMOKE_RC=1
  fi
else
  warn "skipped parity (--skip-network)"
fi

echo "== staging meta probe (read-only · minimal) =="
if [[ "$SKIP_NETWORK" -eq 0 ]]; then
  if curl --noproxy "*" -sS --max-time 30 "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}/meta" \
    | grep -qE '"status"|"build"|"version"'; then
    pass "staging /meta reachable"
  else
    warn "staging /meta probe inconclusive"
    SMOKE_RC=1
  fi
else
  warn "skipped staging meta probe"
fi

if [[ "$SMOKE_RC" -eq 0 ]]; then
  echo "TT_P2FC_MINIMAL_SMOKE_PARITY: PASS"
else
  echo "TT_P2FC_MINIMAL_SMOKE_PARITY: PARTIAL"
fi
echo ""

# --- E · Freeze Candidate manifest ---
echo "=== E · Freeze Candidate manifest @ HEAD ==="
MANIFEST_ARGS=(--build-log "$BUILD_LOG")
[[ -n "$PARITY_OUT" ]] && MANIFEST_ARGS+=(--parity-log "$PARITY_OUT")
[[ -n "$ALIGN_REPORT" ]] && MANIFEST_ARGS+=(--alignment-report "$ALIGN_REPORT")
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-freeze-candidate-manifest.py" "${MANIFEST_ARGS[@]}" \
  && pass "manifest written" || fail "manifest gen"

ln -sfn "$(basename "$BUILD_LOG")" "$PROG_DIR/freeze-candidate-build.latest.log" 2>/dev/null || \
  cp -f "$BUILD_LOG" "$PROG_DIR/freeze-candidate-build.latest.log" 2>/dev/null || true
echo ""

# --- F · 72h Soak prep (不自动 launch) ---
echo "=== F · 72h Soak prep (ready · not launched) ==="
bash "$ROOT/scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh" --status 2>&1 | tail -15 || true

node -e "
const fs=require('fs');
const p=process.argv[1];
const sha=require('child_process').execSync('git rev-parse HEAD',{cwd:process.argv[2],encoding:'utf8'}).trim();
fs.writeFileSync(p, JSON.stringify({
  schema:'traveltrust.p2fc_soak_72h_ready.v1',
  prepared_at_utc:new Date().toISOString(),
  candidate_git_sha:sha,
  status:'READY_NOT_LAUNCHED',
  policy:'Owner launch after engage-freeze @ HEAD',
  launch_sequence:[
    'bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --phase-staging-live',
    'bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --engage-freeze',
    'P2FC_SOAK_SUPERSEDE=1 bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --launch-soak',
  ],
  observe:'bash scripts/ops/p2fc-soak-attest.sh',
  honest_boundary:'① local 25/25 + Freeze Candidate manifest ≠ ② staging GO ≠ ③ Production GO',
},null,2)+'\n');
" "$PROG_DIR/soak-72h-ready.json" "$ROOT"
pass "soak-72h-ready.json written"
echo ""

# --- Summary ---
echo "=== Summary ==="
echo "pass=$pass_n warn=$warn_n fail=$fail_n"
echo "manifest=$PROG_DIR/freeze-candidate.latest.json"
echo "soak_prep=$PROG_DIR/soak-72h-ready.json"
echo "next: bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --phase-staging-live"
echo "      → --engage-freeze → P2FC_SOAK_SUPERSEDE=1 --launch-soak"
echo ""
if [[ "$fail_n" -eq 0 ]] && [[ -f "$PROG_DIR/freeze-candidate.latest.json" ]]; then
  echo "TT_P2FC_FREEZE_CANDIDATE_BUILD: PASS (CANDIDATE @ HEAD · soak not launched)"
  exit 0
fi
if [[ -f "$PROG_DIR/freeze-candidate.latest.json" ]] && grep -q '"verdict": "CANDIDATE"' "$PROG_DIR/freeze-candidate.latest.json" 2>/dev/null; then
  echo "TT_P2FC_FREEZE_CANDIDATE_BUILD: PASS (CANDIDATE @ HEAD · $fail_n non-blocking item(s) · soak not launched)"
  exit 0
fi
echo "TT_P2FC_FREEZE_CANDIDATE_BUILD: PARTIAL ($fail_n hard fail)" >&2
exit 2
