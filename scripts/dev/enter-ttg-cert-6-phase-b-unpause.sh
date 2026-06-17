#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
python "$ROOT/scripts/dev/enter-ttg-cert-6-phase-b-unpause.py"
