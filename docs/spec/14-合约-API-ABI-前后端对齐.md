# 合约、API、ABI 与前后端对齐说明

本文为**合约接口、API 路由、ABI 放置与前后端调用**的单源对齐文档，便于实现时 04、crates/api、frontend、contracts 保持一致。**权威依据**：合约见 [01-总库总览](01-总库总览.md) §4/§5、[02-架构设计](02-架构设计.md) §十、[contracts/README](../../contracts/README.md)；API 见 [04-后端与API](04-后端与API.md) §三；DApp 见 [06-DApp架构总览](06-DApp架构总览.md)、[09-技术架构总览](09-技术架构总览-v1.0.md) §2.7。

---

## 1. 合约 ↔ ABI ↔ 前端/后端 对齐

### 1.1 合约模块与设计承诺（与 contracts/README 一致）

| 模块 | 用途 | 关键方法/事件（实现时定稿） | 前端/后端使用 |
|------|------|-----------------------------|----------------|
| **Escrow** | 订单托管 | deposit / confirm / openDispute；事件 EscrowCreated、Paid、DisputeOpened、ResolutionExecuted（01 §5） | 前端：用户签 deposit/confirm/openDispute；后端：Indexer 消费事件、Executor 执行裁决 |
| **Staking** | 导游/仲裁员质押 | stake / unstake / slash；档位与接单上限 08-3 | 前端：质押/解押；后端：读余额、对账 |
| **Registry（方案 B）** | 链上资格 | approve / revoke；可接单条件 01 §4、§10 | 前端：读资格；后端：审核后上链发资格 |
| **Reputation** | 可选存证 | 存证接口与 01 可验证信誉一致 | 前端/后端：可选 |

### 1.2 ABI 放置与引用约定

| 位置 | 说明 | 对齐规则 |
|------|------|----------|
| **contracts/abi/** | 合约编译产出的 ABI JSON（Escrow、Staking、Registry 等）**单源存放** | 实现时：Solidity 编译后把各合约 ABI 放入此目录；命名建议 `Escrow.json`、`Staking.json`、`Registry.json` |
| **frontend** | 前端需用 ABI 调用 viem readContract/writeContract/signTypedData | 从 **contracts/abi/** 复制到 **frontend/dapp/abis/** 或构建时引用 monorepo 路径，保证与合约部署版本一致；**不得手写 ABI**，必须来自编译产物 |
| **后端（crates/api 或链客户端）** | 链下读链、对账、执行器调合约 | 若用 Rust 与链交互（alloy 等），ABI 或等效接口定义须与 contracts/abi 一致（可脚本从 JSON 生成 Rust 绑定） |

**对齐检查**：合约接口变更 → 重新编译 → 更新 contracts/abi/*.json → 同步到 frontend/dapp/abis（或引用）→ 后端若用 ABI 同步更新；发版前核对 ABI 与部署合约版本一致。

### 1.3 链上事件与 04/前端展示对齐

| 事件 | 01/02 约定 | 后端（Indexer/Projection） | 前端 |
|------|------------|----------------------------|------|
| EscrowCreated | 订单↔escrow 一一对应 | 写 event 表 + 投影 orders.chain_state | 仅通过 API 读订单状态，不直接读链展示资金态 |
| Paid | 用户已付代币进托管 | 驱动订单状态 Escrowed/Paid | 已支付仅来自 API/对账结果（01 §7 UI 事实） |
| DisputeOpened | 争议已上链 | 驱动 Disputed、冻结放款 | 争议状态以 API 为准 |
| ResolutionExecuted | 裁决已执行 | 驱动 Refunded/Slashed/Completed | 终态以 API 为准 |

---

## 2. API 路由与前后端对齐

### 2.1 权威源：04 §三 与 crates/api 实际路由

以下表与 [04-后端与API](04-后端与API.md) §三 一致；**crates/api** 已按此表挂载路由（占位或实现）。前端调用 API 时路径须与本表一致。

| 方法 | 路径 | 说明 | 前端落点（建议） |
|------|------|------|------------------|
| GET | /health | 健康检查 | 可选探活 |
| GET | /meta | 版本与 SSOT 绑定（05 §七点六） | 启动时校验、fail-closed |
| POST | /auth/register | 邮箱注册 | lib/auth 或页面 |
| POST | /auth/login | 登录 | lib/auth |
| POST | /auth/logout | 登出 | lib/auth |
| POST | /auth/refresh | 刷新 token | lib/auth |
| POST | /auth/verify-email | 邮箱验证 | lib/auth |
| POST | /auth/forgot-password | 忘记密码 | lib/auth |
| POST | /auth/reset-password | 重置密码 | lib/auth |
| GET | /api/v1/me | 当前用户 + 统计 | lib/me |
| PUT | /api/v1/me | 更新资料 | lib/me |
| GET | /api/v1/me/stats | 统计摘要（可选） | lib/me |
| PUT | /api/v1/me/password | 修改密码 | lib/me |
| GET | /api/v1/guides | 导游列表 | lib/guides |
| GET | /api/v1/guides/:id | 导游详情 | lib/guides |
| POST | /api/v1/guides | 导游注册 | lib/guides |
| POST | /api/v1/guides/:id/stake | 质押 | lib/guides + dapp 签质押 |
| POST | /api/v1/orders | 下单 | lib/orders |
| GET | /api/v1/orders | 我的订单列表 | lib/orders |
| GET | /api/v1/orders/:id | 订单详情 | lib/orders |
| POST | /api/v1/orders/:id/accept | 导游接单 | lib/orders |
| POST | /api/v1/orders/:id/cancel | 取消订单 | lib/orders |
| POST | /api/v1/orders/:id/confirm-completion | 确认完成 | lib/orders + dapp 签 confirm |
| GET | /api/v1/orders/:id/reviews | 该订单评价 | lib/orders |
| POST | /api/v1/orders/:id/reviews | 提交评价 | lib/orders |
| POST | /api/v1/orders/:id/dispute | 发起争议 | lib/orders + dapp 签 openDispute |
| GET | /api/v1/orders/:id/evidence | 证据（GET） | lib/orders |
| POST | /api/v1/orders/:id/evidence | 证据上传 | lib/orders |
| GET | /api/v1/disputes | 争议列表 | lib/disputes |
| GET | /api/v1/disputes/:id | 争议详情 | lib/disputes |
| POST | /api/v1/disputes/:id/resolve | 裁决 | lib/disputes（仲裁员） |

### 2.2 前端 API 基地址与路径常量

- **基地址**：`NEXT_PUBLIC_API_BASE_URL`（05 §四、frontend/.env.example）；未设则开发默认可用 `http://localhost:8080`（与根 .env.example 一致）。
- **路径常量**：见 **frontend/lib/api.ts**（与上表及 04 §三 一致）；所有请求须带 x-request-id、写操作须带 Idempotency-Key / X-Idempotency-Key（04 §四、01 §10 #14）。

### 2.3 后端实现状态（与 04、crates/api 一致）

- 认证路由：占位返回 501 或未实现；实现时接 JWT/session。
- /api/v1/me、me/stats、orders、orders/:id、evidence、dispute、disputes 等：已挂载，部分占位；实现时按 04 §二 数据模型与 §四 风控补齐。
- 幂等键：API 已读取并回写 Idempotency-Key/X-Idempotency-Key；实现时在业务层做 key 去重与结果复用。

---

## 3. 前后端数据流与职责（对齐 01 §9、05、06）

| 数据 | 权威源 | 前端 | 后端 |
|------|--------|------|------|
| 用户、导游、订单列表、订单详情、争议 | **API（04）** | 仅通过 API 获取；不直接读链展示业务数据 | crates/api 提供；资金相关状态由链上事件驱动后写回 DB |
| 链上支付/质押/争议签名 | 用户钱包 | 前端 dapp 调 viem signTypedData / writeContract；EIP-712 domain 写死（09 §2.7） | 不代签；执行器代发裁决上链 |
| 已支付/终态展示 | 链上事件 + 对账 | 仅展示 API 返回的状态（01 §7 UI 事实） | Indexer/Projection 消费事件写回；API 读 DB |

---

## 4. 对齐检查清单（发版前或实现期）

- [ ] 合约 Solidity 实现后，ABI JSON 放入 **contracts/abi/**，并同步到 **frontend/dapp/abis/**（或构建引用）。
- [ ] 前端 API 调用路径与 **frontend/lib/api.ts** 及 04 §三 一致；基地址来自 NEXT_PUBLIC_API_BASE_URL。
- [ ] 前端 DApp 调合约时使用的 ABI 与部署合约版本一致；EIP-712 domain（chainId、verifyingContract）与 08-3/配置一致。
- [ ] crates/api 路由与 04 §三 表一致（已挂载；实现时补齐业务逻辑）。
- [ ] GET /meta 与前端版本绑定、fail-closed 逻辑已实现（05 §七点六）。

---

## 5. 端口与本地启动对齐

| 项 | 约定 | 当前实现 | 对齐 |
|------|------|----------|------|
| **后端 API 端口** | PORT 环境变量，默认 **8080**（与前端默认基地址一致） | crates/api/src/main.rs 默认 8080；.env.example 已列 PORT | ✅ 一致 |
| **前端 API 基地址** | NEXT_PUBLIC_API_BASE_URL；未设时开发默认 `http://localhost:8080` | frontend/lib/api.ts 默认 localhost:8080；frontend/.env.example 已列 | ✅ 一致 |
| **本地启动后端** | `cargo run -p api` 或等价；监听 0.0.0.0:PORT | main.rs bind(0.0.0.0:PORT) | ✅ 可启动 |
| **本地启动前端** | Next.js dev；需能请求后端 8080 | 依赖 NEXT_PUBLIC_API_BASE_URL；CORS 由后端 CORS_ORIGINS 控制 | ✅ 可启动（生产须设 CORS_ORIGINS） |

**结论**：端口与本地启动**已对齐**；后端 8080、前端默认连 localhost:8080，可本地分别启动并联调 API。

---

## 6. 本地虚拟链、智能合约部署与可测试性

| 项 | 当前状态 | 说明 |
|------|----------|------|
| **是否使用本地虚拟链** | **否** | 仓库内未配置 Anvil/Hardhat/Ganache 等本地链；07 Phase 3 为「测试网部署」，11 M2 为「本地链全流程演示」规划。 |
| **智能合约实现** | **待实现** | contracts/ 仅 README（设计承诺）；无 Solidity 源码、无 contracts/abi/ 产物；Escrow/Staking/Registry 为设计态（见 [contracts/README](../../contracts/README.md)）。 |
| **本地链上部署合约** | **不可用** | 合约未实现，无法在本地链或测试网部署；实现后需在 contracts/ 或独立 repo 增加构建与部署脚本（含本地链/测试网）。 |
| **本地全流程功能测试** | **部分可用** | **API 与前端**：可本地启动后端 + 前端，对 04 §三 路由做注册/登录/订单/争议等 API 与页面联调。**链上支付/质押/争议/执行器**：依赖合约与链，当前无法端到端测试；合约实现后可先接本地链（如 Anvil）再接测试网。 |

**实现期建议**（与 01 §10、07 Phase 3、11 一致）：

1. **合约实现**：在 contracts/ 或独立 repo 实现 Escrow/Staking/Registry，产出 ABI 至 contracts/abi/，同步 frontend/dapp/abis/。
2. **本地链（可选）**：引入 Foundry Anvil 或 Hardhat 本地节点，供开发与 E2E 使用；chainId 与 08-3/配置一致。
3. **部署与测试**：本地链部署脚本 + 测试网部署脚本；E2E 或手动「创建订单→支付→放款/争议」闭环。

*本文与 01、02、04、05、06、09、contracts/README 配套；合约与 ABI 实现后请更新 §1.1、§1.2 具体方法/事件名。* 文档版本与最后更新见 [00-文档索引](00-文档索引.md)。
