#!/usr/bin/env bash
# ① 本地 · 收购 trust **PG ↔ chain_off 内存** 对拍（cargo IT；须 **DATABASE_URL** 与 API 烟测同库）
#
# 用法（仓库根）：
#   bash scripts/dev/smoke-acquisition-trust-parity-local.sh
#
# 由 **`smoke-acquisition-pd009-local.sh`** 收尾调用时另须：
#   SMOKE_ACQUISITION_TRUST_PARITY_USER_IDS=owner_uuid,carrier_uuid
#   SMOKE_ACQUISITION_TRUST_ME_SCORE=<GET /me trust.acquisition_trust_score>（可选 · 对拍 API 投影）
#
# 跳过：SMOKE_SKIP_TRUST_PARITY=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "smoke-acquisition-trust-parity: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-acquisition-trust-parity: OK $*"; }

if [[ "${SMOKE_SKIP_TRUST_PARITY:-0}" == "1" ]]; then
  echo "smoke-acquisition-trust-parity: SKIP (SMOKE_SKIP_TRUST_PARITY=1)"
  exit 0
fi

[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL unset (same DB as running API)"

echo "== smoke-acquisition-trust-parity-local (① PG ↔ memory) =="

if [[ -n "${SMOKE_ACQUISITION_TRUST_PARITY_USER_IDS:-}" ]]; then
  ok "env user ids=${SMOKE_ACQUISITION_TRUST_PARITY_USER_IDS}"
  cargo test -p traveltrust-api matrix_pd009_trust_pg_memory_parity_from_env_smoke -- --nocapture
else
  ok "self-contained IT (no env user ids)"
  cargo test -p traveltrust-api matrix_pd009_trust_pg_memory_parity_pg -- --nocapture
fi

ok "PG ↔ memory acquisition trust parity (① local · not ②③ GO)"
