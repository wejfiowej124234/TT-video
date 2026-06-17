#!/usr/bin/env bash
# TT_GOVERNANCE_ENTERPRISE_HAT · prep（生成清单 + 机读辅助 · 非最终 PASS）
#
#   bash scripts/dev/run-tt-governance-enterprise-hat-review.sh
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
EVID="$ROOT/evidence/GO_tt_governance_enterprise_hat/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/prep.log"
: >"$LOG"

step() { echo "ENTERPRISE_HAT_PREP: $*" | tee -a "$LOG"; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || { echo "ENTERPRISE_HAT_PREP: FAIL missing env" >&2; exit 2; }
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

step "0 · GovFreeze V2 基线闸"
bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >>"$LOG" 2>&1

export TT_ENTERPRISE_HAT_EVID="$EVID"
export TT_ENTERPRISE_HAT_STAMP="$STAMP"
python "$ROOT/scripts/dev/lib/tt-governance-enterprise-hat-generate-checklist.py" | tee -a "$LOG"

step "1 · UI 叙事辅助扫描（vitest · 非 Enterprise PASS）"
if bash "$ROOT/scripts/dev/run-ttg-tokenomics-ui-alignment-audit.sh" >>"$LOG" 2>&1; then
  UI_VERDICT="PASS_MACHINE"
else
  UI_VERDICT="FAIL_MACHINE"
fi
UI_LATEST="$(ls -td "$ROOT/evidence/GO_ttg_tokenomics_ui_alignment"/*/ 2>/dev/null | head -1 || true)"
[[ -n "$UI_LATEST" ]] && cp -r "$UI_LATEST" "$EVID/ui-alignment-advisory" 2>/dev/null || true

step "2 · 链上 GOV 读面辅助（非 Enterprise PASS）"
export GOV_FREEZE_V2_EVID_DIR="$EVID/onchain-advisory"
bash "$ROOT/scripts/dev/verify-gov-freeze-v2-sepolia-onchain.sh" >>"$LOG" 2>&1 && ONCHAIN="PASS" || ONCHAIN="FAIL"

step "3 · API 抽样（L4/L9 辅助）"
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
for ep in \
  "/api/v1/governance/protocol-reference" \
  "/api/v1/steward/stake-quote?jurisdictions=KR" \
  "/api/v1/governance/ttg-exchange/quote?usdc_amount=100000000&round=0"; do
  slug="$(echo "$ep" | tr '/?&=' '-' | tr -s '-' | sed 's/^-//')"
  code="$(curl -sS -o "$EVID/api-${slug}.json" -w '%{http_code}' "${API_BASE}${ep}" 2>/dev/null || echo 000)"
  echo "api ${ep} → ${code}" >>"$LOG"
done

step "4 · Playwright L1 路由截图（可选 · :3012）"
FE_BASE="${HAT_R1_FRONTEND_BASE:-http://127.0.0.1:3012}"
if [[ "$SKIP_PLAY" == "1" ]]; then
  echo '{"skipped":true,"reason":"--skip-playwright"}' >"$EVID/playwright-advisory.json"
elif curl -sf -o /dev/null "${FE_BASE}/governance" 2>/dev/null; then
  node "$ROOT/scripts/dev/capture-hat-r1-screenshots.mjs" \
    --mode=browser-acceptance \
    --out="$EVID/screenshots" \
    --base="$FE_BASE" >>"$LOG" 2>&1 || true
else
  echo '{"skipped":true,"reason":"frontend_unreachable"}' >"$EVID/playwright-advisory.json"
fi

export TT_ENTERPRISE_HAT_EVID="$EVID"
export TT_ENTERPRISE_HAT_STAMP="$STAMP"
export TT_ENTERPRISE_HAT_UI_VERDICT="$UI_VERDICT"
export TT_ENTERPRISE_HAT_ONCHAIN="$ONCHAIN"
python <<'PY'
import json, os, pathlib
evid = pathlib.Path(os.environ["TT_ENTERPRISE_HAT_EVID"])
evid.mkdir(parents=True, exist_ok=True)
doc = {
    "audit_id": "TT_GOVERNANCE_ENTERPRISE_HAT",
    "stamp_utc": os.environ["TT_ENTERPRISE_HAT_STAMP"],
    "verdict": "PREP_READY",
    "human_signoff_required": True,
    "checklist": str(evid / "ENTERPRISE-HAT-CHECKLIST.md"),
    "machine_advisory": {
        "ui_alignment": os.environ.get("TT_ENTERPRISE_HAT_UI_VERDICT", "UNKNOWN"),
        "onchain_verify": os.environ.get("TT_ENTERPRISE_HAT_ONCHAIN", "UNKNOWN"),
        "note": "Advisory only — does not substitute L1-L9 human PASS",
    },
    "next": [
        "Complete ENTERPRISE-HAT-CHECKLIST.md L1-L9",
        "bash scripts/dev/record-tt-governance-enterprise-hat-signoff.sh --all-pass",
        "export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1",
        "bash scripts/dev/run-hat-r1-phase-b-when-ready.sh",
    ],
}
(evid / "PREP.json").write_text(json.dumps(doc, indent=2), encoding="utf-8")
PY

echo "$STAMP" >"$ROOT/evidence/GO_tt_governance_enterprise_hat/latest-stamp.txt"
echo "TT_GOVERNANCE_ENTERPRISE_HAT_PREP: READY evidence=${EVID}"
echo "TT_GOVERNANCE_ENTERPRISE_HAT_SUMMARY: PREP_READY"
exit 0
