# GOV-04 · Seat 最低质押 · 准入冲突审计

**Audit ID:** `GOV-04-SEAT-STAKE-ADMISSION`  
**SSOT:** [TTG-TOKENOMICS-GENESIS-V2.md](TTG-TOKENOMICS-GENESIS-V2.md) · [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml)  
**Date:** 2026-07-12 (Genesis V2 realignment)  
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
- **Seat 最低质押** 约束的是 **主理人 Seat 路径** 的链上 `stake()` 门槛（**自持 TTG** · Same Protocol Rights）。
- 十国 **最低 stake（150k～450k TTG）均 > GOV-04 cap（25k TTG）** → **单钱包无法仅靠 Primary Market 购满 Seat 质押量**。

这与 Genesis V2 SSOT 分层一致：

1. **Public Sale 50%**（Primary Market · GOV-04）≠ **Region Steward 质押 TTG**（任意合法来源 · **无** `country_pool_shelf` 创世桶）
2. [ttg-primary-market-and-exit-policy-v1-draft.md](ttg-primary-market-and-exit-policy-v1-draft.md) · UI 文案：**持 TTG ≠ 自动获得 45% 主理人路径**

---

## 3. 产品准入读法（冻结 · 不改 GOV 数值）

| 路径 | 是否允许 |
|------|----------|
| Primary Market 买 TTG → 治理投票 / 持币 | ✅ |
| Primary Market 单钱包买满 → 直接 Seat `stake(min)` | ❌ **禁止**（数学上不可行） |
| 多源 TTG（PM + 二级市场 + Community Incentive + DAO 治理拨付 + Team 已解锁等）→ Seat stake | ✅ **Genesis V2 设计意图** |
| 修订 GOV-04 或降低 `steward_stake_bps` 以消除张力 | ☐ **须 GOV-02 提案 · 不在 HAT-R1 范围** |

**HAT-R1 Phase A 测试设计：**

- 用 **多钱包 / 预置 TTG** 测 Seat stake — **不** 假设 Primary Market 单钱包可满 stake  
- GOV-04 cap **保持** 25k — 与 Seat min stake **并存** 为产品约束，非 bug

---

## 4. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-06-16 | 初版 · V1 六桶 + Country Shelf 叙事 |
| 2026-07-12 | **Genesis V2 对齐** — 取消 Shelf/顾问桶 · Seat = 自持 TTG 质押 · Public Sale 50% |
