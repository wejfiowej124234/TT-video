# TravelTrust Dashboard System v2

**固定入口：**

```bash
node scripts/dev/dashboard.cjs
# 或
bash scripts/dashboard.sh
```

---

## 三个驾驶舱（固定 · 不再扩框架）

| # | Dashboard | 命令 | 回答 |
|---|-----------|------|------|
| 1 | **Project** | `run-phase-dashboard.cjs` | 项目做到哪里了？ |
| 2 | **Web3** | `run-web3-dashboard.cjs` | Web3 生命周期跑到哪了？ |
| 3 | **Operations** | `run-operations-dashboard.cjs` | 用户旅程 UAT 测到哪了？ |
| 4 | **Deployment** | _Phase ② 末激活_ | 今天广播哪些合约？ |

---

## 原则：Status 而非 Percentage

**不再显示** Web3 35% · Admin 68% · Overall 61% 等估算百分比。

原因：Cert #8 等 Timelock 等待会让百分比长期不变，**不代表项目停滞**。

**改用：**

| 类型 | 值 |
|------|-----|
| Status | `PASS` · `IN_PROGRESS` · `BLOCKED` · `NOT_STARTED` |
| Open P0 / P1 | 真实计数 |
| Open Cert / Open Evidence | 真实计数 |

---

## Project Dashboard · 五层

1. **Executive** — Phase ①/②/③ Status only
2. **Sub-tracks** — ②-A…②-F Status + focus 标记
3. **TODAY** — Mission · Task · Blocked · ETA · Next · Owner
4. **Blockers** — P0/P1 逐项列出
5. **Real Metrics** — Open P0 · P1 · Cert · Evidence

---

## Web3 Dashboard · Lifecycle View

```text
TTG → Mint → Primary Market → Holder → Delegate → Vote
→ Queue → Execute → Treasury Spend → Region Steward → Stake
→ CountryPool → Profit → Claim → Archive
```

每个节点：`PASS` | `IN_PROGRESS` | `BLOCKED` | `NOT_STARTED`

---

## Operations Dashboard · User Journeys

- **Traveler:** Register → Wallet → Book → Escrow → Travel → Confirm → Review → Done
- **Guide:** Register → Identity → Stake → Accept → Travel → Settlement → Done
- **Merchant:** Register → Identity → Publish → Order → Settlement

UAT 按 Journey 逐步验证。

---

## Deployment Dashboard（未来）

**现在不做。** Phase ② 快结束时激活。

SSOT: `registry/deployment-dashboard.v1.yaml`

Wave 1 Governance/Escrow/Treasury · Wave 2 CountryPool · Wave 3 Mainnet

---

## 工作纪律（最重要）

1. **停止扩框架** — 治理文档/SSOT/Runbook/Dashboard 已足够丰富
2. **用 Dashboard 驱动每天工作**
3. **每完成一项 Cert / UAT / 部署验证 → 刷新 Dashboard**
4. **不增加新治理层**，除非出现无法表达的新需求

```bash
node scripts/dev/dashboard.cjs --refresh
```

---

## SSOT

- [`registry/phase-dashboard.v1.yaml`](../../registry/phase-dashboard.v1.yaml)
- [`registry/dashboard-config.v1.yaml`](../../registry/dashboard-config.v1.yaml)
- [`registry/deployment-dashboard.v1.yaml`](../../registry/deployment-dashboard.v1.yaml) _(future)_
