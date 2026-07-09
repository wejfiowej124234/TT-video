#!/usr/bin/env bash
# ① Site10 · community 桶窄切片复跑（rerun20=49 面 · 同源聚类修复验收 · 非全矩阵）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

source "$ROOT/scripts/dev/export-database-url-from-root-env.sh"

export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
export PLAYWRIGHT_E2E_STABILITY="${PLAYWRIGHT_E2E_STABILITY:-1}"
export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
export PLAYWRIGHT_SKIP_NEXT_PURGE="${PLAYWRIGHT_SKIP_NEXT_PURGE:-1}"
export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE="${TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE:-1}"
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE="${NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE:-1}"

OUT="$ROOT/frontend/evidence/GO_local_phase1/site10-community-bucket-narrow-recheck.latest.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

SPECS=(
  e2e/community-friends-messages-flow.spec.ts
  e2e/community-me-data-state.spec.ts
  e2e/community-modals-interaction.spec.ts
  e2e/community-phase1-narrow-flows.spec.ts
  e2e/community-post-detail-collect-persist-after-reload.spec.ts
  e2e/community-post-detail-comment-sort.spec.ts
  e2e/community-post-detail-like-persist-after-reload.spec.ts
  e2e/market-subsite-studio-and-community-publish.spec.ts
  e2e/me-security-community-hub.spec.ts
  e2e/o-s2-official-guides-community-publishing.spec.ts
)

{
  echo "# site10 community bucket narrow recheck · $STAMP (UTC)"
  echo "# specs=${#SPECS[@]} · baseline rerun20 community=16"
  echo ""
} >"$OUT"

fail=0
pass=0

for spec in "${SPECS[@]}"; do
  echo "== recheck: $spec ==" | tee -a "$OUT"
  set +e
  (
    cd "$ROOT/frontend"
    env -u REQUIRE_IDEMPOTENCY_KEY node ./scripts/run-e2e-default.mjs "$spec" --project=chromium
  ) 2>&1 | tee -a "$OUT"
  rc=${PIPESTATUS[0]}
  set -e
  if [[ "$rc" -eq 0 ]]; then
    pass=$((pass + 1))
    echo "RECHECK_PASS: $spec (exit 0)" | tee -a "$OUT"
  else
    fail=$((fail + 1))
    echo "RECHECK_FAIL: $spec (exit $rc)" | tee -a "$OUT"
  fi
  echo "" | tee -a "$OUT"
done

{
  echo "# summary pass=$pass fail=$fail total=${#SPECS[@]} · $STAMP"
} | tee -a "$OUT"

if [[ "$fail" -ne 0 ]]; then
  echo "site10-community-bucket-narrow-recheck: FAIL ($fail/${#SPECS[@]}) → $OUT" >&2
  exit 1
fi

echo "site10-community-bucket-narrow-recheck: OK ($pass/${#SPECS[@]}) → $OUT"
echo "TT_SITE10_COMMUNITY_BUCKET_NARROW_RECHECK: OK"
