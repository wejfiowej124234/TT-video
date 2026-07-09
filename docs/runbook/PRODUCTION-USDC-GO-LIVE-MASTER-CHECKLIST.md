# Production USDC Go-Live · 全方位上线前检查清单

**Four-Gate Framework:** [`PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md`](PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md) — **L2 Web3** 层 SSOT  
**Machine SSOT:** [`registry/production-usdc-go-live-master-checklist.v1.yaml`](../../registry/production-usdc-go-live-master-checklist.v1.yaml)  
**Remaining work:** [`registry/production-go-remaining-work.v1.yaml`](../../registry/production-go-remaining-work.v1.yaml)  
**Payment Gate:** `bash scripts/check-web3-payment-production-readiness.sh`  
**Architecture:** [`registry/payment-architecture-classification.v1.yaml`](../../registry/payment-architecture-classification.v1.yaml)  
**Scope:** PRODUCTION_SCOPE_SEPOLIA · `CHAIN_ID=11155111`

> **2026-07-08 纠正：** 本清单 **取代** 以 Stripe 作为核心 Production Payment 的旧版上线准备流程。  
> **Payment = Web3 Escrow (USDC)** · **Stripe = Optional Fiat Onboarding（附录 · P1 · 不挡 GO）**

---

## 0 · 架构裁定（先读）

```
用户钱包 → USDC approve → Escrow.deposit → 链上 Event
  → Indexer → 订单状态 → Release → FeeRouter 分账
  → Settlement Ledger → 对账
Governance / Treasury — 与订单 Escrow 资金独立
```

| 是 | 否 |
|----|-----|
| USDC ERC-20 结算 | Stripe 作为 trip/market 核心支付 |
| Escrow 智能合约托管 | mock-pay / P3_CHAIN_OFF=1 上 prod |
| Indexer 同步订单 | sk_test 冒充生产支付 |

**并联（不替代本清单）：** [`docs/go-live-checklist.md`](../go-live-checklist.md) §0～§11（DB/监控/回滚等工程项）

---

## A · 架构与 Production Scope

- [ ] **GL-A01** 对外披露 **Sepolia 测试网结算**（非 Mainnet 主网资产）
- [ ] **GL-A02** 产品/Runbook/Decision Package 均写 **Payment = Web3 Escrow (USDC)**
- [ ] **GL-A03** Prod `P3_CHAIN_OFF` 未启用；`GET /meta` 无 mock-pay；`POST …/mock-pay` → **501**
- [ ] **GL-A04** `MAINNET_CUTOVER_AUTHORIZED=false`（除非另开 PI3-005-M）

---

## B · 合约 · ABI · 地址全栈对拍

### B.1 Sepolia Production 基线地址

| 合约 / 资产 | 地址 | API env | FE env |
|-------------|------|---------|--------|
| **Settlement USDC** | `0x241948bE49a778490c8A4Ae8D98b7537fE001f63` | `SETTLEMENT_TOKEN` | `NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS` |
| EscrowFactory | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` | `ESCROW_FACTORY_ADDRESS` | `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS` |
| FeeRouter | `0x81A8009210c5215100564c6E4123F672c4459306` | `FEE_ROUTER_ADDRESS` | `NEXT_PUBLIC_FEE_ROUTER_ADDRESS` |
| Registry | `0xc50913e154f850583D0afbE9158a75E0e2167AAb` | `REGISTRY_ADDRESS` | `NEXT_PUBLIC_REGISTRY_ADDRESS` |
| Governor | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` | `GOVERNOR_ADDRESS` | `NEXT_PUBLIC_GOVERNOR_ADDRESS` |
| Timelock | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` | `TIMELOCK_ADDRESS` | — |
| TTG | `0x2837ea0c50e27d59b88af617abbb231a040062c5` | `GOVERNANCE_TOKEN_ADDRESS` | `NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS` |
| Guide Staking | `0x5bdACF35292bDd681103BBb50865d8D2Fd49653f` | `GUIDE_STAKING_ADDRESS` | `NEXT_PUBLIC_GUIDE_STAKING_ADDRESS` |
| RegionVault | `0x2Ea061d50393c09af2f607Ee9f89679642A3a65B` | `REGION_VAULT_ADDRESS` | — |
| Region Stake Pool | `0x3a89378bfad12d1028707dd37055294854c8784e` | `REGION_STEWARD_STAKE_POOL_ADDRESS` | `NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS` |

SSOT 交叉引用：[`protocol-convergence-deployments.v1.yaml`](../../registry/protocol-convergence-deployments.v1.yaml) · [GovFreeze V2 Sepolia](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)

### B.2 对拍检查项

- [ ] **GL-B01** Fly `tt-api-prod` secrets 与上表一致
- [ ] **GL-B02** `deploy/fly/tt-web-prod/build.env.local` 与 API `/meta` 一致
- [ ] **GL-B03** `SETTLEMENT_TOKEN` ↔ `NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS` 一致
- [ ] **GL-B04** 链上 Escrow 实例 `platformFeeRecipient == FEE_ROUTER_ADDRESS`
- [ ] **GL-B05** ABI 真源：`contracts/abi/Escrow.json` · `EscrowFactory.json` · `FeeRouter.json` 与部署 commit 对齐
- [ ] **GL-B06** FE `CreateOnChainEscrowBlock` 使用相同 `approve` / `deposit` / `release` selector
- [ ] **GL-B07** 治理 Treasury / Staking 地址与 GovFreeze 基线一致；与 trip Escrow 边界清晰

**验证命令：**

```bash
PROD_API_BASE=https://tt-api-prod.fly.dev PROD_WEB_BASE=https://tt-web-prod.fly.dev \
  bash scripts/dev/check-production-web-alignment.sh

bash scripts/ops/runtime-chain-ssot-cast-verify.sh
```

---

## C · USDC 结算代币

- [ ] **GL-C01** `SETTLEMENT_TOKEN` 已在 prod API 配置（Sepolia track token）
- [ ] **GL-C02** Token decimals / 订单 amount 单位 / FE 展示一致
- [ ] **GL-C03** 烟测钱包持有足够 Sepolia USDC + ETH（gas）
- [ ] **GL-C04** `approve(Escrow, amount)` 链上 tx 成功后再 deposit

---

## D · API · 订单 · Indexer 对齐

| 端点 | 验收 |
|------|------|
| `GET /meta` | `chain_id=11155111` · contracts 块与 env 一致 · 无 mock-pay |
| `POST /api/v1/orders` | 创建订单 · guide/listing 绑定 |
| `POST …/accept` | 向导接单 |
| `POST …/set-escrow-address` | 写入 escrow_address（链上模式） |
| `GET …/orders/:id` | `escrow_address` · `chain_id` · itinerary · fee_route_country |
| `GET …/chain-sync-status` | deposit 后含 `tx_hash` · finality |
| `POST /internal/indexer-tick` | 处理 Deposited/Paid/Released |
| `POST /internal/indexer-reconcile` | `persist:true` → accepted→escrowed |
| `POST /internal/indexer-replay` | 漏 block 后可重扫（W11） |

- [ ] **GL-D01～D08** 上表 prod 烟测通过
- [ ] **GL-D08** `INTERNAL_API_SECRET` 已设 · WAF 禁公网 `/internal/*`
- [ ] 终态以 **`orders_projection`** 为 SSOT（B-094）

**状态机 SSOT：** `crates/core/src/escrow.rs` · [04-后端与API §orders](../spec/04-后端与API.md)

---

## E · 前端 · 钱包 · DApp

- [ ] **GL-E01** MetaMask / WalletConnect 连接 prod FE
- [ ] **GL-E02** Coinbase Wallet（若支持）或文档化 N/A
- [ ] **GL-E03** connect · disconnect · reconnect · 刷新恢复
- [ ] **GL-E04** `/escrow/:id` 或 Pay Hub 完整 approve → deposit UI
- [ ] **GL-E05** 每单展示 TxHash · Sepolia Explorer · Block · Confirmations
- [ ] **GL-E06** USDC 不足 / gas 不足 / tx revert 有明确 UX

**FE env 模板：** `deploy/fly/tt-web-prod/build.env.sepolia-prod.example`

---

## F · Payment Production Verification（PAY-W01～W16）

完整 16 项见 [`PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md`](PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md)

| ID | 类别 |
|----|------|
| W01 | Wallet |
| W02 | Approve |
| W03 | Deposit |
| W04 | Escrow + 合约一致性 |
| W05 | Indexer |
| W06 | Order State |
| W07 | Release |
| W08 | FeeRouter |
| W09 | Settlement |
| W10 | Ledger 对账（链→Indexer→DB→订单→Settlement→FeeRouter→Ledger） |
| W11 | Event Replay |
| W12 | RPC Failover（Primary + Backup） |
| W13 | Explorer |
| W14 | Multi Wallet |
| W15 | Security |
| W16 | Recovery（Pending/Replace/Revert/cancel/dispute） |

- [ ] **GL-F** 全部 W01～W16 有 prod 证据 · Gate **PASS**

```bash
bash scripts/check-web3-payment-production-readiness.sh
# 目标: TT_WEB3_PAYMENT_PRODUCTION_READINESS=WEB3_PAYMENT_PRODUCTION_PASS
```

证据目录：`evidence/GO_production_readiness/G3-02/{wallet,approve,deposit,...}/`

---

## G · 基础设施（非支付 · 与 go-live 并联）

Production GO 主链路顺序见 [`production-go-closure-sequence.v1.yaml`](../../registry/production-go-closure-sequence.v1.yaml)：

| 序 | 项 | 检查 |
|----|-----|------|
| ① | OCS Bootstrap | `OCS_PRODUCTION_PARITY_AUDIT=PASS` |
| ② | **Web3 Payment** | **本节 F · PAY-W01～W16** |
| ③ | CMS 全运营 | `TT_PRODUCTION_OPERATIONS_GO` |
| ④ | API Parity | lineage / public API 对拍 |
| ⑤ | CDN / Media | G3-01 |
| ⑥ | Domain / TLS / CORS | PI3-002 |
| ⑦ | Monitoring | G3-04 |
| ⑧ | Backup / Rollback | PI3-001 · go-live §8 |
| ⑨ | Security Review | G2 security gaps |
| ⑩ | Owner Sign-off | G3-06 Decision Package |

- [ ] **GL-G01～G07** 各步 evidence 留痕

**并联工程清单：** [`go-live-checklist.md`](../go-live-checklist.md) §0～§11（DB · SSOT · 监控 · 回滚）

---

## 附录 A · Optional Fiat Onboarding（Stripe · P1 · 非主链路）

> **不是 Production Payment。** 仅当显式启用 `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1` 时执行。

- [ ] Stripe Live 账户 + `sk_live_*` + `whsec_*`
- [ ] Webhook: `POST /api/v1/hooks/stripe/onboarding`
- [ ] 一笔 onboarding live 烟测

SSOT: [`PRODUCTION-STRIPE-ENV-MATRIX-SEPOLIA-SCOPE.md`](PRODUCTION-STRIPE-ENV-MATRIX-SEPOLIA-SCOPE.md) · [153 PI3-003](../handbook/engineering/153-PI3-003-Stripe-Live-Production-Webhook-Report.md)

```bash
bash scripts/check-pi3-003-stripe-live-production-webhook-execution.sh
```

**默认入驻路径仍为 USDC → OnboardingFeeReceiver，无需 Stripe 即可 Production GO（Web3-only scope）。**

---

## 已从核心准备中移除（勿再作为 GO 阻断）

| 旧项 | 新裁定 |
|------|--------|
| PI3-003 Stripe Live 作为 Step 3 必做 | 移至附录 A · P1 optional |
| `sk_live_*` 作为 trip 支付前置 | 不需要 |
| PRM-STR-B001 BLOCKER | 降级 ENHANCEMENT · 由 PRM-WEB3-PAY-B001 取代 |
| go-live §6 Stripe 烟测挡核心 GO | 仅 onboarding 可选 |

---

## 快速验收命令汇总

```bash
# 1 · Meta / mock-pay
curl -s https://tt-api-prod.fly.dev/meta | jq '{chain_id: .chain.chain_id, mock: .order_mock_pay_enabled, contracts: .chain.contracts}'

# 2 · FE/API 对拍
PROD_API_BASE=https://tt-api-prod.fly.dev PROD_WEB_BASE=https://tt-web-prod.fly.dev \
  bash scripts/dev/check-production-web-alignment.sh

# 3 · 链上地址接线
bash scripts/ops/runtime-chain-ssot-cast-verify.sh

# 4 · Web3 Payment Gate（16 项）
bash scripts/check-web3-payment-production-readiness.sh
```

---

*Maintained by Production Readiness · USDC-native correction 2026-07-08*
