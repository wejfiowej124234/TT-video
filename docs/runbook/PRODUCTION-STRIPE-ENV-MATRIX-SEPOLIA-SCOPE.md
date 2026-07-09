# Production Stripe Environment Matrix · Sepolia Scope（148 PRODUCTION_SCOPE_SEPOLIA）

> **分类纠正（2026-07-08）：** Stripe 配置矩阵仅适用于 **入驻 onboarding 准入费可选 bypass**（`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`）。**核心订单/市场/收购支付** 走 **USDC + Escrow + FeeRouter**，见 [`PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md`](PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md)。Stripe Live **不阻断** Production GO（Web3-only scope）。

**Recorded:** 20260608  
**Scope SSOT:** [148-PI3-005-Production-Scope-Decision-Report.md](../handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md)  
**Execution SSOT:** [153-PI3-003-Stripe-Live-Production-Webhook-Report.md](../handbook/engineering/153-PI3-003-Stripe-Live-Production-Webhook-Report.md)  
**Domain baseline:** [151 PI3-002 Execution](../handbook/engineering/151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md) · [121 §7](../handbook/engineering/121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md)

> **≠ Production GO** — Sepolia scope 允许 **Stripe Live（真钱 PSP）** + **Sepolia 链上结算**；须诚实披露 scope（148 §4）。

---

## 1 · Scope lock

| Key | Production value |
|-----|------------------|
| `PRODUCTION_SCOPE` | **SEPOLIA** |
| Stripe mode | **live** (`sk_live_*` · live `whsec_*`) |
| Onboarding PSP | **`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`** |
| Test key on prod | **禁止** (`sk_test_*` = G-1 violation) |
| Growth / Catalog | **冻结** — 145/146/150 unchanged |

---

## 2 · Webhook topology

| Item | Value |
|------|-------|
| Path | **`POST /api/v1/hooks/stripe/onboarding`** |
| Prod URL | **`https://api.<brand-domain>/api/v1/hooks/stripe/onboarding`** |
| Header | **`Stripe-Signature`** |
| Secret env | **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET=whsec_*`** (live endpoint) |
| Handler | `stripe_onboarding_legacy_monolith.rs` · HMAC verify |
| Auth middleware | Public **`/api/v1/hooks/`** POST whitelist |

**事件（最小）：** `payment_intent.succeeded` · `checkout.session.completed` · `charge.refunded` · `charge.dispute.funds_withdrawn`

---

## 3 · Fly / env 变量矩阵（tt-api-prod）

**Template:** `scripts/dev/.env.production.example`  
**Owner local:** `scripts/dev/.env.production.local`（gitignored）

| Variable | Production requirement | Probe |
|----------|------------------------|-------|
| `TRAVELTRUST_STRIPE_SECRET_KEY` | **`sk_live_*`** · balance API 200 | `stripe-live-onboarding-lib.sh` |
| `TRAVELTRUST_STRIPE_WEBHOOK_SECRET` | **`whsec_*`** from live endpoint | register + sync scripts |
| `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED` | **`1`** | Fly secrets |
| `PUBLIC_API_BASE_URL` | `https://api.<brand-domain>` | 151 alignment |
| `PROD_API_BASE` | 同 API base | webhook URL 对拍 |

**Fly sync:** `bash scripts/dev/sync-fly-stripe-onboarding-secrets-prod.sh`

---

## 4 · Owner execution checklist

| Step | Action | Script |
|------|--------|--------|
| 1 | Stripe Dashboard **Live** account activated | Finance / Owner |
| 2 | **151** prod API domain live (`PROD_API_BASE`) | `check-production-web-alignment.sh` |
| 3 | Register live webhook on prod URL | `register-stripe-live-webhook-prod.sh` |
| 4 | Fill `.env.production.local` · sync Fly | `sync-fly-stripe-onboarding-secrets-prod.sh` |
| 5 | Deploy `tt-api-prod` if needed | `phase3-production-fly-deploy-and-sync.sh` |
| 6 | Live webhook smoke (signature + 200) | `smoke-stripe-live-webhook-prod.sh` |
| 7 | Baseline → **PASS** | `check-pi3-003-stripe-live-baseline-record.py` |
| 8 | Execution gate → **GO** | `check-pi3-003-stripe-live-production-webhook-execution.sh` |

**可选 live 支付烟测：** 一笔最小 live PI + `payment_intent.succeeded` 留痕（Finance 限额内 · go-live §6 并联）。

---

## 5 · Staging regression baseline（② · 不得 regress）

| Script | Purpose |
|--------|---------|
| `smoke-phase25-h3-stripe-webhook-exceptions-staging.sh` | missing/invalid/signed webhook |
| `smoke-onboarding-testnet.sh` | full onboarding + Stripe test |

---

## 6 · Evidence chain

| Path | Meaning |
|------|---------|
| `evidence/pi3_003_stripe_live_production_webhook/baseline_record.v1.json` | **机读主记录** |
| `.../stripe-live-webhook-register-*/` | Dashboard/API endpoint 注册 |
| `.../stripe-live-webhook-smoke-*/` | Prod live webhook smoke · **GO 必需** |
| `.../pi3-003-exec-*/` | Execution gate summary |
| `evidence/.../onboarding-smoke/` | Staging payment regression |

---

## 7 · Gate commands

```bash
bash scripts/check-pi3-003-stripe-live-production-webhook-execution.sh
bash scripts/dev/verify-production-stripe-webhook-signature-static.sh
PROD_API_BASE=https://api.<domain> bash scripts/dev/check-production-stripe-env-alignment.sh
bash scripts/dev/verify-pi3-003-stripe-payment-regression-evidence.sh
```

---

*Maintained by PI3-003 Execution Sprint · 153 · 2026-06-08*
