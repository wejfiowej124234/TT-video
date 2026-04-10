#!/usr/bin/env bash
# Build workflow: baseline reminder + copy-paste triage template (no network).
set -euo pipefail

BASELINE_RUN_ID="24139191178"
BASELINE_SHA="2364f55"

CURRENT_SHA="${GITHUB_SHA:-unknown}"
RUN_ID="${GITHUB_RUN_ID:-unknown}"
REPO="${GITHUB_REPOSITORY:-}"
SERVER="${GITHUB_SERVER_URL:-https://github.com}"

echo ""
echo "===== CI TRIAGE ====="
echo "Baseline: Build ${BASELINE_RUN_ID} (stable)"
echo "Rule: Compare any regression against baseline (tip ${BASELINE_SHA})."
echo ""
echo "Current:"
echo "  Run ID: ${RUN_ID}"
echo "  SHA:    ${CURRENT_SHA}"
if [[ -n "$REPO" ]]; then
  echo "  URL:    ${SERVER}/${REPO}/actions/runs/${RUN_ID}"
fi
echo ""
echo "Quick triage steps:"
echo "  1) Identify first failed job/step from logs above"
echo "  2) Do NOT rescan closed chains (see evidence/GO_20260408_BUILD_CI_CLOSURE.md)"
echo "  3) Compare behavior vs baseline (${BASELINE_SHA})"
echo ""
echo "Template (copy below):"
cat <<'EOF'
[CI TRIAGE]
- Run:
- First failed job:
- First error:
- Category: (new issue | regression vs baseline)
- Next minimal TT:
EOF
echo "====================="
echo ""
