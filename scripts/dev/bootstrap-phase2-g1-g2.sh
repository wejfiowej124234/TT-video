#!/usr/bin/env bash
# Phase ② · G-1/G-2 一键编排（② 测试网预检 · 非 C1～C12 GO）
#
# 1) 合并 scripts/dev/.env.staging-onboarding.local（由 example 生成或已存在）
# 2) 合并 scripts/dev/.env.staging-secrets.local（Stripe · 勿提交）
# 3) G-2：staging PG 空库 sqlx migrate 证据
# 4) 可选：localtunnel → HTTPS API_BASE（仅本机 ② 预演 · URL 每次不同）
# 5) check-phase2-onboarding-staging-ready.sh
# 6) run-phase1-to-phase2-transition-audit.sh → READY_FOR_C1_C12
#
# 用法（仓库根）：
#   cp scripts/dev/staging-onboarding.env.example scripts/dev/.env.staging-onboarding.local
#   cp scripts/dev/staging-secrets.env.example scripts/dev/.env.staging-secrets.local
#   # 编辑两文件 + PHASE2-G1 签字
#   bash scripts/dev/bootstrap-phase2-g1-g2.sh
#
# 或显式 HTTPS staging（推荐持久主机）：
#   STAGING_API_BASE=https://your-staging-api.example bash scripts/dev/bootstrap-phase2-g1-g2.sh
#
# 本机 API + 隧道（无远端 staging 时）：
#   STAGING_USE_LOCAL_TUNNEL=1 bash scripts/dev/bootstrap-phase2-g1-g2.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ONBOARDING_ENV="$ROOT/scripts/dev/.env.staging-onboarding.local"
SECRETS_ENV="$ROOT/scripts/dev/.env.staging-secrets.local"
EXAMPLE="$ROOT/scripts/dev/staging-onboarding.env.example"
TUNNEL_PID_FILE="${STAGING_TUNNEL_PID_FILE:-$ROOT/evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/localtunnel.pid}"

fail() { echo "bootstrap-phase2-g1-g2: FAIL $*" >&2; exit 2; }
ok() { echo "bootstrap-phase2-g1-g2: OK $*"; }

is_placeholder_val() {
  local v="${1,,}"
  case "$v" in
    *replace*|*your-staging*|*your_staging*|*changeme*|*example*|*staging-api.example*)
      return 0 ;;
  esac
  return 1
}

merge_env() {
  local f="$1"
  local skip_placeholders="${2:-0}"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    if [[ "$skip_placeholders" == "1" ]] && is_placeholder_val "$val"; then
      continue
    fi
    export "$key=$val"
  done < "$f"
}

[[ -f "$EXAMPLE" ]] || fail "missing $EXAMPLE"
if [[ ! -f "$ONBOARDING_ENV" ]]; then
  cp "$EXAMPLE" "$ONBOARDING_ENV"
  ok "created $ONBOARDING_ENV from example — edit before production staging"
fi

merge_env "$ONBOARDING_ENV"
# secrets 文件占位符不覆盖 onboarding.local 已填写的 sk_test/whsec
merge_env "$SECRETS_ENV" 1
# API_BASE_URL 与 API_BASE 同义（② 文档常用 API_BASE_URL）
if [[ -n "${API_BASE_URL:-}" && -z "${API_BASE:-}" ]]; then
  export API_BASE="${API_BASE_URL%/}"
fi

# Default staging PG（与 ① traveltrust 库隔离）
export DATABASE_URL="${DATABASE_URL:-postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging}"

# Persist DATABASE_URL into onboarding env if missing
if ! grep -qE '^[[:space:]]*DATABASE_URL=' "$ONBOARDING_ENV" 2>/dev/null; then
  echo "" >>"$ONBOARDING_ENV"
  echo "# G-2 · staging PG（bootstrap 写入 · ${STAGING_USE_LOCAL_TUNNEL:-manual})" >>"$ONBOARDING_ENV"
  echo "DATABASE_URL=${DATABASE_URL}" >>"$ONBOARDING_ENV"
fi

ok "G-2 migrate evidence"
# G-2 证据库用本机 docker staging PG；Fly flycast DATABASE_URL 仅 runtime（见 onboarding.local）
G2_EVIDENCE_DATABASE_URL="${G2_EVIDENCE_DATABASE_URL:-postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging}"
if [[ -n "${STAGING_API_BASE:-}" || "${DATABASE_URL:-}" == *flycast* ]]; then
  DATABASE_URL="$G2_EVIDENCE_DATABASE_URL"
fi
bash "$ROOT/scripts/dev/record-phase2-g2-staging-sqlx-migrate-evidence.sh"

# API_BASE resolution（占位 URL 视为未配置）
API_BASE="${STAGING_API_BASE:-${API_BASE:-${API_BASE_URL:-}}}"
if [[ -n "$API_BASE" ]] && is_placeholder_val "$API_BASE"; then
  API_BASE=""
fi

if [[ -z "$API_BASE" && "${STAGING_USE_LOCAL_TUNNEL:-0}" == "1" ]]; then
  if ! curl -sS -o /dev/null -w "%{http_code}" --max-time 2 http://127.0.0.1:8080/health 2>/dev/null | grep -q 200; then
    fail "STAGING_USE_LOCAL_TUNNEL=1 but http://127.0.0.1:8080/health not 200 — start API first"
  fi
  mkdir -p "$(dirname "$TUNNEL_PID_FILE")"
  npx --yes localtunnel --port 8080 >"${TUNNEL_PID_FILE%.pid}.log" 2>&1 &
  tp=$!
  echo "$tp" >"$TUNNEL_PID_FILE"
  sleep 6
  API_BASE="$(grep -oE 'https://[a-zA-Z0-9.-]+\.loca\.lt' "${TUNNEL_PID_FILE%.pid}.log" | head -1)"
  [[ -n "$API_BASE" ]] || fail "localtunnel did not print URL — see ${TUNNEL_PID_FILE%.pid}.log"
  ok "localtunnel API_BASE=$API_BASE (ephemeral — replace with real staging HTTPS for ② GO)"
fi

[[ -n "$API_BASE" ]] || fail "set STAGING_API_BASE or API_BASE in .env.staging-onboarding.local, or STAGING_USE_LOCAL_TUNNEL=1"

# Patch API_BASE in onboarding env (idempotent line)
if grep -qE '^[[:space:]]*API_BASE=' "$ONBOARDING_ENV"; then
  sed -i.bak "s|^[[:space:]]*API_BASE=.*|API_BASE=${API_BASE}|" "$ONBOARDING_ENV" && rm -f "${ONBOARDING_ENV}.bak"
else
  echo "API_BASE=${API_BASE}" >>"$ONBOARDING_ENV"
fi

# Stripe from secrets file
[[ -n "${TRAVELTRUST_STRIPE_SECRET_KEY:-}" ]] || fail "TRAVELTRUST_STRIPE_SECRET_KEY unset — fill $SECRETS_ENV"
[[ -n "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}" ]] || fail "TRAVELTRUST_STRIPE_WEBHOOK_SECRET unset — fill $SECRETS_ENV"

for kv in \
  "TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1" \
  "TRAVELTRUST_STRIPE_SECRET_KEY=${TRAVELTRUST_STRIPE_SECRET_KEY}" \
  "TRAVELTRUST_STRIPE_WEBHOOK_SECRET=${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}"; do
  key="${kv%%=*}"
  if grep -qE "^[[:space:]]*${key}=" "$ONBOARDING_ENV" 2>/dev/null; then
    sed -i.bak "s|^[[:space:]]*${key}=.*|${kv}|" "$ONBOARDING_ENV" && rm -f "${ONBOARDING_ENV}.bak"
  else
    echo "$kv" >>"$ONBOARDING_ENV"
  fi
done

# INTERNAL_API_SECRET：staging 独立值优先；否则沿用根 .env（仅 ① 烟测同源时）
if [[ -z "${INTERNAL_API_SECRET:-}" && -f "$ROOT/.env" ]]; then
  merge_env "$ROOT/.env"
fi
if [[ -n "${INTERNAL_API_SECRET:-}" ]] && ! grep -qE '^[[:space:]]*INTERNAL_API_SECRET=' "$ONBOARDING_ENV" 2>/dev/null; then
  echo "INTERNAL_API_SECRET=${INTERNAL_API_SECRET}" >>"$ONBOARDING_ENV"
fi

export PHASE2_EVIDENCE_DIR="${PHASE2_EVIDENCE_DIR:-evidence/GO_phase2_testnet_20260526}"

ok "check-phase2-onboarding-staging-ready.sh"
bash "$ROOT/scripts/dev/check-phase2-onboarding-staging-ready.sh"

ok "run-phase1-to-phase2-transition-audit.sh"
if bash "$ROOT/scripts/dev/run-phase1-to-phase2-transition-audit.sh" | tail -8; then
  :
else
  echo "bootstrap-phase2-g1-g2: WARN transition audit exit non-zero — G-1/G-2 may still be OK; see transition-audit/latest before C1-C12" >&2
fi

echo ""
echo "bootstrap-phase2-g1-g2: done — verify run.log ends with READY_FOR_C1_C12"
echo "  Next: COMMUNITY-PHASE-2-3-ROADMAP C1 (② only · per-slot evidence · no GO until slot PASS)"
