# Gate-2.3 实施任务卡索引

**阶段：** **① 本地纠偏 / 合约稳定性补强** · Gate-2.3 **仅** 本地前置审查 + Solidity 绿集

> **① 本地合约绿，不等于 ② Sepolia GO。**

**上位 SSOT：** [country-pool-settlement-gate2.3-projection-package-v1.md](../country-pool-settlement-gate2.3-projection-package-v1.md)  
**基线：** Gate-2.2 `76aff11c` · `evidence/GO_local_country_pool_net_profit_gate2.2/`

---

## ① 本地主线 vs 暂缓（写死）

| **Gate-2.3 ① 执行** | **暂缓至 ① 收口后** |
|----------------------|----------------------|
| G23-03 Funding Path FINAL | indexer 投影 / decoder 合入 |
| G23-01 `recordAccrualBatch` 评审与实现 | API 读面 / 新路由 |
| G23-02 Fuzz / Invariant | DB migration |
| G23-04 ABI / Event Freeze · Manifest | Dashboard / Admin 对账 UI |
| 每 PR：`CountryPoolNetProfit` + `FeeRouterTest` exit 0 | **Sepolia broadcast** · staging 部署 · **② GO** |

**② 测试网全链路接入** 须在 **① 本地四卡 merged + 主线收口** 之后，按 Gate-2.4 → Gate-3 顺序推进。
## 合并纪律（写死）

| 规则 | 说明 |
|------|------|
| **一卡一 PR** | 禁止把 batch + fuzz + funding + ABI 混进同一 PR |
| **每 PR 回归** | `forge test --match-contract CountryPoolNetProfit` + `FeeRouterTest` **exit 0** |
| **禁止跳阶** | Gate-2.4 Sepolia **须** G23-03 → G23-01 → G23-02 → G23-04 全部 merged |

---

## 实施顺序（推荐 · Funding Path 优先）

Funding Path 一旦变更，Batch 与 ABI 可能跟着变 — **须先冻结 G23-03**。

```text
G23-03 Funding Path Finalization
  ↓
G23-01 recordAccrualBatch
  ↓
G23-02 Fuzz & Invariant
  ↓
G23-04 ABI & Event Freeze
  ↓
Gate-2.4 Sepolia（Owner 授权 · 单独闸）
```

| 序 | 卡 ID | 分支建议 | 文档 |
|----|-------|----------|------|
| **1** | **G23-03** | `feature/g23-03-funding-path` | [G23-03-funding-path-finalization.md](G23-03-funding-path-finalization.md) |
| **2** | **G23-01** | `feature/g23-01-accrual-batch` | [G23-01-record-accrual-batch.md](G23-01-record-accrual-batch.md) |
| **3** | **G23-02** | `feature/g23-02-fuzz-invariant` | [G23-02-fuzz-invariant-suite.md](G23-02-fuzz-invariant-suite.md) |
| **4** | **G23-04** | `feature/g23-04-abi-event-freeze` | [G23-04-abi-event-freeze.md](G23-04-abi-event-freeze.md) |

---

## 每 PR 禁止范围（共通）

- indexer migration / API 路由 / DB schema
- Sepolia broadcast / staging 部署
- `recordAccrualBatch`（**仅 G23-01 PR** 允许）
- 修改 split 45/55 算法（**全 Gate-2.3 禁止**）
- ② GO / staging GO 宣称

---

## Gate-2.3 出口 → Gate-2.4 入口

四卡 **全部 DoD ☑** 后，方可启动 [Gate-2.4 Sepolia 前置](../country-pool-settlement-gate2.3-projection-package-v1.md#12-gate-24-sepolia-前置条件仅清单--禁止本包执行-broadcast)（G24-P-01～11）。
