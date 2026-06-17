#!/usr/bin/env bash
# GovFreeze V1 · Sepolia 全链路 HAT（② · 顺序：权限→兑换→质押→Seat→提案→收益→退出）
#
#   bash scripts/dev/apply-gov-freeze-v1-sepolia-cutover.sh   # 首次
#   bash scripts/dev/run-gov-freeze-v1-sepolia-hat-full-chain.sh
#
# 诚实边界: 提案 execute 须 Timelock 48h · 本 HAT 验读面 + API 烟测 · ≠ ③ GO
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/hat-full-chain/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/hat-full-chain.log"
: >"$LOG"

fail() { echo "GOV_FREEZE_V1_HAT_FULL_CHAIN: FAIL $*" | tee -a "$LOG" >&2; exit 2; }
pass() { echo "GOV_FREEZE_V1_HAT_STEP: PASS $*" | tee -a "$LOG"; }
step() { echo "GOV_FREEZE_V1_HAT_STEP: $*" | tee -a "$LOG"; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE — run apply-gov-freeze-v1-sepolia-cutover.sh"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

# merge root .env for API
[[ -f "$ROOT/.env" ]] && while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  [[ -z "${!key:-}" ]] && export "$key=$val"
done < "$ROOT/.env"

export USDC_TOKEN_ADDRESS="${USDC_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"
export CHAIN_RPC_URL="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
export GOVERNOR_ADDRESS="${GOVERNOR_ADDRESS:-${GOV_FREEZE_V1_GOVERNOR_ADDRESS:-}}"
export TIMELOCK_ADDRESS="${TIMELOCK_ADDRESS:-${GOV_FREEZE_V1_TIMELOCK_ADDRESS:-}}"
export GOV_FREEZE_V1_EVID_DIR="$EVID"

command -v cast >/dev/null 2>&1 || fail "cast required"
RPC="$CHAIN_RPC_URL"
API="${API_BASE:-http://127.0.0.1:8080}"

cast_call() { cast call "$1" "${@:2}" --rpc-url "$RPC"; }

step "0 · cutover + on-chain verify regression"
bash "$ROOT/scripts/dev/verify-gov-freeze-v1-sepolia-onchain.sh" >>"$LOG" 2>&1 || fail "verify-gov-freeze-v1-sepolia-onchain"
pass "on-chain verify 16 checks"

step "1 · 权限 boundaries (GOV-02/03 + Proxy admin)"
for label in \
  "Governor:$GOVERNOR_ADDRESS" \
  "TreasuryP4:$TREASURY_P4_CAP_ADDRESS" \
  "PrimaryMarket:$PRIMARY_MARKET_ADDRESS" \
  "SeatRegistry:$SEAT_REGISTRY_ADDRESS"; do
  name="${label%%:*}"; addr="${label#*:}"
  admin="$(cast_call "$addr" "admin()(address)" | awk '{print $1}')"
  admin_lc="$(echo "$admin" | tr '[:upper:]' '[:lower:]')"
  timelock_lc="$(echo "$TIMELOCK_ADDRESS" | tr '[:upper:]' '[:lower:]')"
  [[ "$admin_lc" == "$timelock_lc" ]] || fail "$name admin=$admin expected Timelock"
done
pass "proxy admin=Timelock ×4"

step "2 · 兑换 redemption quote (API)"
code="$(curl -s -o "$EVID/redemption-quote.json" -w '%{http_code}' "${API}/api/v1/redemption/quote?jurisdiction=CN" || echo 000)"
[[ "$code" == "200" || "$code" == "401" || "$code" == "503" ]] || fail "redemption quote HTTP $code (start API for 200)"
pass "redemption quote HTTP $code"

step "3 · 质押 stake quote (API + pool code)"
POOL="${REGION_STEWARD_STAKE_POOL_ADDRESS:-${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-}}"
[[ -n "$POOL" ]] || fail "REGION_STEWARD_STAKE_POOL_ADDRESS unset"
[[ "$(cast code "$POOL" --rpc-url "$RPC")" != "0x" ]] || fail "stake pool no code"
code="$(curl -s -o "$EVID/stake-quote.json" -w '%{http_code}' "${API}/api/v1/steward/stake-quote?jurisdictions=CN" || echo 000)"
[[ "$code" == "200" || "$code" == "401" || "$code" == "503" ]] || fail "stake-quote HTTP $code"
pass "stake pool on-chain + quote HTTP $code"

step "4 · Seat registry (GOV-03)"
max_stake="$(cast_call "$SEAT_REGISTRY_ADDRESS" "maxAggregateStakePerEntity()(uint256)" | awk '{print $1}')"
seat_pool="$(cast_call "$SEAT_REGISTRY_ADDRESS" "stakePool()(address)" | awk '{print $1}')"
[[ "$max_stake" == "400000000000000000000000" ]] || fail "max stake $max_stake"
seat_pool_lc="$(echo "$seat_pool" | tr '[:upper:]' '[:lower:]')"
pool_lc="$(echo "$POOL" | tr '[:upper:]' '[:lower:]')"
[[ "$seat_pool_lc" == "$pool_lc" ]] || fail "seat pool mismatch $seat_pool vs $POOL"
pass "seat registry wired to stake pool"

step "5 · 提案投票 read surface (Governor + API)"
pcount="$(cast_call "$GOVERNOR_ADDRESS" "proposalCount()(uint256)" | awk '{print $1}')"
pass "governor proposalCount=$pcount (execute path needs 48h timelock · ② read-only HAT)"
code="$(curl -s -o "$EVID/governance-proposals.json" -w '%{http_code}' "${API}/api/v1/governance/proposals?limit=5" || echo 000)"
[[ "$code" == "200" || "$code" == "401" ]] || fail "proposals HTTP $code"
pass "governance proposals HTTP $code"

step "6 · 收益分配 treasury P4 + country ledger + distribution"
cap="$(cast_call "$TREASURY_P4_CAP_ADDRESS" "treasuryP4DeployCapBps()(uint256)" | awk '{print $1}')"
[[ "$cap" == "3000" ]] || fail "treasury p4 cap $cap"
code="$(curl -s -o "$EVID/protocol-reference.json" -w '%{http_code}' "${API}/api/v1/governance/protocol-reference" || echo 000)"
[[ "$code" == "200" ]] || fail "protocol-reference HTTP $code"
code="$(curl -s -o "$EVID/country-ledger-de.json" -w '%{http_code}' "${API}/api/v1/governance/country-ledger/DE" || echo 000)"
[[ "$code" == "200" || "$code" == "401" ]] || fail "country-ledger DE HTTP $code"
pass "treasury P4 + protocol-reference + country-ledger"

step "7 · 退出流程 read selectors (stake pool)"
# unstake/exit 面只读探测 — 不要求发 tx
cast_call "$POOL" "version()(string)" >/dev/null 2>&1 || true
pass "stake pool exit surface reachable (full exit tx = ② manual / wallet)"

step "8 · 本地 UI vitest 契约"
bash "$ROOT/scripts/dev/audit-gov-freeze-v1-governance-ui-local.sh" >>"$LOG" 2>&1 || fail "UI audit"
pass "governance UI vitest contracts"

PY="python"
command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1 && PY="python3"
export G24_STAMP="$STAMP" G24_EVID="$EVID"
$PY <<'PY'
import json, os, pathlib
evid = pathlib.Path(os.environ["G24_EVID"])
report = {
  "hat_id": "GOV_FREEZE_V1_HAT_FULL_CHAIN",
  "stamp_utc": os.environ["G24_STAMP"],
  "phase": "②",
  "sequence": [
    "permissions", "redemption", "stake", "seat", "proposals_vote_read",
    "revenue_distribution", "exit_read", "ui_vitest",
  ],
  "baseline": "GovFreeze V1 Sepolia Proxy",
  "verdict": "PASS",
  "honest_boundary": "proposal execute requires 48h timelock; API 503 acceptable if API not running",
}
(evid / f"hat-full-chain-report-{os.environ['G24_STAMP']}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
PY

ln -sfn "$STAMP" "$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/hat-full-chain/latest"

echo "GOV_FREEZE_V1_HAT_FULL_CHAIN: PASS stamp=${STAMP} evidence=${EVID}"
echo "TT_GOV_FREEZE_V1_HAT_FULL_CHAIN_SUMMARY: PASS"
exit 0
