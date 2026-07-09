#!/usr/bin/env bash
# P2FC · G02 + TN-P1-010 预验收（Soak 并行 · 不 redeploy · 不杀 soak）
#
# 为 post-soak 一次性 Graduation 收敛提前消除验收/部署风险：
#   1. backlog 分层评审
#   2. /meta 503 RCA
#   3. 本地 G02 契约（hotfix 工作区）
#   4. TN-P1-010 脚本/门闸就绪检查
#   5. 收敛清单 JSON
#
#   bash scripts/ops/p2fc-pre-accept-g02-graduation-convergence.sh
#   bash scripts/ops/p2fc-pre-accept-g02-graduation-convergence.sh --with-local-g02
#
# 纪律：不 fly deploy · 不调用 staging internal 写 · soak 保持 INFLIGHT
# 末行：TT_P2FC_PRE_ACCEPT_CONVERGENCE: PASS|WARN|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${P2FC_PRE_ACCEPT_OUT:-$ROOT/evidence/GO_phase2_deploy_backlog/pre-accept-convergence/$STAMP}"
WITH_LOCAL_G02=0
RC=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-local-g02) WITH_LOCAL_G02=1; shift ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$OUT"
LOG="$OUT/pre-accept.log"
exec > >(tee -a "$LOG") 2>&1

echo "TT_P2FC_PRE_ACCEPT_CONVERGENCE: START $STAMP soak_unchanged=1"

# --- soak attest (read-only) ---
SOAK_LINE="$(P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>&1 || true)"
echo "soak_attest=${SOAK_LINE}"

# --- backlog layer review ---
LAYER_RC=0
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-deploy-backlog-layer-review.py" \
  --out-dir "$OUT/layer-review" || LAYER_RC=$?

# --- meta 503 RCA ---
RCA_RC=0
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-meta-503-rca.py" || RCA_RC=$?
cp -f "$ROOT/evidence/GO_phase2_deploy_backlog/meta-rca/latest.json" "$OUT/meta-rca.json" 2>/dev/null || true

# --- meta observability (exec chain · non-blocking) ---
OBS_RC=0
bash "$ROOT/scripts/ops/p2fc-record-meta-observability.sh" || OBS_RC=$?

# --- hotfix artifacts ---
HOTFIX="$ROOT/evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"
ACTIVE="$ROOT/evidence/GO_phase2_deploy_backlog/ACTIVE.json"
hotfix_ok=0
[[ -f "$HOTFIX" && -f "$ACTIVE" ]] && hotfix_ok=1
[[ "$hotfix_ok" -eq 1 ]] || RC=2

# --- TN-P1-010 readiness (no staging call unless COMPLETED) ---
TN_READY=0
COMPLETED="$SOAK_DIR/COMPLETED.json"
if [[ -f "$ROOT/scripts/ops/p2fc-run-tn-p1-010-independent.sh" && -f "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh" ]]; then
  TN_READY=1
fi
if [[ -f "$COMPLETED" ]]; then
  echo "NOTE: COMPLETED.json present — TN-P1-010 may run via p2fc-run-tn-p1-010-independent.sh"
else
  echo "NOTE: soak INFLIGHT — TN-P1-010 deferred until COMPLETED (script ready=$TN_READY)"
fi

# --- local G02 (optional · needs local API+Web) ---
G02_LOCAL="skipped"
G02_RC=0
if [[ "$WITH_LOCAL_G02" -eq 1 ]]; then
  if bash "$ROOT/scripts/dev/run-g02-meta-contract-gate-local.sh" 2>&1 | tee "$OUT/g02-local.log"; then
    G02_LOCAL="pass"
  else
    G02_LOCAL="fail"
    G02_RC=2
    RC=2
  fi
fi

# --- fly.toml timeout check (deploy risk) ---
FLY_TOML="$ROOT/deploy/fly/tt-api-staging/fly.toml"
fly_timeout_ok=0
grep -q 'REQUEST_TIMEOUT_SECS' "$FLY_TOML" 2>/dev/null && fly_timeout_ok=1 || true

node -e "
const fs=require('fs');
const path=require('path');
const out=process.argv[1];
const payload={
  schema:'traveltrust.p2fc_pre_accept_convergence.v1',
  recorded_at_utc:new Date().toISOString(),
  soak_attest:process.argv[2],
  soak_completed:fs.existsSync(process.argv[3]),
  checks:{
    backlog_layer_review:process.argv[4]==='0',
    meta_503_rca:process.argv[5]==='0',
    meta_observability_exec_chain:process.argv[6]==='0',
    hotfix_patch_present:process.argv[7]==='1',
    tn_p1_010_scripts_ready:process.argv[8]==='1',
    fly_toml_request_timeout:process.argv[9]==='1',
    local_g02:process.argv[10],
  },
  post_soak_one_shot:[
    'bash scripts/ops/p2fc-post-soak-one-shot-execute.sh --watch',
    'bash scripts/ops/p2fc-verify-staging-meta-availability.sh --strict',
    'PHASE2_REQUIRE_META_GREEN=1 bash scripts/dev/run-phase2-deep-release-gate.sh --require-meta-green',
    'bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh',
  ],
  artifacts:{
    layer_review: path.join(out,'layer-review/layer-review.json'),
    meta_rca: path.join(out,'meta-rca.json'),
    log: path.join(out,'pre-accept.log'),
  },
};
const blockers=[];
if(!payload.checks.hotfix_patch_present) blockers.push('missing meta-availability-hotfix.patch');
if(!payload.checks.tn_p1_010_scripts_ready) blockers.push('TN-P1-010 scripts missing');
if(!payload.checks.fly_toml_request_timeout) blockers.push('fly.toml missing REQUEST_TIMEOUT_SECS=120');
if(process.argv[10]==='fail') blockers.push('local G02 failed');
payload.blockers=blockers;
payload.verdict=blockers.length?'FAIL':((process.argv[4]!=='0'||process.argv[5]!=='0')?'WARN':'PASS');
fs.writeFileSync(path.join(out,'convergence.json'), JSON.stringify(payload,null,2)+'\n');
fs.writeFileSync(path.join(path.dirname(out),'latest.json'), JSON.stringify(payload,null,2)+'\n');
console.log('verdict='+payload.verdict+' blockers='+blockers.length);
process.exit(payload.verdict==='FAIL'?2:0);
" "$OUT" "$SOAK_LINE" "$COMPLETED" "$LAYER_RC" "$RCA_RC" "$OBS_RC" "$hotfix_ok" "$TN_READY" "$fly_timeout_ok" "$G02_LOCAL"

NODE_RC=$?
[[ "$NODE_RC" -eq 2 ]] && RC=2

VERDICT="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).verdict)" "$OUT/convergence.json")"
echo "TT_P2FC_PRE_ACCEPT_CONVERGENCE: $VERDICT out=$OUT"
[[ "$RC" -eq 0 ]] && exit 0
exit 2
