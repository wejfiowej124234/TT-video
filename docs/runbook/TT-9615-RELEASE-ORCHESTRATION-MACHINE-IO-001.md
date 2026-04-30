# TT-9615 · 96-15 Tier A→B→C 机读编排 Runbook（I/O 契约 · MVP）

**Version:** 1.0.1  
**Status:** Living — **实现入口**：`scripts/release/run_96_15_orchestration.py`；**合并进 R-001**：`scripts/release/merge_orchestration_into_report.py`；**GO 建议机**：`scripts/release/go_state_machine.py`；**JSON Schema**：`scripts/schemas/release_orchestration_report.schema.json`。  
**Parent：** **[96-15 §1](../spec/96-15-深度多维度检查与审计体系.md)**、**[R-001](../spec/R-001-全站回归报告模板与汇总JSON结构.md)**、**[R-002](../spec/R-002-回归执行闭环与发布准入.md)**、**[go-live-checklist.md](../go-live-checklist.md)**。

---

## 0. 边界（必读）

- **本 Runbook 不替代** **`go-live-checklist.md`** 的 **Production GO** 四维判定；亦不替代 **93** **`release_gate`** 语义。  
- **`go_state_machine.py` 输出**为 **`release_verdict_suggestion`**（机读建议 + **自动归因**），供 **CI / 证据包** 使用；**对外签字**仍以 **缺口官方总表**、**人签**、**go-live** 为准。  
- **P0 最小闭环（Tier A）**：**A1/A2** 为 **半自动**（证据文件存在且 ≥ 64 字节；路径由 **`--tier-a1-readme` / `--tier-a2-markdown`** 或 **`TT_TIER_A1_README` / `TT_TIER_A2_MARKDOWN`** 提供；**`--require-tier-a-semiauto`** 时缺路径记 **FAIL**）；**A3** 为 **B-421** 全自动。**Tier B/C** 在本阶段 **仅** **`MANUAL_REQUIRED`**，**不**参与 **`go_state_machine.py`** 的放行结论（仍为确定性 **`NO_GO` / `SOFT_GO`** 二元）。

---

## 1. 标准化 I/O 契约总表（96-15 §1 对齐）

| Tier | 序 | Step ID | 输入源（Input） | 执行命令（Command） | 期望输出（Expect） | 证据路径（Evidence） | 96 分册 | 95 F 行提示（索引，非 SSOT） |
|------|-----|---------|-------------------|----------------------|--------------------|----------------------|---------|-------------------------------|
| **A** | 1 | `TIER-A-1` | **15** 附录〇 + **P0 十二项 / 人签** 材料指针（**机读**：README 路径） | **半自动**：`run_96_15_orchestration.py` 校验证据文件 **存在且 ≥ 64 字节**（**不**替代人工阅读） | 状态 **PASS / FAIL / MANUAL_REQUIRED**（缺路径且未 `require` 时为 **MANUAL**） | `evidence/GO_96_bundle_<D>/README.md` 等 | 96-11 / 15 | 与 **§8.2** 卫星 / ISS 并联，**不**单列 F |
| **A** | 2 | `TIER-A-2` | **59** 九维 **P0** 表快照（**机读**：markdown 路径） | **半自动**：同上 | 同上 | `evidence/GO_96_15_deep_<D>/59_p0_table.md` | 96-15 / 59 | **F 行** 间接：收口后回填 **§8.2** |
| **A** | 3 | `TIER-A-3` | 仓库 `scripts/check-runbook-golive-doclink-gate.sh` + `ops/` / `docs/` 互指真值 | **`bash scripts/check-runbook-golive-doclink-gate.sh`**（仓库根） | **exit 0**；stderr 无未处理致命错误 | `<out_dir>/b421.log`（脚本落盘） | 96-11 / B-421 | **GATE**（归因 **R-002** 并联文档链） |
| **B** | 4 | `TIER-B-4` | **66 / 51 / 53-深度** 当前 HEAD | **人工**：本轮 scope 快扫 | 阅读记录 1 页；无隐藏 P0 | `evidence/GO_96_15_deep_<D>/tier_b_read_notes.md` | 96-12 | 与 **§9 ISS** / 缺口表并联 |
| **B** | 5 | `TIER-B-5` | **27-P0～P50** 与 scope 交集 | **人工**：Owner + 截止 | 不替代 **§8.2** 行完成 | 同上或 bundle README | 96-12 / 27 | **§8.2** 真值仍在 **95** |
| **C** | 6 | `TIER-C-6` | **96-13** + **96-16** + **92** | **人工 / E2E 子集**：D1～D12 抽样 | **§4 F 区**覆盖声明 | `evidence/GO_96_15_deep_<D>/d_matrix.md` | 96-13 / 96-16 | **F 区**订单/托管相关 **F-008～F-029** 等（见 **`f_row_96_evidence_hints.json`**） |
| **C** | 7 | `TIER-C-7` | **code-maps / snapshots** + **04** | **人工**：冲突登记 | 冲突 → 开债；**04** 为契约 SSOT | `evidence/GO_96_15_deep_<D>/04_drift_register.md` | 96-12 | **M**/**路由** 相关 F 行 |

---

## 2. `release_orchestration.json`（侧车文件）

- **路径约定**：与 **`report.json`** 同目录，或任意路径；合并时用 **`merge_orchestration_into_report.py`** 写入 **`report.json`** 顶层 **`orchestration`**。  
- **Schema**：`scripts/schemas/release_orchestration_report.schema.json`（`schema_version` **`"1"`**）。  
- **F ↔ 96 映射索引**：种子数据 **`scripts/release/data/f_row_96_evidence_hints.json`**（可增不可删语义键；删改须 **台账** 或 PR 说明）。

---

## 3. CI 与 GO 状态机（建议值 · Tier-A P0 二元）

**策略 ID**：**`tier_a_p0_minimal_binary_v1`** — **`release_verdict_suggestion`** **仅** **`NO_GO`** **或** **`SOFT_GO`**（**永不** **`PRODUCTION_GO` / `INSUFFICIENT_DATA`**）；**Tier B/C** 的 **`MANUAL_REQUIRED`** **不**拉低为 **`NO_GO`**。

| `release_verdict_suggestion` | 条件 |
|--------------------------------|------|
| **`NO_GO`** | 任一 **`TIER-A-*`** 状态为 **`FAIL`**；**或** 合并后的 **`report.json`** 存在且顶层 **`release_gate`** = **`NO_GO`**；**或** **`release_gate`** 缺失 / 非 **`GO`/`PARTIAL_GO`/`NO_GO`**（结构级视为 **`NO_GO`**） |
| **`SOFT_GO`** | **非** 上述 **`NO_GO`** 的全部其它情况（含：无 **`report.json`**；**`release_gate`** = **`GO`** 或 **`PARTIAL_GO`** 但 **Tier A** 未全 **`PASS`**；**A1/A2** 为 **`MANUAL_REQUIRED`** 等）— **非生产签字**；**不**替代 **go-live** |

**自动归因**（`attributions[].domain`）：**`95`**、**`96`**、**`93`**、**`R002`**、**`GATE`**（与步骤 **`primary_attribution_if_fail`** 对齐）。

---

## 4. 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.1 | 2026-04-25 | **Tier A** 全链：**A1/A2** 半自动文件门 + **A3** B-421；**B/C** 固定 **MANUAL**；**`go_state_machine`** 二元 **`NO_GO`/`SOFT_GO`**；**`summary.tier_a_all_pass`** + **`tier_bc_scope_manual_only`**。 |
| 1.0.0 | 2026-04-25 | 初版：I/O 总表 + 侧车 JSON + CI/状态机语义 + **MVP** 仅 **A.3** 全自动。 |

---

**End of TT-9615**
