#!/usr/bin/env bash
# Ops planes freeze matrix verification（PI3-004 · static SSOT + optional live gates）
#
#   bash scripts/dev/verify-pi3-004-ops-planes-freeze-matrix.sh
#   PI3_004_RUN_LIVE_FREEZE_GATES=1 bash scripts/dev/verify-pi3-004-ops-planes-freeze-matrix.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LIVE="${PI3_004_RUN_LIVE_FREEZE_GATES:-0}"

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

section "1 · 148 Sepolia scope lock"
rg -q 'PRODUCTION_SCOPE_SEPOLIA' "$ROOT/docs/handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md" \
  && pass "148 scope documented" || fail "148 scope missing"

section "2 · Freeze gate scripts (SSOT present)"
for pair in \
  "120 Catalog S5:scripts/check-s5-catalog-release-freeze.sh" \
  "146 C-S6 opt-in:scripts/check-c-s6-catalog-consumer-opt-in-cutover.sh" \
  "133 Growth G-S8:scripts/check-g-s8-growth-release-freeze.sh" \
  "145 Ops platform:scripts/check-operations-platform-release-freeze.sh" \
  "149 Ops E2E:scripts/check-operations-e2e-acceptance.sh" \
  "150 Cold Start:scripts/check-e2e-a-01-cold-start-campaign-consumer.sh" \
  "O-S4 Admin:scripts/check-o-s4-cold-start-campaigns-deployment-operations.sh"; do
  label="${pair%%:*}"
  script="${pair#*:}"
  [[ -f "$ROOT/$script" ]] && pass "${label} gate script" || fail "missing ${script}"
done

section "3 · Frozen engineering reports (static GO/HOLD markers)"
while IFS='|' read -r id marker doc; do
  [[ -z "$id" ]] && continue
  if rg -q "$marker" "$ROOT/docs/handbook/engineering/$doc" 2>/dev/null; then
    pass "${id} report ${marker}"
  else
    fail "${id} report missing ${marker}"
  fi
done <<'EOF'
120|CATALOG_RELEASE_FREEZE_GO|120-S5-Catalog-Release-Freeze-Report.md
133|GROWTH_RELEASE_FREEZE_GO|133-G-S8-Growth-Release-Freeze-Report.md
145|OPERATIONS_PLATFORM_GO|145-Operations-Platform-Release-Freeze-Report.md
149|OPERATIONS_E2E_ACCEPTANCE_GO|149-Operations-E2E-Acceptance-Report.md
150|E2E_A_01_COLD_START_CAMPAIGN_CONSUMER_GO|150-E2E-A-01-ColdStart-Campaign-Consumer-Report.md
EOF

section "4 · Prod catalog defaults (146 · prod ENABLED=0)"
[[ -f "$ROOT/deploy/fly/tt-web-prod/build.env.sepolia-prod.example" ]] \
  && pass "prod build.env.sepolia-prod.example" || fail "missing prod build template"

section "5 · Optional live freeze gate re-run"
if [[ "$LIVE" == "1" ]]; then
  run_gate() {
    local label="$1" script="$2"
    if bash "$ROOT/$script" >/dev/null 2>&1; then pass "LIVE ${label}"; else fail "LIVE ${label}"; fi
  }
  run_gate "120 S5" "scripts/check-s5-catalog-release-freeze.sh"
  run_gate "146 C-S6" "scripts/check-c-s6-catalog-consumer-opt-in-cutover.sh"
  run_gate "133 G-S8" "scripts/check-g-s8-growth-release-freeze.sh"
  run_gate "145 Ops" "scripts/check-operations-platform-release-freeze.sh"
  run_gate "149 E2E" "scripts/check-operations-e2e-acceptance.sh"
  run_gate "150 Cold Start" "scripts/check-e2e-a-01-cold-start-campaign-consumer.sh"
else
  warn "PI3_004_RUN_LIVE_FREEZE_GATES unset — skip live Playwright/API gate re-run (154 static SSOT only)"
fi

echo ""
echo "verify-pi3-004-ops-planes-freeze-matrix: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
