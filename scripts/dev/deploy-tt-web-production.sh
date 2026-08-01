#!/usr/bin/env bash
# Phase ③ · 部署 tt-web-prod（Fly · Next.js standalone · 基础设施）
#
# FEP Path A · attestation parity with staging (same Dockerfile.fly-staging):
#   stamps NEXT_PUBLIC_GIT_SHA / ARTIFACT / DIGEST / BUILD_TIME from tip
#   so /api/release-identity matches Release Artifact (fail-closed empty SHA).
#
#   bash scripts/dev/deploy-tt-web-production.sh
#   bash scripts/dev/deploy-tt-web-production.sh --check-only
set -euo pipefail

# TRAVELTRUST_DEPLOY_ROOT: bake from a clean worktree tip (e.g. Staging Product Truth 1ff71858)
# while using this script from the living checkout.
ROOT="${TRAVELTRUST_DEPLOY_ROOT:-}"
if [[ -z "$ROOT" ]]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
else
  ROOT="$(cd "$ROOT" && pwd)"
fi
APP="${FLY_PROD_WEB_APP:-tt-web-prod}"
FLY_CONFIG="${FLY_PROD_WEB_CONFIG:-fly.production.toml}"
BUILD_ENV="${PROD_WEB_BUILD_ENV:-$ROOT/deploy/fly/tt-web-prod/build.env.local}"
BUILD_EXAMPLE="$ROOT/deploy/fly/tt-web-prod/build.env.example"
API_BASE="${PROD_API_BASE:-https://api.web3-ttg.com}"
# Prefer public apex for health / release-identity (CDN may front Fly hostname)
WEB_BASE="${PROD_WEB_BASE:-https://www.web3-ttg.com}"
info_root() { echo "deploy-tt-web-production: ROOT=$ROOT"; }

fail() { echo "deploy-tt-web-production: FAIL $*" >&2; exit 2; }
ok() { echo "deploy-tt-web-production: OK $*"; }
info() { echo "deploy-tt-web-production: $*"; }

CHECK_ONLY=0
[[ "${1:-}" == "--check-only" ]] && CHECK_ONLY=1

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
[[ -f "$ROOT/frontend/$FLY_CONFIG" ]] || fail "missing $ROOT/frontend/$FLY_CONFIG"

if [[ ! -f "$BUILD_ENV" ]]; then
  echo "deploy-tt-web-production: seeding $BUILD_ENV from example"
  mkdir -p "$(dirname "$BUILD_ENV")"
  cp "$BUILD_EXAMPLE" "$BUILD_ENV"
  fail "edit $BUILD_ENV with prod domains then re-run"
fi

merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    export "${line%%=*}=${line#*=}"
  done <"$f"
}
merge_env "$BUILD_ENV"

[[ -n "${NEXT_PUBLIC_API_BASE_URL:-}" ]] || fail "NEXT_PUBLIC_API_BASE_URL required in build.env.local"
[[ "$NEXT_PUBLIC_API_BASE_URL" != *example.com* ]] || fail "replace example.com in build.env.local"

export TRAVELTRUST_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://web3-ttg.com}"
export API_REWRITE_TARGET="${API_REWRITE_TARGET:-$NEXT_PUBLIC_API_BASE_URL}"
export NEXT_PUBLIC_CHAIN_ID="${NEXT_PUBLIC_CHAIN_ID:-1}"
export NEXT_PUBLIC_RPC_URL="${NEXT_PUBLIC_RPC_URL:-}"
export NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS="${NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS:-${ESCROW_FACTORY_V2_ADDRESS:-}}"
export NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS="${NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS:-${ESCROW_FACTORY_ADDRESS:-}}"
export NEXT_PUBLIC_FEE_ROUTER_ADDRESS="${NEXT_PUBLIC_FEE_ROUTER_ADDRESS:-${FEE_ROUTER_ADDRESS:-}}"
export NEXT_PUBLIC_GOVERNOR_ADDRESS="${NEXT_PUBLIC_GOVERNOR_ADDRESS:-${GOVERNOR_ADDRESS:-}}"
export NEXT_PUBLIC_REGISTRY_ADDRESS="${NEXT_PUBLIC_REGISTRY_ADDRESS:-${REGISTRY_ADDRESS:-}}"
export NEXT_PUBLIC_GUIDE_STAKING_ADDRESS="${NEXT_PUBLIC_GUIDE_STAKING_ADDRESS:-${GUIDE_STAKING_POOL_ADDRESS:-}}"
export NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS="${NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS:-${PROVIDER_STAKING_POOL_ADDRESS:-}}"
# FEP Product Reality Parity · Staging Runtime Truth is sole non-Web3 baseline.
# Catalog bake must match Staging (else Ambient silently falls back to Unsplash).
export NEXT_PUBLIC_CATALOG_API_ENABLED="${NEXT_PUBLIC_CATALOG_API_ENABLED:-1}"
export NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI="${NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI:-0}"
# Product Truth · Staging bake emits preload-tier=production via this mode
export NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE="${NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE:-tier1-playback}"
export NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL="${NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL:-https://traveltrust-community-media.fly.storage.tigris.dev}"
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES="${NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES:-$NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}"

# Runtime Attestation · same contract as staging (Dockerfile.fly-staging fail-closed on empty SHA)
_WEB_GIT_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo local)"
export NEXT_PUBLIC_PSG_RELEASE_VERSION="${NEXT_PUBLIC_PSG_RELEASE_VERSION:-${TRAVELTRUST_PSG_RELEASE_VERSION:-PSG-REL-20260720-WEB3-CAND-V2}}"
if [[ -n "${TRAVELTRUST_GIT_SHA:-}" ]]; then
  export NEXT_PUBLIC_GIT_SHA="$TRAVELTRUST_GIT_SHA"
else
  export NEXT_PUBLIC_GIT_SHA="$_WEB_GIT_SHA"
fi
export NEXT_PUBLIC_ARTIFACT_SHA="${TRAVELTRUST_ARTIFACT_SHA:-$NEXT_PUBLIC_GIT_SHA}"
export NEXT_PUBLIC_IMAGE_DIGEST="${TRAVELTRUST_IMAGE_DIGEST:-gitsha:$NEXT_PUBLIC_GIT_SHA}"
export NEXT_PUBLIC_BUILD_TIME="${TRAVELTRUST_BUILD_TIME:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
export NEXT_PUBLIC_CONTRACT_PROFILE="${NEXT_PUBLIC_CONTRACT_PROFILE:-${TRAVELTRUST_CONTRACT_PROFILE:-v311_fund_safety_candidate_v2}}"
# Env surface label only (ACCEPTED_DIFFERENCE vs Staging label) — not product CMS/catalog bake.
export NEXT_PUBLIC_DATABASE_BASELINE="${NEXT_PUBLIC_DATABASE_BASELINE:-${TRAVELTRUST_DATABASE_BASELINE:-production_surface}}"
export NEXT_PUBLIC_CMS_BASELINE="${NEXT_PUBLIC_CMS_BASELINE:-${TRAVELTRUST_CMS_BASELINE:-public_display_10x4 + catalog_bake=1}}"
export FLY_WEB_NO_CACHE="${FLY_WEB_NO_CACHE:-1}"
info "attestation bake git_sha=$NEXT_PUBLIC_GIT_SHA catalog=$NEXT_PUBLIC_CATALOG_API_ENABLED cms=$NEXT_PUBLIC_CMS_BASELINE no_cache=$FLY_WEB_NO_CACHE chain_id=$NEXT_PUBLIC_CHAIN_ID"

[[ -n "${NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS:-}" ]] \
  || fail "NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS required (Candidate v2) — set in build.env.local"
[[ -n "${NEXT_PUBLIC_GIT_SHA:-}" && "${NEXT_PUBLIC_GIT_SHA}" != "local" ]] \
  || fail "NEXT_PUBLIC_GIT_SHA empty/local — refuse dirty/unknown bake (FEP Path A)"
[[ "${NEXT_PUBLIC_CATALOG_API_ENABLED}" == "1" ]] \
  || fail "NEXT_PUBLIC_CATALOG_API_ENABLED must be 1 (Staging Runtime Truth; got ${NEXT_PUBLIC_CATALOG_API_ENABLED})"
case "${NEXT_PUBLIC_CMS_BASELINE}" in
  *"catalog_bake=1"*) ;;
  *) fail "NEXT_PUBLIC_CMS_BASELINE must include catalog_bake=1 (Staging Runtime Truth; got ${NEXT_PUBLIC_CMS_BASELINE})" ;;
esac

if [[ "$CHECK_ONLY" == "1" ]]; then
  ok "check-only · API=${NEXT_PUBLIC_API_BASE_URL} WEB=${NEXT_PUBLIC_SITE_URL:-$WEB_BASE} sha=$NEXT_PUBLIC_GIT_SHA"
  exit 0
fi

fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

info "syncing runtime attestation secrets to tip …"
fly secrets set -a "$APP" \
  "TRAVELTRUST_GIT_SHA=${NEXT_PUBLIC_GIT_SHA}" \
  "TRAVELTRUST_ARTIFACT_SHA=${NEXT_PUBLIC_ARTIFACT_SHA}" \
  "TRAVELTRUST_IMAGE_DIGEST=${NEXT_PUBLIC_IMAGE_DIGEST}" \
  "TRAVELTRUST_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}" \
  "TRAVELTRUST_PSG_RELEASE_VERSION=${NEXT_PUBLIC_PSG_RELEASE_VERSION}" \
  "TRAVELTRUST_CONTRACT_PROFILE=${NEXT_PUBLIC_CONTRACT_PROFILE}" \
  >/dev/null \
  || fail "fly secrets set attestation failed"

declare -a BUILD_ARGS=(
  --build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
  --build-arg "NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}"
  --build-arg "API_REWRITE_TARGET=${API_REWRITE_TARGET}"
  --build-arg "NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}"
  --build-arg "NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL}"
  --build-arg "NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS=${NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS}"
  --build-arg "NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=${NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS}"
  --build-arg "NEXT_PUBLIC_FEE_ROUTER_ADDRESS=${NEXT_PUBLIC_FEE_ROUTER_ADDRESS}"
  --build-arg "NEXT_PUBLIC_GOVERNOR_ADDRESS=${NEXT_PUBLIC_GOVERNOR_ADDRESS}"
  --build-arg "NEXT_PUBLIC_REGISTRY_ADDRESS=${NEXT_PUBLIC_REGISTRY_ADDRESS}"
  --build-arg "NEXT_PUBLIC_GUIDE_STAKING_ADDRESS=${NEXT_PUBLIC_GUIDE_STAKING_ADDRESS}"
  --build-arg "NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS=${NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS}"
  --build-arg "NEXT_PUBLIC_CATALOG_API_ENABLED=${NEXT_PUBLIC_CATALOG_API_ENABLED}"
  --build-arg "NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI=${NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI}"
  --build-arg "NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE=${NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE}"
  --build-arg "NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}"
  --build-arg "NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=${NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES}"
  --build-arg "NEXT_PUBLIC_PSG_RELEASE_VERSION=${NEXT_PUBLIC_PSG_RELEASE_VERSION}"
  --build-arg "NEXT_PUBLIC_GIT_SHA=${NEXT_PUBLIC_GIT_SHA}"
  --build-arg "NEXT_PUBLIC_ARTIFACT_SHA=${NEXT_PUBLIC_ARTIFACT_SHA}"
  --build-arg "NEXT_PUBLIC_IMAGE_DIGEST=${NEXT_PUBLIC_IMAGE_DIGEST}"
  --build-arg "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}"
  --build-arg "NEXT_PUBLIC_CONTRACT_PROFILE=${NEXT_PUBLIC_CONTRACT_PROFILE}"
  --build-arg "NEXT_PUBLIC_DATABASE_BASELINE=${NEXT_PUBLIC_DATABASE_BASELINE}"
  --build-arg "NEXT_PUBLIC_CMS_BASELINE=${NEXT_PUBLIC_CMS_BASELINE}"
  --build-arg "BUILD_NODE_MAX_OLD_SPACE_SIZE=${BUILD_NODE_MAX_OLD_SPACE_SIZE:-4096}"
)

DEPLOY_EXTRA=()
if [[ "${FLY_WEB_REMOTE_BUILD:-}" == "1" ]]; then
  info "using Fly remote builder (FLY_WEB_REMOTE_BUILD=1)"
  if [[ "${FLY_WEB_DEPOT:-1}" == "0" ]]; then
    DEPLOY_EXTRA+=(--depot=false)
  fi
else
  info "using --local-only (set FLY_WEB_REMOTE_BUILD=1 if local Docker fails)"
  DEPLOY_EXTRA+=(--local-only)
fi
if [[ "${FLY_WEB_NO_CACHE:-}" == "1" ]]; then
  info "FLY_WEB_NO_CACHE=1 — bust Docker builder cache"
  DEPLOY_EXTRA+=(--no-cache)
fi

# Remote/Depot builders sometimes drop CLI --build-arg; also pin args into toml.
FLY_CONFIG_EFFECTIVE="$FLY_CONFIG"
TMP_FLY_CONFIG=""
if [[ "${FLY_WEB_EMBED_BUILD_ARGS:-1}" == "1" ]]; then
  # Must live under frontend/ so dockerfile/context paths in toml stay valid.
  TMP_FLY_CONFIG="$ROOT/frontend/.fly.production.generated.toml"
  cp "$ROOT/frontend/$FLY_CONFIG" "$TMP_FLY_CONFIG"
  {
    echo ""
    echo "# generated by deploy-tt-web-production.sh — do not commit"
    echo "[build.args]"
    echo "  NEXT_PUBLIC_API_BASE_URL = \"${NEXT_PUBLIC_API_BASE_URL}\""
    echo "  NEXT_PUBLIC_SITE_URL = \"${NEXT_PUBLIC_SITE_URL}\""
    echo "  API_REWRITE_TARGET = \"${API_REWRITE_TARGET}\""
    echo "  NEXT_PUBLIC_CHAIN_ID = \"${NEXT_PUBLIC_CHAIN_ID}\""
    echo "  NEXT_PUBLIC_RPC_URL = \"${NEXT_PUBLIC_RPC_URL}\""
    echo "  NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS = \"${NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS}\""
    echo "  NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS = \"${NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS}\""
    echo "  NEXT_PUBLIC_FEE_ROUTER_ADDRESS = \"${NEXT_PUBLIC_FEE_ROUTER_ADDRESS}\""
    echo "  NEXT_PUBLIC_GOVERNOR_ADDRESS = \"${NEXT_PUBLIC_GOVERNOR_ADDRESS}\""
    echo "  NEXT_PUBLIC_REGISTRY_ADDRESS = \"${NEXT_PUBLIC_REGISTRY_ADDRESS}\""
    echo "  NEXT_PUBLIC_GUIDE_STAKING_ADDRESS = \"${NEXT_PUBLIC_GUIDE_STAKING_ADDRESS}\""
    echo "  NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS = \"${NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS}\""
    echo "  NEXT_PUBLIC_CATALOG_API_ENABLED = \"${NEXT_PUBLIC_CATALOG_API_ENABLED}\""
    echo "  NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI = \"${NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI}\""
    echo "  NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE = \"${NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE}\""
    echo "  NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL = \"${NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}\""
    echo "  NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES = \"${NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES}\""
    echo "  NEXT_PUBLIC_PSG_RELEASE_VERSION = \"${NEXT_PUBLIC_PSG_RELEASE_VERSION}\""
    echo "  NEXT_PUBLIC_GIT_SHA = \"${NEXT_PUBLIC_GIT_SHA}\""
    echo "  NEXT_PUBLIC_ARTIFACT_SHA = \"${NEXT_PUBLIC_ARTIFACT_SHA}\""
    echo "  NEXT_PUBLIC_IMAGE_DIGEST = \"${NEXT_PUBLIC_IMAGE_DIGEST}\""
    echo "  NEXT_PUBLIC_BUILD_TIME = \"${NEXT_PUBLIC_BUILD_TIME}\""
    echo "  NEXT_PUBLIC_CONTRACT_PROFILE = \"${NEXT_PUBLIC_CONTRACT_PROFILE}\""
    echo "  NEXT_PUBLIC_DATABASE_BASELINE = \"${NEXT_PUBLIC_DATABASE_BASELINE}\""
    echo "  NEXT_PUBLIC_CMS_BASELINE = \"${NEXT_PUBLIC_CMS_BASELINE}\""
    echo "  BUILD_NODE_MAX_OLD_SPACE_SIZE = \"${BUILD_NODE_MAX_OLD_SPACE_SIZE:-4096}\""
  } >>"$TMP_FLY_CONFIG"
  FLY_CONFIG_EFFECTIVE="$TMP_FLY_CONFIG"
  info "embedded [build.args] into temp fly config (escrow_v2_len=${#NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS} git_sha=$NEXT_PUBLIC_GIT_SHA)"
fi

info_root
info "fly deploy $APP (config=$FLY_CONFIG_EFFECTIVE) sha=$NEXT_PUBLIC_GIT_SHA …"
cleanup_tmp_fly() { [[ -n "${TMP_FLY_CONFIG:-}" && -f "${TMP_FLY_CONFIG:-}" ]] && rm -f "$TMP_FLY_CONFIG" || true; }
trap cleanup_tmp_fly EXIT
(cd "$ROOT/frontend" && fly deploy -c "$FLY_CONFIG_EFFECTIVE" -a "$APP" \
  "${DEPLOY_EXTRA[@]}" \
  "${BUILD_ARGS[@]}")
cleanup_tmp_fly
trap - EXIT

hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 60 "${WEB_BASE%/}/" 2>/dev/null || echo 000)"
[[ "$hc" == "200" || "$hc" == "307" || "$hc" == "308" ]] || fail "${WEB_BASE} not reachable (got $hc)"

ri_json="$(curl -sS --max-time 30 "${WEB_BASE%/}/api/release-identity?t=$(date +%s)" 2>/dev/null || echo '{}')"
ri_sha="$(node -e "try{const j=JSON.parse(process.argv[1]);process.stdout.write(String(j.git_sha||''))}catch(e){}" "$ri_json")"
expect_sha="$NEXT_PUBLIC_GIT_SHA"
if [[ -n "$expect_sha" && -n "$ri_sha" && "$ri_sha" != "$expect_sha" ]]; then
  fail "release-identity git_sha=$ri_sha ≠ baked $expect_sha — stale image/cache; FLY_WEB_NO_CACHE=1 and redeploy"
fi
info "release-identity ok git_sha=${ri_sha:-unknown}"

ok "$APP deployed · ${WEB_BASE} · git_sha=${ri_sha:-$NEXT_PUBLIC_GIT_SHA}"
