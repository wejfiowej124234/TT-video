# SPEC-MIGRATION-STATUS（P-A～P-D · 删 `docs/spec` 前置登记）

Version: v0.1.13

> **SSOT（必读）**：本文件为 **corpus 登记态**（**P-C 真源之一**），**不**替代 **04 §3.4 / 93 / 14 / 07** 契约正文；与 **[engineering/08 §2](../engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[98 §2.1 细目](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items)** / **[98 §2.2 桶表](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-claim-table)**、**[08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items)**、**[盘点 §7](../../spec-path-dependency-migration-inventory.md#inv-per-path-delete-keep)** 同轮对读。**engineering/** 导读边界见 **[spec/00 读前](../../spec/00-文档索引.md)**。

**独立开发与无 CI / 无 PR UI（本表读法）**：**Owner=单维护者本人**；**「同 PR 对拍」** 在本场景下 **= 同一变更批次内书面一致**（可 **同一小提交序列** 或 **同一工作日** 闭合，**不要求** GitHub Pull Request 界面）。**GitHub Actions 不可用**（欠费 / 关闭）时 **不**以远端 **workflow 顶栏绿** 为唯一依据；**① 本地** 须按 **[`docs/solo-dev-rhythm.md` §6.5](../../solo-dev-rhythm.md)** 跑默认命令集并 **自留 `exit 0` 证据**；**② 测试网**、**③ 公网/生产** 仍须 **顺序验收、禁止跳阶**（与根 **`README` / `AGENTS.md` / `CONTRIBUTING.md`** 三阶口径同源）。**无 CI ≠ 无验证**。

**冻结声明（与工程约定对齐）**：在 **GitHub Actions 计费/配额恢复前**（或组织 **主动关闭** workflow），**不以** **CI 全绿** 作为本 STATUS 勾选前提；本文件承载 **书面证据链** 与 **Owner 可勾选** 字段，**不**宣称 **`git rm docs/spec/...` 已执行**。恢复 Actions 后，可将远端绿作为**旁证**，与本地证据对拍。

<a id="status-phase-123"></a>

### 三阶与删径的关系（防跑阶）

| 阶 | 典型内容 | 与 **P-A～P-D** |
|----|-----------|-----------------|
| **① 本地** | **`validate-spec-path-dependencies-registry.py`**、**`check-handbook-*`**、**`run-check-04-routes`**（视改动）、**`cargo test -p traveltrust-api`** 等 **exit 0** + **证据落盘**（见 **§6.5**） | **P-A / P-C** 的硬条件主要在 **①** 收口 |
| **② 测试网** | 测试主机、测试 DB、Stripe test、staging 类回调等 **再验一遍** | 涉及对外链路的删径/迁链 **不得**仅用 **①** 冒充 **②** |
| **③ 公网/生产** | 生产 PSP、公网 webhook、主网真链、**Production GO** 等 | **删 `docs/spec/` 与生产 GO 无等价关系**；**③** **另闸** |

<a id="status-evidence-local-20260430"></a>

### ① 本地证据索引（solo-dev §6.5 · 2026-04-30）

- **落盘目录**：[evidence/GO_20260430_mig-local/README.md](../../../evidence/GO_20260430_mig-local/README.md)（命令、`exit` 码与说明）。
- **本轮已通过（①）**：`python registry/validate-spec-path-dependencies-registry.py`、`python registry/audit-inv7-vs-registry-classification.py`、`bash scripts/check-handbook-frontmatter.sh`、`bash scripts/check-handbook-engineering-content.sh`、`python registry/scan-spec-consumer-refs.py --strict`（**`not on allowlist: 0`**；总字面 hits **195** 见 **[证据目录](../../../evidence/GO_20260430_mig-local/README.md)** 末段）、**`CARGO_HOME=.cargo-home-mig-evidence cargo test -p traveltrust-api`**（**840** passed）**均为 `exit 0`**。**engineering/09 v1.4.39 · §11** 已与上述证据目录及 **P-B（08/09 对拍）** 同键互指。

---

<a id="status-p-a"></a>

## P-A — 盘点与 registry 双真源

| 勾选 | 条件 |
|------|------|
| - [x] | **[盘点 §7](../../spec-path-dependency-migration-inventory.md#inv-per-path-delete-keep)** 逐路径表与 **`registry/spec-path-dependencies.v1.yaml`** 同类 **A/B/C** 标注 **无互斥**（发现互斥先修盘点/YAML，再回写本节）。**本轮**：**`python registry/audit-inv7-vs-registry-classification.py`** **exit 0**（§7 **A/B**「默认可删」列 + registry **A→keep:** 嗅探；见 **[证据索引](#status-evidence-local-20260430)**）。 |
| - [x] | **`python registry/validate-spec-path-dependencies-registry.py`** 本地 **exit 0**（**无 CI 时**仍须在 **执行删径合并 / 直推 `main` 前** 本地跑通；证据见 **[`docs/solo-dev-rhythm.md` §6.5](../../solo-dev-rhythm.md)**、[证据目录](../../../evidence/GO_20260430_mig-local/README.md)）。 |

<a id="status-p-b"></a>

## P-B — 08 §3 / 09 §3 矩阵同批对拍

| 勾选 | 条件 |
|------|------|
| - [x] | **[engineering/08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix)**「删除 spec 可核验列」与 **engineering/09 §3**（若仓库已检出）**行级一致**（**同批** = 同一变更批次内闭合，**不要求** GitHub **PR** UI；单维护者读法 **[`docs/solo-dev-rhythm.md` §7](../../solo-dev-rhythm.md)**）；或 **书面声明** 09 尚未检出、仅以 08+盘点为真源（须 **Owner** 勾选）。**本轮**：**09 已检出**（**v1.4.39**）；**「删除 spec」列均为 no** 与 **09 §3** 簇态无矛盾（**①** 文档对读 + engineering 门禁绿）；**09 §11** 与 **[证据目录](#status-evidence-local-20260430)** 互指。 |

<a id="status-p-c"></a>

## P-C — 脚本 / workflow 硬编码路径清零（对盘点 §2/§3）

| 勾选 | 条件 |
|------|------|
| - [x] | 对 **[盘点](../../spec-path-dependency-migration-inventory.md)** **§2、§3** 所列 **consumers**，**不存在**指向拟删 **`docs/spec/...`** 的 **孤立硬编码**；已迁 **registry/derived** 或 **manifest** 的路径须在 STATUS 备注列登记 **回滚锚**。**本轮**：**`python registry/scan-spec-consumer-refs.py --strict`** → **`unlisted_count = 0`**（允许类与 **[盘点 §4](../../spec-path-dependency-migration-inventory.md)** 外向互指口径对齐；证据见 **[证据目录](../../../evidence/GO_20260430_mig-local/README.md)**）。**拟删路径族**当前仍以 **须保留（A）** 为主 — **未**执行 **`git rm docs/spec/...`**。 |

<a id="status-p-d"></a>

## P-D — Owner 收口（删径变更闸门）

| 勾选 | 条件 |
|------|------|
| - [x] | **[96-索引 · Owner 勾选](../../spec/96-索引-全链路外生产验收分册.md#spec-delete-closure-owner)** 与 **本节 P-A～P-C** 同步为 **全勾选**（第 **4** 行远端 **rerun** 在 **Actions 冻结** 下以 **solo-dev §6.5** **①** 证据等效声明，见 **96** 表内注）。 |
| - [x] | **98 §2.1 / §2.2** 对拟删路径族给出 **保留/可迁/禁止删** 结论，且与 **08 §2 五条件** 无矛盾。**本轮**：**无**经 **98 §2** 登记的**待批量删径**；**T1–T4** 桶与 **§3** 四步已书面闭合。 |
| - [x] | **`pd-*` 细目**（**[本节表](#status-pd-line-items)**）：**Owner** **于四门**（**[08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items)**、**[98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items)**、**本节表**、**[96-索引 · pd 表](../../spec/96-索引-全链路外生产验收分册.md#96-pd-line-items)**）**完成** **`pd-*` 全量勾选** **并** **结论一致**，**即** **`pd-*` 清单全绿（书面）**。**本轮无新增 `git rm` 对象**：**不**在此批次发起新的 **删径专 PR**（与「删 spec 仅专提交、不夹带」同条）；**未来**若有 **98 §2** 登记逐路径删，仍须 **专提交** 执行 **`git rm …`** 与证据回填。 |

---

<a id="status-per-path-rows"></a>

## 逐路径登记行（与盘点 §7 / 08 §3.1 对拍）

**填法**：每行对应盘点 **§7** 一条聚合路径或闸门族；`STATUS 行 id` 与 **08 §3.1** `#mig-3-1-…` 锚 **同键**。

| STATUS 行 id | 路径或闸门族（摘要） | 默认 disposition | 08 §3.1 锚 | 98 §2 桶 | Owner ☐ |
|---------------|----------------------|------------------|------------|-----------|----------|
| `mig-3-1-gate-04-routes` | `check-04-*` / 04 §3.4 机读窗 | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-04-routes) | 法定壳 | - [x] |
| `mig-3-1-gate-07-08` | `check-07-version-triple` / `check-08-*` | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-07-08) | 法定壳 | - [x] |
| `mig-3-1-gate-wave` | `check-wave-phase-files` / `{NNN}-*.md` | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-wave) | 法定壳 | - [x] |
| `mig-3-1-gate-govlink` | `check-governance-doc-linkage` 族 | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-govlink) | 法定壳 | - [x] |
| `mig-3-1-gate-96-18` | `tt-9618-onboarding-pg-evidence` / 96-18 | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-gate-96-18) | 法定壳 | - [x] |
| `mig-3-1-derive-93-96` | 93 §5 / 96 分册 **派生 JSON（B）** | **正文仍在 spec**；生成物可迁 | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-derive-93-96) | 双写 / registry | - [x] |
| `mig-3-1-subtree-arch` | `27-archived/`、`code-maps/`、`snapshots/` | **须保留 spec（A）** | [08 §3.1](../engineering/08-文档与spec迁移台账.md#mig-3-1-subtree-arch) | 考古子树 | - [x] |
| `wf-build-anchors` | §3 `build.yml` 等 workflow 锚点族 | **须保留 spec（A）** | [盘点 §3](../../spec-path-dependency-migration-inventory.md#inv-section-3-workflows) / [08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix) | 法定壳 | - [x] |

<a id="status-pd-line-items"></a>

### P-D · `pd-*` 细目（与 08 §3.1c / 98 §2.1 / 96-索引 同键）

<a id="status-pd-canonical-sentence"></a>

> **Owner**（单维护者=本人）于四门完成 **pd-*** 全量勾选并结论一致；清单全绿后立即执行 **唯一删径变更批次**（专提交 + 证据回填；**不要求** GitHub **PR** UI），合并/直推后关闭本条迁移。

**四门同键**：行键、默认 disposition、**Owner ☐** 与 **[engineering/08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items)**、**[98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items)**、**本节表**、**[96-索引 · pd 表](../../spec/96-索引-全链路外生产验收分册.md#96-pd-line-items)** **须一致**。**Owner** **于四门** **完成** **`pd-*` 全量勾选** **并** **结论一致**，**即** **`pd-*` 清单全绿（书面）**。**达成后立即执行** **唯一「删径变更批次」**（**专提交**；**执行删除与证据回填**）；**合并/直推即关闭迁移项目**。

| 行键 | 路径或对象（摘要） | 默认 disposition | 08 §3.1c | 98 §2.1 | Owner ☐ |
|------|-------------------|------------------|----------|---------|--------|
| `pd-00-chaining` | `00-文档体系与阅读串联.md` | **须保留**兼容壳 | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-00-module-master` | `00-最终版架构图对应模块清单总表.md` | **须保留** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-gap-official` | `缺口与待补-官方总表.md` | **须保留** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-82` | `82-治理币-文档总览.md` | **须保留** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-83` | `83-区域治理与收益分配-协议白皮书.md` | **须保留** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-84` | `84-第一阶段10国Country-Pool发行参数总表.md` | **须保留** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-govtoken-subtree` | `governance-token/**` | **须保留**子树 | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-08-4-feerouter` | `08-4-附录-收益流闭环图-FeeRouter-Target.md` | **须保留** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-08-2-pr-template` | `08-2-附录-闭合工单表.md` | **须保留** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-93-matrix` | `93-全站功能验证矩阵-域别回归清单.md` | **正文须保留**；派生 JSON 可 **B** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-96-hub` | `96-索引-全链路外生产验收分册.md` | **须保留** Hub | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-96-18-body` | `96-18-未完成清单与多维检查.md`（若盘上已恢复） | **须保留** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-workflow-inline-anchors` | `.github/workflows/**` 内联 spec 锚点族 | **非删 spec 文件对象** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |
| `pd-15-51-53-66-27` | `15` / `51` / `53` / `66` / `27-P0…` 等 | **须保留正文** | [08 §3.1c](../engineering/08-文档与spec迁移台账.md#mig-3-1-c-pd-line-items) | [98 §2.1](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-2-1-pd-line-items) | - [x] |

**维护**：新增 **scripts/workflows** 硬编码 **`docs/spec/`** 时，须先更新 **[盘点 §2/§3](../../spec-path-dependency-migration-inventory.md)** 与 **registry**，再在本表 **逐路径登记行** 与 **`pd-*` 细目** 同步增行。
