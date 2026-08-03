# TT V65 · Batch Release Closure（发布工程模式）

**STATUS:** `ACTIVE`  
**Stamp:** `20260803T040941Z`  
**Supersedes (process):** 单问题 → 马上 Production Deploy 的碎片化上线习惯  
**Does NOT flip:** `TT_PRODUCTION_GO` · Web3 pin · Composition pin

## 为什么改

碎片化路径（修一个 → 马上更新 Production → 再发现 → 再更新）会导致：

- 发布次数过多
- Runtime 漂移
- Evidence 过碎
- 真源难管理
- 「本地 PASS · 生产旧包」反复出现（V65 OPEX / Workbench 已暴露）

## 真源链（写死）

```text
V65 Product Truth
        ↓
Release Candidate Batch（冻结 · 本地全量验证）
        ↓
Production Runtime（一次 Build · 一次 Deploy · Runtime Evidence）
```

**禁止：** Local → 直接 Production（除 P0 线上事故）。

## 流程（Batch Closure）

1. 深度审查（Audit）
2. 收集 Gap Inventory
3. 批量修复（在 Batch 内）
4. 本地完整验证
5. 形成 Release Batch（Freeze）
6. 一次 Commit
7. 一次 Build
8. 一次 Production Deploy
9. Runtime Verify（Git = Build = Deploy = Runtime）

## 批次规模

| 档位 | 问题数 | 适合 |
|------|--------|------|
| 小批次 | 10–30 | 文案 · 样式 · locale · 小组件 |
| 中批次 | 30–80 | 单模块 / 单业务域（如 Finance UX） |
| 大批次 | 100+ | **必须拆模块** · 禁止一次动全部 |

**日常建议：** 每批 **10–50** 项（Admin UX / UI / Locale / Workbench 默认落此区间）。

## Daily Release Window

每天最多 **1** 次 Production 更新（P0 例外）。

建议节奏：

| 时段 | 动作 |
|------|------|
| 上午 | Audit → Gap Inventory |
| 下午 | Batch Fix + 本地全量验证 |
| 晚上 | Release Cut（Freeze → Commit → Build → Deploy → Runtime Evidence） |

Daily Cut ID 示例：`V65-BATCH-20260803`

每个 Cut 必须登记：

- Batch ID
- Commit SHA
- Build / artifact SHA（与 release-identity 对齐）
- Deploy 证明
- Evidence 目录
- Gap Inventory 关闭项计数

## 四条硬规则

### Rule 1 · 一切进 Batch

任何修复必须进入 Gap Inventory → Release Batch。  
**禁止：** 单个小修 → Production。  
**唯一例外：** P0 线上事故（须单独事故单 + Evidence）。

### Rule 2 · Batch 必须有冻结点

例如 `V65 Admin UX Batch Freeze` 之后：**只验证 · 不扩范围**。  
新发现 → 进入下一 **V65 Admin UX Batch**（仍在 V65 · **禁止** V65.x 新版本号），不回流当前 Freeze。

### Rule 3 · Production 节奏

一天最多 **1** 次正式 Production Deploy。P0 例外。

### Rule 4 · 四源一致才算完成

每次更新必须同时验证：

`Git SHA` = `Build / artifact SHA` = `Deploy tip` = `Runtime /meta|/release-identity`

否则：**不算完成** · 不得宣称 Batch CLOSED。

## 当前 ACTIVE Batch

| 键 | 值 |
|----|-----|
| Batch | **V65 Admin UX Batch Closure**（`not_a_new_version: true` · 仍在 **V65**） |
| Status | `FROZEN_BATCH_FIX_APPLIED`（Freeze Gate PASS · locale Wave-1 已落盘） |
| Scope | Admin UI · UX · Locale · Dashboard · Workbench · 真网发现 |
| Gate | Freeze PASS · Runtime Evidence（G005 CLOSED_CAMPAIGN · OPEN_VERIFY 19 项） |
| Inventory stamp | `20260803T040941Z` · OPEN **19**（P0=0 · P1=0 · P2=19）· locale patched **61** |
| Freeze gate | **PASS** · P0=0 · P1=0 · P2≤50 · batch_size_ok |
| Gap Inventory | [`TT-V65-ADMIN-UX-BATCH-GAP-INVENTORY-LATEST.md`](./TT-V65-ADMIN-UX-BATCH-GAP-INVENTORY-LATEST.md) · [`.json`](./TT-V65-ADMIN-UX-BATCH-GAP-INVENTORY-LATEST.json) |
| Evidence pack | [`evidence/GO_v65_admin_ux_batch/20260803T040941Z/`](../../evidence/GO_v65_admin_ux_batch/20260803T040941Z/) |
| Machine JSON | [`TT-V65-BATCH-RELEASE-CLOSURE-LATEST.json`](./TT-V65-BATCH-RELEASE-CLOSURE-LATEST.json) |
| Next | **One Commit → One Build → One Production Deploy → Runtime Evidence**（**禁止**碎片 Deploy） |

## 过渡说明（诚实边界）

Production Web tip `87a5686f…`（Workbench polish）属于 Batch Closure **生效前**的末次碎片化上线。  
自本 SSOT `ACTIVE` 起：后续 Admin UX 类变更 **不得**再单问题上线；统一进入 **V65 Admin UX Batch** Inventory（仍在 **V65** 真源 / tip 上）→ 一次 Cut。

## 机器消费

- Process JSON: [`TT-V65-BATCH-RELEASE-CLOSURE-LATEST.json`](./TT-V65-BATCH-RELEASE-CLOSURE-LATEST.json)
- Cursor rule: `.cursor/rules/traveltrust-v65-batch-release-closure.mdc`
- Runtime SSOT 绑定: [`TT-V65-FINAL-RUNTIME-TRUTH-SSOT-LATEST.md`](./TT-V65-FINAL-RUNTIME-TRUTH-SSOT-LATEST.md)

**① 本地 Batch PASS ≠ ② Staging ≠ ③ Production GO。** `TT_PRODUCTION_GO: NO_GO` 仍独立。
