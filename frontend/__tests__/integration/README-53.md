# 53 阶段集成测试与 E2E 范围（§六附续 §2 / §3）

与 [53-阶段开发技术文档](../../docs/spec/53-阶段开发技术文档.md) §六附续 对应，53-S11 验收时需覆盖以下范围。

## 集成测试（§六附续 §2）

| 范围 | 必测项 | 验收方式 | 对应 53 |
|------|--------|----------|---------|
| 订单页 + API | 订单/Escrow 详情在 mock 或测试环境 API 下加载、展示状态/金额/步骤条/参与方；无白屏或未捕获异常 | mock 04 订单/行程/me 接口，断言页面渲染、步骤与 status 一致 | 53-S2～53-S6、53-S8 |
| 自由市场抢单与确认接单 | 向导身份下订单卡展示「抢单」、抢单后弹窗「确认接该项目」、状态回写；非向导不展示抢单 | mock 04 accept/claim、discover/orders，断言按钮可见性、请求参数与状态更新 | 53-S5、53-S9、53-S21 |
| 双边确认 | 游客/向导各自确认、双勾后步骤进入「确认·待付款」；重复提交幂等 | mock 双边确认 API、幂等键，断言双勾态、禁用态、重复请求不重复生效 | 53-S6、53-S9 |
| 评分页 + API | 上传材料、提交、待审核/待对方确认/已确认态；与 04 评分接口一致 | mock 评分与确认 API，断言状态流转与按钮禁用 | 53-S8、53-S9 |
| 订单聊天 orders/messages | 订单详情或 TT 社区入口下，订单关联会话为 04 /orders/:id/messages；发送/加载消息不报错 | mock GET/POST orders/:id/messages，断言消息列表与发送成功 | 53-S7、§3.7 维度三 |

**验收**：上述五类在 mock 或测试环境至少各 1 个集成用例通过；与 36 §2.2 集成范围一致。

**当前实现**：
- **订单页+API**：`components/escrow/OrderFlowSteps.integration.test.tsx`（mock getOrder，断言步骤与 status 一致）
- **抢单/确认接单、双边确认**：`__tests__/integration/53-bilateral-accept.integration.test.ts`（mock orderAccept、orderConfirmBilateral，断言 orderId + 幂等键）
- **评分页+API**：`__tests__/integration/53-rating-messages.integration.test.ts`（mock orderConfirmRating，断言传参）
- **订单聊天 orders/messages**：`__tests__/integration/53-orders-messages.integration.test.ts`（mock fetch GET/POST，断言 path/method/body 与 04 一致）。
- **订单行程写回 PATCH itinerary**：`__tests__/integration/53-patch-itinerary.integration.test.ts`（mock `PATCH /api/v1/orders/:id/itinerary`，断言 path、method、body、Idempotency-Key 与 04 一致）。

### 已实现的集成用例（53 收口）

| 类别 | 用例文件 | 说明 |
|------|----------|------|
| 订单页 + API | `components/escrow/OrderFlowSteps.integration.test.tsx` | mock getOrder，断言 orderStateToStep 与 API 响应一致 |
| 抢单/确认接单 | `__tests__/integration/53-bilateral-accept.integration.test.ts` | mock orderAccept，断言 orderId + 幂等键传参 |
| 双边确认 | 同上 | mock orderConfirmBilateral，断言 orderId + 幂等键传参 |
| 评分页 + API | `__tests__/integration/53-rating-messages.integration.test.ts` | mock orderConfirmRating，断言传参约定 |
| 订单聊天 orders/messages | `__tests__/integration/53-orders-messages.integration.test.ts` | mock fetch GET/POST，断言 path `/api/v1/orders/:id/messages`、method GET/POST、body `{ content }` |
| 订单行程写回 PATCH itinerary | `__tests__/integration/53-patch-itinerary.integration.test.ts` | mock PATCH `/api/v1/orders/:id/itinerary`，断言 path、method、body、Idempotency-Key |

运行：`npm run test -- --run OrderFlowSteps.integration 53-bilateral 53-rating 53-orders-messages 53-patch-itinerary` 或 `npm run test -- --run components/escrow __tests__/integration/53`

## E2E（§六附续 §3）

- **53 主路径（Happy Path）**：游客创建行程 → 订单进入市场可见 → 向导抢单 → 聊天/订单消息沟通（可选简短）→ 向导确认接单 → 双边确认 → 游客付款（deposit）→ 完成 → 评分上传+双方确认 → 释放。
- **超时分支**：至少 1 条（抢单后未确认接单 / 付款超时 / 评分确认超时）。
- **异常态**：钱包未连接/错链时付款步禁用并提示；与 36、13-1 异常态一致。

## E2E 环境定稿表（27 或 §六附续 填实）

| 项 | 约定 | 落点 |
|----|------|------|
| API base URL | 测试环境 base 或 `NEXT_PUBLIC_API_URL` | 27 或 .env.example、53 E2E 配置 |
| 链或 stub | 本地链（Anvil）、测试网或链下 stub | 27、ops、04 §3.4 mock 行 |
| 测试账号与权限 | 游客/向导测试账号（13-1 表 2 或 27 一致） | 27-P0 或 13-1、53-S11 验收 |

实现时在 27 或 53 §六附续 填实上表；53-S11 验收前 E2E 环境须可复现。
