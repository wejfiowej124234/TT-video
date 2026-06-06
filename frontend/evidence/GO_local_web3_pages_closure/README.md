# GO_local_web3_pages_closure · ① Web3 页面总收口（2026-06-03）

**阶段：① 本地** — 全站 **链上 / Escrow / 质押 / 治理 / 支付 Hub** 等 Web3 相关页面的 **确认 · 检查 · 收口 · 冻结** 总索引。  
**非本包：** ② 测试网真链 / staging `release_gate=GO`、③ 生产 PSP / 主网 Production GO。

**今日任务入口：** [`WEB3-PAGES-PHASE1-INVENTORY.md`](./WEB3-PAGES-PHASE1-INVENTORY.md)

**四页代码/UI 真源（2026-06-03）：** [`LANDING-MARKET-PAGES-CODE-SSOT.md`](./LANDING-MARKET-PAGES-CODE-SSOT.md) — **`/`** · **`/market`** · **`/market/provider`** · **`/market/acquisition`**

---

## 子文档（按域）

| 文档 | 路由 / 域 |
|------|-------------|
| [`WEB3-PAGES-PHASE1-INVENTORY.md`](./WEB3-PAGES-PHASE1-INVENTORY.md) | **全表** · 冻结态 · 绿集 · 诚实边界 |
| **[`LANDING-MARKET-PAGES-CODE-SSOT.md`](./LANDING-MARKET-PAGES-CODE-SSOT.md)** | **`/` + 三页市场** 代码/UI/功能/设计 **真源** |
| [`PAY-HUB-PHASE1-CLOSURE.md`](./PAY-HUB-PHASE1-CLOSURE.md) | `/pay` |
| [`STAKING-PHASE1-CLOSURE.md`](./STAKING-PHASE1-CLOSURE.md) | `/staking` |
| [`GOVERNANCE-PAGES-PHASE1-CLOSURE.md`](./GOVERNANCE-PAGES-PHASE1-CLOSURE.md) | `/governance/*` |
| [`ESCROW-ONCHAIN-RATE-STATUS.md`](./ESCROW-ONCHAIN-RATE-STATUS.md) | 已上链 Escrow 壳 · `/escrow/[id]/rate`（**未 UI 冻结**） |
| **[`WEB3-LANDING-MARKET-LOCAL-REMAINING.md`](./WEB3-LANDING-MARKET-LOCAL-REMAINING.md)** | **`/` + 三页市场** ① 剩余诚实清单 · ②/③ 索引 |
| **[`WEB3-HOME-PHASE2-BACKLOG.md`](./WEB3-HOME-PHASE2-BACKLOG.md)** | **`/`** Web3旅行 Phase **②** **WEB3-P2-001～012** · **③** **WEB3-P3-001～006** |
| **[`TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md`](./TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md)** | **`/traveltrust`** 网络叙事 Phase **②** **TTNET-P2-001～008** · **③** **TTNET-P3-001～004** |
| **[`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md`](./MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md)** | **`/market` · `/market/provider` · `/market/acquisition`** 三页筛选 Phase **②** **MKT-FILT-P2-001～012** · **③** **MKT-FILT-P3-001～005** |

**已有 SSOT（互指，不重复）：**

- 创新行程 · Escrow 草稿：[`GO_local_web3_itinerary_l5`](../GO_local_web3_itinerary_l5/README.md)
- 订单列表 · Pay 走廊：[`GO_local_orders_l5`](../GO_local_orders_l5/README.md)
- 五主路由 UI：[`FIVE-MAIN-ROUTES-PHASE1-FREEZE`](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)
- 身份入驻：[`GUIDE-REGISTER-UI-FREEZE`](../GO_local_auth_l5/GUIDE-REGISTER-UI-FREEZE.md) · [`PROVIDER-REGISTER-UI-FREEZE`](../GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) · [`STEWARD-REGISTER-UI-FREEZE`](../GO_local_steward_register_closure/STEWARD-REGISTER-UI-FREEZE.md) · [`ME-IDENTITIES-UI-FREEZE`](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)

---

## ① 一键绿集（推送前 · 须 exit 0）

```bash
bash scripts/dev/run-web3-itinerary-l5-green.sh
bash scripts/dev/run-orders-l5-green.sh
bash scripts/gates/governance-matrix-local-gate.sh
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh
```

末行：`TT_WEB3_ITINERARY_L5_GREEN: OK` · `TT_ORDERS_L5_GREEN: OK` · `TT_GOVERNANCE_MATRIX_LOCAL_GATE_SUMMARY: OK`
