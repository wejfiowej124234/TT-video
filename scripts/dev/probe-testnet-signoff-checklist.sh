#!/usr/bin/env bash
# ② Testnet Sign-off · staging machine probes (T-ENV-* · T-CHAIN-* · T-ID-01).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
FE="${FE%/}"
OUT="${1:-$ROOT/evidence/manual-uat/sessions/latest/testnet-probes.jsonl}"
mkdir -p "$(dirname "$OUT")"
: >"$OUT"

log() { echo "$1" | tee -a "${OUT%.jsonl}.log"; }
fail=0

probe() {
  local id="$1" status="$2" note="${3:-}"
  log "$status $id $note"
  local esc
  esc="$(python -c "import json,sys; print(json.dumps(sys.argv[1]))" "$note")"
  echo "{\"id\":\"$id\",\"status\":\"$status\",\"note\":$esc}" >>"$OUT"
  [[ "$status" == "PASS" ]] || fail=1
}

hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' --max-time 30 "${API}/health" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] && probe T-ENV-01 PASS "HTTP $hc" || probe T-ENV-01 FAIL "HTTP $hc"

fe="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' --max-time 30 "${FE}/" 2>/dev/null || echo 000)"
[[ "$fe" =~ ^(200|301|302|307|308)$ ]] && probe T-ENV-02 PASS "HTTP $fe" || probe T-ENV-02 FAIL "HTTP $fe"

export PROBE_API="$API"
META_JSON="$(curl --noproxy "*" -sS --max-time 90 "${API}/meta" 2>/dev/null || echo '{}')"
BUILD_JSON="$(curl --noproxy "*" -sS --max-time 45 "${API}/meta/build" 2>/dev/null || echo '{}')"
export PROBE_META_JSON="$META_JSON"
export PROBE_BUILD_JSON="$BUILD_JSON"
while IFS='|' read -r st id note; do
  [[ -n "$id" ]] || continue
  probe "$id" "$st" "$note"
done < <(python << 'PY'
import json, os
meta = json.loads(os.environ.get("PROBE_META_JSON") or "{}")
build = json.loads(os.environ.get("PROBE_BUILD_JSON") or "{}")
prof = build.get("deployment_profile") or (meta.get("build") or {}).get("deployment_profile") or ""
chain = meta.get("chain") or {}
cid = chain.get("chain_id")
cc = chain.get("contracts") or {}
def addr_ok(v):
    return isinstance(v, str) and v.startswith("0x") and len(v) >= 42
checks = [
    ("T-ENV-03", prof == "staging", f"profile={prof!r}"),
    ("T-ENV-04", str(cid) == "11155111", f"chain_id={cid!r}"),
    ("T-CHAIN-01", bool(cc) and isinstance(cc, dict), f"keys={len(cc)}"),
    ("T-CHAIN-02", all(addr_ok(cc.get(k)) for k in ("registry_address", "fee_router_address", "escrow_factory_address")), "core trio"),
    ("T-CHAIN-03", all(addr_ok(cc.get(k)) for k in ("governance_token_address", "guide_staking_address", "region_steward_stake_pool_address")), "gov/stake trio"),
]
for cid, ok, note in checks:
    print(f"{'PASS' if ok else 'FAIL'}|{cid}|{note}")
PY
)

lc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' --max-time 30 -X POST "${API}/auth/login" \
  -H 'Content-Type: application/json' -d '{"email":"probe-invalid@test","password":"x"}' 2>/dev/null || echo 000)"
[[ "$lc" =~ ^(401|400|422|403)$ ]] && probe T-ID-01 PASS "login gate HTTP $lc" || probe T-ID-01 FAIL "login HTTP $lc"

if [[ "$fail" -eq 0 ]]; then
  log "TT_TESTNET_SIGNOFF_PROBE: PASS"
  exit 0
fi
log "TT_TESTNET_SIGNOFF_PROBE: FAIL"
exit 1
