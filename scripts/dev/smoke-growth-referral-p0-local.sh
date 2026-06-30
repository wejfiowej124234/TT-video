#!/usr/bin/env bash
# G-S1 · 102 Referral 最小闭环 smoke（① 本地 · 须 API+PG 已起）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
FE="${TRAVELTRUST_FE_BASE:-http://127.0.0.1:3012}"

echo "== smoke-growth-referral-p0-local (G-S1) =="
echo "API=$API FE=$FE"

# 1) 公开校验端点存在（无效码仍 200 + valid:false）
invalid_json="$(curl -fsS "$API/api/v1/growth/referrals/validate?code=TT-NOSUCH99" || echo FAIL)"
echo "$invalid_json" | grep -q '"valid"' || { echo "FAIL validate response shape"; exit 1; }
echo "$invalid_json" | grep -q '"valid":false' || { echo "FAIL expected valid:false for unknown code"; exit 1; }
echo "OK   GET /api/v1/growth/referrals/validate (unknown code)"

# 2) Admin 路由需鉴权
code_admin="$(curl -s -o /dev/null -w '%{http_code}' "$API/api/v1/admin/growth/referral-codes" || echo 000)"
if [[ "$code_admin" != "401" && "$code_admin" != "403" ]]; then
  echo "FAIL admin referral-codes unauth -> HTTP $code_admin (want 401/403)"
  exit 1
fi
echo "OK   GET /api/v1/admin/growth/referral-codes unauth -> HTTP $code_admin"

# 3) FE 注册页 ?ref= 与 Admin 子路由可达（前端未起时 WARN · API 切片仍有效）
FE_SKIP=0
for path in "/auth/register?ref=TT-SMOKE1" "/admin/growth/referral-codes" "/admin/growth"; do
  fe_code="$(curl -s -o /dev/null -w '%{http_code}' "$FE$path" 2>/dev/null || echo 000)"
  fe_code="${fe_code//[^0-9]/}"
  case "$fe_code" in
    200|307|308) echo "OK   fe $path: HTTP $fe_code" ;;
    000*|""|"0")
      echo "WARN fe $path unreachable (frontend not up — start :3012 for full G-S1 FE slice)"
      FE_SKIP=1
      ;;
    *) echo "FAIL fe $path -> HTTP $fe_code"; exit 1 ;;
  esac
done
if [[ "$FE_SKIP" == "1" ]]; then
  echo "smoke-growth-referral-p0-local: exit 0 (API slice OK · FE skipped — not ②③ GO)"
  exit 0
fi

echo "smoke-growth-referral-p0-local: exit 0"
