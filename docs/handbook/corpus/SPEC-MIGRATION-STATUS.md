# SPEC-MIGRATION-STATUS（P-A～P-D · 删 `docs/spec` 前置登记）

Version: v0.1.0

> **SSOT（必读）**：本文件为 **corpus 登记态**（**P-C 真源之一**），**不**替代 **04 §3.4 / 93 / 14 / 07** 契约正文；与 **[engineering/08 §2](../engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-claim-table)**、**[盘点 §7](../../spec-path-dependency-migration-inventory.md#inv-per-path-delete-keep)** 同轮对读。**engineering/** 导读边界见 **[spec/00 读前](../../spec/00-文档索引.md)**。

**冻结声明（与工程约定对齐）**：在 **GitHub Actions 计费/配额恢复前**，仓库默认 **冻结** 工程合入与 PR 扩面；本 STATUS 仅承载 **书面证据链** 与 **Owner 可勾选** 字段，**不**宣称 **CI 全绿** 或 **`git rm docs/spec/...` 已执行**。

---

<a id="status-p-a"></a>

## P-A — 盘点与 registry 双真源

| 勾选 | 条件 |
|------|------|
| - [ ] | **[盘点 §7](../../spec-path-dependency-migration-inventory.md#inv-per-path-delete-keep)** 逐路径表与 **`registry/spec-path-dependencies.v1.yaml`** 同类 **A/B/C** 标注 **无互斥**（发现互斥先修盘点/YAML，再回写本节）。 |
| - [ ] | **`python registry/validate-spec-path-dependencies-registry.py`** 本地 **exit 0**（CI 冻结期仍须在合入删径 PR 前本地跑通）。 |

<a id="status-p-b"></a>

## P-B — 08 §3 / 09 §3 矩阵同 PR 对拍

| 勾选 | 条件 |
|------|------|
| - [ ] | **[engineering/08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix)**「删除 spec 可核验列」与 **engineering/09 §3**（若仓库已检出）**行级一致**；或 **书面声明** 09 尚未检出、仅以 08+盘点为冻结期真源（须 Owner 签字域勾选）。 |

<a id="status-p-c"></a>

## P-C — 脚本 / workflow 硬编码路径清零（对盘点 §2/§3）

| 勾选 | 条件 |
|------|------|
| - [ ] | 对 **[盘点](../spec-path-dependency-migration-inventory.md)** **§2、§3** 所列 **consumers**，**不存在**指向拟删 **`docs/spec/...`** 的 **孤立硬编码**；已迁 **registry/derived** 或 **manifest** 的路径须在 STATUS 备注列登记 **回滚锚**。 |

<a id="status-p-d"></a>

## P-D — Owner 收口（删径 PR 闸门）

| 勾选 | 条件 |
|------|------|
| - [ ] | **[96-索引 · Owner 勾选](../../spec/96-索引-全链路外生产验收分册.md#spec-delete-closure-owner)** 与 **本节 P-A～P-C** 同步为 **全勾选**。 |
| - [ ] | **98 §2** 主张表对拟删路径族给出 **保留/可迁/禁止删** 结论，且与 **08 §2 五条件** 无矛盾。 |

---

<a id="status-per-path-rows"></a>

## 逐路径登记行（与盘点 §7 / 08 §3.1 对拍）

**填法**：每行对应盘点 **§7** 一条聚合路径或闸门族；`STATUS 行 id` 与 **08 §3.1** `#mig-3-1-…` 锚 **同键**。

| STATUS 行 id | 路径或闸门族（摘要） | 默认 disposition | 08 §3.1 锚 | 98 §2 桶 | Owner ☐ |
|---------------|----------------------|------------------|------------|-----------|----------|
| `mig-3-1-gate-04-routes` | `check-04-*` / 04 §3.4 机读窗 | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-04-routes) | 法定壳 | - [ ] |
| `mig-3-1-gate-07-08` | `check-07-version-triple` / `check-08-*` | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-07-08) | 法定壳 | - [ ] |
| `mig-3-1-gate-wave` | `check-wave-phase-files` / `{NNN}-*.md` | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-wave) | 法定壳 | - [ ] |
| `mig-3-1-gate-govlink` | `check-governance-doc-linkage` 族 | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-govlink) | 法定壳 | - [ ] |
| `mig-3-1-gate-96-18` | `tt-9618-onboarding-pg-evidence` / 96-18 | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-96-18) | 法定壳 | - [ ] |
| `mig-3-1-derive-93-96` | 93 §5 / 96 分册 **派生 JSON（B）** | **正文仍在 spec**；生成物可迁 | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-derive-93-96) | 双写 / registry | - [ ] |
| `mig-3-1-subtree-arch` | `27-archived/`、`code-maps/`、`snapshots/` | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-subtree-arch) | 考古子树 | - [ ] |

**维护**：新增 **scripts/workflows** 硬编码 **`docs/spec/`** 时，须先更新 **[盘点 §2/§3](../spec-path-dependency-migration-inventory.md)** 与 **registry**，再在本表增行。
