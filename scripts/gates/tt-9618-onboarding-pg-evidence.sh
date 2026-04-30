#!/usr/bin/env bash
# TT-9618 · 96-18 准入费：与 **§3.1** 步 **5～7** + **Stripe** **`charge.refunded`（`017`）** + **`charge.dispute.funds_withdrawn`（`014`/`016`）** + **§3.6**（**008b/009/010/011/012**）同源的 **PostgreSQL** 机读证据（单脚本收口）。
# **步 5** **`matrix_93_admin_onb`** 已覆盖 **04 §3.5** **Admin onboarding** 全前缀用例（含 **`029`/`030`** **`financial-reversal`**）+ **04 §3.4** **`GET …/admin/jobs?queue_name=onboarding_webhook`**（**`matrix_93_admin_onb_031_*`** **`async_jobs`** **镜像** **对拍**），**勿**在脚本尾重复 **`cargo test …_029`** **/** **`…_031`**。
# 前置：**DATABASE_URL** 指向已 **sqlx migrate** 的库；API 代码与迁移版本与待验环境一致。
# 未设 **DATABASE_URL** 时 **exit 2**（不冒充已在 **② 测试网** 跑通）。
# 串跑顺序：**admin_onb** → **006** → **005_f036_ext** → **017**（**refund**）→ **014**/**016**（**dispute·revoked / 终态审计**）→ **008b**（**`async_jobs` 镜像 · 内联队列**）→ **009**–**012**（**`matrix_93_d_onb_009`** **子串** **含** **`009b_*`** **250** **`PRIMARY_CLAIM`** **`async_jobs`** **主选队** **PG·IT**）→ 可选 **promtool** / **npm build**。
# 文档互指：**[TT-9618](../../docs/runbook/TT-9618-onboarding-local-testnet.md)** **§3.5.3**；**`#9618-*`** 人类链见 **registry/derived/tt-9618-onboarding-pg-evidence-doc-pointer.v1.json**。
#
# 可选：串跑 Next **`npm run build`**（须 **node/npm**；无工具时勿设）：
#   CHECK_FRONTEND_NPM_BUILD=1 bash scripts/gates/tt-9618-onboarding-pg-evidence.sh
#
# 用法（仓库根）：
#   export DATABASE_URL='postgres://…'
#   bash scripts/gates/tt-9618-onboarding-pg-evidence.sh
#
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "tt-9618-onboarding-pg-evidence: DATABASE_URL is not set." >&2
  echo "  Export DATABASE_URL to a migrated PostgreSQL (TT-9618 §3.1 steps 5–7 + Stripe 017/014/016 + §3.6 008b/009/010/011/012), then re-run." >&2
  exit 2
fi

echo "==> matrix_93_admin_onb (TT-9618 §3.1 step 5)"
cargo test -p traveltrust-api matrix_93_admin_onb

echo "==> matrix_93_b_onb_006 (TT-9618 §3.1 step 6)"
cargo test -p traveltrust-api matrix_93_b_onb_006

echo "==> matrix_93_d_onb_005_f036_ext (TT-9618 §3.1 step 7 / §3.2 step 6)"
cargo test -p traveltrust-api matrix_93_d_onb_005_f036_ext

echo "==> matrix_93_d_onb_017 (Stripe charge.refunded partial audit then full refund)"
cargo test -p traveltrust-api matrix_93_d_onb_017

echo "==> matrix_93_d_onb_014 (Stripe charge.dispute.funds_withdrawn paid→revoked)"
cargo test -p traveltrust-api matrix_93_d_onb_014

echo "==> matrix_93_d_onb_016 (Stripe dispute funds_withdrawn terminal idempotent audit)"
cargo test -p traveltrust-api matrix_93_d_onb_016

echo "==> matrix_93_d_onb_008b (250 / ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs)"
cargo test -p traveltrust-api matrix_93_d_onb_008b

echo "==> matrix_93_d_onb_009 (TT-9618 §3.6 standalone webhook worker; substring includes 009b PRIMARY_CLAIM async_jobs)"
cargo test -p traveltrust-api matrix_93_d_onb_009

echo "==> matrix_93_d_onb_010 (TT-9618 §3.6 stale processing requeue)"
cargo test -p traveltrust-api matrix_93_d_onb_010

echo "==> matrix_93_d_onb_011 (TT-9618 §3.6.1 /metrics onboarding webhook gauges)"
cargo test -p traveltrust-api matrix_93_d_onb_011

echo "==> matrix_93_d_onb_012 (TT-9618 §3.6.2 DLQ → jobs replay)"
cargo test -p traveltrust-api matrix_93_d_onb_012

if command -v promtool >/dev/null 2>&1; then
  echo "==> promtool check rules (ops/monitoring *.example.yml)"
  bash scripts/gates/check-ops-monitoring-prometheus-examples.sh
else
  echo "tt-9618-onboarding-pg-evidence: hint: install promtool and re-run to validate ops/monitoring/*.example.yml (scripts/gates/check-ops-monitoring-prometheus-examples.sh)" >&2
fi

if [[ "${CHECK_FRONTEND_NPM_BUILD:-}" =~ ^(1|true|yes)$ ]]; then
  echo "==> CHECK_FRONTEND_NPM_BUILD: npm run build (frontend)"
  bash scripts/gates/check-frontend-npm-build.sh
else
  echo "tt-9618-onboarding-pg-evidence: hint: set CHECK_FRONTEND_NPM_BUILD=1 to run scripts/gates/check-frontend-npm-build.sh after PG matrix (requires node/npm)" >&2
fi

echo "tt-9618-onboarding-pg-evidence: OK"
