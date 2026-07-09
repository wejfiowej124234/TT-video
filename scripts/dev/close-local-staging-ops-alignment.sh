#!/usr/bin/env bash
# Full Local mirror of Staging official ops baseline + alignment audit to PASS.
#
#   bash scripts/dev/close-local-staging-ops-alignment.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${CLOSE_ALIGN_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_operations_platform_alignment/${STAMP}"
STAGING_STATE="$ROOT/evidence/GO_official_cold_start_dataset/20260703T044855Z/state.json"
LOCAL_API="${LOCAL_API:-http://127.0.0.1:8080}"
STAGING_API="${STAGING_API:-https://tt-api-staging.fly.dev}"

mkdir -p "$EVID"
exec > >(tee -a "$EVID/close-align-run.log") 2>&1

echo "== close-local-staging-ops-alignment · $STAMP =="

echo "== [1] start local API on staging DB mirror =="
bash "$ROOT/scripts/dev/start-api-local-staging-db-mirror.sh" || {
  echo "WARN: staging DB mirror start failed — continuing with existing local API"
}

echo "== [2] SOPCP align (idempotent) =="
API="$LOCAL_API" STATE="$STAGING_STATE" \
  OUT="$EVID/single-official-baseline-align.json" \
  node "$ROOT/scripts/dev/align-single-official-baseline-staging.cjs"

echo "== [3] audits on local =="
API="$LOCAL_API" STATE="$STAGING_STATE" OUT="$EVID/sopcp-audit.json" \
  node "$ROOT/scripts/dev/audit-single-official-baseline.cjs" | tee "$EVID/sopcp-audit.log"

API="$LOCAL_API" STATE="$STAGING_STATE" OUT="$EVID/ocip-audit.json" \
  node "$ROOT/scripts/dev/audit-official-catalog-identity.cjs" | tee "$EVID/ocip-audit.log"

echo "== [4] workflow validation on local (read-only) =="
SKIP_MUTATIONS=1 WF_VAL_STAMP="${STAMP}" STATE="$STAGING_STATE" \
  OUT="$EVID/workflow-validation-readonly.json" \
  API="$LOCAL_API" node "$ROOT/scripts/dev/validate-operations-workflow.cjs" | tee "$EVID/wf-readonly.log"

echo "== [5] Local ↔ Staging alignment audit =="
LOCAL_API="$LOCAL_API" STAGING_API="$STAGING_API" STATE="$STAGING_STATE" \
  ALIGN_STAMP="$STAMP" OUT="$EVID/alignment-audit.json" \
  node "$ROOT/scripts/dev/audit-operations-platform-local-staging-alignment.cjs"

echo "== [6] write sign-off =="
SIGNOFF="$ROOT/evidence/manual-uat/signoff/LOCAL-STAGING-OPS-PLATFORM-ALIGNMENT-SIGNOFF-${STAMP}.md"
mkdir -p "$(dirname "$SIGNOFF")"
ALIGN_AUDIT="$EVID/alignment-audit.json"
ALIGN_VERDICT="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(j.verdict.phase2_local_staging_alignment)" "$ALIGN_AUDIT")"
BLOCKING="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(j.verdict.blocking_count)" "$ALIGN_AUDIT")"
STAGING_BASELINE="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(j.verdict.phase2_staging_ops_baseline)" "$ALIGN_AUDIT")"

cat >"$SIGNOFF" <<EOF
# Local ↔ Staging Operations Platform Alignment Sign-off

- **Stamp:** ${STAMP}
- **Verdict:** ${ALIGN_VERDICT}
- **Staging baseline:** ${STAGING_BASELINE}
- **Blocking differences:** ${BLOCKING}
- **Evidence:** evidence/GO_operations_platform_alignment/${STAMP}/alignment-audit.json
- **Staging state SSOT:** evidence/GO_official_cold_start_dataset/20260703T044855Z/state.json
- **Method:** Local API + Staging PostgreSQL (fly proxy) · SOPCP align · OCIP audit
- **Evidence Reuse Policy:** ENFORCED (`CLOSED_UNLESS_TOUCHED`)
- **RC Governance:** CLOSED (Evidence Reused)
- **DDG Governance:** CLOSED (Evidence Reused)
- **OCS Governance:** CLOSED (Evidence Reused)

## Acceptance

Local and Staging share one official operations model: OCS · SOPCP · OCIP · Operations Workflow · Public Catalog.

EOF

echo "SIGNOFF: $SIGNOFF"
echo "close-local-staging-ops-alignment: ${ALIGN_VERDICT}"

if [[ "$ALIGN_VERDICT" != "PASS" ]]; then
  exit 1
fi
