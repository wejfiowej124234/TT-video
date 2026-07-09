#!/usr/bin/env bash
# ① Site10 · acquisition（PD-009 · F-022/F-031 · identities）桶窄切片复跑（10 spec · 扩展 phase）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/_site10-bucket-narrow-recheck-common.sh
source "$ROOT/scripts/dev/_site10-bucket-narrow-recheck-common.sh"
site10_bucket_narrow_recheck_export_env "$ROOT"

OUT="$ROOT/frontend/evidence/GO_local_phase1/site10-acquisition-bucket-narrow-recheck.latest.log"

SPECS=(
  e2e/f021-f022-f023-request.spec.ts
  e2e/f029-f030-f031-request.spec.ts
  e2e/me-identities-core-hub.spec.ts
  e2e/93-matrix-path-did-rank-boards.spec.ts
  e2e/local-six-account-matrix-ui-l5-audit.spec.ts
  e2e/phase28-human-acceptance-browser.spec.ts
  e2e/site-theme-v1-v2-hard-refresh.spec.ts
  e2e/site-theme-v1-evidence-capture.spec.ts
  e2e/p0-spine-real-api-session.spec.ts
  e2e/market-subsite-studio-and-community-publish.spec.ts
)

site10_run_bucket_narrow_recheck "$ROOT" "acquisition" "$OUT" "TT_SITE10_ACQUISITION_BUCKET_NARROW_RECHECK: OK" "${SPECS[@]}"
