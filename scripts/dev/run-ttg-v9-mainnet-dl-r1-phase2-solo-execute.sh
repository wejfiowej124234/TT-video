#!/usr/bin/env bash
# TTG_V9_MAINNET_DL_R1_PHASE2 — after Solo 48h ETA: execute frozen scheduled ops ONLY
# Then Owner signs Legacy Safe → KEEP Timelock.schedule(setFeeRouter) (payload frozen).
# FORBID: redesign · redeploy · address swap · live param edit · public sale · TT_PRODUCTION_GO
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${TTG_V9_MAINNET_ENV:-$ROOT/scripts/dev/.env.mainnet-phase3-deploy.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v9_mainnet_dl_r1"
AUDIT_EV="$ROOT/evidence/GO_ttg_v9_audit"
FREEZE="$AUDIT_EV/V9_MAINNET_DL_R1_PHASE2_FREEZE_WAIT.json"
ADDRS="$EVIDENCE/addresses.env"
MAINNET_CHAIN_ID=1

# Frozen Phase1 pins (must match FREEZE / addresses.env)
SOLO_TL="0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f"
FEE_ROUTER="0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970"
ID_BIND="0x8b96ff20e9b91aabc9e53c20d4555e311cc0813e26e84a123b6ef5ff8176d358"
ID_SEED="0x4da49a34030eba44cb5112bb65cd2a3040179589500a00c347741097b38dfaa0"
ID_CALLER_SR="0x2265e858d10f7c80c117f2e6381100379ef03e492aee527f7c8e15d12a0f19f4"
ID_CALLER_EF="0x3818f4ce821f840cc51a7c0d564c935b776aa0a9ee0e0b088bc132f0482e0a18"
NORM_MARKETING="0xe1e732EfBf9B010a9204054467256d3d93f3CdD4"

fail() { echo "TTG_V9_MAINNET_DL_R1_PHASE2: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V9_MAINNET_DL_R1_PHASE2: OK $*"; }

is_truthy() {
  case "${1:-}" in 1|true|TRUE|yes|YES|on|ON) return 0 ;; *) return 1 ;; esac
}

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

[[ -f "$FREEZE" ]] || fail "missing freeze stamp $FREEZE"
[[ -f "$ADDRS" ]] || fail "missing $ADDRS"
load_env_file "$ENV_FILE"
load_env_file "$ADDRS"

if ! is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_MAINNET_BROADCAST_OK=1"
fi

# Refuse address drift vs freeze
source_addr() { grep -E "^$1=" "$ADDRS" | head -1 | cut -d= -f2- | tr -d '\r'; }
[[ "$(source_addr TIMELOCK)" == "$SOLO_TL" ]] || fail "TIMELOCK drift"
[[ "$(source_addr FEE_ROUTER)" == "$FEE_ROUTER" ]] || fail "FEE_ROUTER drift"
[[ "$(source_addr ID_BIND)" == "$ID_BIND" ]] || fail "ID_BIND drift"
[[ "$(source_addr ID_SEED)" == "$ID_SEED" ]] || fail "ID_SEED drift"
[[ "$(source_addr ID_CALLER_SR)" == "$ID_CALLER_SR" ]] || fail "ID_CALLER_SR drift"
[[ "$(source_addr ID_CALLER_EF)" == "$ID_CALLER_EF" ]] || fail "ID_CALLER_EF drift"

CHAIN_RPC_URL="${CHAIN_RPC_URL:-https://ethereum.publicnode.com}"
CID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || true)"
[[ "$CID" == "$MAINNET_CHAIN_ID" ]] || fail "chain_id=$CID not Mainnet"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY unset"
DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "${DEPLOYER,,}" == "${NORM_MARKETING,,}" ]] || fail "deployer must be Norm Marketing"

ok "waiting SoloTimelock ETA (refuse early execute)"
python - <<PY
import subprocess, sys, time
rpc = "${CHAIN_RPC_URL}"
tl = "${SOLO_TL}"
ids = [
  ("idBind", "${ID_BIND}"),
  ("idSeed", "${ID_SEED}"),
  ("idCallerSr", "${ID_CALLER_SR}"),
  ("idCallerEf", "${ID_CALLER_EF}"),
]
now = int(time.time())
for name, oid in ids:
    out = subprocess.check_output(
        ["cast", "call", tl, "operations(bytes32)(uint256,bool,address,uint256,bytes)", oid, "--rpc-url", rpc],
        text=True,
    ).strip().splitlines()
    ready = int(out[0].split()[0])
    done = out[1].strip().lower() in ("true", "1")
    print(name, "readyAt", ready, "done", done, "wait_s", ready - now)
    if done:
        print("already executed", name)
        continue
    if now < ready:
        print("TOO_EARLY", name, file=sys.stderr)
        sys.exit(2)
print("ALL_READY")
PY

ok "execute frozen Solo ops only"
for ID in "$ID_BIND" "$ID_SEED" "$ID_CALLER_SR" "$ID_CALLER_EF"; do
  DONE="$(cast call "$SOLO_TL" "operations(bytes32)(uint256,bool,address,uint256,bytes)" "$ID" --rpc-url "$CHAIN_RPC_URL" | sed -n '2p' | tr -d '\r' | awk '{print tolower($1)}')"
  if [[ "$DONE" == "true" || "$DONE" == "1" ]]; then
    ok "skip already done $ID"
    continue
  fi
  cast send "$SOLO_TL" "execute(bytes32)" "$ID" \
    --rpc-url "$CHAIN_RPC_URL" --private-key "$PRIVATE_KEY" --legacy >/dev/null
  ok "executed $ID"
done

# Post Solo execute spot-checks (no redesign)
python - <<PY
import subprocess, sys
rpc = "${CHAIN_RPC_URL}"
fr = "${FEE_ROUTER}"
sr = "0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372"
ef = "0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6"
vault = "$(source_addr VAULT)"
market = "$(source_addr MARKET)"

def call(*a):
    return subprocess.check_output(["cast", "call", *a, "--rpc-url", rpc], text=True).strip().split()[0]

bm = call(vault, "market()(address)")
assert bm.lower() == market.lower(), (bm, market)
assert call(fr, "feeRouterCaller(address)(bool)", sr).lower() in ("true", "1")
assert call(fr, "feeRouterCaller(address)(bool)", ef).lower() in ("true", "1")
# SR not yet retargeted
assert call(sr, "feeRouter()(address)").lower() != fr.lower()
print("SOLO_EXECUTE_SPOT_OK")
PY

ok "Solo execute complete — KEEP Safe schedule still required"
ok "Safe payload: $EVIDENCE/KEEP_SAFE_SET_FEE_ROUTER_PAYLOAD.json"
ok "NOT stamping V9_MAINNET_DEPLOYMENT_VERIFIED_STOP yet"
ok "TT_PRODUCTION_GO unchanged"
echo "TTG_V9_MAINNET_DL_R1_PHASE2: STOP_AWAIT_KEEP_SAFE_SCHEDULE"
