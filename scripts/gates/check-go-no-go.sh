#!/usr/bin/env bash
# Informational only: GO / NO_GO / REVIEW_REQUIRED (does not gate CI).
set -u

E2E_PW="${E2E_PLAYWRIGHT_OUTCOME:-}"
if [ -z "${E2E_PW}" ] && [ -n "${E2E_OUTCOME_FILE:-}" ] && [ -f "${E2E_OUTCOME_FILE}" ]; then
  E2E_PW="$(tr -d '\n\r' < "${E2E_OUTCOME_FILE}")"
fi
if [ -z "${E2E_PW}" ]; then
  E2E_PW="unknown"
fi

case "${E2E_PW}" in
  failure)
    DIFF_CONCLUSION="REGRESSION_VS_BASELINE"
    ;;
  success)
    DIFF_CONCLUSION="NO_REGRESSION_SIGNAL"
    ;;
  *)
    DIFF_CONCLUSION="UNCLASSIFIED"
    ;;
esac

all_jobs_success=true
for var in JOB_BUILD JOB_FRONTEND JOB_REGIONAL_MATRIX JOB_A11Y JOB_E2E JOB_FINANCE_RECONCILE JOB_CONFIG_CENTER JOB_FEATURE_FLAG JOB_JOB_QUEUE JOB_SECRET_KEY; do
  r="${!var:-unknown}"
  if [ "${r}" != "success" ]; then
    all_jobs_success=false
    break
  fi
done

go_no_go_status="REVIEW_REQUIRED"
if [ "${E2E_PW}" = "failure" ] && [ "${DIFF_CONCLUSION}" = "REGRESSION_VS_BASELINE" ]; then
  go_no_go_status="NO_GO"
elif [ "${all_jobs_success}" = true ]; then
  go_no_go_status="GO"
fi

echo ""
echo "===== GO/NO-GO HINT (informational) ====="
echo "e2e_playwright_outcome=${E2E_PW}"
echo "diff_conclusion=${DIFF_CONCLUSION}"
echo "all_required_jobs_success=${all_jobs_success}"
echo "go_no_go_status=${go_no_go_status}"
echo "========================================="
echo ""
exit 0
