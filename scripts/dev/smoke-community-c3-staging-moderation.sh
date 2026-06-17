#!/usr/bin/env bash
# Phase ② · C3 staging moderation E2E（举报→审核→下架 · ② 槽 · 非 Phase ② GO）
#
# 用法（仓库根 · API 已起 · SEED_TEST_ACCOUNTS=1 · TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 推荐）：
#   API_BASE=http://127.0.0.1:8080 bash scripts/dev/smoke-community-c3-staging-moderation.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
PASSWORD="Test123!"
AUTHOR_EMAIL="c3-author-${STAMP}@example.com"
REPORTER_EMAIL="c3-reporter-${STAMP}@example.com"
ADMIN_EMAIL="c3-admin-${STAMP}@traveltrust.test"
MARKER="c3-moderation-staging-${STAMP}"

fail() { echo "smoke-community-c3-staging-moderation: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c3-staging-moderation: OK $*"; }

# shellcheck source=scripts/dev/lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"
# shellcheck source=scripts/dev/lib/smoke-admin-local-prep.sh
source "$ROOT/scripts/dev/lib/smoke-admin-local-prep.sh"

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -d "$body")"
    fi
  else
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Authorization: Bearer $auth")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url")"
    fi
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

feed_has_post() {
  local post_id="$1"
  local json_src="$2"
  local tmp
  tmp="$(mktemp)"
  printf '%s' "$json_src" >"$tmp"
  node -e "
    const fs=require('fs');
    const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
    const id=process.argv[2];
    const posts=j.posts||[];
    process.exit(posts.some(p=>String(p.id)===id)?0:1);
  " "$tmp" "$post_id"
  local rc=$?
  rm -f "$tmp"
  return "$rc"
}

echo "== smoke-community-c3-staging-moderation (② C3) API=$API_BASE =="

hc="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"

# 作者发帖（production origin · @example.com）
reg_a="$(smoke_auth_register_curl "$AUTHOR_EMAIL" "tourist" '{"nickname":"C3 Author"}')"
[[ "${reg_a%%|*}" == "200" || "${reg_a%%|*}" == "201" ]] || fail "author register HTTP ${reg_a%%|*} body=${reg_a#*|}"
AUTHOR_TOKEN="$(json_field "${reg_a#*|}" token)"
[[ -n "$AUTHOR_TOKEN" ]] || fail "author token missing"
AUTHOR_ID="$(json_field "${reg_a#*|}" user_id)"
[[ -z "$AUTHOR_ID" ]] && AUTHOR_ID="$(node -e "
  const j=JSON.parse(process.argv[1]);
  process.stdout.write(String(j.user?.id||j.id||''));
" "${reg_a#*|}")"

post="$(curl_json POST "${API_BASE}/api/v1/community/posts" \
  "$(node -e "process.stdout.write(JSON.stringify({body:process.argv[1],post_type:'text'}))" "$MARKER")" \
  "$AUTHOR_TOKEN")"
[[ "${post%%|*}" == "200" ]] || fail "create post HTTP ${post%%|*} body=${post#*|}"
POST_ID="$(json_field "${post#*|}" id)"
[[ -n "$POST_ID" ]] || fail "post id missing"
ok "author created post $POST_ID"

# 公开 Feed / Profile / 详情可见
feed_before="$(curl -sS "${API_BASE}/api/v1/community/feed?limit=50")"
feed_has_post "$POST_ID" "$feed_before" || fail "post not in feed before takedown"
ok "post visible in public feed before takedown"

if [[ -n "$AUTHOR_ID" ]]; then
  prof_before="$(curl -sS "${API_BASE}/api/v1/community/users/${AUTHOR_ID}/posts?limit=20")"
  feed_has_post "$POST_ID" "$prof_before" || fail "post not on public profile before takedown"
  ok "post visible on public profile before takedown"
fi

detail_before="$(curl_json GET "${API_BASE}/api/v1/community/posts/${POST_ID}")"
[[ "${detail_before%%|*}" == "200" ]] || fail "post detail before HTTP ${detail_before%%|*}"
node -e "const j=JSON.parse(process.argv[1]); if(!j.post) process.exit(1);" "${detail_before#*|}" \
  || fail "post detail null before takedown"
ok "post detail visible before takedown"

# 举报人提交举报
reg_r="$(smoke_auth_register_curl "$REPORTER_EMAIL" "tourist" '{"nickname":"C3 Reporter"}')"
[[ "${reg_r%%|*}" == "200" || "${reg_r%%|*}" == "201" ]] || fail "reporter register HTTP ${reg_r%%|*} body=${reg_r#*|}"
REPORTER_TOKEN="$(json_field "${reg_r#*|}" token)"
rep="$(curl_json POST "${API_BASE}/api/v1/community/reports" \
  "$(node -e "process.stdout.write(JSON.stringify({target_type:'post',target_id:process.argv[1],reason_code:'spam',details:'c3 staging smoke'}))" "$POST_ID")" \
  "$REPORTER_TOKEN")"
[[ "${rep%%|*}" == "200" ]] || fail "report HTTP ${rep%%|*} body=${rep#*|}"
REPORT_ID="$(json_field "${rep#*|}" id)"
[[ -n "$REPORT_ID" ]] || fail "report id missing"
ok "report submitted ($REPORT_ID)"

# Admin 队列 + 下架
reg_ad="$(smoke_auth_register_curl "$ADMIN_EMAIL" "tourist" '{"nickname":"C3 Admin"}')"
[[ "${reg_ad%%|*}" == "200" || "${reg_ad%%|*}" == "201" ]] || fail "admin register HTTP ${reg_ad%%|*} body=${reg_ad#*|}"
promote="$(curl_json POST "${API_BASE}/auth/seed-test-accounts" \
  "{\"promote_admin_email\":\"${ADMIN_EMAIL}\"}")"
[[ "${promote%%|*}" == "200" ]] || fail "promote admin HTTP ${promote%%|*} (need SEED_TEST_ACCOUNTS=1)"
admin_login="$(curl_json POST "${API_BASE}/auth/login" \
  "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${PASSWORD}\"}")"
[[ "${admin_login%%|*}" == "200" ]] || fail "admin login HTTP ${admin_login%%|*}"
ADMIN_TOKEN="$(json_field "${admin_login#*|}" token)"

smoke_admin_relax_2fa_for_local
smoke_admin_ensure_console_role "$ADMIN_EMAIL" "Ops"

queue="$(curl_json GET "${API_BASE}/api/v1/admin/community/reports?status=open&limit=50" "" "$ADMIN_TOKEN")"
[[ "${queue%%|*}" == "200" ]] || fail "admin reports HTTP ${queue%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  const rid=process.argv[2];
  const items=j.items||[];
  if(!items.some(r=>String(r.id)===rid)) process.exit(1);
" "${queue#*|}" "$REPORT_ID" || fail "report not in admin queue"
ok "admin queue lists open report"

patch_body="$(node -e "
process.stdout.write(JSON.stringify({
  expected_version: 1,
  status: 'resolved',
  admin_notes: 'c3 staging content_remove',
  disposition: 'content_removed',
  record_penalty: { action: 'content_remove' },
}));
")"
TMP_MOD="$(mktemp)"
mod="$(curl -sS -o "$TMP_MOD.resp" -w '%{http_code}' -X PATCH \
  "${API_BASE}/api/v1/admin/community/moderation/${REPORT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Idempotency-Key: c3-staging-moderation-${STAMP}" \
  -d "$patch_body")"
mod_body="$(cat "$TMP_MOD.resp")"
rm -f "$TMP_MOD.resp"
[[ "$mod" == "200" ]] || fail "moderation PATCH HTTP $mod body=$mod_body"
ok "admin content_remove resolved"

# 公众面不可见
feed_after="$(curl -sS "${API_BASE}/api/v1/community/feed?limit=50")"
feed_has_post "$POST_ID" "$feed_after" && fail "post still in feed after takedown"
ok "post hidden from public feed"

if [[ -n "$AUTHOR_ID" ]]; then
  prof_after="$(curl -sS "${API_BASE}/api/v1/community/users/${AUTHOR_ID}/posts?limit=20")"
  feed_has_post "$POST_ID" "$prof_after" && fail "post still on public profile after takedown"
  ok "post hidden from public profile"
fi

detail_after="$(curl_json GET "${API_BASE}/api/v1/community/posts/${POST_ID}")"
[[ "${detail_after%%|*}" == "200" ]] || fail "post detail after HTTP ${detail_after%%|*}"
node -e "const j=JSON.parse(process.argv[1]); if(j.post) process.exit(1);" "${detail_after#*|}" \
  || fail "anon post detail still visible after takedown"
ok "post detail hidden for anonymous viewer"

# 作者仍可在 me/posts 看到（archived）
me_posts="$(curl_json GET "${API_BASE}/api/v1/community/me/posts?limit=20" "" "$AUTHOR_TOKEN")"
[[ "${me_posts%%|*}" == "200" ]] || fail "me/posts HTTP ${me_posts%%|*}"
feed_has_post "$POST_ID" "${me_posts#*|}" || fail "author me/posts missing archived post"
ok "author still sees post in me/posts (archived)"

echo "TT_COMMUNITY_C3_STAGING_MODERATION: OK"
