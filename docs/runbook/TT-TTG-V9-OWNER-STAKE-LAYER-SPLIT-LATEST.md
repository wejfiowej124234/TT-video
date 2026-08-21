# TT · TTG V9 — Owner Lock: Stake Layer Split (Steward TTG ≠ Guide/Merchant USDC)

**STATUS:** `V9_OWNER_STAKE_LAYER_SPLIT_LOCKED` · Owner 2026-08-21  
**Upstream:** [Documentation Truth Baseline](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · [Fee vs Role Stake](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md) · [Design Lock](TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md)  
**Machine:** [`V9_OWNER_STAKE_LAYER_SPLIT_LOCKED.json`](../../evidence/GO_ttg_v9_audit/V9_OWNER_STAKE_LAYER_SPLIT_LOCKED.json)

**Does not:** redeploy Phase1 · enable Merchant/Guide RoleStake · flip `TT_PRODUCTION_GO` · mutate Official www this turn

---

## Locked three-layer split（写死）

| Layer | Asset | Who | Purpose |
|-------|-------|-----|---------|
| **A · TTG Seat / Role Stake** | **TTG** | **区域主理人 only** | 区域席位责任与治理约束 · 十国 `steward_stake_bps` × live `totalSupply()` |
| **B · USDC Identity / Order Risk Stake** | **USDC** | **向导 / 商家** | 履约风险保证 · 违约优先扣此押（81 Identity 池） |
| **C · Escrow** | 订单结算币 | 旅行者↔供给方 | 订单本金与争议结算 · 与 A/B **正交** |

**Forbidden mix:** 把「主理人 TTG 质押」写成向导/商家履约保证金；把 FeeRouter `globalStakers` 当成供给侧质押；订单违约默认 slash TTG。

---

## Merchant / Guide TTG RoleStake（收紧）

| 项 | Lock |
|----|------|
| Status | **`NOT_REQUIRED` / `DISABLED`** |
| Default backlog | **否** — 不再当「未来必做 TBD」 |
| Re-open | **仅** Owner 另开治理升级书面授权 |
| Phase1 contracts | **不必**为开启 M/G TTG 而重部署或修改 |
| 履约约束 | **只**走 USDC Identity / Order Risk + Escrow dispute/slash |

合约 `TtgV9RoleStakePool` 可保留 `RoleId.Merchant` / `Guide` 开关位（现为 false）作工程壳；**产品与文档不得再默认规划开启。**

---

## Steward（不变）

- TTG Seat ACTIVE · 国家分级 bps · 退出日历仍 protocol-ssot（24月 / 180天通知 / 90天 delay / 365天 vest）
- 准入费 300k USDC **正交**于 TTG Seat

---

## Downstream must cite

官网 / 白皮书 / Admin / GitHub Official / 合约导读：三层分表；Merchant/Guide = **NOT_REQUIRED · DISABLED · 非默认待办**。
