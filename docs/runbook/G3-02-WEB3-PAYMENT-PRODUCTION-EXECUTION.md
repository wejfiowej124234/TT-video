# G3-02 · Web3 USDC Payment Production Execution Plan

**Checklist:** [`registry/production-payment-readiness-checklist.v1.yaml`](../../registry/production-payment-readiness-checklist.v1.yaml) (PAY-W01..W16)  
**Architecture:** [`registry/payment-architecture-classification.v1.yaml`](../../registry/payment-architecture-classification.v1.yaml)  
**GO sequence:** [`registry/production-go-closure-sequence.v1.yaml`](../../registry/production-go-closure-sequence.v1.yaml)  
**Gate:** `bash scripts/check-web3-payment-production-readiness.sh`

---

## 0 · 裁定

- **Payment = Web3 Escrow (USDC)** — 企业级 Web3 产品验收（16 项）
- **Stripe = Optional Fiat Onboarding** — P1 扩展 · 不在主链路

---

## 1 · 执行顺序

```text
SSOT + gate artifacts
→ contract parity (W04)
→ wallet (W01) → approve (W02) → deposit (W03)
→ indexer (W05) → order state (W06)
→ release (W07) → feerouter (W08) → settlement (W09)
→ ledger reconcile (W10)
→ event replay (W11) · rpc failover (W12)
→ explorer (W13) · multi-wallet (W14)
→ security (W15) · recovery (W16)
→ production reality verification → G3-02 VERIFIED
```

---

## 2 · 自动化执行（Production Sepolia）

```bash
export G3_02_TRAVELER_PK=0x... G3_02_GUIDE_PK=0x... G3_02_FACTORY_DEPLOYER_PK=0x...
export G3_02_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com   # 可选 · RPC 容灾
node scripts/dev/run-g3-02-web3-payment-production-verification.cjs
node scripts/dev/run-g3-02-evidence-synchronization.cjs   # P0-003 · EXECUTION ↔ READINESS 对齐
bash scripts/check-web3-payment-production-readiness.sh
bash scripts/check-production-go-four-gates.sh
```

Evidence 根目录：`evidence/GO_production_readiness/G3-02/`（PAY-W01..W16 子目录 + `G3-02-EXECUTION-LATEST.json`）

## 3 · Owner 动作矩阵（摘要）

| Step | ID | 动作 |
|------|-----|------|
| 1 | W04 | 全栈合约地址对拍 |
| 2 | W01–W03 | 钱包 · approve · deposit 真实 Sepolia tx |
| 3 | W05–W06 | Indexer + 订单状态（禁 mock-pay） |
| 4 | W07–W10 | release · FeeRouter · settlement · ledger 对账 |
| 5 | W11–W12 | event replay · RPC 容灾 |
| 6 | W13–W14 | Explorer · 多钱包 |
| 7 | W15–W16 | 安全 · Gas/异常恢复 |
| 8 | GATE | `check-web3-payment-production-readiness.sh` → PASS |

---

## 3 · Stripe 扩展轨（P1 · 可选 · 非主链路）

```bash
bash scripts/check-pi3-003-stripe-live-production-webhook-execution.sh
```

---

## 4 · 禁止项

- Stripe 代替 USDC Escrow 核心验收
- Production mock-pay
- Staging PASS 冒充 Production VERIFIED

---

*G3-02 execution · checklist v2 · 2026-07-08*
