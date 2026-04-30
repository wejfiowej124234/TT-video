# `docs/spec` 路径依赖盘点与真源迁移方案（只读）

**性质**：工程盘点与方案草案；**不**删除、**不**搬迁 `docs/spec/` 内任何文件。执行删旧仍须 **[engineering/08 §2](handbook/engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[SPEC-MIGRATION-STATUS](handbook/corpus/SPEC-MIGRATION-STATUS.md)**（含 **P-C** 脚本去硬编码）、**[98 §2](spec/98-以代码为真源的文档体系与旧文档替代路线图.md)** 与 **CI/链接** 同批。

**盘点方法**：对 `scripts/`、`.github/`、`docs/`（不含 `docs/spec/` 内部自链的穷尽统计）做 `docs/spec`、`docs\spec`、`../../spec/` 形态检索；抽样核对脚本硬编码路径。**日期**：2026-04-29。

**说明**：`contracts/reference/`、`contracts/registry/` 在仓库中**尚不存在**；下表「可迁 registry」指**未来**可引入的机读载体（JSON/YAML 等），须另行定义与 **04/93/14** 的**双写或生成管道**，避免第二套冲突真源。

**变更纪律（与 `registry/README.md`、CONTRIBUTING、AGENTS、`.cursor/rules` 同源）**：凡是**新增、删除或改动** **`docs/spec` 路径依赖**（含：`docs/spec/` 下被 **`scripts/`**、**`docs/`**（spec 外）、**`.github/workflows/`** 等硬编码消费的路径；上述消费方对 **`docs/spec/…`** 的锚点/门禁目标变更；**`registry/spec-path-dependencies*.yaml`** / 本文所记条目的增删改），**须同步**更新 **本文** 与 **[`registry/spec-path-dependencies.v1.yaml`](../registry/spec-path-dependencies.v1.yaml)**。**提交前**须在仓库根**本地**依次通过 **`python registry/validate-spec-path-dependencies-registry.py`**、**`bash scripts/check-handbook-frontmatter.sh`**、**`bash scripts/check-handbook-engineering-content.sh`**（均 **exit 0**）。**完成口径**以**本地**为准；**不以** PR / Actions 绿灯为收口。**Registry YAML** 结构以 **validator** 为硬门禁；**[`.github/workflows/registry-spec-path-dependencies-validate.yml`](../.github/workflows/registry-spec-path-dependencies-validate.yml)** 为 **CI 恢复后的可选复跑**。**不**借此迁移或删除 **`docs/spec`**，**除非单独立项**；**不**改 **`build.yml`** 主链默认必过组合。

---

<a id="inv-classification-abc"></a>

## 1. 分类口径（方案层）

| 类别 | 含义 | 典型归属 |
|------|------|-----------|
| **A · 法定壳（须长期留在 `docs/spec` 或同路径兼容壳）** | 合同级 HTTP/矩阵/治理版本真值、索引主表、GO/缺口闭环、08-3/08-4 机读对、96 Hub 分册语义 | **04** §3.4、**93** 表体、**14**、**07**/版本三线、**00** 主表与版本表、**08-3/08-4**、**95/96** 主链、**缺口官方总表**、**15**、**go-live**、**R-001/R-002** 正文、**governance-token/** 与 **82/83/84** 等 |
| **B · 可迁 `contracts/reference` 或 `contracts/registry`（机读 / 去重解析）** | 脚本与 CI **重复列举**、可被 **结构化替代** 且**不**承担法务叙事的部分 | 96 分册路径元组（与 `scripts/release/verify_96_booklets_registry.py` 同源）；**check_anchor** 的 `(子串, 目标 spec 文件)` 表；从 **93** 派生的用例 ID 清单（与 `extract_93_case_inventory.py` 对齐）；**08-3** 的 `SSOT_SHA256` 旁路的「仅 hash 校验」输入（正文仍在 spec） |
| **C · `handbook` / `corpus` 可接管（导读 / REG / 执行 Runbook）** | **How-to**、域 Hub、登记与迁移矩阵；**不**替代 **04/93/14** 表体 | **engineering/** 域篇、**REG-***、**09/08** 矩阵、**runbook/** 执行卡、**product-manager/** 运营表；已 **migrated / partial / full** 的叙事（仍链回 spec 锚点） |

---

<a id="inv-section-2-scripts"></a>

## 2. `scripts/`：硬编码 `docs/spec` 依赖（按闸门类型）

### 2.1 路由与表结构机读（**强依赖 A**）

| 脚本 | 依赖的 spec 路径 | 迁移备注 |
|------|------------------|----------|
| `scripts/gates/check-04-routes-vs-code.py` | `docs/spec/04-后端与API.md` | **A**；机读窗与表体语义不可迁出 spec 除非 **04** 自身改版式并改闸 |
| `scripts/gates/check-04-frontend-routes-vs-app.py` | 同上 | 同上 |
| `scripts/gates/check-04-api-ts-routes-vs-doc-34.py` | 同上 | 同上 |
| `scripts/gates/check-13-1-table1-routes-vs-app.py` | `docs/spec/13-1-UI产品级SSOT与页面规范.md` | **A**（UI 路由 SSOT） |
| `scripts/gates/run-check-04-routes.sh`（注释） | 04 / 14 冻结口径 | **A** |

### 2.2 版本与 08 机读对（**强依赖 A**）

| 脚本 | 依赖 | 迁移备注 |
|------|------|----------|
| `scripts/gates/check-07-version-triple.sh` | `07-开发流程与顺序.md`、`00-文档索引.md` | **A** |
| `scripts/gates/check-08-consistency.sh` | `08-3-参数与门禁表.md`、`08-4-对外口径包.md` | **A** |
| `scripts/gates/check-08-evidence-pointer.sh` | `08-3-参数与门禁表.md` | **A** |
| `scripts/dev/check-strict-ssot-local-prereqs.sh` | `08-3` + SHA256 | **B** 候选：hash 输入可 registry；**叙事** 仍在 **A** |

### 2.3 阶段文件存在性（**强依赖 A + 目录约定**）

| 脚本 | 依赖 | 迁移备注 |
|------|------|----------|
| `scripts/gates/check-wave-phase-files.sh` | `docs/spec/${NNN}-*.md` 模式与 **00** 登记号段 | **A**；若迁 **B**，需 **00** 或 registry 列出文件名集合，否则失去「防误删」语义 |

### 2.4 治理文档联动（**强依赖 A**）

| 脚本 | 依赖 | 迁移备注 |
|------|------|----------|
| `scripts/gates/check-governance-doc-linkage.sh` | `00-文档索引.md`、`00-最终版架构图…`、`00-文档体系与阅读串联.md`、`07`、`82/83/84`、`governance-token/*`、`08-4-附录-收益流闭环图…` | **A**；链路与存在性 **P-C** 前不可删 |

### 2.5 其它 gates / tools

| 脚本 | 依赖 | 类别 |
|------|------|------|
| `scripts/gates/check-handbook-engineering-content.py` | 校验 **handbook → spec** 链接存在 | **C** 消费 **A** |
| `scripts/gates/fix_27_archived_links.sh` | `docs/spec/27-archived/**` | **A**（考古树） |
| `scripts/gates/check-48-line-count.sh` | `48-后端模块化拆分与落地清单.md` | **A** |
| `scripts/gates/check-ci-exemption.sh` | `08-5-CI与一致性落地说明.md`、`00-文档治理总册.md` §8.3（`#doc-audit-gates-ssot`） | **A** |
| `scripts/check-runbook-golive-doclink-gate.sh` | `00`、`缺口与待补-官方总表`、`15` | **A** |
| `scripts/release/b421_doclink_gate.py` | 同上 + `ops/RUNBOOK` 等 | **A** |
| `scripts/release/verify_96_booklets_registry.py` | 96-Hub + `96-01`…`96-UI` 路径列表 | **B** 首选：迁为 **`contracts/registry/96-booklets.json`**（或仓库根 `registry/`），脚本读 registry **并**可选校验文件存在 |
| `scripts/check-spec93-routes-vs-app.py` | `93-全站功能验证矩阵…` §5 | **B** 候选：路由集合从 93 生成 JSON；**93** 仍为 **A** |
| `scripts/dev/extract_93_case_inventory.py` | 同上 | **B** 派生 |
| `scripts/validate-regression-report.py`（注释） | R-001 | **A** |
| `scripts/release/run_96_15_orchestration.py`、`tier_bc_machine_gates.py` | 若干 spec 路径 | **A** + 部分可 **B**（文件列表） |
| `scripts/tools/fix_spec_code_maps_snapshots_links.py` | `docs/spec/code-maps`、`snapshots` | **A**（子目录治理） |
| `scripts/gates/bulk_update_doc_ssot_07.py` | 字符串内含 `00-文档体系与阅读串联` | 维护脚本；目标仍是 **A** |
| `scripts/dev/sync-spec00-handbook-docs-version-column.py` | `spec/00` 版本表 | **A** |

### 2.6 Ops / 注释型引用

多条 `scripts/ops/*.sh` 头注释引用 **04 §3.4** — 属 **文档互证**，非机读硬路径；归类 **C** 导读与 **A** 锚点并存。

---

<a id="inv-section-3-workflows"></a>

## 3. `.github/workflows/`：`docs/spec` 路径依赖

以下 workflow **内联** `docs/spec/…` 作为 **check_anchor** 或 **grep** 目标（与 `build.yml` 局部步骤同源模式）：

| Workflow | 用途摘要 |
|----------|----------|
| `build.yml` | 04 / 14 / 240 / 250 / 230 等锚点 |
| `secret-key-gate.yml` | 04、230 |
| `job-queue-gate.yml` | 04、14、250 |
| `feature-flag-gate.yml` | 04、240 |
| `config-center-gate.yml` | 04 |
| `community-governance-gate.yml` | 04、160 |
| `finance-reconcile-gate.yml` | 70、200 |
| `internal-drill-gate.yml` | 04、140 |
| `ai-governance-gate.yml` | 04、170 |
| `check-wave-phase-files.yml` | `paths: docs/spec/**` |
| `check-08-consistency.yml`、`check-08-evidence-pointer.yml` | 08-3 / 08-4 |
| `governance-doc-linkage-gate.yml` | 注释指向 84 |
| `broadcast-batch-blockers.yml` | 步骤名提及 docs/spec |

**迁移备注**：**B** 可引入 **`registry/ci-anchor-manifest.yaml`**（示例名），由单一 shell 函数读 manifest 再 `check_anchor`；**合并前**须 **双跑**（manifest vs 现行内联）直至等价。**法定叙事**仍在 **A**。

---

## 4. `docs/`（`spec` 外）对 `docs/spec` 的依赖量级

| 区域 | 量级与角色 |
|------|------------|
| `docs/handbook/engineering/*.md`、`EVIDENCE-*` | **高**：`../../spec/…` 链 **04/93/14/07/00** 与域 spec；**C** 承接导读，**A** 为契约 |
| `docs/handbook/corpus/REG-*`、`SPEC-MIGRATION-STATUS.md` | **中**：登记与迁移状态；**C** |
| `docs/runbook/*.md` | **中高**：执行与证据链互指 **96/93/04/110** 等；偏 **C** + 锚 **A** |
| `docs/product-manager/`、`docs/任务母表.md`、`docs/AI任务卡索引.md` | **中高**：任务与母表链 spec；**C** 索引为主 |
| `docs/backend`、`docs/frontend`、`docs/dapp` README / 架构目录 | **中**：导航进 spec；**C** |
| `docs/spec/` 自身 | 内部互链不计入「外向依赖」 |

---

## 5. 推荐迁移顺序（仅方案）

1. **登记 P-C 清单**：从 §2、§3 提取「硬编码路径全集」，映射到 **A/B/C**（本文件可作为附件）。
2. **先做低风险 B**：**96 分册 registry**、`93 §5` 派生路由 JSON（**生成物**），脚本优先读 registry，**失败回退**读 spec 直至稳定。
3. **CI manifest**：将分散的 `check_anchor` 收束到单一 manifest，**路径键**仍指向 **A** 文件。
4. **handbook**：继续按 **08/09** 抬高 **C** 覆盖度；**不**在 **C** 内复制 **04/93** 表体。
5. **法定壳**：**04/93/14/07/00/08-3/08-4/95/96/go-live** 等 **A** 在可预见期内保持 spec 正文；删路径仅能在 **08 §2 + STATUS + 98** 程序后发生。

---

## 6. 相关真源（阅读顺序）

- **[engineering/08](handbook/engineering/08-文档与spec迁移台账.md)** · **[engineering/09](handbook/engineering/09-文档迁移覆盖审计报告.md)**  
- **[SPEC-MIGRATION-STATUS](handbook/corpus/SPEC-MIGRATION-STATUS.md)**（**P-C**）  
- **[98 §2](spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**  
- **[spec/00 读前 · handbook 与 spec 边界](spec/00-文档索引.md)**  
- **逐路径可删/保留（书面）** → **[§7](#inv-per-path-delete-keep)**  

---

<a id="inv-per-path-delete-keep"></a>

## 7. 逐路径「可删 / 须保留」证据链（书面闭环 · CI 冻结期）

**目的**：在 **不** 新开工程 PR、**不** 依赖 Actions 绿灯的前提下，把 **[§2](#inv-section-2-scripts)**、**[§3](#inv-section-3-workflows)** 的闸门族 **压缩为可勾选行**，并与 **[SPEC-MIGRATION-STATUS](handbook/corpus/SPEC-MIGRATION-STATUS.md#status-per-path-rows)**、**[engineering/08 §3.1](handbook/engineering/08-文档与spec迁移台账.md#mig-3-1-per-path-evidence)**、**[98 §2](spec/98-以代码为真源的文档体系与旧文档替代路线图.md#98-claim-table)**、**[96-索引 · Owner 勾选](spec/96-索引-全链路外生产验收分册.md#spec-delete-closure-owner)** **同键互指**。

**填表规则**：新增 **脚本 / workflow** 行时，先补 **§2 或 §3**，再在本表增 **聚合行**，并在 **STATUS** 增 **`STATUS 行 id`**。

| 聚合 id（= STATUS / 08 §3.1） | 覆盖的盘点段落 / registry id（摘要） | §1 类 | **默认可删 spec？** | Owner ☐ |
|------------------------------|----------------------------------------|-------|---------------------|--------|
| `mig-3-1-gate-04-routes` | §2.1；`check-04-*` | **A** | **否** | - [ ] |
| `mig-3-1-gate-07-08` | §2.2；`check-07-version-triple`、`check-08-*` | **A** | **否** | - [ ] |
| `mig-3-1-gate-wave` | §2.3；`check-wave-phase-files` | **A** | **否** | - [ ] |
| `mig-3-1-gate-govlink` | §2.4；`check-governance-doc-linkage` | **A** | **否** | - [ ] |
| `mig-3-1-gate-96-18` | registry `spec-96-18-backlog`；`tt-9618-*` | **A** | **否** | - [ ] |
| `mig-3-1-derive-93-96` | §2.1–2.3 派生；`derive-93-section5-routes`、`derive-96-booklets-paths` | **B** | **仅生成物可迁；正文否** | - [ ] |
| `mig-3-1-subtree-arch` | §2.5–2.6；`27-archived`、`code-maps`、`snapshots` | **A** | **否** | - [ ] |
| `wf-build-anchors` | §3 `build.yml` 等 workflow 锚点族 | **A** | **否**（改 manifest 属另立项） | - [ ] |

**「清单全绿」定义（书面）**：上表 **Owner ☐** 全为 `[x]`，且 **STATUS P-A～P-D**、**96-索引 Owner 表**、**98 §3** 同步为全勾选。

---

**维护**：若新增脚本/workflow 硬编码 `docs/spec/`，请在本文件 **§2/§3** 增补一行，并在 **08** 台账侧考虑是否触发 **P-C**。

**机器登记（草稿）**：[`registry/spec-path-dependencies.v1.yaml`](../registry/spec-path-dependencies.v1.yaml)（字段：`classification`、`consumers`、`target_location`、`migration_prerequisites`；说明见 [`registry/README.md`](../registry/README.md)）。
