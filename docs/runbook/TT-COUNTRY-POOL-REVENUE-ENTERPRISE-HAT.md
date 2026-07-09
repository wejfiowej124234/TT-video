# TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT

**Audit ID:** `TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT`  
**Phase:** **② Sepolia** · DE pilot · **≠ ③ Production GO**  
**Blocks:** `HAT_R1_PHASE_B` until **四账一致 PASS** + **Enterprise HAT L9 recheck PASS**

---

## 审计顺序（九步 · 每步五层证据）

| Step | 链路节点 | 五层 |
|------|----------|------|
| 1 | 利润产生 → accrual / epoch | page · tx · events · API · DB |
| 2 | NetProfit Ledger 配置 | 同上 |
| 3 | 45/55 Split | 同上 |
| 4 | StewardPathVault | 同上 |
| 5 | Global Treasury（Timelock） | 同上 |
| 6 | API 读面 | 同上 |
| 7 | DB 快照 | 同上 |
| 8 | 前端 `/governance/params` · distribution · claim | 同上 |
| 9 | Claim 路径边界（steward vs investor） | 同上 |

**四账一致：** 链上 · API · DB · 页面 — 见 `four-ledger-reconcile.json`。

---

## 基线（GovFreeze V2 · 只读）

| 组件 | DE Sepolia |
|------|------------|
| NetProfit Ledger | `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS` |
| StewardPathVault | `COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS` |
| UnallocatedStewardVault | `COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS` |
| Settlement token | `COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS` |
| Registry | `config/jurisdiction_country_pool_net_profit.sepolia.json` |

Env SSOT: `scripts/dev/.env.phase2-chain-deploy.local`

---

## 已知 blocker（L9 同源）

**API env 优先级：** `crates/api/src/chain/mod.rs` 先读 `COUNTRY_POOL_LEDGER_ADDRESS`，再 fallback `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS`。若 legacy P5 pilot 地址仍设置，则 `GET /api/v1/governance/country-ledger/DE` **≠** NetProfit 链上读面。

**修复（② · 非 GOV 参数变更）：** 取消 legacy 或令两 env 同址 → 重启 API → 重跑本 HAT。

**Split 未演练：** Sepolia DE 若无 `SPLIT_COMPLETED` epoch，四账 verdict 为 **FAIL**（需 Owner 授权 accrue/split 演练 tx，不修改 GovFreeze GOV 参数）。

**Global Treasury 未对齐 V2 Timelock：** NetProfit Ledger 上 `globalTreasury()` 仍可能指向 **legacy Timelock**（`0x0359…`），与 GovFreeze V2 `TIMELOCK_ADDRESS`（`0x904a…`）不一致 — 须治理/部署 cutover 修正（**非** GOV 参数 freeze 范围内的 UI 文案变更）。

**API Session Gate：** `GET /api/v1/governance/country-ledger/DE` 在 `STRICT_SESSION_GATE=1` 时需 Bearer session — 审计时须带 token 或专用 read-only 闸。

---

## 命令

```bash
bash scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh
bash scripts/dev/run-tt-country-pool-revenue-enterprise-hat.sh
bash scripts/dev/run-tt-country-pool-revenue-enterprise-hat.sh --skip-playwright

# four_ledger PASS 后
bash scripts/dev/run-enterprise-hat-l9-recheck.sh
export HAT_R1_PHASE_B_PAUSED=0   # Owner 确认
bash scripts/dev/run-hat-r1-phase-b-when-ready.sh --dry-run
```

证据根目录: `evidence/GO_tt_country_pool_revenue_enterprise_hat/<stamp>/`

---

## Phase B 解除条件

1. `four-ledger-reconcile.json` → `verdict: PASS`
2. `run-enterprise-hat-l9-recheck.sh` → `TT_ENTERPRISE_HAT_L9_RECHECK_SUMMARY: PASS`
3. `export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1`
4. `export HAT_R1_PHASE_B_PAUSED=0`
5. Timelock elapsed → `run-hat-r1-phase-b-when-ready.sh`

**诚实边界：** 本 HAT **②** 四账一致 **≠** staging 全矩阵 GO **≠** ③ Production GO。
