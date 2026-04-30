# 95 · §3 批次 F-011～F-015 · 四验 + §8.2 对齐（2026-04-22）

> 与 **`../spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**/**§8.2**/**§9** 对读；**不**宣称 **93 PASS** / **E2E 归档** / **§8.2「行完成」** / **§3.1 `[x]`**（**ISS-007**/**ISS-002**）。

## 1. 环境

- **`DATABASE_URL`**（**`tests_create_post_commerce`** 等）：`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`
- **Postgres**：`docker compose` 服务 **`healthy`**（与前几批一致）

## 2. 路由验证

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
bash scripts/run-check-04-routes.sh
```

**结果**：**exit 0**（**178** 路径 **`api.ts`↔04**）。

## 3. 机读命令与结果

| 过滤串 / 命令 | passed | failed | 备注 |
|---------------|--------|--------|------|
| `cargo test -p traveltrust-api set_order_escrow_address_impl_` | 2 | 0 | **`chain_off::tests_events_itinerary`** **F-011** |
| `cargo test -p traveltrust-api itinerary_create_impl_stores_draft_order_and_bundle` | 1 | 0 | **F-012** |
| `cargo test -p traveltrust-api confirm_final_plan` | 2 | 0 | **F-013**（**含** **409** 版本冲突） |
| `cargo test -p traveltrust-api get_feed_no_db_returns_database_required` | 1 | 0 | **F-014** |
| `cargo test -p traveltrust-api create_post_commerce_parse` | 5 | 0 | **F-015** 体解析 |
| `cargo test -p traveltrust-api tests_create_post_commerce`（**已 export `DATABASE_URL`**） | 3 | 0 | **F-015** **PG·IT** |

## 4. 分 F 四验（§3）

| F | 代码真值 | 路由 | 状态 | mock·PG |
|---|-----------|------|------|---------|
| **F-011** | **`set_order_escrow_address_impl`** **`tests_events_itinerary.rs`** | **`POST …/set-escrow-address`**（04 扇面） | 写地址 + **400** **`invalid_escrow_address`** 负例 | **2** UT（**内存 `chain_off`**，**非** 独立 **Router+PG** 专母） |
| **F-012** | **`itinerary_create_impl`** 同上 | **`POST /api/v1/itineraries`** | 草稿 + 订单同事务断言 | **1** UT |
| **F-013** | **`confirm_final_plan_impl`** 同上 | **`POST …/confirm-final-plan`** | snapshot + **409** 冲突 | **2** UT |
| **F-014** | **`routes/community/tests.rs`** | **`GET …/feed`** | 无池 **503/database_required** 类语义 | **1** UT |
| **F-015** | **`posts.rs`** **`parse_create_post_commerce_body`**；**`tests_create_post_commerce_db.rs`** | **`POST …/posts`** + **`commerce_*`** | **PG** 绑定 **listing** 权限 | **5+3** 测 |

**诚实边界（与 95 §8.2 脚注一致）**：**F-011～014** **§8.2·API·IT** 仍为 **`[ ]`**（**无** **`auth_register_login_logout_db_api_tests`** 对标 **`Router::oneshot`+PG** 专文件）；**F-015** **API·IT** 母表 **`[x]`** 已由 **`tests_create_post_commerce`** 支撑 — **本批复跑** **不**升格 **93**/**E2E**/**行完成**。

## 5. §9

- **不新增 ISS**；**ISS-007** 仍阻塞 **93**/**E2E**/**行完成**/**§3.1**。
