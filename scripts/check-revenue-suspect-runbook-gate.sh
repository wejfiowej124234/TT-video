#!/usr/bin/env bash
# B-426 · **Runbook** **锚** **+** **（** **可选** **）** **overview** **四** **键** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v jq >/dev/null 2>&1; then
  echo "check-revenue-suspect-runbook-gate: jq is required" >&2
  exit 1
fi

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then JSON=true
  else echo "check-revenue-suspect-runbook-gate: unknown option: $a" >&2; exit 1
  fi
done

if ! grep -q "B-426-REVENUE-SUSPECT-TRIAGE" "${ROOT}/ops/RUNBOOK.md"; then
  echo "check-revenue-suspect-runbook-gate: ops/RUNBOOK.md missing anchor B-426-REVENUE-SUSPECT-TRIAGE" >&2
  exit 2
fi
if ! grep -q "TT-B426" "${ROOT}/ops/RUNBOOK.md"; then
  echo "check-revenue-suspect-runbook-gate: ops/RUNBOOK.md missing TT-B426 pointer" >&2
  exit 2
fi

if [[ "${B426_SKIP_OVERVIEW:-}" == "1" ]]; then
  echo "check-revenue-suspect-runbook-gate: skip overview (B426_SKIP_OVERVIEW=1)" >&2
else
  if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
    echo "check-revenue-suspect-runbook-gate: ADMIN_BEARER_TOKEN required unless B426_SKIP_OVERVIEW=1" >&2
    exit 1
  fi
  BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
  BASE="${BASE%/}"
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT
  code="$(curl -sS -o "$tmp" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview")"
  if [[ "$code" != "200" ]]; then
    echo "check-revenue-suspect-runbook-gate: overview HTTP ${code}" >&2
    exit 3
  fi
  for k in revenue_pipeline_freshness_drift_suspect_observability revenue_pipeline_spread_dual_slack_triangulation_observability revenue_pipeline_spread_triangulation_concordance_bundle_observability revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability; do
    if ! jq -e ".overview | has(\"$k\")" "$tmp" >/dev/null 2>&1; then
      echo "check-revenue-suspect-runbook-gate: overview missing overview.$k" >&2
      exit 4
    fi
  done
fi

if $JSON; then
  jq -n \
    --arg schema "traveltrust.revenue_suspect_runbook_gate.v1" \
    --arg verdict "GO" \
    '{schema_version:$schema, verdict:$verdict, suspect_attribution_hints:{note:"see_ops_RUNBOOK_B426"}}'
else
  echo "check-revenue-suspect-runbook-gate: ok" >&2
fi
