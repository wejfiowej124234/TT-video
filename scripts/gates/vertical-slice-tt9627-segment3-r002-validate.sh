#!/usr/bin/env bash
# TT-9627 §3 — R-002: machine-validate an existing report.json.
# Does NOT generate reports, run 93, or claim staging; use after you have a report path (evidence/GO_*/report.json).
#
# Usage (from repo root):
#   bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh evidence/GO_20260418/report.json
#   REPORT_JSON=evidence/GO_20260418/report.json bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh
#
# Optional env (same semantics as scripts/validate-regression-report.py):
#   R002_FAIL_ON_NO_GO=1           → --fail-on-no-go
#   R002_REQUIRE_GO=1            → --require-go
#   R002_FAIL_ON_CASE_NOT_RUN=1  → --fail-on-case-not-run
#   R002_VALIDATE_ORCHESTRATION=1 → --validate-orchestration
#
# See: docs/spec/R-002-回归执行闭环与发布准入.md §1; TT-9627 §3.3

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

pick_py() {
  if [[ -n "${PYTHON:-}" ]] && command -v "${PYTHON}" >/dev/null 2>&1 && "${PYTHON}" -c "import sys" >/dev/null 2>&1; then
    echo "${PYTHON}"
    return 0
  fi
  for c in python3 python; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys" >/dev/null 2>&1; then
      echo "$c"
      return 0
    fi
  done
  return 1
}
py="$(pick_py)" || {
  echo "vertical-slice-tt9627-segment3-r002-validate: need python3 or python on PATH (or set PYTHON)" >&2
  exit 2
}

RPT="${1:-${REPORT_JSON:-${TRAVELTRUST_R002_REPORT_PATH:-}}}"
if [[ -z "${RPT}" ]]; then
  echo "error: pass report.json path as argv1 or set REPORT_JSON / TRAVELTRUST_R002_REPORT_PATH" >&2
  echo "read: docs/spec/R-002-回归执行闭环与发布准入.md §1; docs/runbook/TT-9627-delivery-order-spine-then-full-site.md §3.3" >&2
  echo "path convention (no repo-root default): docs/runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-report-json-path-convention" >&2
  exit 2
fi
if [[ ! -f "$RPT" ]]; then
  echo "error: file not found: $RPT" >&2
  exit 2
fi

ARGS=("$py" scripts/validate-regression-report.py "$RPT")
if [[ "${R002_FAIL_ON_NO_GO:-}" == "1" ]]; then ARGS+=(--fail-on-no-go); fi
if [[ "${R002_REQUIRE_GO:-}" == "1" ]]; then ARGS+=(--require-go); fi
if [[ "${R002_FAIL_ON_CASE_NOT_RUN:-}" == "1" ]]; then ARGS+=(--fail-on-case-not-run); fi
if [[ "${R002_VALIDATE_ORCHESTRATION:-}" == "1" ]]; then ARGS+=(--validate-orchestration); fi

"${ARGS[@]}"
echo "OK: vertical-slice-tt9627-segment3-r002-validate ($RPT)"
exit 0
