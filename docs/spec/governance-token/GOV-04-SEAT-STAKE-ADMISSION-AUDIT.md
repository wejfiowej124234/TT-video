# GOV-04 · Seat 最低质押 · 准入冲突审计

**Audit ID:** `GOV-04-SEAT-STAKE-ADMISSION`  
**SSOT:** [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md) · [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml)  
**Date:** 2026-06-16  
**Phase:** ② Sepolia · **HAT-R1 暂停中**

---

## 1. 参数对拍

| 规则 | 参数 | 数值（10M TTG 供应） |
|------|------|---------------------|
| **GOV-04** | `public_sale_per_wallet_cap_ttg` | **25,000 TTG**（0.25%） |
| **GOV-04** | `public_sale_min_purchase_usdc` | 100 USDC |
| **Seat · CN/US** | `steward_stake_bps` 400 | **400,000 TTG** min stake |
| **Seat · FR/ES** | 450 bps | **450,000 TTG** |
| **Seat · JP/TH** | 250 bps | **250,000 TTG** |
| **Seat · SG/KR** | 200 bps | **200,000 TTG** |
| **Seat · AU/AE** | 150 bps | **150,000 TTG** |

公式：`minStakeAmount = 10_000_000 × steward_stake_bps / 10_000`（TTG wei）

---

## 2. 冲突结论

**结论：`PRIMARY_MARKET_ALONE_INSUFFICIENT`（结构性张力 · 非实现 bug）**

- **GOV-04** 约束的是 **Primary Market 公众三轮 USDC→TTG** 的单钱包累计认购上限。
- **Seat 最低质押** 约束的是 **主理人 Seat 路径** 的链上 `stake()` 门槛。
- 十国 **最低 stake（150k～450k TTG）均 > GOV-04 cap（25k TTG）** → **单钱包无法仅靠 Primary Market 购满 Seat 质押量**。

这与 SSOT 分层一致：

1. **公众发行 20%**（Primary Market · GOV-04）≠ **Country Pool Shelf / Seat 质押 TTG**（protocol-ssot `country_pool_shelf` 25% · 独立分配）
2. [ttg-primary-market-and-exit-policy-v1-draft.md](ttg-primary-market-and-exit-policy-v1-draft.md) · UI 文案：**持 TTG ≠ 自动获得 45% 主理人路径**

---

## 3. 产品准入读法（冻结 · 不改 GOV 数值）

| 路径 | 是否允许 |
|------|----------|
| Primary Market 买 TTG → 治理投票 / 持币 | ✅ |
| Primary Market 单钱包买满 → 直接 Seat `stake(min)` | ❌ **禁止**（数学上不可行） |
| Shelf / 分配 / OTC / 多源 TTG → Seat stake | ✅ **SSOT 设计意图** |
| 修订 GOV-04 或降低 `steward_stake_bps` 以消除张力 | ☐ **须 GOV-02 提案 · 不在 HAT-R1 范围** |

**HAT-R1 Phase A 测试设计：**

- **Step 1** 仍验 Primary Market（GOV-04 · 100 USDC min）
- **Step 2** Stake 使用 **钱包既有 TTG**（非 PM 单一来源）或 Owner 文档化的 test top-up · **不得**宣称「PM 单路径可 Seat」

---

## 4. 机读审计

```bash
bash scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh
# report.gov04_vs_seat_stake.admission_class == PRIMARY_MARKET_ALONE_INSUFFICIENT
```

---

## 5. 诚实边界

- 本审计 **不** 修改 GOV-04 / `steward_stake_bps` 冻结值  
- **≠** ③ 法务对外 GO  
- Seat 准入若需「PM 可直达 Seat」叙事 → **须 SSOT 修订 + GOV-02 投票 · 另闸**
