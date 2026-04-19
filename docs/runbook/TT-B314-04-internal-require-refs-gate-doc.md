# TT-B314 · 04 internal 路由 REQUIRE_REFS 门禁说明（登记）

**卡号**：`TT-B314-04-INTERNAL-REQUIRE-REFS-GATE-DOC-001` · **母表** `B-314`  
**日期**：2026-04-15  
**定位**：文档门禁说明（docs-only）；不改公开 HTTP 契约，不改 `crates/**` 业务实现。

## 本轮仅读文件清单（<=8）

1. `docs/任务母表.md`
2. `docs/AI任务卡索引.from-stash.md`
3. `docs/AI任务卡索引.md`
4. `docs/spec/04-后端与API.md`
5. `scripts/check-pr-crates-needs-metadata.sh`
6. `scripts/gates/check-pr-crates-needs-metadata.sh`

---

## 1) 审计结论

- `scripts/gates/check-pr-crates-needs-metadata.sh` 已具备 **`CRATES_METADATA_GATE_REQUIRE_REFS=1`** 语义：`BASE`/`HEAD` 解析失败时 **exit 2**，避免“门禁未执行却当通过”。
- 当前 04「零、SSOT Gate」已登记该变量，但未显式点名 **internal 路由契约/脚本改动** 的执行纪律（即“涉及 `crates/api/src/routes/internal/**` 或 `scripts/gates/**` 时，建议强制 refs 解析”）。

---

## 2) B-314 最小实现（文档登记）

在 `04` 的「单人开发元数据门禁」段补充一条纪律：

- 涉及 **internal 路由契约或门禁脚本**（如 `crates/api/src/routes/internal/**`、`scripts/gates/**`）的改动，执行元数据门禁建议使用：
  - `CRATES_METADATA_GATE_REQUIRE_REFS=1 bash scripts/check-pr-crates-needs-metadata.sh <BASE> <HEAD>`
  - 且 `<BASE>/<HEAD>` 需显式可解析（避免静默跳过）。

---

## 3) 边界

- 本卡不新增脚本，不调整 `check-pr-crates-needs-metadata.sh` 逻辑，不改变 `CRATES_METADATA_GATE_FAIL` 默认策略。
- 本卡不新增/删除 04 §3.4/§3.5 路由表行，仅补门禁执行说明。

---

## 4) 验收（本卡）

- `docs/spec/04-后端与API.md` 已出现 internal 路由场景下 `REQUIRE_REFS` 执行纪律句。
- 母表 `B-314`、from-stash 一览 `324` 与 `### TT-B314...` 同批互证并标记封口（docs-only）。
