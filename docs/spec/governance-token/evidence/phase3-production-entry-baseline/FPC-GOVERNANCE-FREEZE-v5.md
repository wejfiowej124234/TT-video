# FPC Governance · FREEZE（v5 · 治理冻结）

**Status:** **FROZEN**  
**Frozen UTC:** 2026-07-09  
**Framework version:** FPC-100 **v5**  
**Unlock:** **P0 defect in governance itself** · **explicit Version Upgrade (v6+)** only

---

## 两条线（写死）

| 线 | 名称 | 状态 | 日常投入 |
|----|------|------|----------|
| **① Governance** | FPC Framework · Registry · Governance docs · Dashboard schema | **FROZEN @ v5** | **不动** — 除非 P0 或 Version Upgrade |
| **② Execution** | B00 → B01 → … → B41 · Evidence · Fixes · Dashboard refresh | **ACTIVE** | **主要时间在这里** |

**禁止 Framework Inflation：** B41 完成前 **不得** 新增治理模块、新 pillar、新 batch 类型。  
**v5 最终执行纪律（已纳入 freeze）：** No Batch Skip · Burn-down · `TT_RELEASE_READINESS` · 每日一批 rhythm。

---

## No Batch Skip Policy（最终纪律）

```
B00 → B01 → B02 → … → B41
```

**禁止：** B01 → B04 → B18 → B02 跳跃执行。

| 检查 | 路径 |
|------|------|
| Sequence SSOT | `registry/full-production-certification-checklist.v1.yaml` · `execution_sequence` |
| Script | `scripts/dev/check-fpc-no-batch-skip.cjs` |
| Batch runner | 必须先 `assertCanRun(batchId)` |

---

## Owner 每日唯一数字

**`TT_RELEASE_READINESS`** = 从 B00 起连续 PASS 前缀 / 41 × 100%

Dashboard **Burn-down：** Completed · Remaining · Next Batch

**每日 rhythm：** 1 Batch → refresh Dashboard → Commit → **`finalize-fpc-batch-dod.cjs`** → 仅 DoD 全满足才 PASS

**核心原则：** *Feature Freeze does not mean Release Ready.* — 功能冻结不代表可以发布；发布资格只能通过完整的认证证据获得。

---

## 允许变更（Execution 线）

- 执行 Batch · 写入 `FPC-100-BATCH-{id}-LATEST.json`
- 收集 Evidence · 修复 P0/P1 发现
- 刷新 Dashboard · Page matrix 逐页填卡
- Risk register **状态更新**（ACCEPTED/CLOSED）— 非结构变更
- Change Impact map **追加路径规则** — 仅当新 batch 已存在于 v5 registry

---

## 禁止变更（Governance 线 · 至 B41 或 v6）

- 新增 FPC 层级 / 新 certification 维度
- 改 batch 清单结构 / 重编号
- 改 Release Decision 枚举
- 改 Traceability 链顺序
- 大规模重写 governance 文档（ typo / P0 修正除外）

---

## Version Upgrade 流程（future v6+）

1. Owner 书面 **Version Upgrade** 决策  
2. 新 registry `version: 6` + 迁移说明  
3. 旧 v5 release_history 行 **只读保留**  
4. 受影响 batches re-cert

---

## SSOT 锚点（v5 freeze commit）

| 文件 | 角色 |
|------|------|
| `registry/full-production-certification-checklist.v1.yaml` | Machine registry v5 |
| `FPC-CERTIFICATION-GOVERNANCE-v1.md` | Governance rules |
| `FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md` | Human checklist v5 |
| `FPC-GOVERNANCE-FREEZE-v5.md` | **本文件** |
| `registry/fpc-100-version-registry.v1.yaml` | Version history |
| `registry/fpc-100-change-impact-map.v1.json` | Scoped invalidation |
| `registry/fpc-100-risk-register.v1.yaml` | Risks |

**下一工作：** Execution — **B01 Public Surface** → B02 … → B41
