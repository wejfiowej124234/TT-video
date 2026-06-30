#!/usr/bin/env bash
# TT_ADMIN_RBAC_ALIGNMENT_PROGRAM — gap scan + four-cluster verification (① only)
#
#   bash scripts/dev/run-tt-admin-rbac-alignment-program.sh
#
# 禁止：新增功能 · GovFreeze V2 · 扩展 docs/spec
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_admin_rbac_alignment/${STAMP}"
mkdir -p "$EVID"

echo "TT_ADMIN_RBAC_ALIGNMENT: START phase=① stamp=${STAMP}"

python "$ROOT/scripts/dev/gen-admin-rbac-gap-list.py" --out-dir "$EVID"

echo "TT_ADMIN_RBAC_ALIGNMENT: cargo test four-cluster gates"
cargo test -p traveltrust-api -- \
  admin_finance_summary_forbidden_for_cs_console_role \
  admin_fee_router_ok_for_cs_console_role \
  get_admin_approvals_forbidden_for_ops_console_role \
  admin_audit_logs_ok_for_cs_console_role \
  --nocapture

if [[ -f "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh" ]]; then
  if curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:8080/health" 2>/dev/null | grep -q 200; then
    bash "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh" || {
      echo "TT_ADMIN_RBAC_ALIGNMENT: WARN smoke-admin-rbac-matrix-local failed (API/DB optional)" >&2
    }
  else
    echo "TT_ADMIN_RBAC_ALIGNMENT: SKIP smoke (API down)"
  fi
fi

python "$ROOT/scripts/dev/write-admin-rbac-verification-json.py" --evid-dir "$EVID"

echo "TT_ADMIN_RBAC_ALIGNMENT: OK evidence=$EVID"
