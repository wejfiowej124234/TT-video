# GO_95 · §7.8 代码结构机读复验（补充 · 2026-04-22）

## 1. 目的

在 **《95》§7.8** **3/3 `[x]`** 已落款的前提下，复跑 **`read_contract`** 子集、**`check-07-version-triple`**、**04 路由闸**，并对 **`…section7_8_code_structure/README.md`** 代表性锚点 **重数 `wc -l`**，与 **v1.4.114** **`…section7_8_code_structure_baseline/README.md`** 并列登记（**不**改 **U/C/总%**）。

## 2. 命令与结果（仓库根）

```bash
bash scripts/check-07-version-triple.sh
# → OK: 07 version triple aligned (1.0.858).

bash scripts/run-check-04-routes.sh
# → exit 0（各 check-* OK）

cargo test -p traveltrust-api read_contract
# → 13 passed; 0 failed

wc -l crates/api/src/routes/admin/mod.rs frontend/app/admin/indexer/reconcile-reports/page.tsx
# →   9785 crates/api/src/routes/admin/mod.rs
# →    992 frontend/app/admin/indexer/reconcile-reports/page.tsx
```

与 **`evidence/GO_95_20260422_section7_8_code_structure/README.md`** **§1**（**9785**）/**§3**（**992**）及 **`…section7_8_code_structure_baseline/README.md`** 一致。

## 3. 主叙事 SSOT（并列）

- **`evidence/GO_95_20260422_section7_8_code_structure/README.md`** — **`>800` route Top**、**`page.tsx`>500**、[48 §14.5](../../docs/spec/48-后端模块化拆分与落地清单.md)、[43 §2.7](../../docs/spec/43-阶段-前端UI模块化拆解与最佳实践.md)。
- **`evidence/GO_95_20260422_section7_8_code_structure_baseline/README.md`**（**v1.4.114**）— 同上命令链的基线重验包。

## 4. 诚实边界

- **`read_contract` 13** **不**替代 **04** 全写体人审、**§8.2** 行完成、**93**/**E2E**。
- **计划落款 ≠ 已拆分**；**不**将 **`admin/mod.rs` 9785** 误读为 **已物理拆分**；**§12.2·C-1/C-4** 主批次仍 **`[ ]]`**（以 **95** 正文为准）。
