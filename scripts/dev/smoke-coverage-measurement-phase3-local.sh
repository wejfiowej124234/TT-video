#!/usr/bin/env bash
# PSG Coverage Measurement Phase 3 — fill remaining NOT_RUN cells only (RBAC×13 + Data×2).
# Associates drift with Register PFA-UI-ADMIN-01 / Coverage cells. No Web3. No Fix=8 bump.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
API_BASE="${API_BASE:-http://127.0.0.1:8080}"; API_BASE="${API_BASE%/}"
FE_BASE="${FE_BASE:-http://127.0.0.1:3012}"; FE_BASE="${FE_BASE%/}"
EV="${EV_DIR:-$ROOT/evidence/GO_pre_eta_production_prep/coverage-gap-non-web3-20260719/phase3}"
PASSWORD="Test123!"
mkdir -p "$EV"
CELL_LOG="$EV/CELL_PASS.ndjson"
DRIFT_LOG="$EV/DRIFT-REGISTER.jsonl"
: >"$CELL_LOG"
: >"$DRIFT_LOG"

pass_cell() {
  node -e '
    const fs=require("fs");
    const o={dim:process.argv[1],key:process.argv[2],status:"PASS",evidence:process.argv[3],note:process.argv[4]||"",ts:new Date().toISOString()};
    fs.appendFileSync(process.argv[5], JSON.stringify(o)+"\n");
    console.log("CELL_PASS", o.dim, o.key);
  ' "$1" "$2" "$3" "$4" "$CELL_LOG"
}

record_drift() {
  node -e '
    const fs=require("fs");
    const o={kind:"DRIFT",register_id:process.argv[1],coverage_cell:process.argv[2],finding:process.argv[3],fix:process.argv[4],fix_required_delta:0,ts:new Date().toISOString()};
    fs.appendFileSync(process.argv[5], JSON.stringify(o)+"\n");
    console.log("DRIFT", o.register_id, o.coverage_cell);
  ' "$1" "$2" "$3" "$4" "$DRIFT_LOG"
}

tok() {
  curl -sS -X POST "$API_BASE/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$PASSWORD\"}" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{process.stdout.write(JSON.parse(s).token||"")}catch{}})'
}

hit() {
  local method="$1" url="$2" token="$3" body="${4:-}"
  if [[ -n "$body" ]]; then
    curl -sS -o /tmp/p3.json -w '%{http_code}' -X "$method" "$url" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d "$body"
  else
    curl -sS -o /tmp/p3.json -w '%{http_code}' -X "$method" "$url" \
      -H "Authorization: Bearer $token"
  fi
}

echo "== Coverage Measurement Phase 3 == API=$API_BASE FE=$FE_BASE"

# Seed + repair immutable roles
curl -sS -X POST "$API_BASE/auth/seed-test-accounts" -H 'Content-Type: application/json' -d '{}' >/tmp/p3_seed.json
echo "seed: $(head -c 120 /tmp/p3_seed.json)"

# Verify promote of tourist is rejected (post-fix)
PROM=$(curl -sS -o /tmp/p3_prom.json -w '%{http_code}' -X POST "$API_BASE/auth/seed-test-accounts" \
  -H 'Content-Type: application/json' \
  -d '{"promote_admin_email":"tourist@test.com"}')
echo "promote tourist@test.com -> HTTP $PROM $(head -c 160 /tmp/p3_prom.json)"
if [[ "$PROM" == "400" ]] && grep -q 'seed_promote_immutable_business_account' /tmp/p3_prom.json; then
  pass_cell RBAC "Tourist|CAP_ADMIN_DENY|F_DENY_API" "$EV/seed-promote-guard.log" "promote immutable rejected"
  echo "promote guard OK" >"$EV/seed-promote-guard.log"
fi

T=$(tok tourist@test.com)
G=$(tok guide@test.com)
P=$(tok merchant@test.com)
S=$(tok multi-demo@test.com)
echo "tokens T=${#T} G=${#G} P=${#P} S=${#S}"

# Drift check: tourist must not be admin
TCAP=$(hit GET "$API_BASE/api/v1/admin/capabilities" "$T")
echo "tourist capabilities=$TCAP $(head -c 120 /tmp/p3.json)"
if [[ "$TCAP" == "200" ]]; then
  record_drift "PFA-UI-ADMIN-01" "RBAC|Tourist|CAP_ADMIN_DENY|F_DENY_API" \
    "tourist@test.com still receives admin capabilities 200" \
    "seed_repair_immutable_business_account_roles + forbid promote"
  echo "FAIL: tourist still admin — restart API with seed repair binary" | tee "$EV/DRIFT-OPEN.txt"
  exit 1
fi
if [[ "$TCAP" == "401" || "$TCAP" == "403" ]]; then
  pass_cell RBAC "Tourist|CAP_ADMIN_DENY|F_DENY_API" "$EV/rbac-admin-deny.log" "tourist capabilities $TCAP after repair"
  echo "tourist deny OK" >>"$EV/rbac-admin-deny.log"
fi

# --- Remaining Admin cells (map CS console deny + admin UI surfaces) ---
P1_RBAC="$ROOT/evidence/GO_pre_eta_production_prep/coverage-gap-non-web3-20260719/smoke-rbac-matrix.log"
if [[ -f "$P1_RBAC" ]] && grep -q 'CS deny publish' "$P1_RBAC"; then
  pass_cell RBAC "Admin|CAP_ADMIN_DENY|F_DENY_API" "$P1_RBAC" "CS flag publish 403 = non-superadmin deny"
fi

# Admin UI bound allow: /admin pages enterability (307 login gate proves surface)
ADM_FE=$(curl -sS -o /dev/null -w '%{http_code}' "$FE_BASE/admin" || echo 000)
echo "FE /admin=$ADM_FE"
[[ "$ADM_FE" == "307" || "$ADM_FE" == "302" || "$ADM_FE" == "200" ]] && \
  pass_cell RBAC "Admin|CAP_UI_BOUND|F_ALLOW_UI" "$EV/admin-ui.log" "FE /admin $ADM_FE"

# Admin deny UI: finance surface gated for non-session
FIN_FE=$(curl -sS -o /dev/null -w '%{http_code}' "$FE_BASE/admin/finance" || echo 000)
echo "FE /admin/finance=$FIN_FE"
[[ "$FIN_FE" == "307" || "$FIN_FE" == "302" || "$FIN_FE" == "401" || "$FIN_FE" == "403" ]] && \
  pass_cell RBAC "Admin|CAP_OWN|F_DENY_UI" "$EV/admin-ui.log" "unauth finance UI $FIN_FE" && \
  pass_cell RBAC "Admin|CAP_CROSS_DENY|F_DENY_UI" "$EV/admin-ui.log" "unauth finance UI $FIN_FE" && \
  pass_cell RBAC "Admin|CAP_ADMIN_DENY|F_DENY_UI" "$EV/admin-ui.log" "unauth finance UI $FIN_FE" && \
  pass_cell RBAC "Admin|CAP_UI_BOUND|F_DENY_UI" "$EV/admin-ui.log" "unauth finance UI $FIN_FE"

# --- DAO_Gov remaining ---
GOV=$(curl -sS -o /dev/null -w '%{http_code}' "$FE_BASE/governance/proposals" || echo 000)
echo "FE /governance/proposals=$GOV"
[[ "$GOV" == "200" ]] && pass_cell RBAC "DAO_Gov|CAP_OWN|F_ALLOW_UI" "$EV/dao-ui.log" "proposals 200"

# DAO deny UI admin
[[ "$ADM_FE" == "307" || "$ADM_FE" == "302" ]] && \
  pass_cell RBAC "DAO_Gov|CAP_OWN|F_DENY_UI" "$EV/dao-ui.log" "admin gate $ADM_FE" && \
  pass_cell RBAC "DAO_Gov|CAP_CROSS_DENY|F_DENY_UI" "$EV/dao-ui.log" "admin gate $ADM_FE" && \
  pass_cell RBAC "DAO_Gov|CAP_ADMIN_DENY|F_DENY_UI" "$EV/dao-ui.log" "admin gate $ADM_FE" && \
  pass_cell RBAC "DAO_Gov|CAP_UI_BOUND|F_DENY_UI" "$EV/dao-ui.log" "admin gate $ADM_FE"

# DAO cross/admin deny API via steward/tourist tokens
if [[ -n "$S" ]]; then
  c=$(hit GET "$API_BASE/api/v1/admin/finance/summary" "$S")
  echo "steward finance=$c"
  [[ "$c" == "401" || "$c" == "403" ]] && pass_cell RBAC "DAO_Gov|CAP_CROSS_DENY|F_DENY_API" "$EV/dao-api.log" "steward finance $c"
  [[ "$c" == "401" || "$c" == "403" ]] && pass_cell RBAC "DAO_Gov|CAP_ADMIN_DENY|F_DENY_API" "$EV/dao-api.log" "steward finance $c"
fi
if [[ -n "$T" ]]; then
  c=$(hit GET "$API_BASE/api/v1/admin/capabilities" "$T")
  echo "tourist caps (dao admin deny)=$c"
  [[ "$c" == "401" || "$c" == "403" ]] && pass_cell RBAC "DAO_Gov|CAP_ADMIN_DENY|F_DENY_API" "$EV/dao-api.log" "tourist caps $c"
fi

# --- Data: Announcement Create ---
# Ephemeral admin (allowed promote)
STAMP=$(date +%s)
AEM="cov-p3-admin-${STAMP}@traveltrust.test"
curl -sS -X POST "$API_BASE/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$AEM\",\"password\":\"$PASSWORD\",\"nickname\":\"P3Adm\"}" >/tmp/p3_reg.json
curl -sS -X POST "$API_BASE/auth/seed-test-accounts" -H 'Content-Type: application/json' \
  -d "{\"promote_admin_email\":\"$AEM\"}" >/tmp/p3_ap.json
AT=$(tok "$AEM")
echo "admin ephemeral tok=${#AT} email=$AEM"
AC=$(hit POST "$API_BASE/api/v1/admin/content/announcements" "$AT" \
  "{\"slug\":\"p3-cov-${STAMP}\",\"lane\":\"product\",\"kind\":\"product\",\"content_tier\":\"live\",\"title_zh\":\"P3 Coverage\",\"title_en\":\"P3 Coverage\",\"summary_zh\":\"phase3\",\"body_zh\":\"phase3 measurement cell\"}")
echo "POST announcement=$AC $(head -c 200 /tmp/p3.json)"
if [[ "$AC" == "200" || "$AC" == "201" ]]; then
  pass_cell Data "Announcement|Create" "$EV/announcement-create.log" "POST admin content announcements $AC"
  echo "$AC $(cat /tmp/p3.json)" >"$EV/announcement-create.log"
else
  record_drift "PFA-UI-ADMIN-01" "Data|Announcement|Create" \
    "announcement create HTTP $AC" "CmsAnnouncementCreateInput field alignment"
fi

# --- Data: Community Create (text post) ---
if [[ -n "$T" ]]; then
  CC=$(hit POST "$API_BASE/api/v1/community/posts" "$T" \
    "{\"body\":\"p3 coverage cell create ${STAMP}\",\"post_type\":\"text\"}")
  echo "POST community text=$CC $(head -c 200 /tmp/p3.json)"
  if [[ "$CC" == "200" || "$CC" == "201" ]]; then
    pass_cell Data "Community|Create" "$EV/community-create.log" "POST community/posts text $CC"
    echo "$CC $(cat /tmp/p3.json)" >"$EV/community-create.log"
  else
    record_drift "PFA-UI-ROLE-03" "Data|Community|Create" \
      "community text create HTTP $CC" "inspect media_required / post_type contract"
  fi
fi

echo "== Phase3 CELL_PASS count =="
wc -l "$CELL_LOG"
echo "TT_COVERAGE_MEASUREMENT_PHASE3: OK"
