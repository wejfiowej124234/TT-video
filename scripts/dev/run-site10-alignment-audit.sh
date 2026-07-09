#!/usr/bin/env bash
# ① Site10 · Alignment Audit（22-key denoised G2/G3 收敛轨 · 步骤 2）
#
# 入口：TT_SITE10_G2G3_CONVERGENCE_READY: OK + S3/S1 precheck PASS
# 出口：TT_SITE10_ALIGNMENT_AUDIT: CLOSED
#
#   bash scripts/dev/run-site10-alignment-audit.sh
#   bash scripts/dev/run-site10-alignment-audit.sh --write
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
OUT="$EVID/site10-alignment-audit.latest.txt"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

write=0
[[ "${1:-}" == "--write" ]] && write=1

fail_n=0
pass_n=0
audit_rc=0

pass() { echo "  [✅] $*"; pass_n=$((pass_n + 1)); }
fail() { echo "  [❌] $*"; fail_n=$((fail_n + 1)); audit_rc=2; }

require_file() {
  local f="$1" label="$2"
  if [[ -f "$f" ]]; then pass "$label → $f"; else fail "$label missing: $f"; fi
}

require_grep() {
  local f="$1" pat="$2" label="$3"
  if [[ -f "$f" ]] && grep -qE "$pat" "$f" 2>/dev/null; then
    pass "$label"
  else
    fail "$label (grep $pat in $f)"
  fi
}

run_audit() {
  echo "Site10 Alignment Audit · $STAMP (UTC)"
  echo "Track: 22-key denoised oracle (NOT 846/844 full matrix truth source)"
  echo "SSOT: docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md §1.4.0 · §1.4.2"
  echo ""

  echo "=== Precondition · G2/G3 + precheck ==="
  require_grep "$EVID/site10-g2g3-convergence-acceptance.latest.log" \
    "TT_SITE10_G2G3_CONVERGENCE_READY: OK" "G2/G3 convergence acceptance"
  require_grep "$EVID/site10-r22b-denoised-regression-parse.txt" \
    "run_complete: True" "parse run_complete"
  require_grep "$EVID/site10-r22b-denoised-regression-parse.txt" \
    "still RED in manifest: 0" "manifest RED=0"
  require_grep "$EVID/site10-phase2-s3-local-test.latest.log" \
    "TT_PHASE2_LOCAL_STAGING_PARITY: PASS" "S3 local parity (precheck)"
  require_grep "$EVID/site10-phase2-s1-staging-alignment.latest.log" \
    "FAIL=0" "S1 staging alignment FAIL=0"
  echo ""

  echo "=== Exit 1 · 代码真源一致 ==="
  require_file "$ROOT/frontend/e2e/helpers/seedPaidMarketEntitlements.ts" "async pg seed helper"
  if [[ -f "$ROOT/frontend/e2e/helpers/seedPaidMarketEntitlements.ts" ]] \
    && ! grep -q "execFileSync" "$ROOT/frontend/e2e/helpers/seedPaidMarketEntitlements.ts" 2>/dev/null; then
    pass "seedPaidMarketEntitlements: no sync docker exec"
  else
    fail "seedPaidMarketEntitlements still uses execFileSync"
  fi
  require_file "$EVID/site10-r22-true-regression-manifest.txt" "22-key manifest"
  require_file "$ROOT/scripts/dev/parse-site10-denoised-regression.py" "denoised parse script"
  echo ""

  echo "=== Exit 2 · 文档真源一致 ==="
  require_grep "$ROOT/frontend/evidence/GO_local_phase1/README.md" "7h · G2G3" "GO_local_phase1 README §7h"
  require_grep "$ROOT/docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md" "1\\.4\\.0" "ENTERPRISE-SITE-10 §1.4.0 denoised track"
  require_file "$EVID/site10-phase2-staging-precheck.latest.txt" "phase2 staging precheck"
  echo ""

  echo "=== Exit 3 · 脚本真源一致 ==="
  require_file "$ROOT/scripts/dev/run-site10-r22b-denoised-regression-matrix.sh" "denoised matrix runner"
  require_grep "$ROOT/scripts/dev/run-site10-r22b-denoised-regression-matrix.sh" \
    "846 full matrix intentionally NOT" "matrix script 846 boundary"
  require_file "$ROOT/scripts/dev/run-phase2-local-staging-parity-gate.sh" "parity gate script"
  echo ""

  echo "=== Exit 4 · G2/G3 引用一致（22-key · 非 846 冒充） ==="
  require_grep "$EVID/site10-r22b-gates.txt" \
    "denoised 22-key regression matrix: OK" "gates file G2/G3 denoised OK"
  if grep -rq "846 full matrix" "$EVID/site10-g2g3-convergence-acceptance.latest.log" \
    "$EVID/site10-r22b-gates.txt" "$EVID/site10-phase2-staging-precheck.latest.txt" 2>/dev/null; then
    pass "evidence chain documents 846 boundary"
  else
    fail "846 boundary missing in evidence chain"
  fi
  echo ""

  echo "=== Exit 5 · SSOT 无冲突（阶段 · 禁止假完成） ==="
  require_grep "$EVID/site10-g2g3-convergence-acceptance.latest.log" \
    "not ②③ GO" "phase discipline in acceptance"
  require_file "$EVID/site10-r22b-extra-warn-register.txt" "extra WARN register (non-blocking)"
  echo ""

  echo "=== Exit 6 · 历史口径已归档 ==="
  require_file "$EVID/site10-r22b-vs-r21-tier-attribution.txt" "r22b tier attribution"
  require_grep "$EVID/site10-r22b-vs-r21-tier-attribution.txt" "Run4 收敛签字" "Run4 closure note in attribution"
  require_file "$EVID/site10-r22b-denoised-regression-run4.stdout.log" "Run4 stdout archive"
  echo ""

  echo "=== Summary ==="
  echo "pass=$pass_n fail=$fail_n"
  if [[ "$fail_n" -eq 0 ]]; then
    echo "TT_SITE10_ALIGNMENT_AUDIT: CLOSED (① · denoised 22-key · not ②③ GO)"
    echo "TT_SITE10_NON_GATE_REGISTRY: VERIFIED (① corridor · ② pre-graduation backlog)"
    return 0
  fi
  echo "TT_SITE10_ALIGNMENT_AUDIT: FAIL ($fail_n exit item(s) open)" >&2
  return 2
}

if [[ "$write" -eq 1 ]]; then
  run_audit | tee "$OUT"
  audit_rc=${PIPESTATUS[0]}
  echo "written → $OUT"
else
  run_audit
  audit_rc=$?
fi
exit "$audit_rc"
