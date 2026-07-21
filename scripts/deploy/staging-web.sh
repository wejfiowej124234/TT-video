#!/usr/bin/env bash
# Canonical Staging Web deploy — ONLY allowed fly path for tt-web-staging.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=_lib.sh
source "$ROOT/scripts/deploy/_lib.sh"
tt_forbid_during_fg15 || exit 2
tt_canonical_deploy_prelude web || exit 2
export DEPLOY_TARGET="${DEPLOY_TARGET:-STAGING_PATCH}"
exec bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" "$@"
