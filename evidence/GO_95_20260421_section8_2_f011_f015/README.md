# GO_95 · §8.2 · F-011～F-015 生产级四验证据 · 2026-04-21

与 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2** 对读；**不**替代 **93 §7.1** / **R-001**。

---

## 1 · §3 对读

| F | 能力 | 前端（示例） | API（摘要） | §3 就绪 |
|---|------|--------------|-------------|---------|
| **F-011** | 设托管地址 | Escrow | `POST …/set-escrow-address` | PARTIAL |
| **F-012** | 行程草稿创建 | `/itinerary/new` | `POST /api/v1/itineraries` | PARTIAL |
| **F-013** | 确认最终计划 | 订单详情 | `POST …/confirm-final-plan` | PARTIAL |
| **F-014** | 社区 Feed | `/community/explore` | `GET …/feed` | PARTIAL |
| **F-015** | 发帖 | `/community/me` | `POST …/posts` | READY* |

---

## 2 · 四验与命令（登记日机读）

| F | 代码锚点 | 命令 | 结果 |
|---|----------|------|------|
| **F-011** | **`chain_off::tests_events_itinerary`** **`set_order_escrow_address_impl_*`** | **`cargo test -p traveltrust-api set_order_escrow_address_impl_writes_address`** | **1 passed** |
| **F-012** | 同上 **`itinerary_create_impl_*`** | **`cargo test -p traveltrust-api itinerary_create_impl_stores_draft_order_and_bundle`** | **1 passed** |
| **F-013** | 同上 **`confirm_final_plan_impl_*`** | **`cargo test -p traveltrust-api confirm_final_plan_impl_stores_snapshot_hash`** | **1 passed** |
| **F-014** | **`routes::community::tests`** | **`cargo test -p traveltrust-api get_feed_no_db_returns_database_required`** | **1 passed** |
| **F-015** | **`create_post_commerce_parse_tests`** + **`tests_create_post_commerce_db`** | **`cargo test -p traveltrust-api create_post_commerce_parse`**；**`cargo test -p traveltrust-api tests_create_post_commerce`** | **5 passed**；**3 passed**（**须 `DATABASE_URL`**；未设时 **skip**） |

**路由**：**`bash scripts/run-check-04-routes.sh`** → **exit 0**。

**93 映射（母表列仍 `[ ]`）**：**F-011** → **B-ESC-001** 等托管叙事；**F-012**/**F-013** → **B-ORD-001** 链延伸；**F-014**/**F-015** → **93 · D**（Feed / 发帖）；终验仍受 **ISS-007**（**v1.4.65** 起 **`build.yml`·`e2e`** 已接 **Postgres**；**须** **CI `e2e` 绿存档** 或 **`report.json` / R-001** 可索引条目）。

**E2E 旁证（列仍 `[ ]`）**：如 **`frontend/e2e/smoke-community.spec.ts`**（**`/community/explore`**、**`/community/me`** 等）— **不**单独闭 **§8.2** **E2E** 格。

---

## 3 · §8.2 五格（本批结论）

| 列 | F-011～F-014 | F-015 |
|----|--------------|-------|
| **UT** | **[x]**（与母表一致） | **[x]** |
| **API·IT** | **`[ ]`** | **`[x]`**（**`tests_create_post_commerce_db`**） |
| **93** | **`[ ]`** | **`[ ]`** |
| **E2E** | **`[ ]`** | **`[ ]`** |
| **负例** | **[x]**（见 **95 §8.2** **F-012～016** 脚注） | **[x]** |
| **行完成** | **`[ ]`** | **`[ ]`** |

**§3.1**：在 **行完成** 未全 **`[x]`** 前 **不得**勾选。

---

## 4 · **v1.4.68** 机读复跑（本机 · `DATABASE_URL` 已设 · 2026-04-21）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api set_order_escrow_address_impl_writes_address`** | **1 passed**（**F-011**） |
| **`cargo test -p traveltrust-api set_order_escrow_address_impl_rejects_invalid_escrow_address`** | **1 passed**（**F-011** **负例**） |
| **`cargo test -p traveltrust-api itinerary_create_impl_stores_draft_order_and_bundle`** | **1 passed**（**F-012**） |
| **`cargo test -p traveltrust-api confirm_final_plan_impl_stores_snapshot_hash`** | **1 passed**（**F-013**） |
| **`cargo test -p traveltrust-api confirm_final_plan_version_conflict_returns_409`** | **1 passed**（**F-013** **负例**） |
| **`cargo test -p traveltrust-api get_feed_no_db_returns_database_required`** | **1 passed**（**F-014**） |
| **`cargo test -p traveltrust-api create_post_commerce_parse`** | **5 passed**（**F-015** **UT**） |
| **`cargo test -p traveltrust-api tests_create_post_commerce`** | **3 passed**（**F-015** **API·IT**；**须** **`DATABASE_URL`**） |

**§2 表增量**：相对登记日初稿，本批补登 **`set_order_escrow_address_impl_rejects_invalid_escrow_address`**、**`confirm_final_plan_version_conflict_returns_409`** 两条 **1 passed** 机读。

---

## 5 · Agent 本机复跑（2026-04-22 · Cursor · Windows）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与 **F-001～010** 证据包同源）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api set_order_escrow_address_impl_writes_address`** | **1 passed**（**F-011**） |
| **`cargo test -p traveltrust-api set_order_escrow_address_impl_rejects_invalid_escrow_address`** | **1 passed**（**F-011** **负例**） |
| **`cargo test -p traveltrust-api itinerary_create_impl_stores_draft_order_and_bundle`** | **1 passed**（**F-012**） |
| **`cargo test -p traveltrust-api confirm_final_plan_impl_stores_snapshot_hash`** | **1 passed**（**F-013**） |
| **`cargo test -p traveltrust-api confirm_final_plan_version_conflict_returns_409`** | **1 passed**（**F-013** **负例**） |
| **`cargo test -p traveltrust-api get_feed_no_db_returns_database_required`** | **1 passed**（**F-014**） |
| **`cargo test -p traveltrust-api create_post_commerce_parse`** | **5 passed**（**F-015** **UT**） |
| **`cargo test -p traveltrust-api tests_create_post_commerce`** | **3 passed**（**F-015** **API·IT**） |

**§8.2 诚实边界不变**：**F-011～014** **API·IT**/**93**/**E2E**/**行完成** **`[ ]`**；**F-015** **93**/**E2E**/**行完成** **`[ ]`** — **ISS-007**；**§3.1** **禁勾**。

---

## 6 · Cursor agent 复跑（**2026-04-22** · 本对话 · **F-011～F-015**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与 **F-001～010** 证据包同源）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api set_order_escrow_address_impl_writes_address`** | **1 passed**（**F-011**） |
| **`cargo test -p traveltrust-api set_order_escrow_address_impl_rejects_invalid_escrow_address`** | **1 passed**（**F-011** **负例**） |
| **`cargo test -p traveltrust-api itinerary_create_impl_stores_draft_order_and_bundle`** | **1 passed**（**F-012**） |
| **`cargo test -p traveltrust-api confirm_final_plan_impl_stores_snapshot_hash`** | **1 passed**（**F-013**） |
| **`cargo test -p traveltrust-api confirm_final_plan_version_conflict_returns_409`** | **1 passed**（**F-013** **负例**） |
| **`cargo test -p traveltrust-api get_feed_no_db_returns_database_required`** | **1 passed**（**F-014**） |
| **`cargo test -p traveltrust-api create_post_commerce_parse`** | **5 passed**（**F-015** **UT**） |
| **`cargo test -p traveltrust-api tests_create_post_commerce -- --test-threads=1`** | **3 passed**（**F-015** **API·IT**） |

**结论**：与 **§5** 同日机读**同结果**；**不**升格 **§8.2** **93**/**E2E**/**行完成**/**§3.1**（**ISS-007**）。
