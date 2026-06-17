#!/usr/bin/env bash
# TTG Tokenomics Full-System Audit — SSOT: TTG-TOKENOMICS-FREEZE-V1
#
#   bash scripts/dev/apply-gov-freeze-v1-sepolia-cutover.sh   # 首次
#   bash scripts/dev/run-ttg-tokenomics-full-system-audit.sh
#
# 覆盖: Primary Market · Global Treasury · Governor/Timelock · Country Pool 45/55
#       · Steward/Global 路径 · Treasury Spend · 提案 · 退出 · Buyback/Burn · UI 文案
# 诚实边界: ② Sepolia 审计 · execute/buyback 真 tx 留真人测试
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_ttg_tokenomics_full_system_audit/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/audit-steps.log"
: >"$LOG"

fail() { echo "TTG_TOKENOMICS_FULL_SYSTEM_AUDIT: FAIL $*" | tee -a "$LOG" >&2; exit 2; }
step() { echo "AUDIT_STEP: $*" | tee -a "$LOG"; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE — run apply-gov-freeze-v1-sepolia-cutover.sh first"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

[[ -f "$ROOT/.env" ]] && while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  [[ -z "${!key:-}" ]] && export "$key=$val"
done < "$ROOT/.env"

export CHAIN_RPC_URL="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
export GOVERNOR_ADDRESS="${GOVERNOR_ADDRESS:-${GOV_FREEZE_V1_GOVERNOR_ADDRESS:-}}"
export TIMELOCK_ADDRESS="${TIMELOCK_ADDRESS:-${GOV_FREEZE_V1_TIMELOCK_ADDRESS:-}}"
export GOV_FREEZE_V1_EVID_DIR="$EVID/onchain"

PY="python"
command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1 && PY="python3"

step "1 · SSOT 文档存在性"
[[ -f "$ROOT/docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md" ]] || fail "missing TTG-TOKENOMICS-FREEZE-V1.md"
[[ -f "$ROOT/docs/spec/governance-token/protocol-ssot.v1.yaml" ]] || fail "missing protocol-ssot.v1.yaml"
[[ -f "$ROOT/frontend/lib/governance/governanceParamsTtgTokenomicsFreeze.ts" ]] || fail "missing frontend GOV mirror"

step "2 · Forge · GOV enforcement + Country Pool ABI freeze"
(
  cd "$ROOT/contracts"
  forge test --match-contract "TtgGovFreezeV1Enforcement|CountryPoolNetProfitAbiFreeze" -q 2>&1 | tee -a "$LOG"
) || fail "forge gov/country-pool tests"

step "3 · Sepolia 链上 GOV-01～04 + Proxy 架构"
export GOV_FREEZE_V1_EVID_DIR="$EVID/onchain"
bash "$ROOT/scripts/dev/verify-gov-freeze-v1-sepolia-onchain.sh" >>"$LOG" 2>&1 || fail "verify-gov-freeze-v1-sepolia-onchain"
ONCHAIN_JSON="$(ls -t "$EVID/onchain"/sepolia-onchain-alignment.json 2>/dev/null | head -1 || true)"
[[ -n "$ONCHAIN_JSON" ]] || fail "missing sepolia-onchain-alignment.json"
export TTG_AUDIT_ONCHAIN_JSON="$ONCHAIN_JSON"

step "4 · Country Pool DE · 45/55 bps + triplet"
LEDGER="${COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS:-}"
RPC="$CHAIN_RPC_URL"
if [[ -n "$LEDGER" ]] && command -v cast >/dev/null 2>&1; then
  steward_bps="$(cast call "$LEDGER" "bpsStewardPath()(uint16)" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}' || echo "")"
  global_bps="$(cast call "$LEDGER" "bpsGlobalTreasury()(uint16)" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}' || echo "")"
  export TTG_AUDIT_EVID="$EVID"
  export CP_STEWARD_BPS="$steward_bps"
  export CP_GLOBAL_BPS="$global_bps"
  export CP_LEDGER="$LEDGER"
  export CP_STEWARD_VAULT="${COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS:-}"
  export CP_UNALLOC_VAULT="${COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS:-}"
  export CP_SETTLEMENT="${COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS:-}"
  $PY <<'PY'
import json, os, pathlib
evid = pathlib.Path(os.environ["TTG_AUDIT_EVID"])
steward_bps = os.environ.get("CP_STEWARD_BPS", "")
global_bps = os.environ.get("CP_GLOBAL_BPS", "")
verdict = "PASS" if steward_bps == "4500" and global_bps == "5500" else "FAIL"
evidence = {
  "jurisdiction": "DE",
  "ledger": os.environ.get("CP_LEDGER", ""),
  "bps_steward_path": int(steward_bps or 0),
  "bps_global_treasury": int(global_bps or 0),
  "expected": {"steward": 4500, "global": 5500},
  "triplet": {
    "steward_path_vault": os.environ.get("CP_STEWARD_VAULT", ""),
    "unallocated_vault": os.environ.get("CP_UNALLOC_VAULT", ""),
    "settlement_token": os.environ.get("CP_SETTLEMENT", ""),
  },
  "verdict": verdict,
}
evid.mkdir(parents=True, exist_ok=True)
(evid / "country-pool-bps.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
print(json.dumps(evidence, indent=2))
raise SystemExit(0 if verdict == "PASS" else 1)
PY
  cp_result=$?
  [[ $cp_result -eq 0 ]] || fail "Country Pool DE bps mismatch steward=${steward_bps} global=${global_bps}"
else
  export TTG_AUDIT_EVID="$EVID"
  $PY <<'PY'
import json, os, pathlib
evid = pathlib.Path(os.environ["TTG_AUDIT_EVID"])
evid.mkdir(parents=True, exist_ok=True)
(evid / "country-pool-bps.json").write_text(json.dumps({"verdict":"SKIP","reason":"ledger unset or cast missing"}, indent=2), encoding="utf-8")
PY
  fail "COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS required for full audit"
fi

step "5 · UI 页 · vitest 契约（治理/主理人/池/Treasury/兑换收益）"
export TTG_AUDIT_EVID="$EVID"
UI_EVID="$(bash "$ROOT/scripts/dev/audit-gov-freeze-v1-governance-ui-local.sh" 2>&1 | tee -a "$LOG" | grep -o 'evidence=[^ ]*' | tail -1 | cut -d= -f2- || true)"
if [[ -n "$UI_EVID" && -f "$UI_EVID/ui-audit-report.json" ]]; then
  cp "$UI_EVID/ui-audit-report.json" "$EVID/ui-audit-report.json"
fi

step "6 · API protocol-reference（可选 · :8080）"
API="${API_BASE:-http://127.0.0.1:8080}"
code="$(curl -s -o "$EVID/protocol-reference.json" -w '%{http_code}' "${API}/api/v1/governance/protocol-reference" 2>/dev/null || echo 000)"
echo "protocol-reference HTTP $code" >>"$LOG"
if [[ "$code" == "200" ]]; then
  export TTG_AUDIT_EVID="$EVID"
  $PY <<'PY'
import json, os, pathlib
evid = pathlib.Path(os.environ["TTG_AUDIT_EVID"])
p = evid / "protocol-reference.json"
body = json.loads(p.read_text(encoding="utf-8"))
p.write_text(json.dumps({"http": 200, "doc_version": body.get("doc_version"), "has_governance_reads": "protocol_reference_reads" in str(body)}, indent=2), encoding="utf-8")
PY
fi

step "7 · 生成 Full-System Audit 报告"
export TTG_AUDIT_ROOT="$ROOT" TTG_AUDIT_EVID="$EVID"
REPORT_VERDICT="$($PY "$ROOT/scripts/dev/lib/ttg-tokenomics-full-system-audit-report.py" 2>&1 | tee -a "$LOG" | grep '^TTG_TOKENOMICS_FULL_SYSTEM_AUDIT:' | awk '{print $2}' || echo FAIL)"
[[ "$REPORT_VERDICT" == "PASS" || "$REPORT_VERDICT" == "PASS_WITH_PARTIAL" ]] || fail "report verdict $REPORT_VERDICT"

ln -sfn "$STAMP" "$ROOT/evidence/GO_ttg_tokenomics_full_system_audit/latest" 2>/dev/null || \
  echo "$STAMP" >"$ROOT/evidence/GO_ttg_tokenomics_full_system_audit/latest-stamp.txt"

echo "TTG_TOKENOMICS_FULL_SYSTEM_AUDIT: ${REPORT_VERDICT} stamp=${STAMP} evidence=${EVID}"
echo "TTG_TOKENOMICS_FULL_SYSTEM_AUDIT_SUMMARY: ${REPORT_VERDICT}"
echo "Human test gate: OPEN (see docs/spec/governance-token/TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT.md)"
exit 0
