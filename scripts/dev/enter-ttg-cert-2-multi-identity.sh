#!/usr/bin/env bash
# Enter Cert #2 Multi Identity Walkthrough (post stats triple-sync freeze).
#
#   bash scripts/dev/enter-ttg-cert-2-multi-identity.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
python "$ROOT/scripts/dev/enter-ttg-cert-2-multi-identity.py"
