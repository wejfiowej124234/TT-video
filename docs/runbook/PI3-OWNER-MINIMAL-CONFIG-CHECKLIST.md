# PI3 · Owner 最小配置清单（Production GO 前必填）

**用途：** Owner 准备生产资源时的最小输入集。填实后可按 `TT-PI3-PRODUCTION-INFRASTRUCTURE-PREP.md` 复跑 gate 升格 **HOLD → GO**。

**Payment SSOT（2026-07-08）：** 核心支付 = **Web3 USDC + Escrow** — 见 [`PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md`](PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md)  
**Stripe** = Optional Fiat Onboarding（附录 · P1 · **不挡 GO**）

**默认 scope：** Sepolia Production（`CHAIN_ID=11155111`）— Mainnet 决策留 PI3-005。

---

## A · 品牌与域名（PI3-002 · 第一步）

| # | 配置项 | 示例 | 写入位置 |
|---|--------|------|----------|
| A1 | 生产 Web 域名 | `https://app.traveltrust.example` | `PROD_WEB_BASE` · Fly cert · DNS |
| A2 | 生产 API 域名 | `https://api.traveltrust.example` | `PROD_API_BASE` · Fly cert · DNS |
| A3 | Fly API app | `tt-api-prod` | `deploy/fly/tt-api-prod/fly.toml` |
| A4 | Fly Web app | `tt-web-prod` | `frontend/fly.production.toml` |
| A5 | Web build env | `NEXT_PUBLIC_*` 对拍 | `deploy/fly/tt-web-prod/build.env.local` |
| A6 | API secrets env | `CORS_ORIGINS` 仅 prod FE | `scripts/dev/.env.production.local` |

**验证：**

```bash
PROD_WEB_BASE=… PROD_API_BASE=… bash scripts/dev/check-production-web-alignment.sh
PROD_WEB_BASE=… bash scripts/dev/patch-tt-api-prod-cors.sh
bash scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh
```

---

## B · PostgreSQL 备份（PI3-001 · 第二步）

| # | 配置项 | 说明 |
|---|--------|------|
| B1 | Fly PG app | `tt-traveltrust-prod` |
| B2 | `DATABASE_URL` | prod internal URL → `.env.production.local` |
| B3 | Fly managed backup | `bash scripts/dev/enable-fly-pg-backup.sh tt-traveltrust-prod` |
| B4 | 恢复演练 | `bash scripts/dev/run-phase3-db-restore-drill-prod.sh` |
| B5 | B-475 baseline | `evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json` → **`status=PASS`** |

**验证：**

```bash
python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py
bash scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh
```

---

## C · Web3 USDC Escrow Payment（G3-02 · 第三步 · 核心支付）

| # | 配置项 | 说明 |
|---|--------|------|
| C1 | `CHAIN_ID` | **11155111**（Sepolia prod scope） |
| C2 | `CHAIN_RPC_URL` | Primary RPC（建议 + Backup 见 W12） |
| C3 | `SETTLEMENT_TOKEN` | Sepolia USDC track：`0x241948bE49a778490c8A4Ae8D98b7537fE001f63` |
| C4 | `ESCROW_FACTORY_ADDRESS` | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` |
| C5 | `FEE_ROUTER_ADDRESS` | `0x81A8009210c5215100564c6E4123F672c4459306` |
| C6 | `REGISTRY_ADDRESS` / `GOVERNOR_ADDRESS` / staking 等 | 见 [Master Checklist §B](PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md#b--合约--abi--地址全栈对拍) |
| C7 | FE `NEXT_PUBLIC_*` | 与 API / `/meta` 全栈对拍（含 `SETTLEMENT_TOKEN`） |
| C8 | `P3_CHAIN_OFF` | **必须 unset / 0**（禁止 mock-pay） |
| C9 | Indexer | `INTERNAL_API_SECRET` + 内网 indexer-tick 调度 |
| C10 | 烟测钱包 | Sepolia ETH + USDC · 跑 PAY-W01～W16 |

**验证：**

```bash
bash scripts/ops/runtime-chain-ssot-cast-verify.sh
bash scripts/check-web3-payment-production-readiness.sh
# 目标: WEB3_PAYMENT_PRODUCTION_PASS
```

**全方位清单：** [`PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md`](PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md)

---

## D · Production 验收（PI3-004 · 第四步）

| # | 配置项 | 说明 |
|---|--------|------|
| D1 | Prod UAT 账号 | `PROD_UAT_EMAIL` / `PROD_UAT_PASSWORD`（非 seed） |
| D2 | R-003 全站回归 | `bash scripts/dev/run-r003-production-regression.sh` |
| D3 | 六域 UAT | `bash scripts/dev/run-production-uat-six-domains.sh` |
| D4 | `report.json` | `release_gate=GO` + `validate-regression-report.py --require-go` |
| D5 | PI3-004 baseline | `status=PASS` |

**验证：**

```bash
bash scripts/check-pi3-004-production-readiness-verification-execution.sh
```

---

## E · 生产硬闸（全部 PI3 live 必达）

| 变量 | Production 值 |
|------|----------------|
| `SEED_TEST_ACCOUNTS` | **0** |
| `P3_CHAIN_OFF` | **unset / 0** |
| `INTERNAL_API_SECRET` | 强随机 · 与 staging 隔离 |
| `STRICT_SSOT` | **1**（建议） |
| `SETTLEMENT_TOKEN` | 与 FE `NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS` 一致 |

---

## F · 暂不要求（PI3-005 / PI3-006）

- Mainnet `CHAIN_ID` / 合约地址 cutover（PI3-005）
- Go-Live §0–§11 全闭 · cutover smoke（PI3-006）
- `TT_RELEASE_DECISION: GO` 签字

**进入 F 的前置：** A–D 全部 gate 输出 **GO** + **Web3 Payment PASS**

---

## 附录 · Optional Fiat Onboarding（Stripe · P1 · 非 Step C）

> **不是核心支付。** 仅 `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1` 时需要。

| # | 配置项 |
|---|--------|
| S1 | `TRAVELTRUST_STRIPE_SECRET_KEY=sk_live_*` |
| S2 | `TRAVELTRUST_STRIPE_WEBHOOK_SECRET=whsec_*` |
| S3 | Webhook URL → `/api/v1/hooks/stripe/onboarding` |

见 [`PRODUCTION-STRIPE-ENV-MATRIX-SEPOLIA-SCOPE.md`](PRODUCTION-STRIPE-ENV-MATRIX-SEPOLIA-SCOPE.md)

---

## G · 一键 prep（无域名时可跑）

```bash
bash scripts/dev/run-pi3-production-infra-prep.sh
bash scripts/gates/check-phase3-production-infrastructure-ssot.sh
bash scripts/check-web3-payment-production-readiness.sh
```

预期：PI3 域 **HOLD/INTERIM** + Web3 payment gate SSOT **OK** + execution artifacts **PASS**。
