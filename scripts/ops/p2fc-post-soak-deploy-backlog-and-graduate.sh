#!/usr/bin/env bash
# P2FC · post-soak 薄封装 → p2fc-post-soak-one-shot-execute.sh
#
#   bash scripts/ops/p2fc-post-soak-deploy-backlog-and-graduate.sh --watch
#   bash scripts/ops/p2fc-post-soak-deploy-backlog-and-graduate.sh --prep-only
#
# 末行：TT_P2FC_POST_SOAK_DEPLOY_GRADUATION: PASS|FAIL（委托 one-shot）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec bash "$ROOT/scripts/ops/p2fc-post-soak-one-shot-execute.sh" "$@"
