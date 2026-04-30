# 08 — 文档与 spec 迁移台账（engineering）

Version: v0.1.1

**工程验证段**：变更本台账时建议本地跑 `bash scripts/gates/run-check-04-routes.sh` 与 **04 §3.4** 机读契约同链。

> **SSOT（必读）**：**`engineering/`** 仅为导读，**不**替代 **04 §3.4、93、14、07** 及 **代码与脚本门禁**（与 **CONTRIBUTING**、**spec/00 读前** 同键）。**执行** `git rm docs/spec/...` **须** **[§2 五条件](#mig-delete-policy)** + **[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)** + **[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)** + **[盘点 §7](../../spec-path-dependency-migration-inventory.md#inv-per-path-delete-keep)** + **CI/链接** **同批**。

**三处对拍提醒**：若仓库后续合入完整 **`docs/handbook/00-手册总览与编制规范.md`** 与 **`engineering/README.md`** 主序全表，须将 **本文档** 与 **SPEC-MIGRATION-STATUS** 纳入 **手册 00 §3** / **engineering/README** 行级登记（**HB-PROD-DOC-TRIPLE-SYNC**）。

---

<a id="mig-delete-policy"></a>

## §2 执行删除 `docs/spec/` 的五条件（摘要真源）

1. **契约与索引不降级**：删径后 **HTTP/ABI/矩阵** 仍指向 **单一真源**（默认 **spec 内 A 类** 或已公示的 **兼容壳**）。  
2. **P-C 完成**：**[STATUS · P-C](../corpus/SPEC-MIGRATION-STATUS.md#status-p-c)** — 无孤立硬编码指向被删路径。  
3. **98 主张一致**：**[98 §2.2 桶表](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-claim-table)** 与 **[98 §2.1 细目](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items)** 对该路径族 **无互斥**；凡 **§2.1** 已勾行，**§2.2** 桶结论须可推导。  
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

<a id="mig-3-1-c-pd-line-items"></a>

### §3.1c P-D 扩面 — 逐路径「可删 / 保留」细目（Owner 判定）

**纪律**：本节 **不** 改 **registry / 门禁脚本**；仅扩写 **P-D** 可勾选对象。行键 **`pd-*`** 与 **[98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items)** **同序同键**；回填 **[STATUS · 逐路径登记行](../corpus/SPEC-MIGRATION-STATUS.md#status-per-path-rows)** 时，可将 `pd-*` **合并**为既有 `mig-3-1-*` 行或 **增行**（须 **同 PR** 对拍盘点 §7）。

| 行键 | `docs/spec/` 路径或对象（摘要） | 默认识别（删径语义） | Owner 判定（☐ 已读 + 已决） | 互指 |
|------|----------------------------------|----------------------|-----------------------------|------|
| `pd-00-chaining` | `00-文档体系与阅读串联.md` | **须保留**兼容壳至闸门/锚同改 | - [ ] | 98 **T4**；registry `spec-00-doc-chaining-legacy` |
| `pd-00-module-master` | `00-最终版架构图对应模块清单总表.md` | **须保留**（治理 grep 链） | - [ ] | 98 **T1**；盘点 §2.4 |
| `pd-gap-official` | `缺口与待补-官方总表.md` | **须保留** | - [ ] | 98 **T1**；go-live / B-421 互指 |
| `pd-82` | `82-治理币-文档总览.md` | **须保留** | - [ ] | 98 **T1**；governance-token 链 |
| `pd-83` | `83-区域治理与收益分配-协议白皮书.md` | **须保留** | - [ ] | 98 **T1** |
| `pd-84` | `84-第一阶段10国Country-Pool发行参数总表.md` | **须保留** | - [ ] | 98 **T1** |
| `pd-govtoken-subtree` | `governance-token/**` | **须保留**子树 | - [ ] | 98 **T1**；registry `spec-governance-token-subtree` |
| `pd-08-4-feerouter` | `08-4-附录-收益流闭环图-FeeRouter-Target.md` | **须保留** | - [ ] | 98 **T1** |
| `pd-08-2-pr-template` | `08-2-附录-闭合工单表.md` | **须保留**（PR 模板/豁免指针） | - [ ] | 98 **T1** |
| `pd-93-matrix` | `93-全站功能验证矩阵-域别回归清单.md` | **正文须保留**；§5 派生 JSON 可 **B** 迁出 | - [ ] | 98 **T2**；`mig-3-1-derive-93-96` |
| `pd-96-hub` | `96-索引-全链路外生产验收分册.md` | **须保留** Hub | - [ ] | 98 **T1**；96-18 **正文**仍属 A（**registry 未登记 ≠ 可删**） |
| `pd-96-18-body` | `96-18-未完成清单与多维检查.md`（若盘上已恢复） | **须保留** | - [ ] | 98 **T1**；TT-9618 / README 锚 |
| `pd-workflow-inline-anchors` | `.github/workflows/**` 内联 `docs/spec/…` 锚点族 | **非删 spec 文件对象**；改 manifest **另立项** | - [ ] | 盘点 §3；registry `derive-ci-check-anchor-manifest` |
| `pd-15-51-53-66-27` | `15` / `51` / `53` / `66` / `27-P0…` 等（release 脚本未恢复时） | **须保留正文**；**不得以「无 consumers」推可删** | - [ ] | 98 **T1**；registry `migration_prerequisites` 注记 |

**清单全绿（书面）**：上表 **Owner 判定** 列全 `[x]`，且与 **[STATUS P-D](../corpus/SPEC-MIGRATION-STATUS.md#status-p-d)**、**[96-索引 Owner 表](../../spec/96-索引-全链路外生产验收分册.md#spec-delete-closure-owner)** **无互斥**。

---

**变更记录**：见仓库 PR 说明；**Version 三线**若 bump **07** 须遵守 **`check-07-version-triple`**（与 **07** 文内纪律同读）。
