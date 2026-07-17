#!/usr/bin/env bash
# Standalone check: TT_PSG_PRODUCTION_CERT must be PASS (PGC hard gate).
#   bash scripts/gates/check-psg-production-cert-required.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=../ops/lib/psg-production-cert-hard-gate.sh
source "$ROOT/scripts/ops/lib/psg-production-cert-hard-gate.sh"
export ROOT
psg_require_production_cert_pass
echo "TT_PSG_PRODUCTION_CERT_REQUIRED: PASS"
