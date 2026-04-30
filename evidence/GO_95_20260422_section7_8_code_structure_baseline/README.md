# GO_95 · §7.8 代码结构基线重验（2026-04-22）

## 1. 目的

在 **《95》§7.8** **3/3 `[x]`** 已落款的前提下，复跑 **JSON·04 读合同子集**、**04 路由闸**，并对 **§7.8 §1/§3** 代表性超长文件 **重数 `wc -l`**，确认与 **`…section7_8_code_structure/README.md`** 清册**无漂移**（或记录漂移）。

## 2. 命令与结果（仓库根）

```bash
cargo test -p traveltrust-api read_contract
# → 13 passed; 0 failed

bash scripts/run-check-04-routes.sh
# → exit 0

wc -l crates/api/src/routes/admin/mod.rs frontend/app/admin/indexer/reconcile-reports/page.tsx
# →   9785 crates/api/src/routes/admin/mod.rs
# →    992 frontend/app/admin/indexer/reconcile-reports/page.tsx
```

与 **`evidence/GO_95_20260422_section7_8_code_structure/README.md`** **§1**（**9785**）/**§3**（**992**）一致。

## 3. 主叙事 SSOT

**`evidence/GO_95_20260422_section7_8_code_structure/README.md`** — **`>800` route Top**、**`page.tsx`>500** 全表、**[48 §14.5](48-后端模块化拆分与落地清单.md)** / **[43 §2.7](43-阶段-前端UI模块化拆解与最佳实践.md)** 计划落款。

## 4. 诚实边界

- **`read_contract` 13** **不**替代 **04** 全写体人审、**§8.2** 行完成、**§12.2·C-1/C-4** 主批次。
- **计划落款 ≠ 已拆分**；若 **`wc -l`** 与清册分叉，须更新 **§8** 证据清册并登记 **§12.4**。
