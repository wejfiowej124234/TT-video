#!/usr/bin/env bash
# ① Admin 审计整改批次 · 一键验收（非 ②③ GO）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "== [1/3] capabilities route =="
bash scripts/dev/check-admin-capabilities-route.sh

echo "== [2/3] admin L5 vitest green =="
bash scripts/dev/run-admin-l5-green.sh

echo "== [3/3] admin pages HTTP smoke =="
bash scripts/dev/smoke-admin-pages-local.sh

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
if [[ -n "${DATABASE_URL:-}" ]] && command -v psql >/dev/null 2>&1; then
  echo "== [optional] RBAC matrix smoke =="
  bash scripts/dev/smoke-admin-rbac-matrix-local.sh
else
  echo "SKIP RBAC matrix smoke (need DATABASE_URL + psql in PATH)"
fi

echo "== [optional] admin remaining local prep (API+FE+DB) =="
echo "  bash scripts/dev/run-admin-remaining-local-prep.sh"
echo "== [optional] phase2 toolchain check (no Staging) =="
echo "  bash scripts/dev/check-admin-phase2-prep-toolchain.sh"

echo "verify-admin-audit-closure: exit 0 (① batch closed in repo)"
