# GO_95 · §8.2 · F-021～F-025 审计复跑 · 2026-04-25

对应 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2**。**§3 主表** 本批行为 **PARTIAL**（**F-021～F-025**）；**不**替代 **93 · B/94** / **R-001** / **ISS-007**。

---

## 1 · 机读命令与结果（本轮）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api market_subsite::tests`** | **10 passed**（**F-021**/**F-022**） |
| **`cargo test -p traveltrust-api routes::guides::tests`** | **7 passed**（**F-023**；含 **`guide_stake_without_chain_off_*`**） |
| **`cargo test -p traveltrust-api p21_guides_create_list_get_stake`** | **1 passed**（**F-024** **chain_off** 内存主路径） |
| **`cargo test -p traveltrust-api guide_stake_without_chain_off_is_503_chain_off_unavailable`** | **1 passed**（与 **`routes::guides::tests`** 内同名测重复过滤；**F-024** HTTP **503**） |
| **`cargo test -p traveltrust-api routes::disputes::tests`** | **5 passed**（**F-025**；**b099**/**b118**/**503**） |

---

## 2 · 四验摘要

| F | 代码 / 路由 | 数据 / 负例 |
|---|-------------|-------------|
| **F-021** | **`market_subsite::router`** **`/api/v1/market/provider/*`** | **503**/**401**/**400**（**`market_subsite::tests`**） |
| **F-022** | 同上 **`/api/v1/market/acquisition/*`** | 同源 **10** 测 |
| **F-023** | **`guides.rs`** **`GET|POST /api/v1/guides`** 等 | **503**/**401**/**生产安全默认** 下上传禁止 |
| **F-024** | **`POST /api/v1/guides/:id/stake`**（**`guides.rs`** **`guide_stake`**） | **`p21_guides_create_list_get_stake`** + **无 chain_off → 503** |
| **F-025** | **`disputes.rs`** **`GET /api/v1/disputes`**、**`/:id`** | **503**/**400 cursor**/**b118 PG 契约体** |

**路由挂载锚**：**`market_subsite.rs`** **`router()`**（约 **L553–L586**）；**`guides.rs`**（约 **L527–L531**）；**`disputes.rs`**（约 **L35–L36**）。

---

## 3 · §8.2 五格（与 **95** 母表一致）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:------:|:--:|:---:|:----:|:------:|
| F-021～F-025 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |

**§3.1**：**不得**勾选。

**注**：**`routes::disputes::tests`** 中 **`b118_*_pg_success_*`** 在 **`DATABASE_URL`** 已设环境下参与 **5 passed**；**仍不**升格 **§8.2** **API·IT**/**行完成**（**无** **`auth_register_*` 风格** 专母文件；**95** **§8.2** 脚注）。

---

## 4 · §9

**ISS-007**；**ISS-002**。
