# 08 — 文档与 spec 迁移台账（engineering）

> **SSOT（必读）**：**`engineering/`** 仅为导读，**不**替代 **04 §3.4、93、14、07** 及 **代码与脚本门禁**（与 **CONTRIBUTING**、**spec/00 读前** 同键）。**执行** `git rm docs/spec/...` **须** **[§2 五条件](#mig-delete-policy)** + **[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)** + **[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)** + **[盘点 §7](../../spec-path-dependency-migration-inventory.md#inv-per-path-delete-keep)** + **CI/链接** **同批**。

**三处对拍提醒**：若仓库后续合入完整 **`docs/handbook/00-手册总览与编制规范.md`** 与 **`engineering/README.md`** 主序全表，须将 **本文档** 与 **SPEC-MIGRATION-STATUS** 纳入 **手册 00 §3** / **engineering/README** 行级登记（**HB-PROD-DOC-TRIPLE-SYNC**）。

---

<a id="mig-delete-policy"></a>

## §2 执行删除 `docs/spec/` 的五条件（摘要真源）

1. **契约与索引不降级**：删径后 **HTTP/ABI/矩阵** 仍指向 **单一真源**（默认 **spec 内 A 类** 或已公示的 **兼容壳**）。  
2. **P-C 完成**：**[STATUS · P-C](../corpus/SPEC-MIGRATION-STATUS.md#status-p-c)** — 无孤立硬编码指向被删路径。  
3. **98 主张一致**：**[98 §2 · 主张表](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-claim-table)** 对该路径族标记 **非「须保留 spec」** 或已完成 **迁出 + 双跑**。  
4. **96 / go-live 链路**：**[96-索引 · Owner 勾选](../../spec/96-索引-全链路外生产验收分册.md#spec-delete-closure-owner)** 与发版/全链路外声明 **无冲突**。  
5. **同 PR 证据**：**盘点 §7**、**registry**、**STATUS 逐路径行** 同一 PR 可复核。

---

<a id="mig-2-matrix"></a>

## §3 迁移台账矩阵（簇态 × 「删 spec」可核验列）

| 簇（盘点口径） | 代表路径 / 闸门 | handbook 导读承接 | `delete_spec` 列（书面） | 与 **09 §3** 对拍 |
|----------------|-----------------|---------------------|---------------------------|-------------------|
| 路由 / API 机读 | `04-后端与API.md` 等 | `engineering` 域篇链 **04** | **禁止删正文** | 须 **同 PR** |
| 07 / 00 版本与 08-3/4 | `07`/`00`/`08-3`/`08-4` | 台账 + runbook | **禁止删** | 须 **同 PR** |
| 阶段文存在性 | `{NNN}-*.md` glob | Wave 导读 | **禁止删号段壳** | 须 **同 PR** |
| 93 / 96 派生 | 93 §5、96 分册列表 | registry **derived** | **仅可迁生成物**；正文 **A** | 须 **同 PR** |
| 考古子树 | `27-archived/`、`code-maps/`、`snapshots/` | 审计导读 | **禁止删**（除非单独立项迁考古） | 书面立项 |

---

<a id="mig-3-1-per-path-evidence"></a>

### §3.1 逐路径「可删 / 须保留」证据链（与盘点 §7 对键）

以下锚 **id** 与 **[SPEC-MIGRATION-STATUS · 逐路径登记行](../corpus/SPEC-MIGRATION-STATUS.md#status-per-path-rows)**、`STATUS 行 id` **一一对应**。

<a id="mig-3-1-gate-04-routes"></a>
#### `mig-3-1-gate-04-routes` — 04 机读窗与路由闸门族

- **Disposition**：**须保留 `docs/spec/04-后端与API.md`（A）**  
- **证据**：盘点 **[§2.1](../spec-path-dependency-migration-inventory.md#21-路由与表结构机读强依赖-a)**；**registry** `spec-04-routes` 类条目。  
- **互指**：**98** 法定壳桶；**96-索引** Hub 行「契约单源」。

<a id="mig-3-1-gate-07-08"></a>
#### `mig-3-1-gate-07-08` — 07 三线 / 08-3 / 08-4

- **Disposition**：**须保留 spec（A）**  
- **证据**：盘点 **[§2.2](../spec-path-dependency-migration-inventory.md#22-版本与-08-机读对强依赖-a)**。  

<a id="mig-3-1-gate-wave"></a>
#### `mig-3-1-gate-wave` — 阶段文 glob

- **Disposition**：**须保留 spec（A）**；删号段须先改 **00 主表 + 闸门允许集**  
- **证据**：盘点 **[§2.3](../spec-path-dependency-migration-inventory.md#23-阶段文件存在性强依赖-a--目录约定)**；registry `spec-wave-phase-nnn-glob`。

<a id="mig-3-1-gate-govlink"></a>
#### `mig-3-1-gate-govlink` — 治理文档联动

- **Disposition**：**须保留 spec（A）**  
- **证据**：盘点 **[§2.4](../spec-path-dependency-migration-inventory.md#24-治理文档联动强依赖-a)**。

<a id="mig-3-1-gate-96-18"></a>
#### `mig-3-1-gate-96-18` — 96-18 / TT-9618 链

- **Disposition**：**须保留 `docs/spec/96-18-未完成清单与多维检查.md`（A）**  
- **证据**：registry `spec-96-18-backlog`；**96-索引** Declaration 与 **README/TT-9618** 互指。

<a id="mig-3-1-derive-93-96"></a>
#### `mig-3-1-derive-93-96` — 93 §5 / 96 分册路径 **派生 JSON（B）**

- **Disposition**：**表体/正文保留 spec**；**派生清单** 可迁 **`registry/derived/*`**，须 **双跑** 通过后再切换默认读 manifest。  
- **证据**：盘点 **[§2.1–2.3](../spec-path-dependency-migration-inventory.md)** 与 registry `derive-93-section5-routes`、`derive-96-booklets-paths`。

<a id="mig-3-1-subtree-arch"></a>
#### `mig-3-1-subtree-arch` — `27-archived/`、`code-maps/`、`snapshots/`

- **Disposition**：**须保留 spec（A）**；删整子树 **单独立项**  
- **证据**：盘点 **§2.5–2.6**（`27-archived` / `code-maps` / `snapshots` 行）；registry `spec-27-archived-subtree`、`spec-code-maps-subtree`、`spec-snapshots-subtree`。

---

**变更记录**：见仓库 PR 说明；**Version 三线**若 bump **07** 须遵守 **`check-07-version-triple`**（与 **07** 文内纪律同读）。
