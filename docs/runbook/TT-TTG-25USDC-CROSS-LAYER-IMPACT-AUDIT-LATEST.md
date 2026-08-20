# TTG $25 · Cross-layer Impact Audit · LATEST

**Stamp:** `2026-08-14T15:00:00Z`  
**Parent:** [`TT-TTG-25USDC-GLOBAL-ECONOMIC-CONVERGENCE-LATEST.md`](./TT-TTG-25USDC-GLOBAL-ECONOMIC-CONVERGENCE-LATEST.md)  
**`TT_PRODUCTION_GO`:** `NO_GO`  
**Scope:** Read-only impact · **no** Mainnet mutate this wave

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Nail（审计前提）

| 问题 | 结论 |
|------|------|
| Unified Primary Acquisition Price $25？ | **YES** · Public Sale + Steward 经济名义 |
| R1/R2/R3 同价？ | **YES** |
| RMB 进链？ | **NO** · display-only |

---

## Impact matrix

| 层 | 现状 | 影响 | 本轨处置 | Class after non-chain work |
|----|------|------|----------|------------------------------|
| **Final Truth / FTB** | Money Path / PM proxy pins | PM **price** 与经济真源冲突；地址可不动 | 登记 CONFLICT · 不改 FTB 地址表 | `PRICE_LANE_OPEN` |
| **PSG-EGM / Candidate v2** | Sepolia/demo 旁路 | 测试网默认 `1e18` 定价 | 文档标注 SUPERSEDED for Official economics | note only |
| **Constitution / Tokenomics** | Genesis 15/5/30/50 · GOV-04 caps | 供应/轮次硬顶 **不变**；单价变 | 更新参考价 SSOT · FREEZE 节加 $25 | SSOT rewrite |
| **Public Sale 三轮** | Caps 800k/1.2M/3M · min 10 USDC | 单价统一 $25 · cap 不变 | Registry + 合约审计 | READY_WAITING_EXECUTE |
| **Region Steward** | Seat bps → TTG lock | Funding USD = TTG×25 | 募资表改 USD 同比 | SSOT rewrite |
| **Registry** | vesting / mainnet / asset denom | 缺 `usdc_per_ttg=25` | 增机读键 | Registry patch |
| **PrimaryMarket Solidity** | immutable `ttgPerUsdcUnit=1e18` | **必须**新 impl 构造参数 `4e16` | 审计+correction pack · **禁**本波 upgrade | WAITING_GOV |
| **Proxy / upgradeability** | TimelockUpgradeableProxy | immutables **不在 storage** · 须 **upgradeTo(newImpl)** | 包内写清 · 禁 execute | WAITING_AUTH |
| **API quote** | Mock ~27.78 from CNY | 改候选 **25** · Live 读链仍旧 | 双面：candidate vs live | PRODUCT_READY_WAITING_RUNTIME |
| **DB / Indexer** | Purchased 事件投影 | 金额对拍公式变 | 验真器用 10→0.4 | 测试/工具 |
| **Homepage / Governance UI** | Mock Swap / 募资表 CNY | Mock 可跟 $25；Official Live 禁提前宣称 | 文案 `pending_switch` | PRODUCT_READY_WAITING_RUNTIME |
| **Admin / i18n** | CNY/TTG 文案 | 加 USDC 锚 · CNY 展示可选 | i18n 批次 | same |
| **Tests** | forge 钉 `1 ether` | 新测 `4e16` · 10 USDC→0.4 TTG | 加 correction tests | UNIT/FORK local |
| **CI-02 / #3** | 并行等待 | **零耦合** | 禁止混轨 | ORTHOGONAL |

---

## Drift / Conflict

| ID | 描述 | Severity |
|----|------|----------|
| **PMC-01** | Live Mainnet PM `1e18` ≠ Owner $25 | **BLOCKING** for economic GO · not for CI-02 |
| **PMC-02** | Docs/FE Mock still CNY-200 / 27.78 in places | P1 · rewrite this track |
| **PMC-03** | Fundraise CNY wan ≠ Seat×$25 USD table | P1 · replace with USD formula |
| **PMC-04** | Deploy scripts default `1 ether` | P1 · change defaults for **new** deploys only |

---

## Expected Difference（CONFIRM · 不修成一致）

| 项 | 说明 |
|----|------|
| Seat TTG vs Country Pool 认购 USDC | 仍可产品上分轨；本决策只统一 **单价 $25** |
| Legacy 10→10 Reality 证据 | 永久保留 · class SUPERSEDED |

---

## STOP

审计 **ACTIVE**。下一步真源改写 + `PRIMARY_MARKET_PRICE_CORRECTION_PACKAGE` · **无**链上 execute。
