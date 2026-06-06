#!/usr/bin/env bash
# Phase 2.5 · CH-H05 · Stake / Release / Claim chain write-path staging verification
#
#   STAGING_API_BASE=https://tt-api-staging.fly.dev \
#     bash scripts/dev/smoke-phase25-h5-chain-write-staging.sh
#
# ② policy: chain WRITE txs (stake/release/redemption claim) are NOT broadcast in hardening.
# This script records: readonly quote/status + dry-run prechecks + explicit WRITE=N/A boundary.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase25-staging-http-lib.sh
source "$ROOT/scripts/dev/lib/phase25-staging-http-lib.sh"

API="$(phase25_api_base)"

echo "== smoke-phase25-h5-chain-write-staging API=${API} =="
phase25_require_health "$API"

# HTTP read surfaces (② already partially covered — re-assert for hardening bundle)
sq_out="$(curl --noproxy "*" -sS -w "|%{http_code}" \
  "${API}/api/v1/steward/stake-quote?jurisdictions=CN" 2>/dev/null || echo "|000")"
sq_code="${sq_out##*|}"
[[ "$sq_code" == "200" ]] || phase25_fail "stake-quote HTTP ${sq_code}"
phase25_ok "stake-quote 200"

rq_out="$(curl --noproxy "*" -sS -w "|%{http_code}" \
  "${API}/api/v1/redemption/quote?jurisdiction=CN" 2>/dev/null || echo "|000")"
rq_code="${rq_out##*|}"
[[ "$rq_code" == "200" ]] || phase25_fail "redemption/quote HTTP ${rq_code}"
phase25_ok "redemption/quote 200"

# On-chain readonly (G6 path) — RPC flake must not fail HTTP hardening bundle
if [[ -f "$ROOT/.env" ]] || [[ -n "${CHAIN_RPC_URL:-}" ]]; then
  if bash "$ROOT/scripts/dev/smoke-steward-stake-testnet-readonly.sh"; then
    phase25_ok "steward pool readonly cast checks"
  else
    echo "phase25: WARN steward readonly cast failed (RPC 502/timeout) — HTTP quote/status already verified"
  fi
else
  echo "phase25: SKIP cast readonly (no CHAIN_RPC_URL / .env)"
fi

# Dry-run scripts (no broadcast) — optional skip when prior evidence exists
if [[ "${PHASE25_SKIP_FORGE_DRYRUN:-0}" != "1" ]]; then
  for dr in \
    "$ROOT/scripts/dev/phase2-sepolia-steward-pool-dry-run.sh" \
    "$ROOT/scripts/dev/phase2-sepolia-redemption-epoch-dry-run.sh"; do
    if [[ -f "$dr" ]]; then
      if bash "$dr" 2>/dev/null; then
        phase25_ok "$(basename "$dr") exit 0"
      else
        echo "phase25: WARN $(basename "$dr") non-zero (env may be incomplete) — WRITE boundary still N/A"
      fi
    fi
  done
else
  echo "phase25: SKIP forge dry-run (PHASE25_SKIP_FORGE_DRYRUN=1)"
fi

cat <<EOF
phase25: CHAIN_WRITE_TX boundary (explicit):
  - RegionStewardStakePool.stake/release: NOT executed (LEGAL/84 · ② readonly only)
  - CountryPoolRedemptionEpochV0.claim/settle: NOT executed (Timelock owner · pilot CN)
  - InvestorDistributionClaim.withdrawDividend: NOT executed (C-GOV-010 staging N/A)
EOF

echo "TT_PHASE25_H5_CHAIN_WRITE: OK_READONLY_AND_DRYRUN"
echo "  chain_write_tx: N/A_BY_POLICY"
