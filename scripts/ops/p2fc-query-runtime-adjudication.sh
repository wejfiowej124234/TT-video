#!/usr/bin/env bash
# 运行时裁决 · 父子两级真源统一查询
#
# 子真源 TT_ADMIN_STAGING_GO_CLAIM：仅 Admin GO（ALLOWED/DENIED）
# 父真源 TT_LIVE_CLOSURE_CHAIN_VERDICT：汇总 admin_go · phase2_closure · production_go
#
#   bash scripts/ops/p2fc-query-runtime-adjudication.sh [--refresh]
#
# 输出顺序：子真源 → 父真源
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
REFRESH=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --refresh) REFRESH=1; shift ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ "$REFRESH" -eq 1 ]]; then
  bash "$ROOT/scripts/ops/p2fc-gate-admin-staging-go-claim.sh" >/dev/null 2>&1 || true
fi

PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-live-closure-chain-verdict.py" \
  --soak-dir "$SOAK_DIR" >/dev/null 2>&1 || true

VERDICT="$SOAK_DIR/post-soak-staging-live-closure/live-closure-verdict.latest.json"
GATE="$SOAK_DIR/post-soak-staging-live-closure/admin-go-claim-gate.latest.json"

if [[ ! -f "$VERDICT" ]]; then
  echo "TT_ADMIN_STAGING_GO_CLAIM: DENIED reason=verdict_artifact_missing"
  echo "TT_LIVE_CLOSURE_CHAIN_VERDICT: admin_go=NO phase2_closure=NO production_go=NO"
  exit 2
fi

node -e "
const v=require(process.argv[1]);
const g=process.argv[2];
let claim=v.child_claim||{};
if(!claim.value && g){ try{ const gj=require(g); claim={value:gj.allowed?'ALLOWED':'DENIED',allowed:!!gj.allowed,reason:gj.reason}; }catch{} }
const verdicts=v.verdicts||{};
if(claim.allowed) console.log('TT_ADMIN_STAGING_GO_CLAIM: ALLOWED');
else console.log('TT_ADMIN_STAGING_GO_CLAIM: DENIED reason='+(claim.reason||'denied'));
console.log(
  'TT_LIVE_CLOSURE_CHAIN_VERDICT: admin_go='+(verdicts.admin_go||'NO')+
  ' phase2_closure='+(verdicts.phase2_closure||'NO')+
  ' production_go='+(verdicts.production_go||'NO')
);
const depOk=(verdicts.admin_go==='YES')===(claim.value==='ALLOWED');
if(!depOk){ console.error('parent_child_mismatch'); process.exit(3); }
process.exit(claim.allowed && verdicts.phase2_closure==='YES'?0:2);
" "$VERDICT" "$GATE"
