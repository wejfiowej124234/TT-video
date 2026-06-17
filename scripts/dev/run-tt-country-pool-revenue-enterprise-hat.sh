#!/usr/bin/env bash
# TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT · DE pilot · 九步五层证据 · 四账一致
#
#   bash scripts/dev/run-tt-country-pool-revenue-enterprise-hat.sh
#   bash scripts/dev/run-tt-country-pool-revenue-enterprise-hat.sh --skip-playwright
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
EVID="$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/cp-revenue-hat.log"
: >"$LOG"

step() { echo "CP_REVENUE_HAT: $*" | tee -a "$LOG"; }
fail() { echo "CP_REVENUE_HAT: FAIL $*" | tee -a "$LOG" >&2; exit 2; }

export HAT_R1_PHASE_B_PAUSED=1
export TT_COUNTRY_POOL_REVENUE_HAT_ACTIVE=1

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

export CP_REVENUE_EVID="$EVID"
export CP_REVENUE_STAMP="$STAMP"
export CHAIN_RPC_URL="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
JUR="${CP_REVENUE_JURISDICTION:-DE}"

# shellcheck source=scripts/dev/lib/cp-revenue-hat-evidence-lib.sh
source "$ROOT/scripts/dev/lib/cp-revenue-hat-evidence-lib.sh"

step "0 · GovFreeze V2 基线 + DE registry"
bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >>"$LOG" 2>&1
[[ -f "$ROOT/config/jurisdiction_country_pool_net_profit.sepolia.json" ]] || fail "missing DE registry JSON"
cp "$ROOT/config/jurisdiction_country_pool_net_profit.sepolia.json" "$EVID/de-registry.json"

step "1 · 利润产生 → NetProfit Ledger（链上读 + 五层 manifest）"
cp_hat_page_manifest "step-01-profit-accrual"
cp_hat_api_get "step-01-profit-accrual" "protocol-reference" "/api/v1/governance/protocol-reference" >/dev/null || true

step "2 · NetProfit Ledger 配置"
cp_hat_page_manifest "step-02-netprofit-ledger"

step "3 · 45/55 Split"
cp_hat_page_manifest "step-03-split-4555"

step "4 · StewardPathVault"
cp_hat_page_manifest "step-04-steward-path-vault"

step "5 · Global Treasury"
cp_hat_page_manifest "step-05-global-treasury"
cp_hat_api_get "step-05-global-treasury" "protocol-reference-treasury" "/api/v1/governance/protocol-reference" >/dev/null || true

step "6 · API 读面"
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
cp_hat_api_get "step-06-api" "country-ledger" "/api/v1/governance/country-ledger/${JUR}" >/dev/null || true
cp_hat_api_get "step-06-api" "investor-distribution-accruals" "/api/v1/governance/investor-distribution-accruals?limit=5" >/dev/null || true
cp_hat_api_get "step-06-api" "stake-quote" "/api/v1/steward/stake-quote?jurisdictions=${JUR}" >/dev/null || true

step "7 · DB 快照"
for s in step-01-profit-accrual step-02-netprofit-ledger step-03-split-4555 step-04-steward-path-vault step-05-global-treasury step-06-api; do
  cp_hat_db_snapshot "$s"
done

step "8 · 前端页面（params 45/55 · distribution-accruals · claim）"
cp_hat_page_manifest "step-08-frontend-pages"
FE_BASE="${HAT_R1_FRONTEND_BASE:-http://127.0.0.1:3012}"
if [[ "$SKIP_PLAY" != "1" ]] && curl -sf -o /dev/null "${FE_BASE}/governance/params" 2>/dev/null; then
  for route in governance-hub gov-params-overview gov-params-treasury-policy distribution-accruals distribution-claim; do
    node "$ROOT/scripts/dev/capture-hat-r1-screenshots.mjs" \
      --mode=browser-acceptance \
      --out="$EVID/step-08-frontend-pages/screenshots" \
      --base="$FE_BASE" 2>/dev/null || true
  done
else
  echo '{"skipped":true}' >"$EVID/step-08-frontend-pages/playwright-advisory.json"
fi

step "9 · Claim 路径边界"
cp_hat_page_manifest "step-09-claim-path"
cp_hat_api_get "step-09-claim-path" "investor-accruals" "/api/v1/governance/investor-distribution-accruals?limit=1" >/dev/null || true

step "10 · 链上 probe + 四账 reconcile"
set +e
python "$ROOT/scripts/dev/lib/cp-revenue-hat-chain-probe.py" 2>&1 | tee -a "$LOG"
PROBE_EXIT=${PIPESTATUS[0]}
set -e

python <<'PY'
import json, os, pathlib
evid = pathlib.Path(os.environ["CP_REVENUE_EVID"])
fl = json.loads((evid / "four-ledger-reconcile.json").read_text(encoding="utf-8"))
api_align = json.loads((evid / "step-06-api-chain-alignment" / "chain-read.json").read_text(encoding="utf-8"))
if api_align.get("blocker_if_mismatch"):
    (evid / "step-06-api" / "env-alignment-blocker.json").write_text(
        json.dumps({
            "issue": "COUNTRY_POOL_LEDGER_ADDRESS shadows COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS in API",
            "fix": "Unset legacy COUNTRY_POOL_LEDGER_ADDRESS or set equal to NET_PROFIT ledger for API restart",
            "legacy": api_align.get("COUNTRY_POOL_LEDGER_ADDRESS"),
            "net_profit": api_align.get("COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS"),
        }, indent=2),
        encoding="utf-8",
    )
(evid / "PHASE-B-PAUSED.json").write_text(json.dumps({
    "HAT_R1_PHASE_B_PAUSED": 1,
    "reason": "TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT until four_ledger PASS + Enterprise HAT L9 recheck",
    "four_ledger_verdict": fl.get("verdict"),
}, indent=2), encoding="utf-8")
PY

echo "$STAMP" >"$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/latest-stamp.txt"
ln -sfn "$STAMP" "$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/latest" 2>/dev/null || true

if [[ "$PROBE_EXIT" -eq 0 ]]; then
  step "DONE · four_ledger PASS — run run-enterprise-hat-l9-recheck.sh next"
  exit 0
fi
step "BLOCKED · see four-ledger-reconcile.json blockers — Phase B remains PAUSED"
exit 1
