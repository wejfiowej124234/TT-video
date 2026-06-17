#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
python "$ROOT/scripts/dev/enter-ttg-cert-4-safe-walkthrough.py"
