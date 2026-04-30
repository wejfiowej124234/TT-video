# GO_20260423 · local · R-001 切片（ISS-007 母题 · 93 锚点三则）

**目的**：为 **R-002 S2～S3** 提供**可复核**的 **`report.json`**（**R-001 `schema_version:1`**），用例态与 **`cargo test` 真跑**对齐；**不**宣称 **93 全矩阵 PASS**、**不**替代 **CI `build.yml`·`e2e` job** / **staging 全矩阵**（**§9 · ISS-007** 主干仍开）。

## 环境四元组（与 `report.json.environment` 一致）

| 字段 | 值 |
|------|-----|
| `name` | `local` |
| `database` | `enabled`（`127.0.0.1:5432/traveltrust`） |
| `chain_mode` | `chain_off`（测试内 **`P3_CHAIN_OFF=1`** 等见各测模块） |
| `auth_mode` | `bearer` |

## 复现（仓库根）

**前置**：本机 Postgres 可连 **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与 **CI `e2e` job** `services.postgres` 同源口径）。

```bash
export DATABASE_URL="postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust"
cargo test -p traveltrust-api matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg -- --test-threads=1
cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg -- --test-threads=1
cargo test -p traveltrust-api matrix_93_d_idx_001f_f029_post_internal_indexer_reconcile_persist_true_app_stack_ok_pg -- --test-threads=1
python scripts/validate-regression-report.py evidence/GO_20260423_local_api_it_r001_matrix_slice/report.json
```

## 记录（本轮登记）

| 项 | 值 |
|----|-----|
| **commit** | `48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5` |
| **`cargo test` 结果** | 上列 **3 / 3** **`ok`**（**2026-04-23T11:28:08Z** 前后） |
| **对应 93 ↔ F** | **D-ITN-001**↔**F-012**；**B-ORD-005**↔**F-013**；**D-IDX-003**↔**F-029** |

## 诚实边界

- **§8.2 母表**：**F-012 / F-013 / F-029** 行 **「行完成」** 早已 **`[x]`**（**v1.4.253** 等脚注）；本包**不**新增母表勾号，仅补 **R-001 机读链**。
- **ISS-007**：全矩阵 **`report.json`** / **`build.yml`·`e2e` 全绿** 仍为主干缺口；本目录为 **local 切片 + 三用例 PASS** 证据，属 **R↑** 侧车，**非** **ISS-007 `[x]`**。
