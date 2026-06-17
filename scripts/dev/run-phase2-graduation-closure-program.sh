#!/usr/bin/env bash
# Phase ② · 毕业闭环总编排（冻结基线 8dcd304a · ② only · ≠ ③ GO）
#
#   bash scripts/dev/run-phase2-graduation-closure-program.sh --status
#   bash scripts/dev/run-phase2-graduation-closure-program.sh --step maintenance
#   bash scripts/dev/run-phase2-graduation-closure-program.sh --step auto
#
# 毕业序：TL#1→Wave1(Cert#7+#8 queue)→全新 Soak→TN-P1-010 复跑→HAT-R1→Cert#10-12→Graduation
# 另闸（非毕业阻塞）：TL#2 Cert#8 spend execute — --step wave2-spend + HAT_R1_ALLOW_SPEND_EXECUTE=1
# 纪律：TESTNET_STAGING_FREEZE ACTIVE · 无 redeploy · 仅阻塞性 P0 可破例
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

FREEZE_SHA="8dcd304afae1bafe5a4de738175e171256a9501e"
HAT="$ROOT/evidence/GO_hat_r1_sepolia/20260616T063612Z"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_graduation_closure_program/${STAMP}"
MODE="status"
STEP=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --status) MODE="status"; shift ;;
    --step) STEP="$2"; MODE="run"; shift 2 ;;
    --auto) MODE="run"; STEP="auto"; shift ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EVID"

check_freeze() {
  local active="$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
  [[ -f "$active" ]] || { echo "BLOCKED: TESTNET_STAGING_FREEZE not ACTIVE"; return 1; }
  local sha
  sha="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).git_sha)" "$active" 2>/dev/null || echo "")"
  [[ "${sha,,}" == "${FREEZE_SHA,,}" ]] || {
    echo "BLOCKED: freeze git_sha=$sha expected=$FREEZE_SHA"
    return 1
  }
}

gate_line() {
  local id="$1" state="$2" note="$3"
  printf "  %-28s %-12s %s\n" "$id" "$state" "$note"
}

# TN-P1-010 毕业闸：须 freeze SHA 对齐 + Soak COMPLETED 后复跑 report（历史报告 alone ≠ PASS）
eval_tn_p1_010_graduation_gate() {
  node -e "
const fs=require('fs');
const path=require('path');
const root=process.argv[1];
const freezeSha=(process.argv[2]||'').toLowerCase();
const soakDir=process.argv[3];
const out={pass:false,state:'no',note:'no post-soak reconcile at freeze SHA'};
const soakCompleted=path.join(soakDir,'COMPLETED.json');
if(!fs.existsSync(soakCompleted)){
  out.note='soak COMPLETED.json missing';
  console.log(JSON.stringify(out));
  process.exit(0);
}
const soak=JSON.parse(fs.readFileSync(soakCompleted,'utf8'));
const soakMs=Date.parse(soak.completed_at||'')||0;
if(!soakMs){
  out.note='soak COMPLETED.json missing completed_at';
  console.log(JSON.stringify(out));
  process.exit(0);
}
const base=path.join(root,'evidence/GO_phase2_testnet_perfect_validation');
let best=null;
if(fs.existsSync(base)){
  for(const ent of fs.readdirSync(base,{withFileTypes:true})){
    if(!ent.isDirectory()||!ent.name.startsWith('tn-p1-010-indexer-reconcile-')) continue;
    const report=path.join(base,ent.name,'report.json');
    if(!fs.existsSync(report)) continue;
    let r; try{r=JSON.parse(fs.readFileSync(report,'utf8'));}catch{continue;}
    if(r.release_gate!=='GO') continue;
    const stamp=r.stamp||ent.name.replace(/^tn-p1-010-indexer-reconcile-/,'');
    const stampMs=Date.parse(
      stamp.length===16 && stamp.endsWith('Z')
        ? stamp.slice(0,4)+'-'+stamp.slice(4,6)+'-'+stamp.slice(6,8)+'T'+stamp.slice(9,11)+':'+stamp.slice(11,13)+':'+stamp.slice(13,15)+'Z'
        : stamp
    )||0;
    if(!stampMs||stampMs<soakMs) continue;
    const sha=(r.freeze_git_sha||r.git_sha||'').toLowerCase();
    if(!sha||sha!==freezeSha) continue;
    if(!best||stampMs>best.stampMs) best={dir:ent.name,stampMs,stamp,sha};
  }
}
if(best){
  out.pass=true; out.state='yes';
  out.note=best.dir+' stamp='+best.stamp+' after_soak=1 freeze_sha='+best.sha;
}else{
  out.state='no';
  out.note='need post-soak TN-P1-010 @ freeze '+freezeSha.slice(0,8)+' (historical-only reports excluded)';
}
console.log(JSON.stringify(out));
" "$ROOT" "$FREEZE_SHA" "$SOAK_DIR"
}

print_status() {
  local now tl1 tl2 tl1_el tl2_el exec_tx queue spend_tx soak_done soak_fail recon_done recon_note
  local tn010_json tn010_state
  now="$(date +%s)"
  tl1="$(cat "$HAT/EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
  tl2="$(cat "$HAT/TREASURY_EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
  tl1_el=no; tl2_el=no
  [[ "$tl1" != "0" && "$now" -ge "$tl1" ]] && tl1_el=yes
  [[ "$tl2" != "0" && "$now" -ge "$tl2" ]] && tl2_el=yes
  exec_tx=no; queue=no; spend_tx=no
  [[ -f "$HAT/step-07-execute/tx-execute.json" ]] && exec_tx=yes
  [[ -f "$HAT/step-09-treasury-queue/timelock-eta.json" ]] && queue=yes
  [[ -f "$HAT/step-10-treasury-execute/tx-execute.json" ]] && spend_tx=yes
  soak_done=no; soak_fail=no
  [[ -f "$SOAK_DIR/COMPLETED.json" ]] && soak_done=yes
  [[ -f "$SOAK_DIR/FAIL.json" ]] && soak_fail=yes
  tn010_json="$(eval_tn_p1_010_graduation_gate)"
  recon_done="$(node -e "console.log(JSON.parse(process.argv[1]).state)" "$tn010_json")"
  recon_note="$(node -e "console.log(JSON.parse(process.argv[1]).note)" "$tn010_json")"

  echo "TT_PHASE2_GRADUATION_CLOSURE_PROGRAM: STATUS stamp=$STAMP"
  echo "  freeze_sha=$FREEZE_SHA phase=②"
  echo ""
  echo "Gates:"
  gate_line "TL#1 Cert#7 execute" "$tl1_el" "unix=$tl1 execute_tx=$exec_tx"
  gate_line "Cert#8 queue" "$queue" "timelock-eta.json"
  gate_line "TL#2 Cert#8 spend" "$spend_tx" "deferred·非毕业序 unix=$tl2 elapsed=$tl2_el"
  gate_line "TN-P1-009 soak" "$soak_done" "fail=$soak_fail dir=$SOAK_DIR"
  gate_line "TN-P1-010 reconcile" "$recon_done" "$recon_note"
  gate_line "HAT_R1 live wallet" "${HAT_R1_LIVE_WALLET_OK:-0}" "evidence/GO_hat_r1_sepolia/"
  gate_line "Cert#10-12" "HUMAN" "complete-ttg-cert-step.sh 10..12"
  gate_line "Graduation GO" "OPEN" "TT_TESTNET_PERFECT_VALIDATION_GO"
  echo ""
  bash "$ROOT/scripts/dev/probe-phase-b-timelock-countdown.sh" || true
  P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>/dev/null || true
}

run_maintenance() {
  check_freeze || exit 3
  bash "$ROOT/scripts/dev/run-phase-b-daily-maintenance.sh" | tee "$EVID/maintenance.log"
  echo "TT_PHASE2_GRADUATION_CLOSURE: step=maintenance OK"
}

run_wave1() {
  check_freeze || exit 3
  [[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || { echo "BLOCKED: HAT_R1_LIVE_WALLET_OK=1"; exit 3; }
  [[ "${HAT_R1_PHASE_B_PAUSED:-1}" == "0" ]] || { echo "BLOCKED: HAT_R1_PHASE_B_PAUSED=0"; exit 3; }
  bash "$ROOT/scripts/dev/run-phase-b-post-timelock-wave1.sh" --signer "${TTG_CERT_SIGNER:-Sebastian Ward}" \
    | tee "$EVID/wave1.log"
  echo "TT_PHASE2_GRADUATION_CLOSURE: step=wave1 OK"
}

run_soak_start() {
  check_freeze || exit 3
  export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
  export P2FC_SOAK_DIR="$SOAK_DIR" P2FC_SOAK_EXPECT_GIT_SHA="$FREEZE_SHA"
  [[ "${P2FC_SOAK_SUPERSEDE:-0}" == "1" ]] && export P2FC_SOAK_SUPERSEDE=1
  bash "$ROOT/scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh" | tee "$EVID/soak-start.log"
  echo "TT_PHASE2_GRADUATION_CLOSURE: step=soak_start OK"
}

run_soak_attest() {
  P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" | tee "$EVID/soak-attest.log"
}

run_reconcile() {
  check_freeze || exit 3
  [[ -f "$SOAK_DIR/COMPLETED.json" ]] || { echo "BLOCKED: soak COMPLETED.json missing"; exit 3; }
  export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
  export TN_P1_010_EXPECT_FREEZE_GIT_SHA="$FREEZE_SHA"
  bash "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh" | tee "$EVID/tn-p1-010.log"
  echo "TT_PHASE2_GRADUATION_CLOSURE: step=tn-p1-010 OK"
}

run_wave2_spend() {
  check_freeze || exit 3
  [[ "${HAT_R1_ALLOW_SPEND_EXECUTE:-}" == "1" ]] || {
    echo "BLOCKED: TL#2 Wave 2 requires Owner explicit HAT_R1_ALLOW_SPEND_EXECUTE=1"
    exit 3
  }
  bash "$ROOT/scripts/dev/run-ttg-phase-b-execute-spend-closure.sh" \
    --finalize --signer "${TTG_CERT_SIGNER:-Sebastian Ward}" | tee "$EVID/wave2-spend.log"
  echo "TT_PHASE2_GRADUATION_CLOSURE: step=wave2_spend OK"
}

run_live_wallet() {
  check_freeze || exit 3
  [[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || { echo "BLOCKED: HAT_R1_LIVE_WALLET_OK=1"; exit 3; }
  bash "$ROOT/scripts/dev/run-hat-r1-sepolia-live-wallet.sh" --phase a | tee "$EVID/hat-r1-phase-a.log"
  echo "TT_PHASE2_GRADUATION_CLOSURE: step=hat_r1 OK (phase A — phase B after timelock if applicable)"
}

run_graduation() {
  check_freeze || exit 3
  [[ -f "$SOAK_DIR/COMPLETED.json" ]] || { echo "BLOCKED: soak"; exit 3; }
  tn010_json="$(eval_tn_p1_010_graduation_gate)"
  node -e "const o=JSON.parse(process.argv[1]); if(!o.pass){console.error('BLOCKED: TN-P1-010 graduation gate — '+o.note); process.exit(3)}" "$tn010_json"
  bash "$ROOT/scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh" | tee "$EVID/graduation.log"
  echo "TT_PHASE2_GRADUATION_CLOSURE: step=graduation_review OK"
}

run_auto() {
  check_freeze || exit 3
  local now tl1 tl2 tl1_el tl2_el
  now="$(date +%s)"
  tl1="$(cat "$HAT/EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
  tl2="$(cat "$HAT/TREASURY_EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
  tl1_el=no; tl2_el=no
  [[ "$tl1" != "0" && "$now" -ge "$tl1" ]] && tl1_el=yes
  [[ "$tl2" != "0" && "$now" -ge "$tl2" ]] && tl2_el=yes

  if [[ "$tl1_el" == "no" ]]; then
    run_maintenance
    echo "TT_PHASE2_GRADUATION_CLOSURE: auto=PRE_TL1 maintenance_only"
    exit 0
  fi
  if [[ ! -f "$HAT/step-07-execute/tx-execute.json" || ! -f "$HAT/step-09-treasury-queue/timelock-eta.json" ]]; then
    echo "BLOCKED: Wave 1 requires Owner wallet — run --step wave1 manually after TL#1"
    run_maintenance
    exit 3
  fi
  if [[ ! -f "$SOAK_DIR/COMPLETED.json" && ! -f "$SOAK_DIR/FAIL.json" ]]; then
    echo "NOTE: soak not COMPLETED — start with P2FC_SOAK_SUPERSEDE=1 --step soak-start after Wave 1"
  fi
  if [[ -f "$SOAK_DIR/COMPLETED.json" ]]; then
    run_reconcile || true
  fi
  if [[ "$tl2_el" == "yes" && ! -f "$HAT/step-10-treasury-execute/tx-execute.json" ]]; then
    echo "NOTE: TL#2 elapsed — Cert#8 spend is separate gate (--step wave2-spend); not required for Graduation"
  fi
  run_maintenance
  print_status
  echo "TT_PHASE2_GRADUATION_CLOSURE: auto=partial (human Cert#10-12 + wallet phases may remain)"
}

case "$MODE" in
  status) print_status | tee "$EVID/status.log" ;;
  run)
    case "$STEP" in
      maintenance) run_maintenance ;;
      wave1) run_wave1 ;;
      soak-start) run_soak_start ;;
      soak-attest) run_soak_attest ;;
      tn-p1-010|reconcile) run_reconcile ;;
      wave2-spend) run_wave2_spend ;;
      live-wallet|hat-r1) run_live_wallet ;;
      graduation) run_graduation ;;
      auto) run_auto | tee "$EVID/auto.log" ;;
      *) echo "unknown --step $STEP" >&2; exit 2 ;;
    esac
    ;;
esac

echo "$STAMP" >"$ROOT/evidence/GO_phase2_graduation_closure_program/latest-stamp.txt"
echo "evidence=$EVID"
