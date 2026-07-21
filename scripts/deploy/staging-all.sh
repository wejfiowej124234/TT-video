#!/usr/bin/env bash
# Canonical Staging Web+API deploy (sequential · one gate prelude).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=_lib.sh
source "$ROOT/scripts/deploy/_lib.sh"
tt_forbid_during_fg15 || exit 2
tt_canonical_deploy_prelude all || exit 2
export DEPLOY_TARGET="${DEPLOY_TARGET:-STAGING_PATCH}"
export TT_CANONICAL_DEPLOY=1
if [[ -f "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" ]]; then
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" "$@"
else
  echo "staging-all: missing API deploy script — refuse bare fly" >&2
  exit 2
fi
bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" "$@"
