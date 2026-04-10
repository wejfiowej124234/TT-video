#!/usr/bin/env bash
set -euo pipefail
_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$_here/ops/governance-timelock-delay-ssot-ops-check.sh" "$@"
