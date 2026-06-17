#!/usr/bin/env bash
# Phase① Convergence · post-change gate (dev → audit → fix → review → archive)
#
#   bash scripts/dev/run-phase1-convergence-post-change-gate.sh [--init-baseline]
#
# Merge discipline: MASTER green + baseline PASS (Readiness must not drop; no new P0)
# Success: TT_PHASE1_CONVERGENCE_POST_CHANGE: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
RUN_ROOT="$ROOT/evidence/GO_phase1_convergence/runs/${STAMP}"
PEB_OUT="$RUN_ROOT/peb"
INIT_BASELINE=0
fail=0

for arg in "$@"; do
  case "$arg" in
    --init-baseline) INIT_BASELINE=1 ;;
  esac
done

mkdir -p "$RUN_ROOT"
echo "== Phase① Convergence Post-Change Gate =="
echo "Run: evidence/GO_phase1_convergence/runs/${STAMP}"
echo "SSOT: docs/runbook/TT-PHASE1-CONVERGENCE-EXECUTION-DISCIPLINE.md"
echo "Standard: TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md v1.14.0"
echo ""

# 1) FULL MASTER
if bash "$ROOT/scripts/dev/run-phase1-convergence-full-master.sh" 2>&1 | tee "$RUN_ROOT/master.log"; then
  echo "OK   FULL MASTER"
else
  echo "FAIL FULL MASTER"
  fail=1
fi

# 2) PEB + EX artifacts (fresh copy under run dir)
if [[ "$fail" -eq 0 ]]; then
  echo ""
  echo "== Site page forensic (PF/UXA/AG execution track) =="
  if bash "$ROOT/scripts/dev/run-phase1-site-page-forensic.sh" 2>&1 | tee "$RUN_ROOT/site-page-forensic.log"; then
    echo "OK   Site page forensic"
  else
    echo "WARN Site page forensic (non-blocking for MASTER)"
  fi
fi

if [[ "$fail" -eq 0 ]]; then
  echo ""
  echo "== Regenerate PEB / EX / Dashboard =="
  if env PEB_AUDIT_OUT="$PEB_OUT" SKIP_DOMAIN_FZ=1 SKIP_DOMAIN_QA2=1 \
    bash "$ROOT/scripts/dev/run-phase1-executive-board-gate.sh" 2>&1 | tee "$RUN_ROOT/peb.log"; then
    echo "OK   PEB + EX"
  else
    echo "FAIL PEB + EX"
    fail=1
  fi
fi

# 3) Copy key Owner artifacts to run root for diff/archive
if [[ "$fail" -eq 0 && -f "$PEB_OUT/EXECUTIVE-FREEZE-DASHBOARD.md" ]]; then
  cp "$PEB_OUT/EXECUTIVE-FREEZE-DASHBOARD.md" "$RUN_ROOT/"
  cp "$PEB_OUT/phase1-readiness-score.v1.json" "$RUN_ROOT/" 2>/dev/null || true
  cp "$PEB_OUT/top10-root-causes.v1.json" "$RUN_ROOT/" 2>/dev/null || true
  cp "$PEB_OUT/top20-blockers.v1.json" "$RUN_ROOT/" 2>/dev/null || true
  if [[ -f "$PEB_OUT/execution-audit/CLOSURE-ROADMAP.md" ]]; then
    cp "$PEB_OUT/execution-audit/CLOSURE-ROADMAP.md" "$RUN_ROOT/"
  fi
  if [[ -f "$PEB_OUT/execution-audit/EXECUTION-DASHBOARD.md" ]]; then
    cp "$PEB_OUT/execution-audit/EXECUTION-DASHBOARD.md" "$RUN_ROOT/"
  fi
fi

# 4) Baseline compare
if [[ "$fail" -eq 0 ]]; then
  echo ""
  echo "== Baseline compare =="
  CMP_ARGS=("$PEB_OUT")
  if [[ "$INIT_BASELINE" -eq 1 ]]; then
    CMP_ARGS+=("--init-baseline")
  fi
  if python "$ROOT/scripts/dev/compare-phase1-convergence-baseline.py" "${CMP_ARGS[@]}" 2>&1 | tee "$RUN_ROOT/baseline-compare.log"; then
    echo "OK   Baseline compare"
  else
    echo "FAIL Baseline compare — Readiness regression or new P0"
    fail=1
  fi
fi

# 5) Summary for merge decision
echo ""
if [[ "$fail" -eq 0 ]]; then
  score="$(grep -o '"score": [0-9]*' "$PEB_OUT/phase1-readiness-score.v1.json" | tail -1 | grep -o '[0-9]*' || echo '?')"
  echo "TT_PHASE1_CONVERGENCE_POST_CHANGE: OK"
  echo "TT_FULL_SYSTEM_AUDIT_MASTER: READY"
  echo "Readiness: $score (targets: 90 FREEZE_CANDIDATE · 95 PHASE1_EXIT_READY)"
  echo "Owner dashboard: $RUN_ROOT/EXECUTIVE-FREEZE-DASHBOARD.md"
  echo "Merge to main: ALLOWED (① convergence rules met)"
  exit 0
fi

echo "TT_PHASE1_CONVERGENCE_POST_CHANGE: FAIL"
echo "Merge to main: BLOCKED — fix issues and re-run"
exit 1
