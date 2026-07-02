#!/usr/bin/env bash
# Release Pipeline SSOT gate — mandatory pre-production gates
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

REG="registry/release-pipeline.v1.yaml"
RUNBOOK="docs/runbook/TT-RELEASE-PIPELINE.md"
DDG="registry/display-data-governance.v1.yaml"
UAT="docs/runbook/TT-BUSINESS-MANUAL-UAT.md"

[[ -f "$REG" ]] || fail "missing $REG"
[[ -f "$RUNBOOK" ]] || fail "missing $RUNBOOK"
[[ -f "$DDG" ]] || fail "missing $DDG"
[[ -f "$UAT" ]] || fail "missing $UAT"

grep -q 'TT_RELEASE_PIPELINE: ENFORCED' "$REG" || fail "release pipeline machine key missing"
grep -q 'mandatory_pre_production_gates' "$REG" || fail "mandatory gates section missing"
grep -q 'DISPLAY_DATA_GOVERNANCE' "$REG" || fail "DDG gate missing in pipeline"
grep -q 'BUSINESS_MANUAL_UAT' "$REG" || fail "Business UAT gate missing in pipeline"
grep -q 'every_release: true' "$REG" || fail "every_release flags missing"
grep -q 'PI3-001' "$REG" || fail "PI3 items missing"
grep -q 'FRONTEND_API_CONSISTENCY_AUDIT' "$REG" || fail "Frontend-API audit gate missing"
grep -q 'Product Capability Complete' "$RUNBOOK" || fail "runbook pipeline order missing"

bash "$ROOT/scripts/gates/check-frontend-api-consistency-audit-ssot.sh"
bash "$ROOT/scripts/gates/check-display-data-governance-ssot.sh"

echo "PASS: release-pipeline SSOT"
