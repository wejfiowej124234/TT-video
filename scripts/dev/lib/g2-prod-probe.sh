#!/usr/bin/env bash
# G2 prod-base probes — shared by Reality Fix + Re-Audit.
# Requires PROD_API_BASE (default https://tt-api-prod.fly.dev).
# Staging cross-check uses STAGING_API_BASE when G2_COMPARE_STAGING=1.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PROD_API_BASE="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
PROD_API_BASE="${PROD_API_BASE%/}"
STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API_BASE="${STAGING_API_BASE%/}"
FLY_PROD_API_APP="${FLY_PROD_API_APP:-tt-api-prod}"

g2_curl_json() {
  local url="$1"
  curl -sS --max-time "${2:-20}" "$url" 2>/dev/null || echo '{}'
}

g2_curl_post_code() {
  local url="$1" idem="$2"
  curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
    -X POST "$url" \
    -H 'Content-Type: application/json' \
    -H "Idempotency-Key: ${idem}" \
    -d '{}' 2>/dev/null || echo '000'
}

g2_probe_internal_exposure() {
  local base="$1" label="$2" out_dir="$3"
  local idem="g2-${label}-internal-$(date +%s)-$RANDOM"
  local code
  code="$(g2_curl_post_code "${base}/api/v1/internal/indexer-tick" "$idem")"
  printf '%s\n' "$code" >"${out_dir}/internal-no-secret.http"
  echo "${label}_internal_no_secret_http=${code}"
}

g2_probe_meta_build() {
  local base="$1" label="$2" out_dir="$3"
  g2_curl_json "${base}/meta/build" >"${out_dir}/meta-build.json"
  g2_curl_json "${base}/meta" >"${out_dir}/meta.json"
  python - "${out_dir}/meta-build.json" "${out_dir}/meta.json" "$label" <<'PY' | tee "${out_dir}/meta-summary.txt"
import json, sys
build_p, meta_p, label = sys.argv[1:4]
build = json.load(open(build_p, encoding="utf-8"))
meta = json.load(open(meta_p, encoding="utf-8"))
sm = meta.get("strict_mode") or {}
print(f"{label}_deployment_profile={build.get('deployment_profile')}")
print(f"{label}_internal_api_secret_configured={sm.get('internal_api_secret_configured')}")
print(f"{label}_git_sha={build.get('git_sha')}")
PY
}

g2_probe_seed_endpoint() {
  local base="$1" label="$2" out_dir="$3"
  local idem="g2-${label}-seed-$(date +%s)-$RANDOM"
  local code body
  body="$(curl -sS --max-time 15 \
    -X POST "${base}/auth/seed-test-accounts" \
    -H 'Content-Type: application/json' \
    -H "Idempotency-Key: ${idem}" \
    -d '{}' 2>/dev/null || true)"
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
    -X POST "${base}/auth/seed-test-accounts" \
    -H 'Content-Type: application/json' \
    -H "Idempotency-Key: ${idem}-code" \
    -d '{}' 2>/dev/null || echo '000')"
  printf '%s\n' "$body" >"${out_dir}/seed-post.body.json"
  printf '%s\n' "$code" >"${out_dir}/seed-post.http"
  echo "${label}_seed_post_http=${code}"
}

g2_probe_fly_secrets_inventory() {
  local out_dir="$1"
  if ! command -v fly >/dev/null 2>&1 || ! fly auth whoami >/dev/null 2>&1; then
    echo 'fly_cli=unavailable' | tee "${out_dir}/fly-secrets-inventory.txt"
    return 0
  fi
  fly secrets list -a "$FLY_PROD_API_APP" 2>&1 | tee "${out_dir}/fly-secrets-list.txt" || true
  for key in SEED_TEST_ACCOUNTS INTERNAL_API_SECRET TRAVELTRUST_DEPLOYMENT_PROFILE \
    TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE TRAVELTRUST_MARKET_PUBLIC_SHOWCASE; do
    if grep -q "^${key}[[:space:]]" "${out_dir}/fly-secrets-list.txt" 2>/dev/null; then
      echo "fly_secret_present_${key}=yes"
    else
      echo "fly_secret_present_${key}=no"
    fi
  done | tee -a "${out_dir}/fly-secrets-inventory.txt"
}

g2_probe_fly_env_redacted() {
  local out_dir="$1"
  if ! command -v fly >/dev/null 2>&1 || ! fly auth whoami >/dev/null 2>&1; then
    echo 'fly_ssh=unavailable' >"${out_dir}/fly-env-redacted.txt"
    return 0
  fi
  fly ssh console -a "$FLY_PROD_API_APP" -C \
    'sh -c "echo SEED_TEST_ACCOUNTS=$SEED_TEST_ACCOUNTS; echo TRAVELTRUST_DEPLOYMENT_PROFILE=$TRAVELTRUST_DEPLOYMENT_PROFILE; echo TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=$TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE; echo TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=$TRAVELTRUST_MARKET_PUBLIC_SHOWCASE; echo DID_RANK_SEED_MARKET_DEMO=$DID_RANK_SEED_MARKET_DEMO"' \
    2>&1 | rg -v '^Connecting to |^Error: ssh shell' >"${out_dir}/fly-env-redacted.txt" || true
}

g2_compare_staging_prod_profiles() {
  local out_dir="$1"
  mkdir -p "$out_dir"
  g2_probe_meta_build "$STAGING_API_BASE" staging "$out_dir"
  g2_probe_meta_build "$PROD_API_BASE" prod "$out_dir"
  python - "${out_dir}/meta-summary.txt" <<'PY' | tee "${out_dir}/profile-compare.txt"
import pathlib, sys
vals = {}
for line in pathlib.Path(sys.argv[1]).read_text(encoding="utf-8").splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        vals[k] = v
sp, pp = vals.get("staging_deployment_profile"), vals.get("prod_deployment_profile")
same = sp == pp and sp not in (None, "", "null")
print(f"staging_profile={sp}")
print(f"prod_profile={pp}")
print(f"profiles_distinct={not same}")
PY
}
