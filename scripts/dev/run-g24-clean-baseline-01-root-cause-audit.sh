#!/usr/bin/env bash
# G24-CLEAN-BASELINE-01 · Sepolia GovFreeze 栈根因审计
#
# 暂停：HAT-R1 Phase A · 补丁式 stake-pool schedule/execute
# 标准：干净 · 可升级 · 一次初始化完整 · 10国/PM/Treasury/Seat 权限全对齐
#
#   bash scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_g24_clean_baseline_01/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/audit-steps.log"
: >"$LOG"

fail() { echo "G24_CLEAN_BASELINE_01: FAIL $*" | tee -a "$LOG" >&2; exit 2; }
step() { echo "AUDIT_STEP: $*" | tee -a "$LOG"; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

RPC="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
export CHAIN_RPC_URL="$RPC"
export G24_CB_EVID="$EVID" G24_CB_ROOT="$ROOT" G24_CB_STAMP="$STAMP"

PY="python"
command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1 && PY="python3"

step "1 · SSOT 文档"
[[ -f "$ROOT/docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md" ]] || fail "missing TTG-TOKENOMICS-FREEZE-V1"
[[ -f "$ROOT/docs/spec/governance-token/protocol-ssot.v1.yaml" ]] || fail "missing protocol-ssot.v1.yaml"
[[ -f "$ROOT/registry/protocol-convergence-deployments.v1.yaml" ]] || fail "missing protocol-convergence-deployments"

step "2 · GovFreeze V1 链上 GOV-01～04（16 checks）"
export GOV_FREEZE_V1_EVID_DIR="$EVID/onchain-gov"
mkdir -p "$EVID/onchain-gov"
if bash "$ROOT/scripts/dev/verify-gov-freeze-v1-sepolia-onchain.sh" >>"$LOG" 2>&1; then
  echo "gov_freeze_v1_verify: PASS" >>"$LOG"
  cp "$(ls -t "$EVID/onchain-gov"/sepolia-onchain-alignment.json 2>/dev/null | head -1)" "$EVID/sepolia-onchain-alignment.json" 2>/dev/null || true
else
  echo "gov_freeze_v1_verify: FAIL" >>"$LOG"
fi

step "3 · Stake Pool 10 国 bootstrap 审计"
bash "$ROOT/scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh" >>"$LOG" 2>&1 || true
SP_AUDIT="$(ls -t "$ROOT/evidence/GO_stake_pool_jurisdiction_bootstrap"/*/stake-pool-jurisdiction-bootstrap-audit.json 2>/dev/null | head -1 || true)"
[[ -n "$SP_AUDIT" && -f "$SP_AUDIT" ]] && cp "$SP_AUDIT" "$EVID/stake-pool-jurisdiction-bootstrap-audit.json"

step "4 · 根因链上探针（权限 · 初始化 · 池拆分 · 补丁 pending）"
$PY "$ROOT/scripts/dev/lib/g24-clean-baseline-01-onchain-probe.py" >>"$LOG" 2>&1 || true

step "5 · registry / env / frontend 切主污染扫描"
$PY "$ROOT/scripts/dev/lib/g24-clean-baseline-01-env-registry-probe.py" >>"$LOG" 2>&1 || true

step "6 · UI / 资金流对齐（vitest + §6 扫描）"
if bash "$ROOT/scripts/dev/run-ttg-tokenomics-ui-alignment-audit.sh" >>"$LOG" 2>&1; then
  UI_EVID="$(ls -td "$ROOT/evidence/GO_ttg_tokenomics_ui_alignment"/*/ 2>/dev/null | head -1 || true)"
  [[ -n "$UI_EVID" && -f "${UI_EVID}ui-alignment-audit.json" ]] && cp "${UI_EVID}ui-alignment-audit.json" "$EVID/ui-alignment-audit.json"
  echo "ui_alignment: PASS" >>"$LOG"
else
  echo "ui_alignment: FAIL" >>"$LOG"
fi

step "7 · 生成 G24-CLEAN-BASELINE-01 报告"
VERDICT="$($PY "$ROOT/scripts/dev/lib/g24-clean-baseline-01-audit-report.py" 2>&1 | tee -a "$LOG" | grep '^G24_CLEAN_BASELINE_01:' | awk '{print $2}' || echo FAIL)"
[[ -n "$VERDICT" ]] || VERDICT="FAIL"

ln -sfn "$STAMP" "$ROOT/evidence/GO_g24_clean_baseline_01/latest" 2>/dev/null || \
  echo "$STAMP" >"$ROOT/evidence/GO_g24_clean_baseline_01/latest-stamp.txt"

echo "G24_CLEAN_BASELINE_01: ${VERDICT} stamp=${STAMP} evidence=${EVID}"
echo "G24_CLEAN_BASELINE_01_SUMMARY: ${VERDICT}"
exit 0
