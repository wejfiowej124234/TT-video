#!/usr/bin/env bash
# ① 本地 · Playwright chromium 全项目 E2E（≠ 93/96-20 穷举 · ≠ ②③ GO）
#
# 用法（仓库根 · DATABASE_URL 已 migrate）：
#   bash scripts/gates/local-e2e-chromium-full-matrix.sh
#   source scripts/dev/export-database-url-from-root-env.sh && bash scripts/gates/local-e2e-chromium-full-matrix.sh
#
# SSOT: docs/runbook/TT-LOCAL-FULL-E2E-MATRIX-001.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/gates/_load_database_url_from_root_env.sh
source "$ROOT/scripts/gates/_load_database_url_from_root_env.sh"
_load_db_gate_name="local-e2e-chromium-full-matrix"
load_database_url_from_root_env "$ROOT" || exit $?

if [[ "${PLAYWRIGHT_PRESERVE_MINIO_EVIDENCE_GATE:-}" != "1" \
  && "${PLAYWRIGHT_MINIO_EVIDENCE_REQUIRE_STORAGE:-}" == "1" \
  && -z "${PLAYWRIGHT_COMMUNITY_PUBLISHDRAWER_EVIDENCE_OUT:-}" ]]; then
  unset PLAYWRIGHT_MINIO_EVIDENCE_REQUIRE_STORAGE
  echo "local-e2e-chromium-full-matrix: cleared leaked PLAYWRIGHT_MINIO_EVIDENCE_REQUIRE_STORAGE" >&2
fi

echo "== local chromium full E2E matrix (① · long run · wall-clock often 45–55min) =="

cd "$ROOT/frontend"
npm run e2e:full-chromium

echo ""
echo "OK: local-e2e-chromium-full-matrix"
{
  echo "note: chromium full spec green ≠ 93/96-20/31 exhaustive PASS"
  echo "note: ≠ ② staging GO · ≠ ③ Production GO"
  echo "SSOT: docs/runbook/TT-LOCAL-FULL-E2E-MATRIX-001.md"
} >&2
