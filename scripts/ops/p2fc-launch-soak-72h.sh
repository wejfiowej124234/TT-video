#!/usr/bin/env bash
# DEPRECATED alias · ② staging soak only（须 P2FC_SOAK_72H_STAGING）
#
#   bash scripts/ops/p2fc-launch-soak-72h.sh
#
# Forwards to scripts/ops/p2fc-launch-staging-soak-72h.sh（SSOT）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "p2fc-launch-soak-72h: DEPRECATED — use p2fc-launch-staging-soak-72h.sh (P2FC_SOAK_72H_STAGING)" >&2
export P2FC_SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
exec bash "$ROOT/scripts/ops/p2fc-launch-staging-soak-72h.sh" "$@"
