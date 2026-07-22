#!/usr/bin/env bash
# Phase ②/③ · 部署 tt-web-staging（Fly · Next.js standalone）
#
# 前置：fly auth login · 可访问 api.fly.io（必要时 export HTTPS_PROXY=…）
#
#   FLY_WEB_REMOTE_BUILD=1 bash scripts/dev/deploy-tt-web-staging.sh   # Fly remote builder
#   FLY_WEB_OOM_FIX=1 bash scripts/dev/deploy-tt-web-staging.sh         # TT-WEB-STAGING-OOM-FIX
#   bash scripts/dev/tt-web-staging-oom-fix-deploy.sh                   # OOM fix + verify settings 200
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export DEPLOYMENT_THREE_STATE_ROOT="$ROOT"
# shellcheck source=../ops/lib/deployment-three-state-lib.sh
source "$ROOT/scripts/ops/lib/deployment-three-state-lib.sh"
deployment_three_state_assert_fly_allowed

FREEZE="$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
if [[ -f "$FREEZE" && "${TESTNET_FREEZE_OVERRIDE:-}" != "1" ]]; then
  echo "deploy-tt-web-staging: BLOCKED — testnet staging freeze active ($FREEZE)" >&2
  exit 2
fi
APP="${FLY_STAGING_WEB_APP:-tt-web-staging}"
FLY_CONFIG="${FLY_STAGING_WEB_CONFIG:-$ROOT/frontend/fly.staging.toml}"
BUILD_ENV="${STAGING_WEB_BUILD_ENV:-$ROOT/deploy/fly/tt-web-staging/build.env.local}"
BUILD_EXAMPLE="$ROOT/deploy/fly/tt-web-staging/build.env.example"
API_APP="${FLY_STAGING_API_APP:-tt-api-staging}"
API_BASE="${STAGING_API_BASE:-https://${API_APP}.fly.dev}"
WEB_BASE="${STAGING_WEB_BASE:-https://${APP}.fly.dev}"

fail() { echo "deploy-tt-web-staging: FAIL $*" >&2; exit 2; }
ok() { echo "deploy-tt-web-staging: OK $*"; }
info() { echo "deploy-tt-web-staging: $*"; }

CHECK_ONLY=0
[[ "${1:-}" == "--check-only" ]] && CHECK_ONLY=1

# shellcheck source=../ops/lib/deploy-governance-phase3-guard.sh
source "$ROOT/scripts/ops/lib/deploy-governance-phase3-guard.sh"
[[ "$CHECK_ONLY" -eq 1 ]] || deploy_governance_phase3_assert_s5_allowed "$ROOT"

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
[[ -f "$FLY_CONFIG" ]] || fail "missing $FLY_CONFIG"

if [[ ! -f "$BUILD_ENV" ]]; then
  info "missing $BUILD_ENV — seeding from build.env.example"
  cp "$BUILD_EXAMPLE" "$BUILD_ENV"
fi

merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$f"
}

# Load build + onboarding BEFORE RC baseline gate so admin PG fallback / DSN work
merge_env "$BUILD_ENV"
ONBOARDING="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
merge_env "$ONBOARDING"
# Prefer public/proxy DSN for gate probes (flycast host fails outside Fly private net)
# shellcheck source=lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
REPO_ROOT="$ROOT" staging_adm_u01_prepare_dsn 2>/dev/null \
  || info "WARN: staging DSN prepare skipped — admin_queue_probe may fail without STAGING_DATABASE_URL"
export DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
export STAGING_DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"

# shellcheck source=lib/staging-rc-baseline-gate.sh
source "$ROOT/scripts/dev/lib/staging-rc-baseline-gate.sh"
[[ "$CHECK_ONLY" -eq 1 ]] || staging_rc_baseline_gate_pre_deploy pre-deploy || fail "TT_STAGING_RC_BASELINE gate"

# registry JSON 须在 Docker build context（frontend/）内
node "$ROOT/frontend/scripts/sync-registry-for-build.mjs"

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-$API_BASE}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-$WEB_BASE}"
export API_REWRITE_TARGET="${API_REWRITE_TARGET:-$API_BASE}"
export NEXT_PUBLIC_CHAIN_ID="${NEXT_PUBLIC_CHAIN_ID:-11155111}"
export NEXT_PUBLIC_RPC_URL="${NEXT_PUBLIC_RPC_URL:-https://sepolia.drpc.org}"
export NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS="${NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS:-${ESCROW_FACTORY_V2_ADDRESS:-}}"
export NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS="${NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS:-${ESCROW_FACTORY_ADDRESS:-}}"
export NEXT_PUBLIC_FEE_ROUTER_ADDRESS="${NEXT_PUBLIC_FEE_ROUTER_ADDRESS:-${FEE_ROUTER_ADDRESS:-}}"
export NEXT_PUBLIC_GOVERNOR_ADDRESS="${NEXT_PUBLIC_GOVERNOR_ADDRESS:-${GOVERNOR_ADDRESS:-}}"
export NEXT_PUBLIC_REGISTRY_ADDRESS="${NEXT_PUBLIC_REGISTRY_ADDRESS:-${REGISTRY_ADDRESS:-}}"
export NEXT_PUBLIC_GUIDE_STAKING_ADDRESS="${NEXT_PUBLIC_GUIDE_STAKING_ADDRESS:-${GUIDE_STAKING_POOL_ADDRESS:-}}"
export NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS="${NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS:-${PROVIDER_STAKING_POOL_ADDRESS:-}}"
# Staging 公开展示：Catalog 必须 bake=1，否则 Ambient 静默回 Unsplash（COS 仍在、页面却「变旧」）。
export NEXT_PUBLIC_CATALOG_API_ENABLED="${NEXT_PUBLIC_CATALOG_API_ENABLED:-1}"
export NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI="${NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI:-0}"
export NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL="${NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL:-https://traveltrust-community-media.fly.storage.tigris.dev}"
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES="${NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES:-$NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL}"

# Runtime Attestation · Web /api/release-identity (bake into Next standalone)
# ALWAYS overwrite GIT/ARTIFACT/DIGEST/BUILD_TIME from tip — build.env.local must NOT pin stale SHAs
# (stale pins + Docker layer cache → release-identity stays old while API is new → 「一部署又旧」).
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
export NEXT_PUBLIC_DATABASE_BASELINE="${NEXT_PUBLIC_DATABASE_BASELINE:-${TRAVELTRUST_DATABASE_BASELINE:-staging_rc_ssot_alignment.v1#expected_staging_surface}}"
export NEXT_PUBLIC_CMS_BASELINE="${NEXT_PUBLIC_CMS_BASELINE:-${TRAVELTRUST_CMS_BASELINE:-public_display_10x4 + catalog_bake=1}}"
# Default bust cache so NEXT_PUBLIC_* attestation cannot stick on a previous image layer
export FLY_WEB_NO_CACHE="${FLY_WEB_NO_CACHE:-1}"
info "attestation bake git_sha=$NEXT_PUBLIC_GIT_SHA catalog=$NEXT_PUBLIC_CATALOG_API_ENABLED no_cache=$FLY_WEB_NO_CACHE"

# Stale Fly secrets TRAVELTRUST_GIT_SHA* override empty bake → old tip forever. Sync to tip each deploy.
info "syncing runtime attestation secrets to tip (clears stale TRAVELTRUST_GIT_SHA pins) …"
fly secrets set -a "$APP" \
  "TRAVELTRUST_GIT_SHA=${NEXT_PUBLIC_GIT_SHA}" \
  "TRAVELTRUST_ARTIFACT_SHA=${NEXT_PUBLIC_ARTIFACT_SHA}" \
  "TRAVELTRUST_IMAGE_DIGEST=${NEXT_PUBLIC_IMAGE_DIGEST}" \
  "TRAVELTRUST_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}" \
  "TRAVELTRUST_PSG_RELEASE_VERSION=${NEXT_PUBLIC_PSG_RELEASE_VERSION}" \
  "TRAVELTRUST_CONTRACT_PROFILE=${NEXT_PUBLIC_CONTRACT_PROFILE}" \
  >/dev/null \
  || fail "fly secrets set attestation failed — stale TRAVELTRUST_GIT_SHA would keep old tip in /api/release-identity"

[[ -n "${NEXT_PUBLIC_API_BASE_URL:-}" ]] || fail "NEXT_PUBLIC_API_BASE_URL empty"
[[ -n "${NEXT_PUBLIC_SITE_URL:-}" ]] || fail "NEXT_PUBLIC_SITE_URL empty"
# Phase-4 · Candidate v2 fail-closed: FactoryV2 required before staging bake
[[ -n "${NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS:-}" ]] \
  || fail "NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS required (Candidate v2 EscrowFactoryV2) — set in build.env.local / ESCROW_FACTORY_V2_ADDRESS"
[[ "${NEXT_PUBLIC_CATALOG_API_ENABLED}" == "1" ]] \
  || fail "NEXT_PUBLIC_CATALOG_API_ENABLED must be 1 on staging (got ${NEXT_PUBLIC_CATALOG_API_ENABLED}) — see TT-CMS-COS-ANTI-CHAOS + TT-PSG-PUBLIC-DISPLAY-10X4-LOCK"

info "preflight alignment (non-blocking) …"
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
  --web-base "$WEB_BASE" \
  --api-base "$NEXT_PUBLIC_API_BASE_URL" \
  --chain-id "$NEXT_PUBLIC_CHAIN_ID" || true

if [[ "$CHECK_ONLY" == "1" ]]; then
  ok "check-only · no deploy"
  exit 0
fi

fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated — run: fly auth login"

if ! fly status -a "$APP" >/dev/null 2>&1; then
  info "creating Fly app $APP …"
  fly apps create "$APP" --org personal 2>/dev/null || fly apps create "$APP" 2>/dev/null || true
  fly status -a "$APP" >/dev/null 2>&1 || fail "Fly app $APP missing — run: fly apps create $APP"
fi

scale_fly_builder_memory() {
  local mb="${1:-8192}"
  local builders
  builders="$(fly apps list 2>/dev/null | awk '/fly-builder/ {print $1}' || true)"
  if [[ -z "$builders" ]]; then
    info "no fly-builder-* app listed — skip scale (Depot may scale org-side)"
    return 0
  fi
  while IFS= read -r builder; do
    [[ -z "$builder" ]] && continue
    info "scaling $builder memory → ${mb}MB (TT-WEB-STAGING-OOM-FIX) …"
    fly scale memory "$mb" -a "$builder" 2>/dev/null \
      || fly machine list -a "$builder" --json 2>/dev/null | head -1 \
      || info "WARN: could not scale $builder (may wake on next build)"
  done <<< "$builders"
}

if [[ "${FLY_WEB_OOM_FIX:-}" == "1" ]]; then
  export FLY_WEB_REMOTE_BUILD=1
  export FLY_WEB_DEPOT="${FLY_WEB_DEPOT:-1}"
  export FLY_WEB_BUILDER_MEMORY_MB="${FLY_WEB_BUILDER_MEMORY_MB:-8192}"
  export BUILD_NODE_MAX_OLD_SPACE_SIZE="${BUILD_NODE_MAX_OLD_SPACE_SIZE:-4096}"
  scale_fly_builder_memory "$FLY_WEB_BUILDER_MEMORY_MB"
fi

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

info "fly deploy $APP (config=$FLY_CONFIG) …"
DEPLOY_EXTRA=()
if [[ "${FLY_WEB_REMOTE_BUILD:-}" != "1" ]]; then
  info "using --local-only (TT-WEB-STAGING-SINGLE-BUILD · 禁 Depot/远程；远程易 OOM exit 137)"
  DEPLOY_EXTRA+=(--local-only)
else
  info "using Fly remote builder (FLY_WEB_REMOTE_BUILD=1)"
  if [[ "${FLY_WEB_DEPOT:-1}" == "0" ]]; then
    info "FLY_WEB_DEPOT=0 — fly deploy --depot=false (legacy remote builder)"
    DEPLOY_EXTRA+=(--depot=false)
  else
    info "using Depot remote builder (default · FLY_WEB_DEPOT=1)"
  fi
  if [[ -n "${FLY_WEB_BUILDER_MEMORY_MB:-}" && "${FLY_WEB_OOM_FIX:-}" != "1" ]]; then
    scale_fly_builder_memory "$FLY_WEB_BUILDER_MEMORY_MB"
  fi
fi
if [[ "${FLY_WEB_NO_CACHE:-}" == "1" ]]; then
  info "FLY_WEB_NO_CACHE=1 — bust Docker builder cache (local uncommitted admin/smoke fixes)"
  DEPLOY_EXTRA+=(--no-cache)
fi

if [[ -n "${FLY_WEB_DEPLOY_IMAGE:-}" ]]; then
  info "FLY_WEB_DEPLOY_IMAGE=$FLY_WEB_DEPLOY_IMAGE — deploy existing image (push recovery)"
  (cd "$ROOT/frontend" && fly deploy -c fly.staging.toml -a "$APP" --image "$FLY_WEB_DEPLOY_IMAGE")
else
  (cd "$ROOT/frontend" && fly deploy -c fly.staging.toml -a "$APP" "${DEPLOY_EXTRA[@]}" "${BUILD_ARGS[@]}")
fi

hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 60 "${WEB_BASE}/" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] || fail "${WEB_BASE}/ not 200 (got $hc) — DNS 传播或首次冷启动可能需重试"

# Post-deploy: release-identity must match baked tip (blocks silent old-package ship)
ri_json="$(curl -sS --max-time 30 "${WEB_BASE}/api/release-identity?t=$(date +%s)" 2>/dev/null || echo '{}')"
ri_sha="$(node -e "try{const j=JSON.parse(process.argv[1]);process.stdout.write(String(j.git_sha||''))}catch(e){}" "$ri_json")"
expect_sha="$NEXT_PUBLIC_GIT_SHA"
if [[ -n "$expect_sha" && -n "$ri_sha" && "$ri_sha" != "$expect_sha" ]]; then
  fail "release-identity git_sha=$ri_sha ≠ baked $expect_sha — stale image/cache; FLY_WEB_NO_CACHE=1 and redeploy"
fi
info "release-identity ok git_sha=${ri_sha:-unknown}"

# Post-deploy: public display 10×4 must still hold (deploy must not scramble OCS)
if command -v python >/dev/null 2>&1; then
  API_BASE="${NEXT_PUBLIC_API_BASE_URL:-$API_BASE}" python "$ROOT/scripts/dev/check-public-display-10x4-counts.py" \
    || fail "post-deploy 10×4 DRIFT — run STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh (do NOT redeploy to 'fix' counts)"
fi

# Post-deploy: full page surfaces (announcements · ambient · market · community · did-rank · wallet dropdown)
if command -v node >/dev/null 2>&1; then
  EXPECT_GIT_SHA="$NEXT_PUBLIC_GIT_SHA" API_BASE="${NEXT_PUBLIC_API_BASE_URL:-$API_BASE}" WEB_BASE="$WEB_BASE" \
    node "$ROOT/scripts/dev/check-staging-public-page-surfaces.cjs" \
    || fail "post-deploy page surfaces DRIFT — see evidence/GO_public_display_10x4_lock/STAGING-PAGE-SURFACES-LATEST.json"
fi

ok "$APP deployed · ${WEB_BASE} · staging UI only · ≠ Production GO"

if [[ "$CHECK_ONLY" -ne 1 ]]; then
  staging_rc_baseline_gate_post_deploy || fail "post-deploy TT_STAGING_RC_BASELINE — run run-staging-rc-baseline-final-alignment.sh"
fi
