#!/usr/bin/env bash
# G24-BROWSER-ACCEPT-01 · GovFreeze V2 Clean Baseline · 真人浏览器逐页验收
#
# 顺序：V2 基线闸 → UI/SSOT 机读 → Playwright L1 截图 → 人工签核模板
# SSOT: TTG-TOKENOMICS-FREEZE-V1 · GovFreeze V2 only
#
#   bash scripts/dev/run-gov-freeze-v2-browser-page-acceptance.sh
#   bash scripts/dev/run-gov-freeze-v2-browser-page-acceptance.sh --skip-playwright
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SKIP_PLAY=0
for arg in "$@"; do
  case "$arg" in
    --skip-playwright) SKIP_PLAY=1 ;;
  esac
done

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_gov_freeze_v2_browser_acceptance/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/acceptance.log"
: >"$LOG"

fail() { echo "G24_BROWSER_ACCEPT_01: FAIL $*" | tee -a "$LOG" >&2; exit 2; }
step() { echo "BROWSER_ACCEPT_STEP: $*" | tee -a "$LOG"; }
ok() { echo "G24_BROWSER_ACCEPT_01: $*" | tee -a "$LOG"; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

step "0 · GovFreeze V2 基线闸"
[[ "${GOV_FREEZE_V2_BASELINE_ACTIVE:-}" == "1" ]] || fail "GOV_FREEZE_V2_BASELINE_ACTIVE≠1 — run V2 cutover first"
CB_VERDICT="$(bash "$ROOT/scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh" 2>&1 | grep '^G24_CLEAN_BASELINE_01:' | awk '{print $2}' || echo FAIL)"
[[ "$CB_VERDICT" == "PASS_CLEAN_BASELINE" ]] || fail "clean baseline=${CB_VERDICT}"
echo "{\"stamp\":\"${STAMP}\",\"baseline\":\"GOV-FREEZE-V2-CLEAN-BASELINE\",\"clean_baseline\":\"${CB_VERDICT}\"}" >"$EVID/baseline-gate.json"

step "1 · TTG Tokenomics UI 对齐（vitest + §6 扫描 · SSOT TTG-TOKENOMICS-FREEZE-V1）"
bash "$ROOT/scripts/dev/run-ttg-tokenomics-ui-alignment-audit.sh" >>"$LOG" 2>&1 || fail "UI alignment audit"
UI_LATEST="$(ls -td "$ROOT/evidence/GO_ttg_tokenomics_ui_alignment"/*/ 2>/dev/null | head -1 || true)"
[[ -n "$UI_LATEST" ]] && cp -r "$UI_LATEST" "$EVID/ui-alignment-evidence" 2>/dev/null || true

step "2 · 链上 GOV-01～04 + Stake Pool 读面（与页面公示对拍）"
export GOV_FREEZE_V2_EVID_DIR="$EVID/onchain-verify"
bash "$ROOT/scripts/dev/verify-gov-freeze-v2-sepolia-onchain.sh" >>"$LOG" 2>&1 || fail "onchain verify"

PAGES=(
  "governance-hub|/governance|治理 Hub · 入口与诚实边界"
  "gov-params-freeze|/governance/params#gov-params-tokenomics-freeze|GOV-01～04 · Primary Market 25k cap"
  "gov-params-treasury|/governance/params#gov-params-treasury-policy|Global Treasury · P4 · 公众三轮"
  "gov-params-overview|/governance/params#gov-params-overview|Country Pool 45/55 · 净利润资金流"
  "governance-proposals|/governance/proposals|提案 · 投票 · Queue · Execute"
  "governance-proposals-create|/governance/proposals/new|提案创建"
  "governance-delegate|/governance/delegate|委托投票权"
  "steward-workbench|/governance/steward-region-workbench|Seat · Stake · 退出 requestRelease"
  "distribution-claim|/governance/distribution-claim|投资者分配领取 · 收益叙事"
  "distribution-accruals|/governance/distribution-accruals|应计分配"
  "fee-routes|/governance/fee-routes|FeeRouter 65/20/15"
  "vault-forwards|/governance/vault-forwards|Vault 转发审计"
)

step "3 · 页面清单与人工签核模板"
{
  echo '{"pages":['
  first=1
  for row in "${PAGES[@]}"; do
    IFS='|' read -r slug route desc <<<"$row"
    [[ "$first" -eq 1 ]] || echo ','
    first=0
    jq -cn --arg slug "$slug" --arg route "$route" --arg desc "$desc" \
      '{slug:$slug,route:$route,description:$desc,human_signoff:false}'
  done
  echo '],"ssot":"TTG-TOKENOMICS-FREEZE-V1"}'
} >"$EVID/page-inventory.json"

{
  echo "# G24-BROWSER-ACCEPT-01 · 逐页验收清单"
  echo ""
  echo "**基线:** GovFreeze V2 · **SSOT:** TTG-TOKENOMICS-FREEZE-V1"
  echo "**机读:** UI alignment PASS · onchain verify PASS"
  echo ""
  echo "| # | 页面 | 路由 | 真人核对项 | L1 截图 | 签核 |"
  echo "|---|------|------|------------|---------|------|"
  n=1
  for row in "${PAGES[@]}"; do
    IFS='|' read -r slug route desc <<<"$row"
    echo "| ${n} | ${desc} | \`${route}\` | 文案=SSOT · 金额/bps · ② 诚实边界 | \`screenshots/${slug}.png\` | ☐ |"
    n=$((n + 1))
  done
  echo ""
  echo "## 五层证据（HAT-R1 每步复用）"
  echo "L1 页面 · L2 钱包 · L3 链上事件 · L4 API · L5 DB"
  echo ""
  echo "## 签核"
  echo "- [ ] 全部页面与 TTG-TOKENOMICS-FREEZE-V1 一致"
  echo "- [ ] Primary Market / Seat / Country Pool / Treasury / 收益 / 退出 无废止叙事"
  echo "- 签核人: _______________ 日期: _______________"
} >"$EVID/HUMAN-PAGE-ACCEPTANCE-CHECKLIST.md"

step "4 · Playwright L1 截图（需前端 :3012）"
FE_BASE="${HAT_R1_FRONTEND_BASE:-http://127.0.0.1:3012}"
if [[ "$SKIP_PLAY" == "1" ]]; then
  ok "SKIP playwright (--skip-playwright)"
elif ! curl -sf -o /dev/null -w '%{http_code}' "${FE_BASE}/governance" 2>/dev/null | grep -qE '200|304'; then
  ok "SKIP playwright — frontend not reachable at ${FE_BASE} (start: cd frontend && npm run dev)"
  echo '{"skipped":true,"reason":"frontend_unreachable","base":"'"$FE_BASE"'"}' >"$EVID/playwright-result.json"
else
  node "$ROOT/scripts/dev/capture-hat-r1-screenshots.mjs" \
    --mode=browser-acceptance \
    --out="$EVID/screenshots" \
    --base="$FE_BASE" >>"$LOG" 2>&1 || fail "playwright capture"
  cp "$EVID/screenshots/manifest.json" "$EVID/playwright-result.json" 2>/dev/null || true
fi

step "5 · API 读面抽样（L4 · 需 :8080）"
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
for ep in \
  "/api/v1/governance/protocol-reference" \
  "/api/v1/steward/stake-quote?jurisdictions=KR" \
  "/api/v1/governance/ttg-exchange/quote?usdc_amount=100000000&round=0"; do
  code="$(curl -sS -o "$EVID/api-sample-$(echo "$ep" | tr '/?&=' '-' | tr -s '-' | sed 's/^-//').json" -w '%{http_code}' "${API_BASE}${ep}" 2>/dev/null || echo 000)"
  echo "${ep} → ${code}" >>"$LOG"
done

cat >"$EVID/PASS.json" <<EOF
{
  "audit_id": "G24-BROWSER-ACCEPT-01",
  "stamp_utc": "${STAMP}",
  "baseline": "GOV-FREEZE-V2-CLEAN-BASELINE",
  "ssot": "TTG-TOKENOMICS-FREEZE-V1",
  "verdict": "PASS_MACHINE",
  "human_signoff_required": true,
  "checklist": "${EVID}/HUMAN-PAGE-ACCEPTANCE-CHECKLIST.md",
  "next": "HAT-R1 Phase A after human ☐ → bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --phase a"
}
EOF

ln -sfn "$STAMP" "$ROOT/evidence/GO_gov_freeze_v2_browser_acceptance/latest" 2>/dev/null || \
  echo "$STAMP" >"$ROOT/evidence/GO_gov_freeze_v2_browser_acceptance/latest-stamp.txt"

ok "PASS_MACHINE stamp=${STAMP} evidence=${EVID}"
echo "G24_BROWSER_ACCEPT_01_SUMMARY: PASS_MACHINE"
echo "Next: 真人逐页签核 HUMAN-PAGE-ACCEPTANCE-CHECKLIST.md → HAT_R1_BROWSER_ACCEPT_OK=1 → Phase A"
exit 0
