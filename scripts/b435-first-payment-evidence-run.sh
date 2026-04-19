#!/usr/bin/env bash
# Thin forwarder -> scripts/ops/b435-first-payment-evidence-run.sh
set -euo pipefail
_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$_here/ops/b435-first-payment-evidence-run.sh" "$@"
