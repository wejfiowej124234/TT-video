# GO_95 · §10.1 全仓库文档对齐 — 机读基线重验（2026-04-22）

## 1. 目的

对 **《95》§10.1** 五条已 **`[x]`** 的「文档真值」做**可重复机读**复核：**07 三线**、**`.env.example` 行数**、**04↔`api.ts`** 闸、**00 表内 95 行** 与 **《95》Version** **台账同批**。

## 2. 命令与结果（仓库根）

```bash
bash scripts/check-07-version-triple.sh
# → OK: 07 version triple aligned (1.0.858).

wc -l .env.example frontend/.env.example
# → 475 .env.example
# → 114 frontend/.env.example

bash scripts/run-check-04-routes.sh
# → exit 0（含 **178** **`api.ts`↔04** 路径）
```

## 3. **00 ↔ 95** 台账同批（本 PR）

- **`docs/spec/00-文档索引.md`** 表行 **95**：**Version** 与 **`docs/spec/95-…md` Version** 对齐为 **`v1.4.115`**；增 **§7.1～7.8 + §10.1 基线证据** 索引句；校正 **`U=43`** / **`C=43/78`** / **总完成度 % 35**（与 **95 §0.2** 机读派生一致）。

## 4. 与 §7 基线证据互指（横切）

| 证据目录 |
|----------|
| `evidence/GO_95_20260422_section7_1_page_domain_baseline/` |
| `evidence/GO_95_20260422_section7_2_frontend_business_ui_baseline/` |
| `evidence/GO_95_20260422_section7_3_api_contract_baseline/` |
| `evidence/GO_95_20260422_section7_4_chain_abi_baseline/` |
| `evidence/GO_95_20260422_section7_5_db_hydrate_baseline/` |
| `evidence/GO_95_20260422_section7_6_admin_internal_baseline/` |
| `evidence/GO_95_20260422_section7_7_partial_baseline/` |
| `evidence/GO_95_20260422_section7_8_code_structure_baseline/` |

## 5. 诚实边界

- **未**对 **docs/spec** 全量 **376** 篇做废止扫描；**27-archived** / **snapshots** 仍以 **既有 README** 为准。
- **§11.2 · 00↔95** 其余子条（全量 spec 对拍等）仍 **`[ ]`**。
