#!/usr/bin/env bash
# P2FC · Admin GO 唯一闭环纪律审计（只读 · soak 期间可跑）
#
#   bash scripts/ops/p2fc-audit-admin-go-closure-discipline-readonly.sh
#
# 末行：TT_P2FC_ADMIN_GO_CLOSURE_DISCIPLINE: OPEN|CLOSED
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"

PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-admin-go-closure-discipline-audit.py" \
  --soak-dir "$SOAK_DIR"
