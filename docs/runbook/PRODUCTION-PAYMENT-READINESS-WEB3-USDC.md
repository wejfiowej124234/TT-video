# Production Payment Readiness · Web3 USDC Native (G3-02)

**Machine SSOT:** [`registry/production-usdc-go-live-master-checklist.v1.yaml`](../../registry/production-usdc-go-live-master-checklist.v1.yaml) · [`registry/production-payment-readiness-checklist.v1.yaml`](../../registry/production-payment-readiness-checklist.v1.yaml)  
**Architecture SSOT:** [`registry/payment-architecture-classification.v1.yaml`](../../registry/payment-architecture-classification.v1.yaml)  
**Production GO sequence:** [`registry/production-go-closure-sequence.v1.yaml`](../../registry/production-go-closure-sequence.v1.yaml)  
**Gate:** `bash scripts/check-web3-payment-production-readiness.sh`  
**Machine key:** `TT_WEB3_PAYMENT_PRODUCTION_READINESS`  
**Scope:** PRODUCTION_SCOPE_SEPOLIA · `CHAIN_ID=11155111`

> **Payment = Web3 Escrow (USDC)** — Wallet → approve → deposit → Escrow → events → Indexer → order → release → FeeRouter → Settlement → Ledger.  
> **Stripe = Optional Fiat Onboarding (future extension)** — 入驻准入费可选 bypass · **P1** · **不阻断** Production GO。

---

## 1 · 架构（写死）

```
Wallet → USDC approve → Escrow.deposit → Chain Events → Indexer
  → Order State → Release → FeeRouter → Settlement Ledger
Governance / Treasury — 独立，不与订单 Escrow 混读
```

| 轨 | 标签 | Production P0 |
|----|------|---------------|
| **核心** | Web3 Escrow (USDC) | **是** |
| **扩展** | Optional Fiat Onboarding (Stripe) | **否** |
| **禁止** | mock-pay · test PSP 冒充核心支付 | — |

---

## 2 · Production Payment Readiness Checklist（PAY-W01～W16）

### PAY-W01 · Wallet
- [ ] 钱包连接 · 签名 · 地址绑定 · 可创建订单

### PAY-W02 · Approve
- [ ] USDC approve → Escrow · allowance 链上可见 · 失败 UX

### PAY-W03 · Deposit
- [ ] Escrow.deposit · tx hash · 确认数 · Gas 路径

### PAY-W04 · Escrow + 合约一致性
- [ ] Escrow 托管 USDC · escrow_address 绑定
- [ ] **EscrowFactory · FeeRouter · Registry · Governor · Treasury 全栈地址一致**（API · FE · /meta · registry）

### PAY-W05 · Indexer
- [ ] Deposited/Paid/Released 事件 ingestion · 无静默丢失

### PAY-W06 · Order State
- [ ] `accepted→escrowed` 经 Indexer（**禁止 mock-pay**）· TTL · 状态机 SSOT

### PAY-W07 · Release
- [ ] Release tx · `escrowed→completed` · 链上 event 对拍

### PAY-W08 · FeeRouter
- [ ] 平台费 → FeeRouter · distribute 治理分账

### PAY-W09 · Settlement
- [ ] 向导/商家/收购结算 · settlement 投影正确

### PAY-W10 · Ledger 对账
- [ ] **链上 Escrow → Indexer → DB → 订单 → Settlement → FeeRouter → Ledger** 金额完全一致

### PAY-W11 · Event Replay
- [ ] 漏 block / indexer lag → 重新扫描 → 订单状态恢复 · 幂等

### PAY-W12 · RPC Failover
- [ ] Primary RPC + Backup RPC · 故障恢复 runbook · indexer 恢复

### PAY-W13 · Explorer
- [ ] 每单 TxHash · Explorer 链接 · Block · Confirmations

### PAY-W14 · Multi Wallet
- [ ] MetaMask · WalletConnect · Coinbase（若支持）connect/disconnect/reconnect · 刷新恢复

### PAY-W15 · Security
- [ ] 无 mock-pay · CHAIN_ID=11155111 · Sepolia scope 诚实披露

### PAY-W16 · Recovery
- [ ] 余额不足 · approve 失败 · Pending · Replace · Revert · cancel · dispute

---

## 3 · Prod Sepolia 合约基线

| 合约 | 地址 |
|------|------|
| EscrowFactory | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` |
| FeeRouter | `0x81A8009210c5215100564c6E4123F672c4459306` |
| Registry | `0xc50913e154f850583D0afbE9158a75E0e2167AAb` |
| Governor | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` |
| Guide Staking | `0x5bdACF35292bDd681103BBb50865d8D2Fd49653f` |
| RegionVault | `0x2Ea061d50393c09af2f607Ee9f89679642A3a65B` |

---

## 4 · Optional Fiat Onboarding（PAY-S01 · 非核心）

| 项 | 说明 |
|----|------|
| **Stripe PI3-003** | Optional Fiat Onboarding · 默认 USDC 入驻 |
| **优先级** | P1 · 仅 `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1` |
| **阻断 GO?** | **否** |

---

## 5 · Production GO 主链路顺序

见 [`registry/production-go-closure-sequence.v1.yaml`](../../registry/production-go-closure-sequence.v1.yaml)：

1. OCS Production Bootstrap  
2. **Web3 Payment Production Verification** ← 本 Checklist  
3. CMS 全运营体系验证  
4. API / Data Lineage / Parity  
5. CDN / Media  
6. Domain / TLS / CORS  
7. Monitoring / Alert  
8. Backup / Rollback  
9. Security Review  
10. Owner Final Sign-off  

**Stripe 不在主链路。**

---

*G3-02 · checklist v2 · 2026-07-08*
