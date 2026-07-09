#!/usr/bin/env bash
# ① Site10 · admin（smoke-admin + admin-growth-ops）桶窄切片复跑（10 spec · 扩展 phase）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/_site10-bucket-narrow-recheck-common.sh
source "$ROOT/scripts/dev/_site10-bucket-narrow-recheck-common.sh"
site10_bucket_narrow_recheck_export_env "$ROOT"

OUT="$ROOT/frontend/evidence/GO_local_phase1/site10-admin-bucket-narrow-recheck.latest.log"

SPECS=(
  e2e/smoke-admin.spec.ts
  e2e/smoke-admin-extended.spec.ts
  e2e/c-s1-admin-content-crud.spec.ts
  e2e/c-s2-poi-media-review-workflow.spec.ts
  e2e/c-s3-catalog-operations-admin.spec.ts
  e2e/g-s5-admin-growth-fraud-reward-ops.spec.ts
  e2e/o-s1-official-accounts-management.spec.ts
  e2e/o-s3-official-itinerary-templates.spec.ts
  e2e/o-s4-cold-start-campaigns-deployment-operations.spec.ts
  e2e/admin-adm-u01-shell-browser-audit.spec.ts
)

site10_run_bucket_narrow_recheck "$ROOT" "admin" "$OUT" "TT_SITE10_ADMIN_BUCKET_NARROW_RECHECK: OK" "${SPECS[@]}"
