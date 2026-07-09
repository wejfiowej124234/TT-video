# 153 · PI3-003 Stripe Live & Production Webhook Report

> **分类纠正（2026-07-08）：** 本文档描述 **入驻准入费可选法币入口（Stripe onboarding）**，属 **P1 未来法币扩展**，**不是** TravelTrust 核心 trip/market/acquisition 支付链路。核心 Production Payment 验收见 [`PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md`](../../runbook/PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md) · G3-02 · `PRM-WEB3-PAY-B001`。

> **Sprint**：PI3-003 · **Stripe Live & Production Webhook Execution**（147/121 审计 → 执行程序）  
> **Scope SSOT**：[148 PI3-005](./148-PI3-005-Production-Scope-Decision-Report.md) · **`PRODUCTION_SCOPE_SEPOLIA`** · Stripe Live + Sepolia 链上  
> **并联基线**：[151 PI3-002 Execution](./151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md) · prod API 域 · [152 PI3-001 Execution](./152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md)  
> **冻结基准**：[145 Operations Platform Freeze](./145-Operations-Platform-Release-Freeze-Report.md) · [146 C-S6](./146-C-S6-Catalog-Consumer-OptIn-Cutover-Report.md) · [150 E2E-A-01](./150-E2E-A-01-ColdStart-Campaign-Consumer-Report.md)  
> **Webhook 拓扑**：[121 §7](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md)  
> **日期**：2026-06-08  
> **纪律**：**禁止新增产品功能代码** · **不修改 Stripe Dashboard / Fly secrets**（Owner 动作）  
> **一键 gate**：`bash scripts/check-pi3-003-stripe-live-production-webhook-execution.sh`  
> **结论**：**`PI3-003 HOLD`** — 执行程序 · Prod Stripe env 矩阵 · 签名验静态 SSOT · 支付回归证据链已交付；**Live account · prod webhook · live 烟测** 尚未 Owner 闭合

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **153 Execution Sprint 交付** | **COMPLETE** — Live lib · webhook 注册 · env 对拍 · smoke · gate |
| **148 Sepolia scope** | **LOCKED** — Live PSP 允许 · 须 scope 诚实披露 |
| **Staging test mode** | **GO** — H3 webhook 异常路径 · onboarding smoke 脚本保留 |
| **Stripe Live account** | **NOT_CONFIGURED** — 无 committed `sk_live_*` |
| **Prod webhook endpoint** | **NOT_REGISTERED** — `webhook_url` 空 |
| **签名验证（代码 SSOT）** | **STATIC_PASS** — `Stripe-Signature` + `whsec_*` · public `/hooks/` |
| **Prod env 矩阵** | **TEMPLATE_READY** — `.env.production.example` + 矩阵文档 |
| **支付回归证据链** | **PARTIAL** — staging ② 脚本/日志 · prod smoke **NOT_RUN** |
| **PI3-003 baseline** | **`status=PLANNED`** |
| **145/146/150 冻结** | **UNCHANGED** |

**153 正式裁定：** **`PI3-003 HOLD`**

**升格 `PI3-003 GO`：** Owner Live account → **151** prod API 域 → `register-stripe-live-webhook-prod.sh` → `sync-fly-stripe-onboarding-secrets-prod.sh` → `smoke-stripe-live-webhook-prod.sh` → baseline **`PASS`** → execution gate **`PI3-003_GO`**.

---

## 2. Sprint 范围与纪律

| 项 | 说明 |
|----|------|
| **执行** | Stripe Live 程序 · prod webhook URL · 签名验证据 · env 矩阵 · 回归链 |
| **未执行** | Stripe Dashboard live 开通 · Fly `sk_live`/`whsec` 写入 · prod 烟测 |
| **禁止** | 业务逻辑 · Catalog · Growth · Admin 新功能 |
| **151 依赖** | prod webhook URL = `https://api.<brand-domain>/api/v1/hooks/stripe/onboarding` |
| **G-1** | prod **禁止** `sk_test_*` |

---

## 3. 交付物清单

### 3.1 脚本与 gate

| 资产 | 路径 |
|------|------|
| Live helpers | `scripts/dev/stripe-live-onboarding-lib.sh` |
| Fly secrets sync | `scripts/dev/sync-fly-stripe-onboarding-secrets-prod.sh` |
| Webhook register | `scripts/dev/register-stripe-live-webhook-prod.sh` |
| Signature static | `scripts/dev/verify-production-stripe-webhook-signature-static.sh` |
| Env alignment | `scripts/dev/check-production-stripe-env-alignment.sh` |
| Payment regression | `scripts/dev/verify-pi3-003-stripe-payment-regression-evidence.sh` |
| Prod live smoke | `scripts/dev/smoke-stripe-live-webhook-prod.sh` |
| Baseline gate | `scripts/gates/check-pi3-003-stripe-live-baseline-record.py` |
| Execution gate | `scripts/check-pi3-003-stripe-live-production-webhook-execution.sh` |

### 3.2 机读证据

| 资产 | 路径 |
|------|------|
| PI3-003 baseline | `evidence/pi3_003_stripe_live_production_webhook/baseline_record.v1.json` |
| Stripe env 矩阵 | `docs/runbook/PRODUCTION-STRIPE-ENV-MATRIX-SEPOLIA-SCOPE.md` |

### 3.3 npm gate

```bash
cd frontend && npm run gate:pi3-003-stripe-live-production-webhook-execution
```

---

## 4. Webhook / 签名验证 SSOT

| 检查 | 结果 |
|------|------|
| Route | `POST /api/v1/hooks/stripe/onboarding` |
| 无 whsec | **503** `stripe_webhook_not_configured` |
| 无/坏签名 | **400** `missing_stripe_signature` / `stripe_webhook_invalid_signature` |
| Auth | Public **`/api/v1/hooks/`** POST（middleware whitelist） |
| Staging H3 | `smoke-phase25-h3-stripe-webhook-exceptions-staging.sh` |

**Prod URL 模板（121）：** `https://api.<brand-domain>/api/v1/hooks/stripe/onboarding`

---

## 5. Prod 环境变量矩阵

详见 [PRODUCTION-STRIPE-ENV-MATRIX-SEPOLIA-SCOPE.md](../../runbook/PRODUCTION-STRIPE-ENV-MATRIX-SEPOLIA-SCOPE.md)。

| 变量 | Production |
|------|------------|
| `TRAVELTRUST_STRIPE_SECRET_KEY` | `sk_live_*` |
| `TRAVELTRUST_STRIPE_WEBHOOK_SECRET` | live `whsec_*` |
| `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED` | `1` |
| `PUBLIC_API_BASE_URL` | prod API FQDN（151） |

---

## 6. Owner 闭合序

| 步 | 动作 |
|----|------|
| 1 | Stripe **Live** 账户激活（Finance） |
| 2 | **151** prod API 域就绪 · `PROD_API_BASE` |
| 3 | `register-stripe-live-webhook-prod.sh` |
| 4 | 填 `.env.production.local` · `sync-fly-stripe-onboarding-secrets-prod.sh` |
| 5 | 部署 `tt-api-prod`（若需） |
| 6 | `smoke-stripe-live-webhook-prod.sh` → baseline **PASS** |
| 7 | （建议）一笔 live 准入费烟测 · go-live §6 |
| 8 | `check-pi3-003-stripe-live-production-webhook-execution.sh` → **GO** |

---

## 7. Gate 探针摘要（2026-06-08）

| 探针 | 结果 |
|------|------|
| Execution artifacts | **PASS** |
| 151/152 baselines | **PASS** |
| PI3-003 baseline shape | **OK · status=PLANNED** |
| Signature static | **PASS** |
| Stripe env alignment | **PASS**（WARN：prod local 未填） |
| Payment regression chain | **PARTIAL** |
| Staging H3 smoke | **WARN/SKIP**（whsec 未配时） |
| Prod live webhook smoke | **NOT_RUN** |

**Gate 输出：** `TT_PI3_003_STRIPE_LIVE_PRODUCTION_WEBHOOK_EXECUTION: PI3-003_HOLD`  
**Evidence：** `evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-003-exec-20260608T012204Z`  
**Staging H3：** **PASS** · **Signature static：** PASS=10 · **Env alignment：** PASS=5 WARN=2

---

## 8. GO / HOLD 判定表

| 条件 | 状态 |
|------|------|
| 153 执行程序交付 | **PASS** |
| Staging webhook 路径 SSOT | **PASS** |
| `sk_live` + live `whsec` on prod | **FAIL** |
| Prod webhook URL 注册 | **FAIL** |
| Prod live webhook smoke | **NOT_RUN** |
| PI3-003 baseline `PASS` | **FAIL** |
| 145/146/150 冻结 | **UNCHANGED** ✓ |
| 产品功能 diff | **NONE** ✓ |

**最终结论：`PI3-003 HOLD`**

---

## 9. 与 Production GO 关系

> **纠正（2026-07-08）：** PI3-003 = **Optional Fiat Onboarding (future extension)** · **P1** · **不阻断** Web3-only Production GO。核心 Production Payment = **G3-02 Web3 USDC Escrow** · [`PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md`](../../runbook/PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md)。

| Gate | 关系 |
|------|------|
| **G3-02 Web3 Payment** | **P0 核心支付闸** — PAY-W01..W16 |
| **PI3-003** | **P1 可选** — 仅 onboarding Stripe bypass · **非** trip/market 支付 |
| **151 PI3-002** | prod API 域应先于 live webhook 注册（若启用 Stripe onboarding） |
| **148 Sepolia** | Live 法币 onboarding + 测试网 Escrow **须分轨披露** |
| **PRODUCTION_GO** | Stripe **不挡** GO — 须 G3-02 Web3 payment + PI3-001/002/004/006 等 |

---

## 10. 证据与复跑

```bash
bash scripts/check-pi3-003-stripe-live-production-webhook-execution.sh
bash scripts/dev/verify-production-stripe-webhook-signature-static.sh
PROD_API_BASE=https://api.<domain> bash scripts/dev/check-production-stripe-env-alignment.sh

# Owner 闭合
PROD_API_BASE=https://api.<domain> bash scripts/dev/register-stripe-live-webhook-prod.sh
bash scripts/dev/sync-fly-stripe-onboarding-secrets-prod.sh
PROD_API_BASE=https://api.<domain> bash scripts/dev/smoke-stripe-live-webhook-prod.sh
```

---

## 11. 交叉引用

| 文档 | 关系 |
|------|------|
| [147 PI3 Closure §6.3](./147-PI3-Closure-Program-Audit-Report.md) | PI3-003 BLOCKED 审计 |
| [121 §7](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md) | Webhook URL 拓扑 |
| [151](./151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md) | prod API 域 |
| [148](./148-PI3-005-Production-Scope-Decision-Report.md) | Sepolia + Stripe Live |
| [PRODUCTION-STRIPE-ENV-MATRIX](../../runbook/PRODUCTION-STRIPE-ENV-MATRIX-SEPOLIA-SCOPE.md) | env SSOT |
| [PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX §4](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) | PI3-003 P1 optional |

---

**维护者：** PI3-003 Execution Sprint · 2026-06-08  
**下一动作：** Owner §6 → 并联 151 域名 cutover → 复跑 gate → PI3-004
