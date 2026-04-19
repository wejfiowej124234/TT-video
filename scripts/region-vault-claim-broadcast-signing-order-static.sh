#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec python "$ROOT/scripts/ops/region_vault_claim_broadcast_signing_order_static.py" "$@"
