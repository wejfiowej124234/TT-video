# TT-93-guide-schedule-next-001 · `/guide` 档期与接单写路径（93 P2 薄入口）

<a id="tt-93-guide-schedule-next-001"></a>

**Version:** 0.1.7  
**阶次：** **①** 本地索引与对拍入口；**②** staging 真闭仍须 **R-003** / **93** 矩阵与证据链单独收口。

**仓库路径：** `docs/runbook/TT-93-guide-schedule-next-001.md`

---

## 互指

| 文档 | 用途 |
|------|------|
| [93-matrix-batch-tracker](93-matrix-batch-tracker.md) | **P2** `/guide` **档期/接单** **NOT RUN** 与「下一批执行指针」 |
| [53 阶段开发技术文档](../spec/53-阶段开发技术文档.md) | 双边协议、订单状态机、**53-Sx** 可执行清单 |
| [93 全站矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md) | **B-GDE-***、**B-ORD-*** 等向导侧用例 |
| [R-002 §4](../spec/R-002-回归执行闭环与发布准入.md) | **用例** **↔** **自动化** **映射** **（** **本** **TT** **相关** **行** **已** **登记** **）** |
| 批次 **`93-B-MKT-GDE`** | 未单开新批次 ID 前，扩展默认挂此批 |

---

## 代码与自动化入口（对拍用）

- **Next 路由**：`frontend/app/guide/page.tsx`，及 `frontend/app/guide/register/` 等。
- **`/guide` 首屏 UI（壳，非档期/接单写深链）**：`frontend/e2e/core-path.spec.ts` **「向导工作台可访问」**；`frontend/e2e/smoke.spec.ts` **`/guide`** **Bearer** **链**（与 **07 §5.0** 一致）。**不**替代 **93-matrix** **P2** **「** **档期** **/** **接单** **写** **」** **NOT** **RUN** **收口** **。**
- **烟测 / 基线**：`frontend/e2e/smoke.spec.ts`、`frontend/e2e/core-path.spec.ts`（历史 flake 注见 [TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md) §6.5）。
- **HTTP 契约**：以 **[04 §3.4](../spec/04-后端与API.md)** 为准；写路径须在 **04** 表内逐 METHOD/path 对齐后再改 **93** 五态。

### `/guide` 工作台 vs 公共向导页（防混读）

| 区域 | 典型 URL | 数据面（实现侧线索） |
|------|-----------|----------------------|
| **向导工作台** | `/guide` | `getMeFull` → **GET `/api/v1/me`**（`frontend/lib/apiClient/me.ts`）；首屏 **stats / billing** 等走 **me** 响应内字段（见 **`GuideBillingPeriodCard`** **B-078** 注释语境）。 |
| **市场向导详情 / 档期只读** | `/guides/[id]` 等 | **`GuideOccupiedScheduleBlock`** → **GET `/api/v1/guides/:id/availability`**（与 **`chain_off::guide_availability_impl`** 同源注释 **B-079**）。 |

### HTTP 对拍候选（机读自路由；**不**替代 04 表）

| 主题 | 路径（须与 **04** 行一致） | 代码锚（真值优先） |
|------|---------------------------|-------------------|
| 向导列表 / 创建 / 单条 / 上传 | `GET|POST /api/v1/guides`、`GET /api/v1/guides/:id`、… | `crates/api/src/routes/guides.rs` |
| 档期只读 | `GET /api/v1/guides/:id/availability` | `routes/guides.rs` → `chain_off/guides.rs`（**B-079** 注释） |
| 质押等 | `POST /api/v1/guides/:id/stake` 等 | 同上 |
| **接单写** | `POST /api/v1/orders/:id/accept` | `crates/api/src/routes/orders/mod.rs` |
| **链下回归样例** | guides + orders 组合流 | `crates/api/src/chain_off/tests_guides_me_orders.rs`；E2E 族 **`frontend/e2e/f021-f022-f023-request.spec.ts`**（含 **availability**）、**`f024-f025-f026-request.spec.ts`** 等 |

### F-023 窄切片（档期 API · 无浏览器）

**口径**：**`F-023`** 只验 **`POST /api/v1/guides` → `GET …/:id` → `GET …/:id/availability`**（**`frontend/e2e/f021-f022-f023-request.spec.ts`** 内 **`F-023 · POST guide then…`**）；**不**覆盖 **`/guide`** 工作台 **UI** 与 **`POST …/orders/:id/accept`** 接单写；通过后可作为 **93 P2** 中 **「档期只读 API」** 子集的 **①** 旁证，**不**单独把整行 **NOT RUN** 改为 **PASS**。

**环境**（与 spec 文件头注释一致）：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**；**API** 默认可达 **`http://127.0.0.1:8080`**（**`PLAYWRIGHT_API_BASE_URL` / `PLAYWRIGHT_API_HEALTH_URL`** 可覆盖）。

**复跑（仓库根，推荐 · 不占 3012）**：设 **`PLAYWRIGHT_E2E_NO_WEBSERVER=1`**（**`frontend/playwright.config.ts`** 不配置 **`webServer`**，仅 **`request`** 打 **API**；须 **`8080/health`** 已起或 **`PLAYWRIGHT_API_*`** 正确）。

```bash
cd frontend && PLAYWRIGHT_E2E_NO_WEBSERVER=1 npx playwright test e2e/f021-f022-f023-request.spec.ts --project=chromium --grep "F-023"
```

**备选（会起 Next）**：不设 **`PLAYWRIGHT_E2E_NO_WEBSERVER`** 时，默认仍起 **`webServer`**；若 **`3012`** **`EADDRINUSE`**，可 **`PLAYWRIGHT_REUSE_FE_SERVER=1`** 复用已有 **`PLAYWRIGHT_BASE_URL`**，或释放端口；全栈见 **`PLAYWRIGHT_FULL_STACK=1`** 与 **CONTRIBUTING** / **TT-9618**。

### TT-93 · `POST …/orders/:id/accept`（接单写 · API 窄切片）

**口径**：验 **`register` → `POST guides` → `stake` → `POST orders` → `POST …/accept`**；**不**验 **`/guide`** **UI**；**不**单独把 **93-matrix** **P2** 行改为 **PASS**。

**文件**：`frontend/e2e/tt-93-guide-order-accept-request.spec.ts`

**复跑**：

```bash
cd frontend && PLAYWRIGHT_E2E_NO_WEBSERVER=1 npx playwright test e2e/tt-93-guide-order-accept-request.spec.ts --project=chromium
```

**与 F-023 合并（同一 `grep`）**：

```bash
cd frontend && PLAYWRIGHT_E2E_NO_WEBSERVER=1 npx playwright test e2e/f021-f022-f023-request.spec.ts e2e/tt-93-guide-order-accept-request.spec.ts --project=chromium --grep "F-023|TT-93"
```

---

## 本文件不做

- **不**替代 **53**、**04**、**93** 正文。
- **不**在此认领 **PASS**；闭条须回写 **93** 表、**R-002 §4**、[93-matrix-batch-tracker](93-matrix-batch-tracker.md)。

---

## 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-05-01 | 首版：互指、代码入口、边界声明。 |
| 0.1.1 | 2026-05-01 | 稳定锚 **`#tt-93-guide-schedule-next-001`**（供 **TT-9628**、**93-matrix** 深链）。 |
| 0.1.2 | 2026-05-01 | **§** **工作台** **vs** **公共** **页** **；** **HTTP** **对** **拍** **候** **选** **表** **（** **routes/guides** **/** **orders** **/** **chain_off** **/** **E2E** **）** **。** |
| 0.1.3 | 2026-05-01 | **§** **F-023** **窄** **切片** **：** **grep** **复** **跑** **、** **`DATABASE_URL`** **`+`** **`P3_CHAIN_OFF`** **、** **3012** **`EADDRINUSE`** **`/`** **`PLAYWRIGHT_REUSE_FE_SERVER`** **注** **。** |
| 0.1.4 | 2026-05-01 | **`PLAYWRIGHT_E2E_NO_WEBSERVER`** **（** **playwright.config** **）** **+** **`.env.example`** **；** **F-023** **①** **首** **次** **复** **跑** **（** **setup** **曾** **1** **skipped** **）** **。** |
| 0.1.5 | 2026-05-01 | **`setup/meta-chain-contracts`** **：** **仅** **`PLAYWRIGHT_E2E_NO_WEBSERVER=1`** **时** **Next** **rewrite** **条** **提前** **`return`** **（** **`3 passed, 0 skipped`** **）** **；** **未** **设** **该** **变量** **时** **`PLAYWRIGHT_FULL_STACK !== "1"`** **仍** **`test.skip`** **（** **旧** **口** **径** **）** **。** |
| 0.1.6 | 2026-05-01 | **`tt-93-guide-order-accept-request.spec.ts`** **`POST …/accept`** **；** **合并** **`grep \"F-023|TT-93\"`** **`4 passed`** **（** **setup×2 + F-023 + accept** **）** **。** |
| 0.1.7 | 2026-05-01 | **互** **指** **[R-002 §4](../spec/R-002-回归执行闭环与发布准入.md)** **；** **`/guide`** **UI** **壳** **（** **`core-path`** **/** **`smoke`** **）** **与** **P2** **NOT** **RUN** **分** **轨** **说** **明** **。** |
