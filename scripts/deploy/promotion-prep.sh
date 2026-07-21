#!/usr/bin/env bash
# Canonical Promotion PREP only — never deploys during FG-15.
# After ELAPSED, Owner runs staging-*.sh separately (not this script).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [[ "${TRAVELTRUST_DEPLOY_NOW:-}" == "1" ]]; then
  echo "promotion-prep: REFUSE TRAVELTRUST_DEPLOY_NOW=1" >&2
  exit 2
fi
if [[ "${FG15_ELAPSED:-}" != "1" ]]; then
  echo "promotion-prep: FG-15 still RUNNING — local Closure Prep only (no deploy)"
fi
exec python "$ROOT/scripts/dev/run-psg-canonical-promotion-prep.py" "$@"
