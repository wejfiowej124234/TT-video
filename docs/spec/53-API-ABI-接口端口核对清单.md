# 53 阶段 API / ABI / 接口 / 端口 核对清单

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **API path 对照** | **§一** |
| **ABI / 端口** | **后文各节** |
| **契约 SSOT** | **[04 §3.4](04-后端与API.md)**、**[14](14-合约-API-ABI-前后端对齐.md)**、**[53-阶段开发技术文档](53-阶段开发技术文档.md)** §3.8.5 |

与 [53-阶段开发技术文档](53-阶段开发技术文档.md) §3.8.5、[04-后端与API](04-后端与API.md) §3.4、[14-合约-API-ABI-前后端对齐](14-合约-API-ABI-前后端对齐.md) 配套。参照 53 开发文档继续开发时，用于**接口、端口、契约**的逐项核对。

---

## 一、API（04 §3.4 ↔ 前端 ↔ crates/api）

**权威单源**：04 §3.4 API 总览（v1 完整清单）。前端 `frontend/lib/api.ts` 的 path 须与 04 一致；crates/api 路由须与 04 一致。

### 1.1 53 相关接口对照

| 04 §3.4（path / method） | frontend lib/api.ts | crates/api routes | 备注 |
|--------------------------|---------------------|--------------------|------|
| GET /api/v1/orders/:id | routes.orderById(id) | GET /api/v1/orders/:id | 响应含 payment_deadline、chat_confirm_deadline、rating_deadline（chain_off 已实现） |
| POST /api/v1/orders/:id/accept | routes.orderAccept(id) | POST /api/v1/orders/:id/accept | 抢单；前端传 Idempotency-Key（useMarketPage、OrderActionsBlock） |
| POST /api/v1/orders/:id/confirm-bilateral | routes.orderConfirmBilateral(id) | POST /api/v1/orders/:id/confirm-bilateral | 双边确认；前端 writeRequestHeaders(idempotencyKey) |
| POST /api/v1/orders/:id/confirm-rating | routes.orderConfirmRating(id) | POST /api/v1/orders/:id/confirm-rating | 评分双方确认；前端 writeRequestHeaders(idempotencyKey) |
| POST /api/v1/orders/:id/confirm-final-plan | routes.orderConfirmFinalPlan(id) | POST confirm_final_plan（`crates/api/src/routes/orders/mutations.rs`） | 双边确认时生成 snapshotHash |
| PATCH /api/v1/orders/:id/itinerary | routes.orderPatchItinerary(id)；apiClient.patchOrderItinerary | **已实现**（crates/api chain_off patch_order_itinerary_impl + routes 注册） | 53 行程修改写回；仅参与方、未 Escrowed 前可改；前端已预留 path 与封装 |
| GET/POST /api/v1/orders/:id/messages | routes.orderMessages(id) | GET/POST（crates/api routes/messages.rs） | 订单聊天 |
| GET /api/v1/discover/orders | routes.discoverOrders | GET /api/v1/discover/orders | 可抢单订单列表 |

**结论**：53 主流程用到的 **accept、confirm-bilateral、confirm-rating、getOrder（含 deadline 字段）、PATCH itinerary** 已与 04、crates/api、frontend 三者对齐。**GET/POST orders/:id/messages** 若前端有调用点，需确认 path/method/body 与 04 一致。

### 1.2 幂等键（Idempotency-Key）

| 项 | 约定 | 实现 |
|----|------|------|
| Header 名 | Idempotency-Key 或 X-Idempotency-Key（04 §四） | frontend：writeRequestHeaders(idempotencyKey) 写两 header；crates/api：idempotency_key_layer 读取并去重 |
| 适用接口 | accept、confirm-bilateral、confirm-rating、confirm-final-plan、reviews、cancel 等写操作 | 前端 orderAccept、orderConfirmBilateral、orderConfirmRating 均传 key |

---

## 二、ABI（14 / contracts/abi ↔ frontend/dapp/abis）

**权威单源**：contracts/abi/*.json（合约编译产物）；frontend 使用须与 contracts/abi 一致（复制或构建时引用）。

| 合约 | contracts/abi | frontend/dapp/abis | 53 用到的能力 |
|------|----------------|--------------------|----------------|
| Escrow | Escrow.json（deposit、release 等） | Escrow.json | 评分后释放 = release()；14、53 §3.8 B5 |
| EscrowFactory | EscrowFactory.json | EscrowFactory.json | 创建托管（若由前端触发） |

**结论**：ABI 放置与 14 约定一致；53 评分后释放与 01 §5、02 执行器一致，release 由前端签或执行器代发。

---

## 三、端口与 API base

**约定**：53 不规定端口号；由 04、.env.example、§六附续 E2E 环境表约定（§3.8.5）。

| 环境 | 约定 | 落点 |
|------|------|------|
| 本地开发 | API 端口默认 **8080**；前端请求 base 默认 **http://localhost:8080** | 根目录 .env.example：PORT=8080；frontend .env.example：NEXT_PUBLIC_API_BASE_URL=http://localhost:8080；frontend lib/api.ts 未设置时 fallback 为 http://localhost:8080 |
| 多环境 | dev/staging/prod 的 API base、链、特性开关见 53 §3.9.8 BB2、根目录及 frontend .env.example | 53 相关见 §六附续 E2E 环境表 |

**注意**：后端 PORT 与前端 NEXT_PUBLIC_API_BASE_URL 的端口须一致，否则登录/订单等请求会失败（见 frontend lib/apiClient/me.ts 404 提示）。

---

## 四、当前无问题 / 需实现时定稿的项

| 类别 | 状态 | 说明 |
|------|------|------|
| API path/method 与 04 一致 | ✅ | 53 用到的订单/消息/接单/双边/评分接口 path 与 04 §3.4 一致 |
| GET order 返回 deadline | ✅ | chain_off 已返回 payment_deadline、chat_confirm_deadline、rating_deadline；前端 EscrowDetail 已展示 |
| 幂等键 | ✅ | 前端写双 header；后端中间件去重 |
| ABI 与 14/contracts 一致 | ✅ | Escrow.json 含 deposit、release |
| 端口 / API base | ✅ | 本地 8080 与 .env.example 一致；多环境在 BB2 说明 |

| 类别 | 实现时定稿 | 说明 |
|------|------------|------|
| PATCH /api/v1/orders/:id/itinerary | ✅ 已实现（crates/api chain_off + routes） | body 与 52 统一表一致；仅参与方、未 Escrowed 前可改 |
| GET/POST orders/:id/messages | 04 已登记；前端订单聊天/社区入口 | 订单消息与 TT 社区统一为 orders/messages（§3.7 维度三） |
| 导出/打印接口 | 04 可选 | 53-S15 行程摘要可下载；04 可选提供，未提供则前端仅做打印或暂不实现 |

---

## 五、与 53 文档的对应

| 本文 | 53 文档 |
|------|---------|
| 一、API | §3.8.5 接口·API·ABI·端口再检查；04 §3.4 |
| 二、ABI | §3.8.5、14、53-S10/53-S24 验收 |
| 三、端口/API base | §3.8.5「端口不在 53 约定」、§六附续 E2E 环境表 |
| 四、无问题/定稿 | §3.8.5 结论「无新增必补缺口」 |

**使用方式**：发版前或 53 收口时，按本清单逐项核对；若新增 53 相关接口，须在 04 §3.4 登记并在本表补充一行。
