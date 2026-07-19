#!/usr/bin/env bash
# V311 Clean Sepolia Redeploy · Full Constitution Re-Alignment
# Fail-stop: any check FAIL → exit 2 · do NOT close gaps / refresh PSG
#
#   bash scripts/dev/run-v311-clean-redeploy-full-alignment.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
EVID_ROOT="$ROOT/evidence/GO_phase2_v311_sepolia_clean_baseline"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$EVID_ROOT/realignment/${STAMP}"
mkdir -p "$EVID"
FAIL=0
pass() { echo "ALIGN PASS: $*"; echo "PASS $*" >>"$EVID/checks.log"; }
fail() { echo "ALIGN FAIL: $*" >&2; echo "FAIL $*" >>"$EVID/checks.log"; FAIL=1; }

PY=python
command -v python >/dev/null 2>&1 || fail "python missing"

LSTAMP="$(tr -d '\r\n' <"$EVID_ROOT/latest-stamp.txt" 2>/dev/null || true)"
[[ -n "$LSTAMP" ]] || fail "missing latest-stamp"
ONCHAIN="$EVID_ROOT/$LSTAMP/ONCHAIN-VERIFY-LATEST.txt"
[[ -f "$ONCHAIN" ]] || fail "missing on-chain verify $ONCHAIN"
grep -q "TT_V311_ONCHAIN_VERIFY: PASS" "$ONCHAIN" && pass "onchain_verify_artifact" || fail "onchain verify not PASS"

REG="$ROOT/registry/protocol-convergence-deployments.v1.yaml"
grep -q "^active_deploy_baseline: v311_sepolia_clean_baseline" "$REG" && pass "registry_active_v311" || fail "active_deploy_baseline not v311"
grep -q "superseded_by: v311_sepolia_clean_baseline" "$REG" && pass "v2_superseded_pointer" || fail "gov_freeze_v2 not marked superseded_by v311"
MX="$ROOT/registry/web3-active-execution-matrix.v1.yaml"
grep -q "baseline: v311_sepolia_clean_baseline" "$MX" && pass "execution_matrix_baseline" || fail "execution matrix baseline"

# load append
APPEND="$EVID_ROOT/$LSTAMP/phase2-env-append-${LSTAMP}.env"
[[ -f "$APPEND" ]] || fail "missing env append"
set -a
# shellcheck disable=SC1090
source "$APPEND"
set +a
[[ "${TREASURY_USDC_SINK_ADDRESS,,}" == "${V311_TREASURY_P4_CAP_ADDRESS,,}" ]] \
  && pass "env_sink_eq_p4cap" || fail "env sink!=P4Cap"
[[ "${TREASURY_USDC_SINK_ADDRESS,,}" != "0x7c018293396325077bb4d039930dcee11b7fb1cf" ]] \
  && pass "env_sink_ne_safe" || fail "env sink==Safe"

# live recheck (RPC failover · fail if all RPCs fail)
cast_ok() {
  local out r
  for r in https://ethereum-sepolia.publicnode.com https://rpc.sepolia.org https://1rpc.io/sepolia https://sepolia.drpc.org; do
    if out=$(timeout 20 cast "$@" --rpc-url "$r" 2>/dev/null); then
      echo "$out"
      return 0
    fi
  done
  return 1
}
num(){ echo "$1" | awk '{print $1}'; }
if SINK=$(cast_ok call "$V311_PRIMARY_MARKET_ADDRESS" "usdcTreasury()(address)"); then
  [[ "${SINK,,}" == "${V311_TREASURY_P4_CAP_ADDRESS,,}" ]] && pass "live_sink_p4cap" || fail "live sink=$SINK"
else
  fail "live_sink_rpc"
fi
if CAP0=$(num "$(cast_ok call "$V311_PRIMARY_MARKET_ADDRESS" "roundCapTtg(uint256)(uint256)" 0)") \
   && CAP1=$(num "$(cast_ok call "$V311_PRIMARY_MARKET_ADDRESS" "roundCapTtg(uint256)(uint256)" 1)") \
   && CAP2=$(num "$(cast_ok call "$V311_PRIMARY_MARKET_ADDRESS" "roundCapTtg(uint256)(uint256)" 2)"); then
  if "$PY" - <<PY
c0=int("$CAP0"); c1=int("$CAP1"); c2=int("$CAP2"); e=10**18
assert [c0,c1,c2]==[800_000*e,1_200_000*e,3_000_000*e]
PY
  then pass "live_caps"; else fail "live caps values"; fi
else
  fail "live_caps_rpc"
fi
if ADMIN=$(cast_ok call "$V311_TIMELOCK_ADDRESS" "admin()(address)"); then
  [[ "${ADMIN,,}" == "0x7c018293396325077bb4d039930dcee11b7fb1cf" ]] && pass "live_admin_safe" || fail "admin=$ADMIN"
else
  fail "live_admin_rpc"
fi

# phase2 env contains V311 keys (first-wins)
ENVF="$ROOT/scripts/dev/.env.phase2-chain-deploy.local"
first_env() {
  local f="$1" k="$2"
  awk -F= -v key="$k" '$1==key {print $2; exit}' "$f"
}
FE="$ROOT/frontend/.env.local"
ROOTENV="$ROOT/.env"

exp_ttg="$GOVERNANCE_TOKEN_ADDRESS"
exp_tl="$V311_TIMELOCK_ADDRESS"
exp_p4="$V311_TREASURY_P4_CAP_ADDRESS"
exp_pm="$V311_PRIMARY_MARKET_ADDRESS"
exp_stake="$V311_STAKE_POOL_PROXY_ADDRESS"

for pair in \
  "$ENVF:GOVERNANCE_TOKEN_ADDRESS:$exp_ttg" \
  "$ENVF:TIMELOCK_ADDRESS:$exp_tl" \
  "$ENVF:GOVERNANCE_TIMELOCK_ADDRESS:$exp_tl" \
  "$ENVF:GOVERNANCE_TREASURY_P4CAP_ADDRESS:$exp_p4" \
  "$ENVF:TREASURY_P4_CAP_ADDRESS:$exp_p4" \
  "$ENVF:TREASURY_USDC_SINK_ADDRESS:$exp_p4" \
  "$ENVF:PRIMARY_MARKET_ADDRESS:$exp_pm" \
  "$ENVF:REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:$exp_stake" \
  "$ROOTENV:GOVERNANCE_TOKEN_ADDRESS:$exp_ttg" \
  "$ROOTENV:TREASURY_P4_CAP_ADDRESS:$exp_p4" \
  "$FE:NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS:$exp_ttg" \
  "$FE:NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS:$exp_stake"
do
  f="${pair%%:*}"; rest="${pair#*:}"; k="${rest%%:*}"; exp="${rest#*:}"
  got=$(first_env "$f" "$k")
  if [[ -z "$got" ]]; then fail "missing first-wins $f $k"; continue; fi
  if [[ "${got,,}" != "${exp,,}" ]]; then fail "drift first-wins $f $k got=$got exp=$exp"; continue; fi
  if [[ "${got,,}" == "0x7c018293396325077bb4d039930dcee11b7fb1cf" ]]; then fail "Safe in active $f $k"; continue; fi
  # reject known V2 actives
  case "${got,,}" in
    0x7af15f98622b9282298ca3070a698ca4a96a4016|0x904a6c4c6aab698afbf08ec6151d317c393520cc|0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2|0x847b00ddb6ffed71812abc358a407dad4b099fcb|0x2837ea0c50e27d59b88af617abbb231a040062c5|0x3a89378bfad12d1028707dd37055294854c8784e|0xc99776e980d33f1857d5bb9a57b35ab7669aad1f)
      fail "V2 address still ACTIVE first-wins $f $k=$got" ;;
    *) pass "first_wins $k ($(basename "$f"))" ;;
  esac
done

grep -q "V311_SEPOLIA_CLEAN_BASELINE_ACTIVE=1" "$ENVF" && pass "phase2_env_cutover" || fail "phase2 env missing V311 cutover"
grep -q "^PRIMARY_MARKET_ADDRESS=${V311_PRIMARY_MARKET_ADDRESS}$" "$ENVF" && pass "phase2_env_pm" || fail "phase2 env PM mismatch"

if [[ -f "$FE" ]]; then
  grep -q "^NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=${GOVERNANCE_TOKEN_ADDRESS}$" "$FE" \
    && pass "frontend_env_cutover" || fail "frontend NEXT_PUBLIC TTG drift"
else
  fail "frontend .env.local missing"
fi

# gap matrix: pre-close = OPEN+GAP; post-close = CLOSED+PASS (REDEPLOY_RESOLUTION only)
GM="$ROOT/registry/web3-full-constitution-gap-matrix-LATEST.json"
[[ -f "$GM" ]] || fail "missing gap matrix $GM"
"$PY" - "$GM" <<'PY'
import json, sys
d=json.load(open(sys.argv[1], encoding="utf-8"))
ids={"T-04","T-05","DEP-01","R-01"}
modes=set()
for i in d["items"]:
  if i["id"] not in ids:
    continue
  assert i.get("resolution")=="REDEPLOY_RESOLUTION", i
  life=i.get("lifecycle")
  audit=i.get("audit")
  if life=="CLOSED" and audit=="PASS":
    modes.add("closed")
  elif life!="CLOSED" and audit=="GAP":
    modes.add("open")
  else:
    raise SystemExit(f"gap state illegal: {i}")
assert len(modes)==1, f"mixed gap states: {modes}"
print("gaps_mode_ok", modes.pop())
PY
pass "gaps_redeploy_resolution_consistent"

# forge caps constant (local)
(
  cd "$ROOT/contracts"
  forge test --match-test test_freeze_constants_match_ssot_yaml -q
) && pass "forge_caps_constant" || fail "forge_caps_constant"

# write verdict
if [[ "$FAIL" -ne 0 ]]; then
  echo "TT_V311_FULL_ALIGNMENT: FAIL" | tee "$EVID/VERDICT.txt"
  echo "STOP — do not close gaps / refresh PSG / claim GO"
  exit 2
fi

echo "TT_V311_FULL_ALIGNMENT: PASS" | tee "$EVID/VERDICT.txt"
echo "$STAMP" >"$EVID_ROOT/realignment-latest-stamp.txt"
cp "$EVID/VERDICT.txt" "$EVID_ROOT/FULL-ALIGNMENT-VERDICT-LATEST.txt"
echo "ALIGN: all checks PASS · safe to close T-04/T-05/DEP-01/R-01"
