#!/usr/bin/env bash
# ① r22b top-3 REAL FAIL 聚类窄矩阵（smoke-admin · governance · other）— 非 846 全量
#
# 用法（仓库根）：
#   bash scripts/dev/run-site10-r22b-top3-narrow-recheck.sh
#
# SSOT diff: frontend/evidence/GO_local_phase1/site10-r22b-vs-r21-diff.txt
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/_site10-bucket-narrow-recheck-common.sh
source "$ROOT/scripts/dev/_site10-bucket-narrow-recheck-common.sh"
site10_bucket_narrow_recheck_export_env "$ROOT"

# 屏障降级后：窄矩阵不启用 ROUTE_EXECUTION_BARRIER（避免 marker 全量 goto 扩散）
unset PLAYWRIGHT_ROUTE_EXECUTION_BARRIER

EVID="$ROOT/frontend/evidence/GO_local_phase1"
OUT="$EVID/site10-r22b-top3-narrow-recheck.latest.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

SMOKE_ADMIN_SPECS=(
  e2e/smoke.spec.ts
  e2e/smoke-admin-extended.spec.ts
  e2e/smoke-community.spec.ts
)

GOVERNANCE_SPECS=(
  e2e/smoke-governance.spec.ts
  e2e/governance-params-full-l5.spec.ts
  e2e/ai-pre-human-uat-governance.spec.ts
  e2e/release-flow.spec.ts
)

OTHER_SPECS=(
  e2e/53-main-path.spec.ts
  e2e/home-landing-shell.spec.ts
  e2e/guide-register-l5.spec.ts
  e2e/me-onboarding-96-18-shell.spec.ts
  e2e/itinerary-date-as-source-corridor.spec.ts
  e2e/p03-tourist-guide-accept.spec.ts
  e2e/p04-bilateral-confirm.spec.ts
)

run_cluster() {
  local label="$1"
  shift
  local -a specs=("$@")
  local fail=0 pass=0 spec rc
  echo "== cluster: $label (${#specs[@]} spec files) ==" | tee -a "$OUT"
  for spec in "${specs[@]}"; do
    echo "-- $spec --" | tee -a "$OUT"
    set +e
    (
      cd "$ROOT/frontend"
      env -u REQUIRE_IDEMPOTENCY_KEY node ./scripts/run-e2e-default.mjs "$spec" --project=chromium
    ) 2>&1 | tee -a "$OUT"
    rc=${PIPESTATUS[0]}
    set -e
    if [[ "$rc" -eq 0 ]]; then
      pass=$((pass + 1))
      echo "CLUSTER_PASS[$label]: $spec" | tee -a "$OUT"
    else
      fail=$((fail + 1))
      echo "CLUSTER_FAIL[$label]: $spec (exit $rc)" | tee -a "$OUT"
    fi
    echo "" | tee -a "$OUT"
  done
  echo "# cluster $label pass=$pass fail=$fail total=${#specs[@]}" | tee -a "$OUT"
  if [[ "$fail" -ne 0 ]]; then
    return 1
  fi
  return 0
}

{
  echo "# site10 r22b top-3 narrow recheck · $STAMP (UTC)"
  echo "# clusters: smoke-admin governance other · barrier marker downgrade active"
  echo "# PLAYWRIGHT_ROUTE_EXECUTION_BARRIER=${PLAYWRIGHT_ROUTE_EXECUTION_BARRIER:-unset}"
  echo ""
} >"$OUT"

total_fail=0
run_cluster "smoke-admin" "${SMOKE_ADMIN_SPECS[@]}" || total_fail=$((total_fail + 1))
run_cluster "governance" "${GOVERNANCE_SPECS[@]}" || total_fail=$((total_fail + 1))
run_cluster "other" "${OTHER_SPECS[@]}" || total_fail=$((total_fail + 1))

{
  echo ""
  echo "# summary clusters_failed=$total_fail/3 · $STAMP"
} | tee -a "$OUT"

if [[ "$total_fail" -ne 0 ]]; then
  echo "TT_SITE10_R22B_TOP3_NARROW_RECHECK: FAIL ($total_fail/3 clusters) → $OUT" >&2
  exit 1
fi

echo "TT_SITE10_R22B_TOP3_NARROW_RECHECK: OK (3/3 clusters) → $OUT"
