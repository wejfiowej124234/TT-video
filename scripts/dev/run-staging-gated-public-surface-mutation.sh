#!/usr/bin/env bash
# Run a Staging public-surface mutation only after Baseline Gate pre-check.
# Post-check ensures no smoke / drift introduced (② only).
#
#   bash scripts/dev/run-staging-gated-public-surface-mutation.sh \
#     node scripts/dev/purge-staging-smoke-display-data.cjs
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=lib/staging-rc-baseline-gate.sh
source "$ROOT/scripts/dev/lib/staging-rc-baseline-gate.sh"
export STAGING_RC_BASELINE_ROOT="$ROOT"

[[ $# -ge 1 ]] || {
  echo "usage: run-staging-gated-public-surface-mutation.sh <cmd...>" >&2
  exit 2
}

staging_rc_baseline_gate_pre_change pre-mutation || exit 2
export STAGING_RC_BASELINE_AUTHORIZED=1
"$@"
staging_rc_baseline_gate_post_change post-mutation || exit 2
echo "TT_STAGING_RC_BASELINE: gated mutation OK"
