#!/usr/bin/env bash
# Informational only: classify e2e outcome vs stable baseline (does not gate CI).
set -u

BASELINE_RUN_ID="24139191178"
BASELINE_SHA="2364f55"

CURRENT_RUN="${GITHUB_RUN_ID:-unknown}"
CURRENT_SHA="${GITHUB_SHA:-unknown}"
E2E_OUTCOME="${E2E_OUTCOME:-unknown}"

echo ""
echo "===== BASELINE REGRESSION CHECK (informational) ====="
echo "baseline_run_id=${BASELINE_RUN_ID}"
echo "baseline_sha=${BASELINE_SHA}"
echo "current_run_id=${CURRENT_RUN}"
echo "current_sha=${CURRENT_SHA}"
echo "e2e_step_outcome=${E2E_OUTCOME}"

case "${E2E_OUTCOME}" in
  success)
    echo "diff_conclusion=NO_REGRESSION_SIGNAL (e2e passed vs baseline expectation)"
    ;;
  failure)
    echo "diff_conclusion=REGRESSION_VS_BASELINE (e2e failed; triage vs baseline run ${BASELINE_RUN_ID} sha ${BASELINE_SHA})"
    ;;
  skipped)
    echo "diff_conclusion=UNCLASSIFIED (e2e step skipped)"
    ;;
  cancelled)
    echo "diff_conclusion=UNCLASSIFIED (e2e step cancelled)"
    ;;
  *)
    echo "diff_conclusion=UNCLASSIFIED (e2e outcome unknown)"
    ;;
esac
echo "======================================================"
echo ""
exit 0
