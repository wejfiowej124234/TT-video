# Escrow Bilateral Settlement — Owner Decision Record v1

**Record ID:** TT-ESCROW-BILATERAL-SETTLEMENT-ODR-001  
**Effective:** 2026-07-08  
**Status:** **APPROVED — B3 EscrowV2 + FactoryV2 selected** (Owner decision recorded; formal signoff stamp pending §7)  
**Implementation stamp:** 2026-07-08 — Layer A API/DB/UI wired; Layer B `EscrowV2` + `EscrowFactoryV2` design + contracts scaffold; V1 mainnet forbidden
**Decision owner:** Engineering Owner (Sebastian Ward)  
**Audit basis:** `ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json` · `ESCROW-SETTLEMENT-BUSINESS-LOGIC-GAP-LATEST.md`

---

## 1. Decision summary

TravelTrust **正式采用** **Bilateral Confirmation Settlement Model（双边确认 Settlement Model）** 作为 Escrow 结算唯一业务模型：

> **Traveler 与 Guide 双方均确认行程服务完成后，才允许链上资金释放。**  
> `release()` 仅执行资金分配，**不是**单方面完成确认。  
> **Keeper** 保留为**自动执行层**，**不是**业务授权层。

**主网前修复路径（选定）：** **B3 — EscrowV2 + FactoryV2**

| 选项 | 决定 |
|------|------|
| B1 SettlementAuthorizationRegistry | 不选（复杂度高） |
| B2 EIP-712 + Executor only | 不选（无法阻止第三方抢先 `release()`） |
| **B3 EscrowV2 + FactoryV2** | **✅ 选定** |
| V1 Escrow 继续主网 | **❌ 禁止** |

---

## 2. Rationale（为何 B3）

1. **V1 Escrow 实例不可升级** — 无法在已部署实例上补 bilateral gate。  
2. **V1 `release()` @ Funded 无 caller / completion 约束** — 主网资金损失 P0。  
3. **B2 不能链上阻止抢先 release** — 仅运营策略不足 protocol-grade。  
4. **B3 最干净** — 新 Factory 路由新订单；completion flags + permissionless release **after** bilateral on-chain。

---

## 3. Target lifecycle（正式 SSOT）

```text
Traveler 创建订单
        ↓
USDC Deposit（Traveler only）
        ↓
Escrow 锁定（Funded）
        ↓
Guide 提供服务 · 行程进行（Escrowed）
        ↓
Guide Confirm Service Complete  +  Traveler Confirm Service Complete
        ↓
Order business = ServiceCompleted（链下 Layer A · 链上 V2 flags Layer B）
        ↓
Release Allowed
        ↓
release() — Keeper / 任一方 EOA（仅分配 · 无 caller 收益）
        ↓
Guide USDC + FeeRouter 平台费 → Ledger
```

**明确区分：**

| 动作 | 授权 |
|------|------|
| 确认业务完成 | Traveler + Guide（各一次） |
| 调用 `release()` | Permissionless **after** bilateral complete |
| 评分 `confirm-rating` | 独立 · **不** gate settlement |

---

## 4. Implementation waves

| Wave | Scope | Mainnet |
|------|-------|---------|
| **Layer A** | `service_tourist_confirmed` / `service_guide_confirmed` · API · DB · UI · Evidence | Required before mainnet orders |
| **Layer B** | `EscrowV2.sol` · `EscrowFactoryV2.sol` · deploy script · registry | **Mainnet only V2** |
| **Layer C** | Keeper bot · watches ServiceCompleted · submits `release()` | Post Layer B |

---

## 5. V1 legacy policy

| Environment | Escrow V1 |
|-------------|-----------|
| Sepolia / testnet | **Legacy allowed** — existing instances complete under documented risk |
| **Mainnet** | **NOT DEPLOYED** — FactoryV2 only |
| G3-02 evidence | Update after Layer A+B |

---

## 6. P0 closure criteria (PG-P0-ESC)

- [x] Layer A API: `POST …/confirm-service-completion` · bilateral `service_*_confirmed` · migration  
- [x] Layer A UI: release gate → service completion (not rating) · i18n · API client  
- [ ] Layer A E2E: tourist + guide confirm → `Completed` · release UI enabled  
- [x] Layer B design: `EscrowV2.sol` · `EscrowFactoryV2.sol` · `DeployEscrowFactoryV2.s.sol` · broadcast shell  
- [x] Layer B forge: `EscrowV2.t.sol` bilateral release gate tests  
- [x] V1 mainnet forbidden: `registry/escrow-bilateral-mainnet-policy.v1.yaml`  
- [ ] Registry: `escrow_factory_v2_address` populated (post Sepolia/mainnet broadcast)  
- [x] Keeper Layer C design: `ESCROW-KEEPER-LAYER-C-DESIGN-V1.md`  
- [ ] Cert #8–12 · R-01 · Shadow Launch · G6 no-rollback  
- [ ] D16 Protocol Intent PASS (post deploy + evidence)  
- [ ] Owner signoff stamp §7  

**Evidence runners:**

```bash
node scripts/dev/run-escrow-bilateral-layer-a-evidence.cjs
node scripts/dev/run-escrow-bilateral-layer-b-evidence.cjs
node scripts/dev/run-escrow-settlement-authorization-audit.cjs
node scripts/dev/run-web3-protocol-grade-audit.cjs
node scripts/dev/run-web3-mainnet-production-readiness-audit.cjs
```

---

## 7. Signoff

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Owner | | | |
| Security | | | |
| Product | | | |

**Machine key:** `TT_ESCROW_BILATERAL_SETTLEMENT_B3_APPROVED`
