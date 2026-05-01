# `docs/runbook` 目录说明（分层 · 排序 · 维护）

**Version:** 0.2.31  
**本页职责：** 把 **`docs/runbook`** 里 **约 200+** 份 Markdown **按用途分层、按阅读顺序排序**；**不**替代 **`docs/spec/04`**、**`14`** 契约正文。

**维护纪律（清理边界）：**

- **默认不做**「把文件挪进子目录 / 批量改名 / 删历史 Runbook」：全仓 **CONTRIBUTING / 母表 / evidence / PR** 里已有大量 **硬编码路径**；物理搬迁 = **高概率断链**，须单独立项 + 全仓 grep 迁移。
- **本目录的「整理」** = **导航真值集中在本 README** + 文内 **稳定锚（TT-… / Epic-…）** 不变；专项册仍以 **点名引用** 为准打开。

**规模（`docs/runbook` 根一层 `*.md`，约数）：** 合计 **~200** 篇 · **`TT-B*.md`** **~110** 篇（专项）· **`GO_*.md`** 等证据指称 **若干**（与 **`evidence/`** 成对阅读居多）。

---

## 1. 推荐阅读顺序（从这一页往下，按序号做即可）

| 步 | 打开 | 目的 |
|----|------|------|
| **1** | **[TT-9625](TT-9625-golden-path-system-spine.md)** | **一条用户脊**：注册 → `/meta` → `/market` → 创单 → `/escrow/:id`（Next → `apiUrl` → Axum → 数据/链） |
| **2** | **[TT-9621](TT-9621-master-order-96-backend-db-chain-frontend.md)** | **每天执行顺序**：后端 → DB → 链 → 前端（Phase **A→D**） |
| **3** | **[TT-9622](TT-9622-bounded-contexts-layering-and-integration-map.md)** | **领域 × 分层**：谁拥有哪条数据链、前后端在哪握手 |
| **4** | **[TT-9624](TT-9624-closed-loop-checklist.md)** | **八类闭环**「闭没闭」速查 |
| **5** | **[96-21](../spec/96-21-工程闭环扩展清单进阶.md)** | **9～17** 规则层 / 价值层闭环（与 **TT-9624** 互补） |
| **6** | **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** | **全站 URL × API** 矩阵（Phase **D** 主工具） |
| **7** | **[96-18](../spec/96-18-未完成清单与多维检查.md)** | **台账与 P0**（**`#9618-one-page-priority`** 等） |
| **8** | **[TT-9626](TT-9626-zero-to-production-go-single-path.md)** | **一条路到生产 GO**：闭环 → 竖切 → **R-002** → **go-live** → 签字（与 **主网 TT** 并联） |
| **9** | **[TT-9627](TT-9627-delivery-order-spine-then-full-site.md)** | **先主脊 → 再全站 → 再生产**：**段 1～6** 勾选总表（与 **TT-9625/9626** 串读） |
| **10** | **[TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md)** | **主线 vs 支线**：社区等扩展 **按 93 批次拆线验证**；发版/契约变更时再 **合线**（与 **§0.c** 增量裁剪叠加） |
| **10b** | **[TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)** | **读前**：**每页 / 每弹窗 / 分权限** 文档承诺边界（**93 §8.0**、**96-20**、**R-002**）；**不**把「矩阵在跑」当成「UI 已全穷举」 |
| **10c** | **[TT-9628 · §0.0.5 禁止假完成](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)** | **阶次 + 证据链**：**①** 本地绿 / 文档勾选 / 窄切片 **`report.json`** **不得**冒充 **②** staging 或 **③** Production GO；**[CONTRIBUTING#no-false-completion](../../CONTRIBUTING.md#no-false-completion)** |
| **10d** | **[TT-9628 · §0.0.2a 机读闸索引](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-tt9627-gates-index)** | **TT-9627** 相关 **`scripts/gates/`** 竖切 × 段 × **`ci-local`** 可选开关一行表（**①**） |
| **10e** | **[TT-9628 · §0.0.3 `report.json` 路径](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-report-json-path-convention)** | 段 **3** 机读：**无**仓库根默认 **`report.json`**；**argv1** / **`REPORT_JSON`** / **`TRAVELTRUST_R002_REPORT_PATH`**；**`ci-local`** 开 **`SEGMENT3_R002_VALIDATE`** 须 **`REPORT_JSON`** |
| **10e-b** | **[TT-9628 · §0.0.2b 双人拆线](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-dual-owner-split)** | **双 Owner**、任务卡与 **TT-9627** 段 / **TT-9626** 阶段映射、**证据分目录**、共用 staging **书面划分**、**96-15** 触发留证、**合线主持人** 一份终局索引 |
| **10e-c** | **[TT-9628 · §0.0.4 叙事互指](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-0-0-4-doc-hygiene)** | **`rg`** 清单：**CI 欠费旁证**、**覆盖边界**、**`report.json` 段 3**、**机读闸索引**、**双人拆线**、**AI 一览**（**`maybe-run-*`** / **`SKIP_AI_*`**）及 **04 · 零** / **`spec/00`** / **`docs/00`（B-179）** / **`docs/README`** / **`AI任务卡索引.from-stash`/`任务母表`（主索引↔草稿）** / **TT-LOCAL** / **PR 模板** 等；与 **[CONTRIBUTING](../../CONTRIBUTING.md)**「Handbook 一行对拍」同源 |
| **10f** | **[93-matrix · 下一批执行指针](93-matrix-batch-tracker.md#tt-93-matrix-next-batch-pointer)** | **IMP** 背板（**[next-batch §6](next-batch-gap-remediation-implementation-plan.md)**）与 **93** 批次 **分轨**；**R-003** 后默认 **93-A-REST**；Admin deep；`/guide` 见 **93-B-MKT-GDE** + **53**（与 **TT-9628** 拆线行互指） |
| **10g** | **[TT-93 · `/guide` P2 薄入口](TT-93-guide-schedule-next-001.md#tt-93-guide-schedule-next-001)** | **93-matrix** **NOT RUN** 行深链；与 **TT-9628 §0.1.3 / §2** 支线表互指 |

**竖切示例（证明「能串」的操作打法）：** **[TT-9623](TT-9623-vertical-slice-01-guides-catalog.md)** + `scripts/gates/vertical-slice-01-guides-catalog.sh`。

---

## 2. 主导航：`TT-96xx` 系列（**刻意连号**，日常只记这一段）

| 编号 | 文件 | 一句话 |
|------|------|--------|
| **TT-9625** | [TT-9625-golden-path-system-spine.md](TT-9625-golden-path-system-spine.md) | **系统总脊**单页：用户路径串全栈 |
| **TT-9621** | [TT-9621-master-order-96-backend-db-chain-frontend.md](TT-9621-master-order-96-backend-db-chain-frontend.md) | **96 收口总执行顺序** |
| **TT-9622** | [TT-9622-bounded-contexts-layering-and-integration-map.md](TT-9622-bounded-contexts-layering-and-integration-map.md) | **领域边界 × 技术分层** |
| **TT-9624** | [TT-9624-closed-loop-checklist.md](TT-9624-closed-loop-checklist.md) | **八类闭环**自检表 |
| **TT-9623** | [TT-9623-vertical-slice-01-guides-catalog.md](TT-9623-vertical-slice-01-guides-catalog.md) | **竖切 01**：guides + meta（示例） |
| **TT-9618** | [TT-9618-onboarding-local-testnet.md](TT-9618-onboarding-local-testnet.md) | **Onboarding / 准入费 / 本地·测试网** 阶梯与 PG 证据 |
| **TT-9600** | [TT-9600-96-HUB-LOCAL-VERIFICATION-PACK.md](TT-9600-96-HUB-LOCAL-VERIFICATION-PACK.md) | **96 Hub** 本地验证包（CI 非必须时） |
| **TT-9615** | [TT-9615-RELEASE-ORCHESTRATION-MACHINE-IO-001.md](TT-9615-RELEASE-ORCHESTRATION-MACHINE-IO-001.md) | **发版编排 / 机读 IO**（与发版节奏相关时） |
| **TT-9626** | [TT-9626-zero-to-production-go-single-path.md](TT-9626-zero-to-production-go-single-path.md) | **闭环 → 竖切 → staging → go-live → GO** 单序列（**不**替代 **go-live** 正文） |
| **TT-9627** | [TT-9627-delivery-order-spine-then-full-site.md](TT-9627-delivery-order-spine-then-full-site.md) | **先主脊 → 全站 → 生产**：**段 1～6** 勾选清单；**§0.c** **完成即标记**（防重复全链测试） |
| **TT-9628** | [TT-9628-main-line-vs-branch-lines-delivery.md](TT-9628-main-line-vs-branch-lines-delivery.md) | **主线 / 支线**：93 分批拆跑 + **合线** 闸门；**§0** **独立开发模式**；**§0.0** **[覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)**（页面·弹窗·角色）；**§0.0.2a** **[机读闸索引](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-tt9627-gates-index)**；**§0.0.2b** **[双人拆线](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-dual-owner-split)**；**§0.0.3** **[`report.json` 路径](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-report-json-path-convention)**；**§0.0.4** **[叙事互指 `rg`](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-0-0-4-doc-hygiene)**（含 **AI 一览** **`maybe-run-*`**、**`docs/00`**、**`docs/README`**、**`from-stash`/`母表`**、**AI话术 §0.2**）；**§0.0.5** **[禁止假完成](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)**；**§6** **补全执行单**；**v0.1.28**（**§0.0.4 `rg`** **增** **`from-stash`/`母表`**；**CONTRIBUTING** **PR** **`from-stash` 行**；**`docs/README` v1.0.1** **任务卡双文件**；余同 **v0.1.27**）；**`/guide` P2** 与 **[TT-93 锚](TT-93-guide-schedule-next-001.md#tt-93-guide-schedule-next-001)** |

---

## 3. 本地交付与 L4 / E2E

| 文件 | 用途 |
|------|------|
| [TT-LOCAL-CI-DELIVERY-GATE-001.md](TT-LOCAL-CI-DELIVERY-GATE-001.md) | **Actions 不可用**时的本地交付闸 |
| [TT-LOCAL-R003-DEV-FULLCHAIN-001.md](TT-LOCAL-R003-DEV-FULLCHAIN-001.md) | 本地全链相关 Runbook |
| [TT-local-user-journey-full-audit.md](TT-local-user-journey-full-audit.md) | 用户旅程审计（专项） |
| [TT-L4-PARALLEL-CI-001.md](TT-L4-PARALLEL-CI-001.md) | **L4 并行 CI** 观测与排障 |
| [TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md](TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md) | Sepolia E2E 基线 |
| [TT-L4-SMOKE-SLOWFILE-PERF-001.md](TT-L4-SMOKE-SLOWFILE-PERF-001.md) | 烟测 / 慢文件 / 性能 |
| [TT-WINDOWS-LOCAL-STACK-ENV-001.md](TT-WINDOWS-LOCAL-STACK-ENV-001.md) | **Windows**：UTF-8 / **cmd** 勿整段粘贴说明 / **Docker 预检**；与 **`start-api-with-seed.bat`**、**TT-9627 §0.a** 互指 |

---

## 4. Epic 阶梯（封口 / 大功能；与 **母表 + evidence** 强绑定）

**总索引（封口与 Epic 一行表）：** **[sealed-programs-and-epics-master-index.md](sealed-programs-and-epics-master-index.md)**。

| Epic | Runbook |
|------|---------|
| **A** | [Epic-A-governance-execution-ux-ladder.md](Epic-A-governance-execution-ux-ladder.md) |
| **C** | [Epic-C-admin-cross-check-drift-ui-ladder.md](Epic-C-admin-cross-check-drift-ui-ladder.md) |
| **D** | [Epic-D-indexer-ops-readonly-ladder.md](Epic-D-indexer-ops-readonly-ladder.md)（artifact schema 同目录 **`Epic-D-ops-artifact.v1.schema.json`**） |
| **E** | [Epic-E-finance-readonly-ladder.md](Epic-E-finance-readonly-ladder.md) |
| **F** | [Epic-F-e2e-three-pack-ladder.md](Epic-F-e2e-three-pack-ladder.md) · [Epic-F-real-path-adr.md](Epic-F-real-path-adr.md) |

---

## 5. 治理 / 清单 / 模板（非 Epic、非 TT-B 时常用）

| 文件 | 用途 |
|------|------|
| [TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md](TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md) | spec→handbook 全量替代清单（减负口径） |
| [TT-SPEC-89-GOV-UI-VOTING-B434-ALIGN-001.md](TT-SPEC-89-GOV-UI-VOTING-B434-ALIGN-001.md) | 治理 UI 对齐专项 |
| [TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001.md](TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001.md) | 企业审计清单 |
| [../go-live-checklist.md](../go-live-checklist.md) | **发版 / GO Decision** 主入口（**CONTRIBUTING** 篇首链此路径） |
| [go-live-checklist.md](go-live-checklist.md) | 本目录副本（若与上一文件漂移，以 **`docs/go-live-checklist.md`** + **母表** 为准） |
| [ai-template-read-only-api.md](ai-template-read-only-api.md) | **只读 GET** 开发单一模板 |
| [93-matrix-batch-tracker.md](93-matrix-batch-tracker.md) · **[下一批执行指针](93-matrix-batch-tracker.md#tt-93-matrix-next-batch-pointer)** | **93 矩阵** 批次与证据排期；拆线默认读此锚（**IMP** / **93** 分轨） |
| [sqlx-migration-ops.md](sqlx-migration-ops.md) | **SQLx 迁移** 运维单入口（**IMP-DB-001**；与 **CONTRIBUTING** 合并检表、**ops/RUNBOOK §2.5** 互指） |
| [evidence-manifest-appendix-zero-map.md](evidence-manifest-appendix-zero-map.md) | **IMP-EV-002** / **IMP-EV-003**：15 附录〇 ↔ **`manifest.json`** 对读表；GO 根聚合 **gen-frontend-manifest** 有序清单（**Runbook §12.6** 互指） |
| [ci-slo-baseline-and-timeout-notes.md](ci-slo-baseline-and-timeout-notes.md) | **IMP-CI-001** / **IMP-CI-002**：**`build.yml`** job 级 **`timeout-minutes`** 真值；分轨 SLO **占位表**（与 **TT-B322** 互指） |
| [next-batch-gap-remediation-implementation-plan.md](next-batch-gap-remediation-implementation-plan.md) | **B-320～B-325** 缺口 **IMP-*** **背板**；**§6** **收口** **编** **目** **（** **2026-05-01** **）** |
| [TT-93-guide-schedule-next-001.md](TT-93-guide-schedule-next-001.md) | **93 P2**：`/guide` **档期/接单**薄入口（**53** + **`93-B-MKT-GDE`**；**v0.1.7** **+** **[R-002 §4](../spec/R-002-回归执行闭环与发布准入.md)** **映射** **；** **不**替代 **04/93**） |

---

## 6. 专项册 **`TT-B…`**（~110 篇）：**不逐篇列在本页**

**是什么：** 多为 **索引器 / revenue pipeline / 04·14 对齐 / 单次 GO 子链** 的 **窄主题 Runbook**，给 **母表行、脚本门禁、PR 描述** 当 **稳定锚**。

**怎么找：**

1. **先看任务卡 / 母表 / PR** 是否 **点名了具体 `TT-B…` 文件名**。  
2. 未点名时：**不要**随机点开 **`TT-B3xx～B4xx`**。  
3. 封口域总览：**[sealed-programs-and-epics-master-index.md](sealed-programs-and-epics-master-index.md)**。  
4. 仓库内搜索：`rg "TT-B3" docs/runbook` 或按 **母表 B-*** 号反查。

---

## 7. 文件名规律速查（排序用）

| 前缀 / 模式 | 含义 |
|-------------|------|
| **TT-9621～TT-9625** | **日常集成导航**（优先记） |
| **TT-9618 / TT-9600 / TT-9615** | **96 / 准入费 / Hub / 发版编排** |
| **TT-LOCAL-*** | **本地交付闸** |
| **TT-L4-*** | **Sepolia / L4 / Chromium / 并行 CI** |
| **TT-B…** | **专项调查 / 对账 / 观测**（大量） |
| **TT-P…** | **单点 E2E / 行为专项**（例：`TT-P07-…`） |
| **Epic-*** | **Epic 阶梯** |
| **TT-SPEC-*** | **spec / handbook / 大清单** |
| **GO_*.md**（本目录少量） | 常与 **`evidence/GO_*`** 互指；以 **证据目录** 为收口真源 |

---

## 8. 与 `docs/spec` 的分工

| 目录 | 回答 |
|------|------|
| **`docs/spec`** | **是什么**（契约、状态机、架构、矩阵正文） |
| **`docs/runbook`** | **怎么做**（步骤、命令、证据放哪、本轮是否算完） |

---

## 9. 仍迷路时的固定出口

- 根 **[README.md](../../README.md) · 文档索引** 第一条链到 **`docs/runbook/README.md`** 与 **TT-9625**。  
- **[CONTRIBUTING.md](../../CONTRIBUTING.md) · 必读入口** 表内 **`docs/runbook` 太杂** 行。  
- **[96-索引 · Runbook 导航](../spec/96-索引-全链路外生产验收分册.md)** 表。

---

## 10. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-04-30 | 首版：三层 + 前缀规律 |
| 0.2.0 | 2026-04-30 | **重组**：推荐阅读顺序（§1）、**TT-96xx 主表**（§2）、本地/L4（§3）、Epic（§4）、治理模板（§5）、**TT-B 检索策略**（§6）、规模与**不搬迁**纪律（篇首） |
| 0.2.1 | 2026-04-30 | §1 步 **8** + §2 表：**[TT-9626](TT-9626-zero-to-production-go-single-path.md)**（到生产 GO 单路径） |
| 0.2.2 | 2026-04-30 | §1 步 **9** + §2 表：**[TT-9627](TT-9627-delivery-order-spine-then-full-site.md)**（主脊→全站→生产段式清单） |
| 0.2.3 | 2026-04-30 | **§3** 表增 **[TT-WINDOWS](TT-WINDOWS-LOCAL-STACK-ENV-001.md)**（Windows 本地栈 / Docker / **cmd** 误解析）。 |
| 0.2.4 | 2026-04-30 | **§2** **TT-9627** 一句摘要增 **§0.c**（**完成即标记**）。 |
| 0.2.5 | 2026-04-30 | **§1** 步 **10** + **§2** 表：**[TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md)**（**主线/支线** 拆线与合线闸门）。 |
| 0.2.6 | 2026-04-30 | **§2** **TT-9628** 一句摘要增 **§6** **补全执行单**（**v0.1.3**）。 |
| 0.2.7 | 2026-04-30 | **§2** **TT-9628** 摘要增 **§0** **独立开发模式**（**v0.1.4**）。 |
| 0.2.9 | 2026-04-30 | **§1** 步 **10c** **禁止假完成**（**TT-9628 §0.0.5** ↔ **CONTRIBUTING#no-false-completion**）；**§2** **TT-9628** 一句摘要增 **§0.0.5**。 |
| 0.2.10 | 2026-05-01 | **§1** 步 **10d** / **10e**（**TT-9628 §0.0.2a** 机读闸索引、**§0.0.3** **`report.json`** 路径）；**§2** **TT-9628** 一句摘要增 **§0.0.2a** / **§0.0.3**。 |
| 0.2.11 | 2026-05-01 | **§5** 表增 **[sqlx-migration-ops](sqlx-migration-ops.md)**（**IMP-DB-001**）。 |
| 0.2.12 | 2026-05-01 | **§5** 表增 **[evidence-manifest-appendix-zero-map](evidence-manifest-appendix-zero-map.md)**（**IMP-EV-002** / **IMP-EV-003**）。 |
| 0.2.13 | 2026-05-01 | **§5** 表增 **[ci-slo-baseline-and-timeout-notes](ci-slo-baseline-and-timeout-notes.md)**（**IMP-CI-001** / **IMP-CI-002**）。 |
| 0.2.14 | 2026-05-01 | **§5** 表增 **[next-batch-gap-remediation-implementation-plan](next-batch-gap-remediation-implementation-plan.md)**（**§6** **IMP-*** **收口** **编** **目** **互** **指** **）。 |
| 0.2.15 | 2026-05-01 | **§1** 步 **10f**（**[93-matrix · 下一批执行指针](93-matrix-batch-tracker.md#tt-93-matrix-next-batch-pointer)**）；**§5** **93-matrix** 行增同锚；**93-matrix** **v1.1.5** 落地 HTML 锚 **`tt-93-matrix-next-batch-pointer`**。 |
| 0.2.16 | 2026-05-01 | **§5** 表增 **[TT-93-guide-schedule-next-001](TT-93-guide-schedule-next-001.md)**（**`/guide` P2** 薄入口）；**93-matrix** **v1.1.6**（**Admin** **证据** **README** **维护** **条** **）** **。** |
| 0.2.17 | 2026-05-01 | **§1** 步 **10g**（**[TT-93 稳定锚](TT-93-guide-schedule-next-001.md#tt-93-guide-schedule-next-001)**）；**§2** **TT-9628** 摘要增 **v0.1.19** **`/guide`** **互** **指** **；** **TT-9628** **v0.1.19** **/** **TT-93** **v0.1.1** **/** **93-matrix** **v1.1.7** **。** |
| 0.2.18 | 2026-05-01 | **§5** **TT-93** 行摘要随 **v0.1.2**；**93-matrix** **v1.1.8** **文档** **维护** **条** **。** |
| 0.2.19 | 2026-05-01 | **§5** **TT-93** **v0.1.3** **（** **F-023** **/** **3012** **）** **；** **93-matrix** **v1.1.9** **。** |
| 0.2.20 | 2026-05-01 | **`PLAYWRIGHT_E2E_NO_WEBSERVER`** **（** **frontend/playwright.config** **）** **；** **TT-93** **v0.1.4** **/** **93-matrix** **v1.1.10** **。** |
| 0.2.21 | 2026-05-01 | **`meta-chain-contracts`** **NO_WEBSERVER** **早** **退** **；** **TT-93** **v0.1.5** **/** **93-matrix** **v1.1.11** **。** |
| 0.2.22 | 2026-05-01 | **`tt-93-guide-order-accept-request.spec.ts`** **；** **TT-93** **v0.1.6** **/** **93-matrix** **v1.1.12** **。** |
| 0.2.23 | 2026-05-01 | **[R-002 §4](../spec/R-002-回归执行闭环与发布准入.md)** **v1.0.10** **映射** **行** **；** **TT-93** **v0.1.7** **/** **93-matrix** **v1.1.13** **。** |
| 0.2.24 | 2026-05-01 | **§1** 步 **10e-b**（**TT-9628 §0.0.2b** **双人拆线**）；**§2** **TT-9628** 一句摘要增 **§0.0.2b**；**TT-9628** 版本指针 **v0.1.20**。 |
| 0.2.25 | 2026-05-01 | **§1** 步 **10e-c**（**TT-9628 §0.0.4** **叙事互指 `rg`**）；**§2** **TT-9628** 一句摘要增 **§0.0.4**；**TT-9628** 版本指针 **v0.1.22**。 |
| 0.2.26 | 2026-05-01 | **§2** **TT-9628** 版本指针 **v0.1.23**（**§0.0.4** **`rg`** 面增 **`docs/00-文档索引.md`**）。 |
| 0.2.27 | 2026-05-01 | **§1** **步 10e-c** 显式 **`docs/00`（B-179）**；**§2** **TT-9628** 一句摘要增 **`docs/00`**；**TT-9628** 版本指针 **v0.1.24**（**`docs/00` §2** 去伪 **`docs/README`** 版本表叙事、**`spec/00`** 伴侣行 bump）。 |
| 0.2.28 | 2026-05-01 | **§2** **TT-9628** 版本指针 **v0.1.25**（**§0.0.3** **ISS-007** **`PARTIAL_GO`** / **`--require-go`** 分轨、**§0.0.2a** **段** **3** **预链** **注**、**`evidence/GO_local_r002_verify/README.md`**）；与 **CONTRIBUTING** **`#no-false-completion`** 对拍。 |
| 0.2.29 | 2026-05-01 | **§1** **步 10e-c** 增 **`docs/README`**；**§2** **TT-9628** 一句摘要增 **`docs/README`**；**TT-9628** 版本指针 **v0.1.26**（**`docs/README`/`spec/00`** **伴侣行** + **`rg` `docs/README.md`**）。 |
| 0.2.30 | 2026-05-01 | **§2** **TT-9628** 版本指针 **v0.1.27**（**§0.0.4** **触发句** 显式 **`AI协作话术` §0.2**；**AI话术** **极简版** **§0.0.4** **锚**）。 |
| 0.2.31 | 2026-05-01 | **§1** **步 10e-c** 增 **`from-stash`/`母表`**；**§2** **TT-9628** 一句摘要同上；**TT-9628** **v0.1.28**（**§0.0.4 `rg`** **路径** **+** **触发句**；**CONTRIBUTING** / **`docs/README`** **对拍**）。 |

---

**文档结束**
