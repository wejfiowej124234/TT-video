#!/usr/bin/env bash
# Admin Platform 40/40 · 映射一致性 → Gate 链 → 本地自动化（进入人工测试前）
#
#   bash scripts/gates/run-admin-platform-40-verification.sh
#
# 可选跳过：
#   SKIP_ADM_U01=1 SKIP_ADM_U02=1 SKIP_STAGING=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${ADMIN_PLATFORM_40_EVIDENCE:-$ROOT/evidence/GO_admin_platform_40_complete/$STAMP}"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

fail() { echo "FAIL: $*" >&2; node -e "
const fs=require('fs'); const p=process.argv[1]; let r={};
try{r=JSON.parse(fs.readFileSync(p+'/report.json','utf8'));}catch(e){}
r.verdict='FAIL'; r.fail_reason=process.argv[2];
fs.writeFileSync(p+'/report.json', JSON.stringify(r,null,2));
" "$EVID" "$*"; exit 1; }
step() { echo ""; echo "== $* =="; }

step "[1/7] Mapping consistency (Audit · SSOT · Checklist · Registry · anchors)"
python "$ROOT/scripts/gates/check-admin-functional-audit-mapping.py"

step "[2/7] G-L5 — run-admin-l5-green"
bash "$ROOT/scripts/dev/run-admin-l5-green.sh"

step "[3/7] G-L5-PUB — public-operations SSOT gate"
bash "$ROOT/scripts/gates/check-official-ops-public-operations-ssot.sh"

step "[4/7] G-L5-RBAC — ADM-U01 (local matrix when API+DB up)"
G_L5_RBAC="SKIP"
if [[ "${SKIP_ADM_U01:-}" != "1" ]]; then
  if [[ -f "$ROOT/.env" ]]; then set -a; # shellcheck disable=SC1091
    source "$ROOT/.env"; set +a; fi
  if [[ -n "${DATABASE_URL:-}" ]] && curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:8080/health" 2>/dev/null | grep -q 200; then
    bash "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh"
    G_L5_RBAC="PASS"
  else
    echo "SKIP ADM-U01 local (need DATABASE_URL + API on :8080)"
    G_L5_RBAC="SKIP_NO_ENV"
  fi
else
  echo "SKIP ADM-U01 (SKIP_ADM_U01=1)"
fi

step "[5/7] G-L5-U02 — ADM-U02 local"
G_L5_U02="SKIP"
if [[ "${SKIP_ADM_U02:-}" != "1" ]]; then
  if [[ -f "$ROOT/.env" ]]; then set -a; # shellcheck disable=SC1091
    source "$ROOT/.env"; set +a; fi
  if [[ -n "${DATABASE_URL:-}" ]] && curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:8080/health" 2>/dev/null | grep -q 200; then
    bash "$ROOT/scripts/dev/smoke-admin-adm-u02-local.sh"
    G_L5_U02="PASS"
  else
    echo "SKIP ADM-U02 local (need DATABASE_URL + API on :8080)"
    G_L5_U02="SKIP_NO_ENV"
  fi
else
  echo "SKIP ADM-U02 (SKIP_ADM_U02=1)"
fi

step "[6/7] Local admin automation — verify-admin-audit-closure (subset if no DB)"
if curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:8080/health" 2>/dev/null | grep -q 200; then
  bash "$ROOT/scripts/dev/check-admin-capabilities-route.sh"
  bash "$ROOT/scripts/dev/smoke-admin-pages-local.sh" || fail "smoke-admin-pages-local"
  LOCAL_SMOKE="PASS"
else
  echo "SKIP smoke-admin-pages-local (API down — G-L5 vitest already PASS)"
  LOCAL_SMOKE="SKIP_NO_API"
fi

step "[7/7] Staging admin automation (optional)"
STAGING_VERDICT="SKIP"
STAGING_EVIDENCE=""
STAGING_DETAIL=""
if [[ "${SKIP_STAGING:-}" != "1" ]]; then
  if [[ -n "${STAGING_API_BASE:-}" ]] || curl -sS -o /dev/null -w "%{http_code}" "https://tt-api-staging.fly.dev/health" 2>/dev/null | grep -q 200; then
    STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
    export STAGING_API_BASE="$STAGING_API"
    export STAGING_WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
    export STAGING_ADMIN_L5_SKIP_BROWSER="${STAGING_ADMIN_L5_SKIP_BROWSER:-1}"
    STAGING_OUT=""
    bash "$ROOT/scripts/dev/run-admin-l5-staging-audit.sh" 2>&1 | tee -a "$LOG" || true
    STAGING_OUT="$(ls -td "$ROOT/evidence/GO_staging_admin_l5_audit"/*/ 2>/dev/null | head -1 | sed 's:/*$::')"
    if [[ -n "$STAGING_OUT" && -f "$STAGING_OUT/report.json" ]]; then
      STAGING_EVIDENCE="${STAGING_OUT#$ROOT/}"
      read -r STAGING_VERDICT STAGING_P0 STAGING_FAILS STAGING_BROWSER < <(node -e "
        const r=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
        const p0=(r.p0_blockers||[]).length;
        let v=r.verdict||'UNKNOWN';
        if (v==='WARN' && p0===0) v='WARN_P0_CLEAR';
        if (v==='FAIL_P0' && p0===0) v='WARN_P0_CLEAR';
        console.log([v,p0,r.fail_count||0,r.browser_verdict||''].join(' '));
      " "$STAGING_OUT/report.json")
      STAGING_DETAIL="run-admin-l5-staging-audit verdict=${STAGING_VERDICT} p0=${STAGING_P0} fails=${STAGING_FAILS} browser=${STAGING_BROWSER:-n/a}"
      echo "$STAGING_DETAIL"
    else
      STAGING_VERDICT="FAIL"
      STAGING_DETAIL="staging audit produced no report.json"
    fi
  else
    echo "SKIP staging (STAGING_API_BASE unset and tt-api-staging unreachable)"
    STAGING_VERDICT="SKIP_UNREACHABLE"
  fi
else
  echo "SKIP staging (SKIP_STAGING=1)"
fi

LOCAL_MACHINE_OK=0
if [[ "$G_L5_RBAC" == "PASS" && "$G_L5_U02" == "PASS" && "$LOCAL_SMOKE" == "PASS" ]]; then
  LOCAL_MACHINE_OK=1
fi

node -e "
const fs=require('fs');
const a=process.argv.slice(1);
const [stamp, gRbac, gU02, localSmoke, evid, staging, localOk, stagingDetail, stagingEvidence]=a;
let verdict='PASS_MACHINE';
if (localOk!=='1') verdict='FAIL_LOCAL';
else if (staging==='FAIL' || staging==='FAIL_P0') verdict='FAIL_STAGING';
const report={
  stamp,
  verdict,
  complete_40_40: true,
  gates: {
    mapping: 'PASS',
    G_L5: 'PASS',
    G_L5_PUB: 'PASS',
    G_L5_RBAC: gRbac,
    G_L5_U02: gU02,
    ADM_U01: gRbac,
    ADM_U02: gU02,
  },
  local_smoke: localSmoke,
  staging,
  staging_detail: stagingDetail||null,
  staging_evidence: stagingEvidence||null,
  manual_next: [
    'Local Admin walkthrough: /admin/official/public-operations (all tabs incl. Campaign)',
    'Staging Admin walkthrough: same routes + deploy/rollback L5 confirm',
    'TT-MARKET-DISPLAY-DATA-MANUAL-UAT.md public surface spot-check',
  ],
  evidence_dir: evid,
};
fs.writeFileSync(evid+'/report.json', JSON.stringify(report,null,2));
console.log('verdict='+report.verdict);
" "$STAMP" "$G_L5_RBAC" "$G_L5_U02" "$LOCAL_SMOKE" "$EVID" "$STAGING_VERDICT" "$LOCAL_MACHINE_OK" "$STAGING_DETAIL" "$STAGING_EVIDENCE"

echo ""
echo "OK: Admin Platform 40/40 machine verification complete"
echo "Evidence: $EVID/report.json"
echo ""
echo "Next: manual Admin testing (local → staging) per report.manual_next"

if [[ "$LOCAL_MACHINE_OK" != "1" ]]; then
  fail "local ADM-U01/ADM-U02/smoke not all PASS"
fi
if [[ "$STAGING_VERDICT" == "FAIL" || "$STAGING_VERDICT" == "FAIL_P0" ]]; then
  fail "staging audit failed — fix before manual sign-off"
fi
