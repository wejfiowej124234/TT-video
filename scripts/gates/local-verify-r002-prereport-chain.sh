#!/usr/bin/env bash
# Local mirror of Build workflow e2e job R-002 slice (before git push).
# Requires: Python 3, sqlx CLI (when DATABASE_URL set), cargo, local Postgres + migrations.
#
# Usage:
#   DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust \
#   P3_CHAIN_OFF=1 \
#   bash scripts/gates/local-verify-r002-prereport-chain.sh
#
# Without DATABASE_URL: only Python compile + soft validate (anchors may be NOT_RUN).
#
# ISS-007 prereport: gen-r002 sets release_gate=PARTIAL_GO even when all anchors PASS (narrow slice).
# validate-regression-report.py: use --fail-on-no-go on this report.json; do not use --require-go alone
# as a staging full-matrix GO substitute. See evidence/GO_local_r002_verify/README.md (default EVDIR).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

py -3 -m py_compile \
  scripts/gen-r002-iss007-prereport.py \
  scripts/validate-regression-report.py \
  scripts/write-e2e-core-report-with-r002.py

EVDIR="${TRAVELTRUST_LOCAL_R002_EVIDENCE_DIR:-evidence/GO_local_r002_verify}"
mkdir -p "$EVDIR"
export TRAVELTRUST_R002_REPORT_PARENT="$EVDIR"
export EVIDENCE_DIR="$EVDIR"
RPT="${EVDIR}/r002_iss007_prereport/report.json"

if [[ -z "${DATABASE_URL:-}" ]]; then
  py -3 scripts/gen-r002-iss007-prereport.py
  py -3 scripts/validate-regression-report.py "$RPT"
  echo "OK (soft only; set DATABASE_URL for full 43-anchor + strict validate)."
  exit 0
fi

export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
sqlx migrate run --source crates/api/migrations

# Same as CI: gen-r002 runs each matrix_93 filter internally (no duplicate cargo here).
py -3 scripts/gen-r002-iss007-prereport.py
py -3 scripts/validate-regression-report.py "$RPT" --fail-on-no-go --fail-on-case-not-run
py -3 scripts/write-e2e-core-report-with-r002.py
py -3 - <<PY
import json
from pathlib import Path
p = Path("${RPT}")
d = json.loads(p.read_text(encoding="utf-8"))
assert d["summary"]["PASS"] == 43 and d["summary"]["NOT_RUN"] == 0, d["summary"]
core = json.loads(Path("${EVDIR}/e2e_core_report.json").read_text(encoding="utf-8"))
assert core.get("passed") is True
print("OK: strict R-002 chain + e2e_core_report.passed=true")
PY
