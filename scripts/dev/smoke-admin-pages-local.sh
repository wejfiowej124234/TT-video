#!/usr/bin/env bash
# ① 本地：Admin 关键 HTTP 面探针（非 ②③ GO · 非 Playwright 全矩阵）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-http://127.0.0.1:8080}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

probe() {
  local label="$1" url="$2" expect="$3"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url" || echo "000")"
  if [[ "$code" != "$expect" ]]; then
    echo "FAIL $label: $url -> HTTP $code (want $expect)"
    return 1
  fi
  echo "OK   $label: HTTP $code"
}

echo "== admin pages smoke (①) =="
probe "api capabilities" "$API/api/v1/admin/capabilities" "401"
probe "next capabilities" "$FE/api/v1/admin/capabilities" "401"

for path in /admin /admin/operator-guide /admin/approvals /admin/onboarding /admin/permissions \
  /admin/inbox /admin/community/reports /admin/community/penalties \
  /admin/content /admin/content/countries /admin/content/publish-queue \
  /admin/growth /admin/growth/analytics /admin/growth/referral-codes \
  /admin/official /admin/official/cold-start \
  /admin/community/policy-change-logs /admin/community/ranking/snapshots \
  /admin/community/abuse-policy /admin/community/comments/visibility \
  /admin/community/appeals/review /admin/finance-suite \
  /admin/finance-reconciliation /admin/onboarding/webhook-jobs \
  /admin/cross-check /admin/orders /admin/fee-router /admin/compliance /admin/audit; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$path" || echo "000")"
  case "$code" in
    200|307|308) echo "OK   fe $path: HTTP $code" ;;
    *) echo "FAIL fe $path: $FE$path -> HTTP $code (want 200/307/308)"; exit 1 ;;
  esac
done

echo "smoke-admin-pages-local: exit 0"
