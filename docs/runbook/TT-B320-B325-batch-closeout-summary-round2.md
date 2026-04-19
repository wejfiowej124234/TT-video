# B-320～B-325 第二轮批次收官总结（Runbook）

**日期**：2026-04-15  
**范围**：母表 **B-320**～**B-325** 对应 TT **均已 docs-only 封口**；本页为 **第二轮** 批次级 **规则升格 · 空集确认 · 缺口四类归纳**，细节仍以各卡专用 Runbook 为准。  
**纪律**：**暂停继续开卡**（本页 **不** 新增母表 backlog）；**不** bump **07** 文首完成度、**不**改 **04** 契约表。

**互证**：前序 **311～319** 批次见 [`TT-B311-B319-batch-closeout-summary.md`](./TT-B311-B319-batch-closeout-summary.md)；缺口 **四类** 总表见 [`gap-category-taxonomy-master-table.md`](./gap-category-taxonomy-master-table.md)（该表 **runtime** 列与本页 **evidence** 列 **对读**，见 **§4**）。

---

## 1. 批次一览

| 母表 | TT 卡号（节选） | 主题 | 封口形态 | 专用 Runbook |
|------|-----------------|------|----------|--------------|
| **B-320** | `TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC-001` | **NEXT_PUBLIC_*** 与 **`frontend/.env.example`** 机读 diff | **docs-only** | [`TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC.md`](./TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC.md) |
| **B-321** | `TT-B321-I18N-KEY-PARITY-LINT-SPEC-001` | **en/zh** 键对称与 **`test:i18n:ci`** 规格 | **docs-only** | [`TT-B321-I18N-KEY-PARITY-LINT-SPEC.md`](./TT-B321-I18N-KEY-PARITY-LINT-SPEC.md) |
| **B-322** | `TT-B322-CI-TSC-VITEST-BUDGET-DOC-001` | **CI** 分轨 **`tsc` / Vitest / `cargo test`** 叙事与预算登记 | **docs-only** | [`TT-B322-CI-TSC-VITEST-BUDGET-DOC.md`](./TT-B322-CI-TSC-VITEST-BUDGET-DOC.md) |
| **B-323** | `TT-B323-API-CARGO-FEATURES-SURFACE-MAP-001` | **`traveltrust-api`/`core`** **Cargo `[features]`** 暴露面 | **docs-only** | [`TT-B323-API-CARGO-FEATURES-SURFACE-MAP.md`](./TT-B323-API-CARGO-FEATURES-SURFACE-MAP.md) |
| **B-324** | `TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER-001` | **SQLx** 迁移正向/回滚策略与 **RUNBOOK** 指针 | **docs-only** | [`TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER.md`](./TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER.md) |
| **B-325** | `TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP-001` | **`manifest.json`** 与 **15 附录〇** 勾选/签字映射 | **docs-only** | [`TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP.md`](./TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP.md) |

**索引**：[`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **330～335** 与各 `### TT-B32x...` 节。

---

## 2. 归纳规则升格项（本批从「审计句」抬为可复用纪律）

| # | 升格内容 | 来源 | 用途 |
|---|----------|------|------|
| R1 | **`frontend/.env.example`** 为 **NEXT_PUBLIC_*** **示例与说明 SSOT**；机读 diff 的 **A 集** **不**与仓库根 **`.env.example`** 键级合一（根文件为 **后端/互指**） | B-320 | 后续 env 缺口登记 **先** 跑 **B-320 §1** 规则，**再** 决定是否补示例行 |
| R2 | **`test:i18n:ci`** **已接入 CI**，本批将 **脚本行为** **升格为台账级规格**（键对称、关键前缀、关键路由、`exit 1` 语义） | B-321 | 与 **13-1 / 53 BB2** **互补**；嵌套 locale 结构若出现须 **另开 TT** |
| R3 | **本地预检** **`cargo test -p traveltrust-api`** **vs** **CI** **`cargo test --workspace`** **分轨** 为 ** intentional 减负**，**非** 本批改为一致 | B-322 | 排期/评审时 **不**将「窄预检」误报为 CI 缺陷 |
| R4 | **04 `admin/flags`** = **运行时** 产品开关；**Cargo `[features]`** = **编译期** 开关 — **术语分轨** | B-323 | 防 **双 SSOT**；首增 **`[features]`** 须 **同批** 母表 + **04/契约** 钉边界 |
| R5 | **迁移** **单源** **`crates/api/migrations/`**；策略义务分散在 **04 §四 P0**、**RUNBOOK §100/§2.6**、**41**、**55 §1.2** — **指针聚合** **不**等于 **Runbook 专章** | B-324 | 发版/DB 运维 **按指针通读**，**不**要求本批重组 **RUNBOOK** 目录 |
| R6 | **`manifest.json`** **`sign_off[]`**（工程/过门）**≠** **08-4** 法务/运营签字；**≠** **08-2** 审查人元数据 — **三线并行填实** | B-325 | 监管级发版 **不**能仅靠 **bundle 内** 字符串替代 **08-4** |
| R7 | **一览 376** **`TT-B322-TESTNET-…`** = **B-275** **协记**；**勿**与 **B-322 CI 预算** / **一览 332** 混读 | B-322 | 索引与复盘 **防糊**（批次内 **已** 多处互指） |

---

## 3. 空集确认项（真值为「无」或「映射表为空」）

| 项 | 确认结论 | 卡 |
|----|----------|-----|
| **Cargo `[features]`** | Workspace / **`crates/api`** / **`crates/core`** **均无** **`[features]`** 段；**`crates/api/src`** **无** **`cfg(feature)`** — **暴露面映射表为空集** | B-323 |
| **i18n 键对称** | **`check-i18n-coverage.mjs`** 审计复跑 **通过**；**`missing_in_en` / `missing_in_zh`** **为空** | B-321 |
| **CI 命令顺序** | **`build.yml`** 与 **63 / 07 / CONTRIBUTING** 在「无分钟级 SLO 表」前提下 **叙述一致** | B-322 |
| **NEXT_PUBLIC 差分** | **`A \\ B`**（示例有而代码未引用）**无**须本批删除的孤立项；**`B \\ A`** **仅登记** **`NEXT_PUBLIC_DISABLE_IDLE_PREFETCH`** 示例漏行（**不**在本卡补文件） | B-320 |

**说明**：空集 **不**表示「工程无工作」— **B-323** 明确 **固定真值** 避免误读为「地图未写完」。

---

## 4. 缺口分类（env / CI / DB / evidence）与本批残留登记

本段 **四类** 与 [`gap-category-taxonomy-master-table.md`](./gap-category-taxonomy-master-table.md) **对读**：该表 **runtime** 列 ≈ 本页 **evidence** + **编译期/API 暴露面（B-323）** 的合并叙述；**本批收口** 以 **下表** 为 **B-320～B-325** 专用摘要。

| 类别 | 覆盖卡 | 本批已登记的典型缺口（仅记录、未强制作业） |
|------|--------|---------------------------------------------|
| **env / config** | **B-320** | **`NEXT_PUBLIC_DISABLE_IDLE_PREFETCH`**：**代码已读**、**`frontend/.env.example` 未示例** — 建议后续单 TT 或文档同批 **补注释示范行** |
| **CI** | **B-321**、**B-322** | **B-322**：无 **分轨分钟级 SLO 表**；**`build.yml`** **单步未设** **`timeout-minutes`**。**B-321**：嵌套 locale 若引入须 **扩展脚本或约定**（当前 **空集**） |
| **DB 运维** | **B-324** | **无** **独立 SQLx 迁移 Runbook 专章**；**04 P0 回滚句** **vs** **up-only `*.sql`** **张力**；**`migration_rollbacks`** **台账** **≠** **全量 down**；**55 §1.2** **须随迁移** **O10** **同批更新** |
| **evidence** | **B-325** | **无** **附录〇 序号 ↔ manifest 键** **机读单表**（**B-309** 管 **P0↔附录〇** **另一维**）；**`validate-evidence-manifest.sh`** **已移除**；**两层 manifest**（前端 **`gen-frontend-manifest`** **↔** **GO 根**）**手工聚合** **复杂度** |

**附：B-323** 归类为 **编译期/ crate 暴露面**，**不**写入上表 **evidence** 列；与 **B-325** **发版证据链** **正交**，与 **总表** **runtime** 行 **互证**。

---

## 5. 批次共性结论

| 结论类型 | 说明 |
|----------|------|
| **全批次 docs-only** | **B-320～B-325** **均未**以本批次 **修改** **`crates/**` **业务逻辑**、**迁移 SQL**、**workflow 语义** 为封口手段（与各 TT **范围** 一致）。 |
| **台账可复用** | 机读 diff 规则、i18n 规格句、CI 分轨真值、**Cargo features** 空集、DB 指针聚合、manifest↔附录〇 **均可作** **后续开卡** **前置阅读** **。 |
| **暂停开卡** | 本页 **不** 新增 **B-326+** **题面**；后续若继续 **07 对齐登记批**，须 **另起母表/索引** **决策** **后再** **开卡** **。 |

---

## 6. 运维与后续衔接（Runbook 提示）

- **环境示例**：补 **`NEXT_PUBLIC_*`** 示例前 **先** 对齐 **B-320 §1～§2**。
- **发版证据**：过门 **bundle** **按** **B-325** **与** **`evidence/README.md`**；**08-2 / 08-4** **并行** **不**省略。
- **DB 变更**：新增 **`.sql`** **须** **O10** **联动** **55 §1.2**、**04**、**41**（**B-324** **指针**）。
- **CI 预算**：若钉 **分钟 SLO** 或 **per-step timeout**，**须** **另开 TT** **并** **评估** **runner** **成本**（**B-322** **登记**）。

---

## 7. 本页用途

- **批次复盘**：一屏读完 **320～325** **升格规则**、**空集**、**四类缺口** **与** **残留登记**。
- **onboard / 治理**：与 **缺口分类总表**、**311～319 收官** **并列** **作** **入口** **，** **不** **替代** **母表** **、** **各 TT 正文** **或** **cargo test** **。**
- **下一阶段（实现补齐）**：已登记缺口 **→** **提案** **IMP-*** **见** [`next-batch-gap-remediation-implementation-plan.md`](./next-batch-gap-remediation-implementation-plan.md) **（** **非** **纯** **审计** **）** **。**

---

## 8. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-04-15 | 初版：第二轮批次收官；**暂停开卡** **声明** **；** **四类** **缺口** **归纳** **。 |
| 2026-04-15 | **互证** **：** **§7** **增加** **「** **实现** **补齐** **」** **指针** **→** **`next-batch-gap-remediation-implementation-plan.md`** **。** |
