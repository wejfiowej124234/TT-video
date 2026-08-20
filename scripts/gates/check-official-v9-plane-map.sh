#!/usr/bin/env bash
# Official V9 · full plane map (Product www 1:1 + API/Web3 ED under V9).
#
#   bash scripts/gates/check-official-v9-plane-map.sh
#
# Product Truth (must match pin): Official www + Staging www git_sha
# Paired under V9 (must): Official API sha + chain_id=1
# Mapped under V9 as Expected Difference (must stay testnet): Staging API chain_id=11155111
# Forbidden: claim Staging API git_sha must equal product pin; Staging API on mainnet
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PIN_GIT_SHA="${TT_OFFICIAL_V9_GIT_SHA:-3e356617a498b0faac42e4ae457343d36294a770}"
PIN_BUILD_TIME="${TT_OFFICIAL_V9_BUILD_TIME:-2026-08-20T00:51:57Z}"
OFFICIAL_API_SHA="${TT_OFFICIAL_V9_API_SHA:-8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51}"
OFFICIAL_WEB="${PROD_WEB_BASE:-https://www.web3-ttg.com}"
STAGING_WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
OFFICIAL_API="${PROD_API_BASE:-https://api.web3-ttg.com}"
STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
BUILD_ENV="${STAGING_WEB_BUILD_ENV:-$ROOT/deploy/fly/tt-web-staging/build.env.local}"

fail() { echo "check-official-v9-plane-map: FAIL $*" >&2; exit 2; }
ok() { echo "check-official-v9-plane-map: OK $*"; }
info() { echo "check-official-v9-plane-map: $*"; }

bash "$ROOT/scripts/gates/check-official-v9-local-staging-repo-1to1.sh" \
  || fail "product 1:1 www/repo gate failed"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fsS --max-time 30 "${OFFICIAL_WEB%/}/api/release-identity?t=$(date +%s)" >"$TMP/wo.json"
curl -fsS --max-time 30 "${STAGING_WEB%/}/api/release-identity?t=$(date +%s)" >"$TMP/ws.json"
curl -fsS --max-time 30 "${OFFICIAL_API%/}/meta?t=$(date +%s)" >"$TMP/ao.json"
curl -fsS --max-time 30 "${STAGING_API%/}/meta?t=$(date +%s)" >"$TMP/as.json"

eval "$(
  python - "$TMP" <<'PY'
import json, os, sys
d = sys.argv[1]
wo = json.load(open(os.path.join(d, "wo.json"), encoding="utf-8"))
ws = json.load(open(os.path.join(d, "ws.json"), encoding="utf-8"))
ao = json.load(open(os.path.join(d, "ao.json"), encoding="utf-8"))
as_ = json.load(open(os.path.join(d, "as.json"), encoding="utf-8"))
bo = ao.get("build") or {}
bs = as_.get("build") or {}
print(f"WO_SHA={wo.get('git_sha') or ''}")
print(f"WO_BT={wo.get('build_time') or ''}")
print(f"WS_SHA={ws.get('git_sha') or ''}")
print(f"WS_BT={ws.get('build_time') or ''}")
print(f"WS_PROFILE={ws.get('contract_profile') or ''}")
print(f"AO_SHA={bo.get('git_sha') or ''}")
print(f"AO_CHAIN={(ao.get('chain') or {}).get('chain_id') or ''}")
print(f"AS_SHA={bs.get('git_sha') or ''}")
print(f"AS_CHAIN={(as_.get('chain') or {}).get('chain_id') or ''}")
print(f"AS_PROFILE={bs.get('contract_profile') or ''}")
PY
)"

[[ "$WO_SHA" == "$PIN_GIT_SHA" ]] || fail "Official www sha=$WO_SHA ≠ pin"
[[ "$WO_BT" == "$PIN_BUILD_TIME" ]] || fail "Official www build_time=$WO_BT ≠ pin"
[[ "$WS_SHA" == "$PIN_GIT_SHA" ]] || fail "Staging www sha=$WS_SHA ≠ pin"
[[ "$AO_SHA" == "$OFFICIAL_API_SHA" ]] || fail "Official API sha=$AO_SHA ≠ V9-paired $OFFICIAL_API_SHA"
[[ "$AO_CHAIN" == "1" ]] || fail "Official API chain_id=$AO_CHAIN ≠ 1"
[[ "$AS_CHAIN" == "11155111" ]] || fail "Staging API chain_id=$AS_CHAIN ≠ 11155111 (must stay Sepolia under V9 map)"
[[ "$AS_SHA" != "$PIN_GIT_SHA" ]] || fail "Staging API sha equals product pin — forbidden collapse of planes"
[[ "$AS_CHAIN" != "1" ]] || fail "Staging API on mainnet — forbidden"

[[ -f "$BUILD_ENV" ]] || fail "missing $BUILD_ENV"
grep -q 'NEXT_PUBLIC_API_BASE_URL=https://tt-api-staging.fly.dev' "$BUILD_ENV" \
  || fail "Staging www build.env must point NEXT_PUBLIC_API_BASE_URL at tt-api-staging"
grep -q 'API_REWRITE_TARGET=https://tt-api-staging.fly.dev' "$BUILD_ENV" \
  || fail "Staging www build.env must point API_REWRITE_TARGET at tt-api-staging"

info "Official www=$WO_SHA@$WO_BT"
info "Staging www=$WS_SHA@$WS_BT profile=$WS_PROFILE (Candidate profile = ED vs Official mainnet)"
info "Official API=$AO_SHA chain=$AO_CHAIN"
info "Staging API=$AS_SHA chain=$AS_CHAIN profile=$AS_PROFILE (sha≠pin = ED under V9 map)"
ok "V9 plane map · product www 1:1 · Official API paired · Staging API Sepolia ED"
echo "TT_OFFICIAL_V9_PLANE_MAP: PASS"
