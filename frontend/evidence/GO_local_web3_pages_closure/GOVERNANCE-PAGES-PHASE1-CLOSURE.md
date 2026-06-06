# `/governance/*` · Phase ① 收口（2026-06-03）

**阶段：① 本地** — 链上治理控制台 **9+ 子路由** · **C-GOV-001～011** 契约切片；**不**表示 ② Timelock 全链闭环 GO、③ 主网 DAO Production GO。

**代码真源：** `frontend/app/governance/**` · **89** · **83 附录 I.0** · **04 §3.4**

**与五主路由关系：** [`FIVE-MAIN-ROUTES-PHASE1-FREEZE`](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) — **治理层允许** 数据链路 / `data_source` / `is_chain_ssot` 真值；**不在** 五主 marketing token 禁改表内。

---

## 子路由收口表

| 路由 | 职责 | 矩阵行 |
|------|------|--------|
| `/governance` | Hub · pool/rewards 只读叙事 | C-GOV-001 |
| `/governance/proposals` | 提案列表 | C-GOV-002 |
| `/governance/proposals/[id]` | 提案详情 · 投票 | C-GOV-003 · 004 |
| `/governance/delegate` | 委托 | C-GOV-005 |
| `/governance/params` | 84 参数只读 | C-GOV-011 |
| `/governance/fee-routes` | Fee 路由事件 | C-GOV-007 |
| `/governance/vault-forwards` | Vault forwards | C-GOV-008 |
| `/governance/distribution-accruals` · `[id]` | 应计只读 | C-GOV-009 |
| `/governance/distribution-claim` | 钱包 Claim 写 | C-GOV-010 |

**Epic A 伴生：** proposal 执行态只读 UX — `governance-matrix-local-gate.v1.json` **`epic_a_companion`**

---

## 收口结论（ACTIVE）

| 维度 | 状态 |
|------|------|
| **Hub 单壳** | `GovernanceHubPageMain` + model 测试（ENTERPRISE-AUDIT 2026-05-26） |
| **真值标签** | `data_source` / `is_chain_ssot` — **禁止** 投影 Σ 冒充链上 SSOT |
| **UI 冻结** | **非** 五主 L0 token 级冻结；**Phase ① 维护期** — 仅 Epic A / 矩阵契约允许的功能接线 |
| **Claim 页** | 用户钱包 `claim`；**不** UI 封装 owner `registerAccrual` |

---

## 机读验收（须 exit 0）

```bash
bash scripts/gates/governance-matrix-local-gate.sh
# 或 frontend: npm run gate:governance-matrix
```

映射：[`governance-matrix-local-gate.v1.json`](../GO_local_marketing_front_closure/governance-matrix-local-gate.v1.json)

末行：`TT_GOVERNANCE_MATRIX_LOCAL_GATE_SUMMARY: OK phase=local-1 matrix=93-C-GOV-slice`

**2026-06-03：** exit 0 · 19 files · 65 tests

---

## 诚实边界

| 可宣称（①） | 禁止冒充 |
|-------------|----------|
| 矩阵闸契约切片 + Hub 单壳 | ② B-428 全闭环 treasury 已验 |
| 只读页不伪造链上状态 | ③ 主网 Governor 执行 GO |

**② 参考：** [TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001](../../../docs/runbook/TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001.md)
