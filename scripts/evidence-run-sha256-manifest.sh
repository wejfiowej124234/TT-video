#!/usr/bin/env bash
# Thin forwarder (B-184 兼容) → scripts/ops/evidence-run-sha256-manifest.sh
set -euo pipefail
_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$_here/ops/evidence-run-sha256-manifest.sh" "$@"
