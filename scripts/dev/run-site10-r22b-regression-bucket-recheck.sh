#!/usr/bin/env bash
# ① 22-key oracle · 分桶窄复跑（smoke-admin · other · community）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/_site10-bucket-narrow-recheck-common.sh
source "$ROOT/scripts/dev/_site10-bucket-narrow-recheck-common.sh"
site10_bucket_narrow_recheck_export_env "$ROOT"
export PLAYWRIGHT_LOCAL_SITE10_MATRIX="${PLAYWRIGHT_LOCAL_SITE10_MATRIX:-1}"
unset PLAYWRIGHT_ROUTE_EXECUTION_BARRIER
unset REQUIRE_IDEMPOTENCY_KEY

EVID="$ROOT/frontend/evidence/GO_local_phase1"
OUT="$EVID/site10-r22-regression-bucket-recheck.latest.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

SMOKE_ADMIN=(e2e/smoke.spec.ts)
OTHER=(
  e2e/guide-register-l5.spec.ts
  e2e/home-landing-shell.spec.ts
  e2e/itinerary-date-as-source-corridor.spec.ts
  e2e/me-onboarding-96-18-shell.spec.ts
  e2e/p03-tourist-guide-accept.spec.ts
  e2e/p04-bilateral-confirm.spec.ts
  e2e/governance-params-full-l5.spec.ts
  e2e/smoke-governance.spec.ts
  e2e/orders-list-keyboard.spec.ts
)
COMMUNITY=(e2e/section10-5-login-community-feed.spec.ts)

run_bucket() {
  local label="$1"
  shift
  local -a specs=("$@")
  local fail=0 pass=0 spec rc
  echo "== bucket: $label (${#specs[@]} specs) ==" | tee -a "$OUT"
  for spec in "${specs[@]}"; do
    echo "-- $spec --" | tee -a "$OUT"
    set +e
    (cd "$ROOT/frontend" && env -u REQUIRE_IDEMPOTENCY_KEY node ./scripts/run-e2e-default.mjs "$spec" --project=chromium) 2>&1 | tee -a "$OUT"
    rc=${PIPESTATUS[0]}
    set -e
    if [[ "$rc" -eq 0 ]]; then pass=$((pass + 1)); echo "BUCKET_PASS[$label]: $spec" | tee -a "$OUT"
    else fail=$((fail + 1)); echo "BUCKET_FAIL[$label]: $spec (exit $rc)" | tee -a "$OUT"; fi
    echo "" | tee -a "$OUT"
  done
  echo "# bucket $label pass=$pass fail=$fail total=${#specs[@]}" | tee -a "$OUT"
  [[ "$fail" -eq 0 ]]
}

{
  echo "# site10 r22 regression bucket recheck · $STAMP"
  echo "# buckets: smoke-admin other community"
  echo ""
} >"$OUT"

total=0
run_bucket smoke-admin "${SMOKE_ADMIN[@]}" || total=$((total + 1))
run_bucket other "${OTHER[@]}" || total=$((total + 1))
run_bucket community "${COMMUNITY[@]}" || total=$((total + 1))

echo "# summary buckets_failed=$total/3 · $STAMP" | tee -a "$OUT"
if [[ "$total" -ne 0 ]]; then
  echo "TT_SITE10_R22_REGRESSION_BUCKET_RECHECK: FAIL ($total/3) → $OUT" >&2
  exit 1
fi
echo "TT_SITE10_R22_REGRESSION_BUCKET_RECHECK: OK (3/3 buckets) → $OUT"
