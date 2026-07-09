#!/usr/bin/env bash
# P2FC · Admin staging GO 宣称闸 · TT_ADMIN_STAGING_GO_CLAIM 唯一真源（v2）
#
# 唯一合法 Admin GO 闭环（全部满足才 ALLOWED）：
#   COMPLETED.json → MR12 one-shot PASS → ADM-U01 live GO (persistent_host)
#   → P0 Runtime CONFIRMED → TT_ADMIN_STAGING_GO_CLAIM=ALLOWED
#
# Prep / Static / Tunnel / Local / Smoke / Watcher / Health / Prep-Only / Soak Inflight
# 一律不得替代 Admin GO · Phase② Closure · Production GO
#
#   bash scripts/ops/p2fc-gate-admin-staging-go-claim.sh
#   bash scripts/ops/p2fc-query-admin-staging-go-claim.sh [--refresh]
#
# 末行：TT_ADMIN_STAGING_GO_CLAIM: ALLOWED|DENIED
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
CLOSURE_DIR="$SOAK_DIR/post-soak-staging-live-closure"
OUT="$CLOSURE_DIR/admin-go-claim-gate.latest.json"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SSOT_REGISTRY="$ROOT/registry/admin-staging-go-claim-ssot.v1.yaml"
SSOT_LINE="TT_ADMIN_STAGING_GO_CLAIM"
FORBIDDEN_JSON='["prep_ready","prep_only","soak_inflight","static_p0_confirmed","tunnel_ephemeral","local_smoke","watcher_alive","health_200_only","meta_unreachable","mr12_prep_only"]'

write_deny() {
  local reason="$1"
  node -e "
const fs=require('fs');
const payload={
  schema:'traveltrust.admin_staging_go_claim_gate.v2',
  admin_go_ssot:process.argv[5],
  admin_go_ssot_registry:process.argv[6],
  checked_at_utc:process.argv[1],
  allowed:false,
  reason:process.argv[2],
  unique_closure_loop:[
    'COMPLETED.json','MR12 one-shot PASS',
    'ADM-U01 live release_gate=GO (persistent_host)','P0 Runtime CONFIRMED',
    'TT_ADMIN_STAGING_GO_CLAIM=ALLOWED',
  ],
  forbidden_as_admin_go:JSON.parse(process.argv[4]),
  forbidden_claim_targets:['admin_go','phase2_closure','production_go'],
  prep_is_not_go:true,
};
fs.writeFileSync(process.argv[3], JSON.stringify(payload,null,2)+'\n');
" "$STAMP" "$reason" "$OUT" "$FORBIDDEN_JSON" "$SSOT_LINE" "$SSOT_REGISTRY"
  echo "TT_ADMIN_STAGING_GO_CLAIM: DENIED reason=${reason}"
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-admin-go-closure-discipline-audit.py" \
    --soak-dir "$SOAK_DIR" >/dev/null 2>&1 || true
  exit 2
}

[[ -f "$SSOT_REGISTRY" ]] || write_deny "ssot_registry_missing"

STRAT_F=0
[[ "${P2FC_STRAT_F_PRE_SOAK:-0}" == "1" ]] && STRAT_F=1
[[ -f "$ROOT/evidence/GO_phase2_deploy_backlog/FINAL-CANDIDATE-EXECUTION-LOCK.json" ]] && STRAT_F=1

if [[ "$STRAT_F" -eq 0 ]]; then
  [[ -f "$SOAK_DIR/COMPLETED.json" ]] || write_deny "soak_not_completed"
  grep -q 'TT_P2FC_POST_SOAK_ONE_SHOT: PASS' "$SOAK_DIR/post-soak-one-shot/one-shot.log" 2>/dev/null \
    || write_deny "mr12_one_shot_not_pass"
elif [[ ! -f "$SOAK_DIR/final-candidate-pre-soak/deploy-complete.json" ]]; then
  write_deny "strat_f_deploy_not_complete"
fi

U01_REPORT="$CLOSURE_DIR/adm-u01-live/report.json"
[[ -f "$U01_REPORT" ]] || write_deny "adm_u01_live_report_missing"

node -e "
const fs=require('fs');
const r=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const env=r.environment||{};
if(r.release_gate!=='GO'){ console.error('release_gate='+r.release_gate); process.exit(1); }
if(env.deployment_kind!=='persistent_host'){ console.error('deployment_kind='+env.deployment_kind); process.exit(2); }
if(env.not_localhost_assertion!==true){ console.error('not_localhost_assertion'); process.exit(3); }
if((env.api_base||'').includes('loca.lt')||(env.api_base||'').includes('127.0.0.1')){ process.exit(4); }
" "$U01_REPORT" || {
  ec=$?
  case "$ec" in
    1) write_deny "adm_u01_release_gate_not_GO" ;;
    2) write_deny "adm_u01_not_persistent_host_tunnel_or_local_forbidden" ;;
    3|4) write_deny "adm_u01_localhost_or_tunnel_api_base" ;;
    *) write_deny "adm_u01_live_validation_failed" ;;
  esac
}

P0_REPORT="$CLOSURE_DIR/p0-rbac-bypass-runtime/latest.json"
[[ -f "$P0_REPORT" ]] || write_deny "p0_runtime_report_missing"

p0_status="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).status||'')}catch{console.log('')}" "$P0_REPORT")"
[[ "$p0_status" == "CONFIRMED" ]] || write_deny "p0_runtime_status=${p0_status}"

node -e "
const fs=require('fs');
const payload={
  schema:'traveltrust.admin_staging_go_claim_gate.v2',
  admin_go_ssot:process.argv[7],
  admin_go_ssot_registry:process.argv[8],
  checked_at_utc:process.argv[1],
  allowed:true,
  reason:null,
  unique_closure_loop:[
    'COMPLETED.json','MR12 one-shot PASS',
    'ADM-U01 live release_gate=GO (persistent_host)','P0 Runtime CONFIRMED',
    'TT_ADMIN_STAGING_GO_CLAIM=ALLOWED',
  ],
  sequence_verified:{
    soak_completed:true,mr12_one_shot_pass:true,adm_u01_live_go:true,
    adm_u01_persistent_host:true,p0_runtime_confirmed:true,
  },
  forbidden_as_admin_go:JSON.parse(process.argv[5]),
  forbidden_claim_targets:['admin_go','phase2_closure','production_go'],
  evidence:{
    completed_json:process.argv[2],adm_u01_report:process.argv[3],p0_runtime_report:process.argv[4],
  },
  note:'Phase② full closure (U02/B1-B4) after this slot; Production GO is separate ③ gate',
  prep_is_not_go:true,
};
fs.writeFileSync(process.argv[6], JSON.stringify(payload,null,2)+'\n');
" "$STAMP" "$SOAK_DIR/COMPLETED.json" "$U01_REPORT" "$P0_REPORT" "$FORBIDDEN_JSON" "$OUT" "$SSOT_LINE" "$SSOT_REGISTRY"

PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-admin-go-closure-discipline-audit.py" \
  --soak-dir "$SOAK_DIR" >/dev/null 2>&1 || true

echo "TT_ADMIN_STAGING_GO_CLAIM: ALLOWED"
