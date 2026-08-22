#!/usr/bin/env bash
# Align Staging www product identity to Official V9 cite (Solo · no PR).
#
# Rebuilds tt-web-staging FROM Release WT cite 3e356617… with staging build.env
# (does NOT fly deploy --image the production Official image).
#
#   TRAVELTRUST_STAGING_V9_ALIGN_OK=1 \
#   FLY_WEB_REMOTE_BUILD=1 \
#   bash scripts/dev/align-staging-www-official-v9.sh
#
# Optional:
#   TT_V9_RELEASE_WT=/d/TravelTrust-official-ops-v9-release
#   STAGING_WEB_BUILD_ENV=deploy/fly/tt-web-staging/build.env.local
#   TESTNET_FREEZE_OVERRIDE=1   # only if ACTIVE.json freeze blocks
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PIN_GIT_SHA="${TT_OFFICIAL_V9_GIT_SHA:-3e356617a498b0faac42e4ae457343d36294a770}"
RELEASE_WT="${TT_V9_RELEASE_WT:-/d/TravelTrust-official-ops-v9-release}"
BUILD_ENV="${STAGING_WEB_BUILD_ENV:-$ROOT/deploy/fly/tt-web-staging/build.env.local}"
STAGING_WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

fail() { echo "align-staging-www-official-v9: FAIL $*" >&2; exit 2; }
ok() { echo "align-staging-www-official-v9: OK $*"; }
info() { echo "align-staging-www-official-v9: $*"; }

[[ "${TRAVELTRUST_STAGING_V9_ALIGN_OK:-}" == "1" ]] \
  || fail "set TRAVELTRUST_STAGING_V9_ALIGN_OK=1 (Owner Solo auth for Staging www V9 identity align)"

[[ -d "$RELEASE_WT" ]] || fail "Release WT missing: $RELEASE_WT"
wt_sha="$(git -C "$RELEASE_WT" rev-parse HEAD)"
[[ "$wt_sha" == "$PIN_GIT_SHA" ]] || fail "Release WT HEAD=$wt_sha ≠ pin $PIN_GIT_SHA"

# Seed role-promo LFS binaries into cite bake tree from tip (tip already smudged).
# Cite checkout often keeps pointer files; Docker bake needs real mp4 bytes.
# Also seed tip PROMO-MANIFEST (cite pin may have stale checksums / region_steward entry).
ROLE_SRC="$ROOT/frontend/public/media/traveltrust/roles"
ROLE_DST="$RELEASE_WT/frontend/public/media/traveltrust/roles"
if [[ -d "$ROLE_SRC" && -d "$ROLE_DST" ]]; then
  info "seeding role-promo media + PROMO-MANIFEST from tip into cite bake tree"
  for f in traveler guide merchant acquisition provider region_steward; do
    [[ -f "$ROLE_SRC/${f}.mp4" ]] || fail "tip missing $ROLE_SRC/${f}.mp4 (run git lfs pull on tip)"
    # reject LFS pointer (~133B) as source
    sz="$(wc -c <"$ROLE_SRC/${f}.mp4" | tr -d ' ')"
    [[ "$sz" -gt 1000000 ]] || fail "tip ${f}.mp4 still LFS pointer ($sz B)"
    cp -f "$ROLE_SRC/${f}.mp4" "$ROLE_DST/${f}.mp4"
    [[ -f "$ROLE_SRC/${f}.poster.jpg" ]] && cp -f "$ROLE_SRC/${f}.poster.jpg" "$ROLE_DST/${f}.poster.jpg" || true
  done
  [[ -f "$ROLE_SRC/PROMO-MANIFEST.json" ]] \
    || fail "tip missing PROMO-MANIFEST.json"
  cp -f "$ROLE_SRC/PROMO-MANIFEST.json" "$ROLE_DST/PROMO-MANIFEST.json"
fi

# Allow only role-media dirtiness on cite (rest must stay clean)
dirty="$(git -C "$RELEASE_WT" status --porcelain | grep -v 'frontend/public/media/traveltrust/roles/' || true)"
[[ -z "$dirty" ]] || fail "Release WT dirty outside role media:\n$dirty"

[[ -f "$BUILD_ENV" ]] || fail "missing staging build env: $BUILD_ENV"
[[ -f "$RELEASE_WT/scripts/dev/deploy-tt-web-staging.sh" ]] \
  || fail "cite tree missing deploy-tt-web-staging.sh"

info "cite=$wt_sha"
info "build_env=$BUILD_ENV"
info "deploy via TT_DEPLOY_ROOT=$RELEASE_WT (staging env · not Official prod image)"

export TT_DEPLOY_ROOT="$RELEASE_WT"
export STAGING_WEB_BUILD_ENV="$BUILD_ENV"
export TRAVELTRUST_GIT_SHA="$PIN_GIT_SHA"
export FLY_WEB_REMOTE_BUILD="${FLY_WEB_REMOTE_BUILD:-1}"
export FLY_WEB_NO_CACHE="${FLY_WEB_NO_CACHE:-1}"
# Three-state deploy governance — identity align is a intentional sync deploy
export DEPLOYMENT_STATE="${DEPLOYMENT_STATE:-sync}"
# Clear only gates needed for V9 product-identity Staging rebuild (no product feature expansion)
export DEPLOY_GOVERNANCE_FORCE_RUNTIME="${DEPLOY_GOVERNANCE_FORCE_RUNTIME:-1}"
export STAGING_RC_BASELINE_ALIGNING="${STAGING_RC_BASELINE_ALIGNING:-1}"

# Prefer tip's deploy script (newer gates) while baking cite frontend via TT_DEPLOY_ROOT
set +e
bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh"
deploy_rc=$?
set -e
# Restore cite role media to git-clean pointers after bake
git -C "$RELEASE_WT" checkout -- frontend/public/media/traveltrust/roles/ 2>/dev/null || true
[[ "$deploy_rc" -eq 0 ]] || fail "deploy-tt-web-staging exited $deploy_rc"

ri="$(curl -fsS --max-time 30 "${STAGING_WEB%/}/api/release-identity?t=$(date +%s)" || echo '{}')"
ri_sha="$(python -c "import json,sys; print(json.loads(sys.argv[1]).get('git_sha') or '')" "$ri")"
ri_bt="$(python -c "import json,sys; print(json.loads(sys.argv[1]).get('build_time') or '')" "$ri")"
[[ "$ri_sha" == "$PIN_GIT_SHA" ]] || fail "post-deploy Staging git_sha=$ri_sha ≠ pin $PIN_GIT_SHA"
ok "Staging www product identity aligned · git_sha=$ri_sha · build_time=$ri_bt (may differ from Official pin wall-clock)"
