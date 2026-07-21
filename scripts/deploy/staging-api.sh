#!/usr/bin/env bash
# Canonical Staging API deploy — ONLY allowed fly path for tt-api-staging.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=_lib.sh
source "$ROOT/scripts/deploy/_lib.sh"
tt_forbid_during_fg15 || exit 2
tt_canonical_deploy_prelude api || exit 2
export DEPLOY_TARGET="${DEPLOY_TARGET:-STAGING_PATCH}"
# Prefer phase2 staging sync if present; else fail loudly (no bare fly)
if [[ -f "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" ]]; then
  exec bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" "$@"
fi
echo "staging-api: missing phase2-staging-fly-deploy-and-sync.sh — refuse bare fly deploy" >&2
exit 2
