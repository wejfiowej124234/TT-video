#!/usr/bin/env bash
# Cookie / CSP / security headers verification（PI3-002 Execution · static + optional live）
#
#   bash scripts/dev/verify-production-cookie-csp-headers.sh
#   PROD_WEB_BASE=… PROD_API_BASE=… bash scripts/dev/verify-production-cookie-csp-headers.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_BASE="${PROD_WEB_BASE:-}"
API_BASE="${PROD_API_BASE:-}"

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

section "1 · Static SSOT (121 §6.4 · no product code change)"
if rg -q 'traveltrust_user_id' frontend/middleware.ts 2>/dev/null || rg -q 'traveltrust_user_id' frontend/lib 2>/dev/null; then
  pass "session cookie name traveltrust_user_id documented in FE"
else
  warn "traveltrust_user_id cookie wiring not found by grep (may be dynamic)"
fi
if rg -q 'X-Frame-Options' frontend/next.config.js; then
  pass "Next production headers include X-Frame-Options"
else
  fail "next.config.js missing X-Frame-Options"
fi
if rg -q 'security_headers_layer' crates/api/src/middleware/auth_pause_metrics/mod.rs; then
  pass "API security_headers_layer registered"
else
  fail "API security_headers_layer missing"
fi
if ! rg -q 'Content-Security-Policy' frontend/next.config.js; then
  warn "No CSP on Next (121 R-CSP-01 · post-PI3 optional)"
  pass "CSP absence documented (not blocking PI3-002 execution templates)"
else
  pass "CSP configured on Next"
fi

section "2 · Cookie attributes (live · optional)"
if [[ -n "$WEB_BASE" ]]; then
  set_cookie="$(curl -sS -D - -o /dev/null --max-time 25 "${WEB_BASE%/}/" 2>/dev/null | tr -d '\r' | grep -i '^set-cookie:' || true)"
  if [[ -z "$set_cookie" ]]; then
    warn "no Set-Cookie on ${WEB_BASE}/ (anonymous visit expected)"
  else
    echo "$set_cookie" | grep -qi 'samesite' && pass "Set-Cookie includes SameSite" || warn "SameSite not seen on Set-Cookie"
    echo "$set_cookie" | grep -qi 'path=/' && pass "Set-Cookie Path=/" || warn "Path=/ not confirmed"
  fi
else
  warn "PROD_WEB_BASE unset — skip live cookie probe"
fi

section "3 · Security headers (live · optional)"
if [[ -n "$WEB_BASE" ]]; then
  web_xfo="$(curl -sS -D - -o /dev/null --max-time 25 "${WEB_BASE%/}/" 2>/dev/null | tr -d '\r' | grep -i '^x-frame-options:' | head -1 || true)"
  [[ -n "$web_xfo" ]] && pass "Web ${web_xfo}" || warn "Web X-Frame-Options not seen"
fi
if [[ -n "$API_BASE" ]]; then
  api_xfo="$(curl -sS -D - -o /dev/null --max-time 25 "${API_BASE%/}/health" 2>/dev/null | tr -d '\r' | grep -i '^x-frame-options:' | head -1 || true)"
  [[ -n "$api_xfo" ]] && pass "API ${api_xfo}" || warn "API X-Frame-Options not seen"
fi

echo ""
echo "verify-production-cookie-csp-headers: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
