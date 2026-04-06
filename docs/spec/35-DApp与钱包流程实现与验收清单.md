# 35 - DApp 与钱包流程实现与验收清单

**用途**：在 [34-前端组件与 Design Tokens 落地清单](34-前端组件与Design-Tokens落地清单.md) 组件与 Token 稳定后，将 [06-DApp 架构总览](06-DApp架构总览.md)、[13-1 交易交互与异常态](13-1-UI产品级SSOT与页面规范.md) 中的**钱包连接、EIP-712、Signature Modal、tx 状态机、deposit/release/openDispute 等链操作**整理为可执行验收清单；支撑 27 P9 门禁、与 36 测试/37 i18n/a11y 衔接。

**受众与用法**：前端/DApp 负责人、开发与 QA；在 Escrow/订单流程页接入链上操作时按 §二～§四 逐项实现与勾选；可与 33/34 同迭代（35 在 Escrow Detail、OrderFlow 等页接入时执行）。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **钱包连接 / 切链 / EIP-712 / tx 状态机** | **§二～§四**（随验收表检索） |
| **DApp 架构 SSOT** | **[06](06-DApp架构总览.md)** |
| **交易交互与异常态** | **[13-1](13-1-UI产品级SSOT与页面规范.md)** |
| **合约与 ABI** | **[14](14-合约-API-ABI-前后端对齐.md)** |
| **与 34 组件的衔接** | **§一** 上下游表 |

---

## 一、文档定位与上下游

| 维度 | 说明 |
|------|------|
| **与 32** | 32 §二 含 35 为「DApp 与钱包流程实现与验收清单」；35 将 32 该项展开为**可勾选验收表**与**前端落点**。 |
| **与 33** | 33 定页面顺序与每页验收；35 定**链上操作所在页**（Escrow Detail、OrderFlow 等）的 DApp 行为是否满足 06/13-1。 |
| **与 34** | 34 的 WalletStatusMini、SignatureModal、EscrowDetail 内链操作为 35 验收对象；34 组件稳定后 35 做钱包连接/EIP-712/tx 状态机验收。 |
| **与 06** | 06 为 DApp 架构单源（钱包、签名、txMachine、业务数据同源、12 缝/17 条）；35 为 06 在**前端实现与验收**的勾选表。 |
| **与 13-1** | 13-1 交易交互规范（Signature/Tx Modal、chainId/contract/amount/gas/finalityN、txMachine 状态）、异常态清单；35 逐项落实验收。 |
| **与 27 P9** | P9「DApp 与完整流程」门禁以 35 验收清单闭环为输入之一。 |
| **与 36/37** | 36 前端测试可覆盖 35 项（钱包态、错链、allowance、tx 状态）；37 i18n/a11y 在 35 组件上做文案与焦点/ARIA。 |

**执行顺序建议**：33 页面 + 34 组件与 Tokens 落地 → **35 DApp/钱包验收**（可与 34 同迭代，在 Escrow/OrderFlow 接入时做）→ 36 测试、37 i18n/a11y。

---

## 二、验收范围与前端落点

以下均以 [06-DApp 架构总览](06-DApp架构总览.md)、[13-1 交易交互规范与异常态](13-1-UI产品级SSOT与页面规范.md)、[09 技术架构 §2.7](09-技术架构总览-v1.0.md) 为单源。

### 2.1 钱包连接

| 验收项 | 06/13-1 依据 | 前端落点 | 说明 |
|--------|----------------|----------|------|
| 连接/断开钱包 | 06 §三 钱包连接 | `wagmi` + WalletConnect v2；`components/trust/WalletStatusMini.tsx`、`components/Header.tsx` | 顶栏展示 Connected / Wrong network；不托管私钥 |
| 链 ID 与切链 | 06 §五、13-1 异常态 | 当前 chainId 展示；非目标链（如非 Polygon）时提示切换网络 | 错链不展示敏感操作、明确提示 |
| 未连接态 | 13-1 异常态「钱包未连接」 | 明确提示 + 连接入口，不展示支付/签名等敏感操作 | 所有链操作入口处需校验 |

### 2.2 签名与交易（EIP-712 / Tx）

| 验收项 | 06/13-1 依据 | 前端落点 | 说明 |
|--------|----------------|----------|------|
| EIP-712 结构化签名 | 06 §三、§五；01 §7 P0 | Domain Separator 写死；支付/**release**/openDispute 等须经 EIP-712 或合约调用前明确展示参数；链下 `confirm-completion` 见 API（04 §3.4） | 不引导无限授权 |
| Signature / Tx Modal | 13-1 §三 交易交互规范 | `components/escrow/EscrowDetail.tsx` 内签名弹窗或独立 Modal | 所有链上动作必须经 Modal，不得普通表单提交 |
| Modal 内必现字段 | 13-1 §三 | chainId、contract、function、amount、token、gas estimate、finalityN（或等价文案） | 用户可取消/拒绝（05 §九 9.0.5） |
| tx 状态机可见 | 13-1 §三、09 txMachine | idle → signing → pending → confirmed → final / failed（及 replaced 若支持） | `TxMachineStatus` 或等价组件在 Escrow Detail/OrderFlow 可见 |

### 2.3 链操作与数据流

| 操作 | 06 依据 | 前端落点 | 验收要点 |
|------|----------|----------|----------|
| **deposit** | 06 §四 1；01 §10 17 条 #2 | Escrow Detail 或 OrderFlow 付款步；API 取 Escrow 地址与金额 → 钱包签 deposit | 须经 deposit()，直转不算；UI 事实：已支付仅来自链上 Paid/对账 |
| **release** | 06 §四 3 | Escrow Detail **释放**：用户签 `Escrow.release()`（评分路径等条件满足后）；**非** `POST confirm-completion`（后者链下行程完成，04 §3.4） | 防重复提交（17 条 #14）、与后端幂等 |
| **openDispute** | 06 §四 4；01 §7 | 先 API 提交争议与证据，再唤起钱包签 openDispute（付 arbFee） | 仅 Escrowed 态、disputeWindow 内允许 |
| 事件与终态 | 06 §三、§四 | `viem watchContractEvent` 或轮询；**Finality 12 blocks** 后再视为终态 | pending 可展示 confirmations；终态以 12 块为准 |

### 2.4 异常态与风控（13-1 §四）

| 异常态 | 表现要求 | 验收方式 |
|--------|----------|----------|
| 钱包未连接 | 明确提示 + 连接入口，不展示敏感操作 | 进入 Escrow Detail/付款步时检查 |
| 链不对 | 提示切换网络、显示当前 chainId | 非目标链时 UI 提示与禁用链操作 |
| USDC allowance 不足 | 提示授权、引导 approve | 支付前校验 allowance，不足时引导 |
| OFAC/冻结命中 | 风控提示、不执行交易 | 与后端/合约一致，前端不发起 |
| disputeWindow 过期 | 明确「已过争议窗口」、不可再发起争议 | Escrow Detail 争议按钮按 API 与链状态禁用 |
| reorg/replay 回滚 | 提示「链已回滚，状态已更新」、引导刷新或重试 | 有 reorg 策略时前端提示与刷新入口 |

### 2.5 业务数据同源与安全（06 §二、§五）

| 验收项 | 说明 |
|--------|------|
| 业务数据唯一来自 API | 订单/向导/争议/档期、Escrow 地址与参数从 04 API 获取；DApp 与 Web 共用同一 API。 |
| DB 不因前端成功写 Paid | 已支付仅依据链上 Paid/对账；前端不直接写 DB 支付状态。 |
| 12 缝 #11 | Paid 后换钱包 = dispute 或新单；换钱包仅允许新订单使用新钱包。 |
| 17 条 #14 | 支付/确认/openDispute 防重复提交，与后端幂等键及 orderId+action 一致。 |

---

## 三、验收勾选表（35 执行时逐项勾选）

实现或 Code Review 时按下列项勾选；全部通过视为 **35 DApp/钱包验收** 已闭环。

### 3.1 钱包与连接

| □ | 验收项 | 核对方式 |
|---|--------|----------|
| | 顶栏/Header 集成 WalletStatusMini，展示 Connected / Wrong network | 视觉与交互检查 |
| | 未连接钱包时，Escrow Detail/付款步等不展示「支付」「**释放（release）**」「发起争议」等须链上签名的操作；链下「确认行程完成」若可不连钱包则由产品定稿 | 未连接态走查 |
| | 错链时提示切换网络、显示当前 chainId，链操作禁用或隐藏 | 切链与错链场景 |

### 3.2 Signature Modal 与 tx 状态机

| □ | 验收项 | 核对方式 |
|---|--------|----------|
| | 所有链上动作（deposit/**release**/openDispute 等）均经 Signature/Tx Modal，无普通表单提交 | 代码与交互检查 |
| | Modal 内展示 chainId、contract、function、amount、token、gas estimate、finalityN（或等价文案） | 13-1 §三 对照 |
| | tx 状态机可见：idle → signing → pending → confirmed → final / failed | TxMachineStatus 或等价组件 |
| | Escrow Detail 为银行级、无玻璃/霓虹（28 资金层） | 28、23 §七 |

### 3.3 链操作落点

| □ | 验收项 | 核对方式 |
|---|--------|----------|
| | deposit 仅通过合约 deposit() 流程，前端不直转；已支付仅来自链上 Paid/对账 | 06 §四 1、17 条 #2 |
| | **release**、openDispute 由用户钱包签名触发；**confirm-completion** 链下 API 与放款解耦（04 §3.4）；防重复提交与后端幂等一致 | 06 §四 3、4；17 条 #14 |
| | 终态以 Finality 12 blocks 为准；pending 可展示 confirmations | 06 §三、§四 |
| | 事件监听或轮询与 Escrow 状态同步（viem watchContractEvent 或等效） | 代码与 06 §三 对照 |

### 3.4 异常态覆盖

| □ | 验收项 | 核对方式 |
|---|--------|----------|
| | 未连接、错链、allowance 不足、disputeWindow 过期、reorg 提示等有明确 UI 或文案 | 13-1 §四 逐项走查 |
| | OFAC/风控与后端一致，前端不执行违规交易 | 产品/风控确认 |

### 3.5 同源与安全

| □ | 验收项 | 核对方式 |
|---|--------|----------|
| | 订单/ Escrow 参数从 API 获取；DApp 与 Web 共用同一 API | 06 §二、04 |
| | EIP-712 Domain Separator 写死；签名前展示金额/代币/合约/订单，用户可取消/拒绝 | 06 §五、05 §九 9.0.5 |

---

## 四、开发步骤与执行顺序

| 步骤 | 工作内容 | 产出/完成标准 |
|------|----------|----------------|
| **1. 前置条件** | 34 组件与 Tokens 已落地；WalletStatusMini、EscrowDetail、SignatureModal（或内嵌）已存在且符合 28/13-1 | 34 §2.3、§3 已勾选 |
| **2. 钱包与连接** | 确认 wagmi + WalletConnect v2 配置；Header 集成 WalletStatusMini；未连接/错链态在 Escrow/OrderFlow 正确展示 | §3.1 勾选通过 |
| **3. Signature Modal 与 tx 状态机** | 所有链操作经 Modal；Modal 内必现字段完整；TxMachineStatus 或等价组件在详情/流程页可见 | §3.2 勾选通过 |
| **4. 链操作实现** | deposit/release/openDispute 前端落点与 06 §四、04 API 一致；事件监听或轮询、Finality 12 块策略 | §3.3 勾选通过 |
| **5. 异常态与同源** | 13-1 异常态清单逐项有 UI/文案；业务数据仅从 API 获取；EIP-712 与安全约定满足 | §3.4、§3.5 勾选通过 |
| **6. 门禁与后续** | 35 勾选表全部通过后，作为 P9 门禁输入；进入 36（测试）、37（i18n/a11y） | 与 27 P9、36/37 衔接 |

**小结**：34 稳定后 → 钱包与连接 → Signature Modal 与 tx 状态机 → 链操作落点与异常态 → 全表勾选 → P9 门禁。

---

## 五、验收与门禁

### 5.1 35 自身验收标准

- **钱包**：连接/断开/错链/未连接态符合 06、13-1；WalletStatusMini 集成正确。
- **签名与 Tx**：所有链上动作经 Signature/Tx Modal；Modal 内字段完整；tx 状态机可见。
- **链操作**：deposit/release/openDispute 落点与 06 §四、01 §10 一致；终态 12 块；防重复与幂等。
- **异常态**：13-1 §四 所列异常态有明确表现。
- **同源与安全**：业务数据唯一来自 API；EIP-712 与 05 §九 9.0.5 满足。

### 5.2 与 27 P9 的关系

| 27 门禁 | 35 贡献 |
|---------|----------|
| P9 DApp 与完整流程 | 35 验收勾选表（§三）全部通过后，可作为「DApp 与钱包流程已实现且符合 06/13-1」的门禁输入。 |

### 5.3 与 36、37 的衔接

- **36 前端测试**：可覆盖 35 项（未连接、错链、allowance、tx 状态、异常态文案）；35 勾选表可作为用例来源。
- **37 i18n/a11y**：Signature Modal、TxMachineStatus、异常态文案等为 37 的文案与焦点/ARIA 对象。

---

## 六、附录：06 / 13-1 关键条款索引

| 需求 | 06 位置 | 13-1 位置 |
|------|----------|------------|
| 钱包连接、不托管 | §一、§三 | — |
| deposit/**release**/openDispute 须钱包签；链下确认行程完成见 API | §一、§三、§四 | §三 交易交互 |
| Signature Modal、chainId/contract/amount/gas/finalityN | §三、§五 | §三 |
| tx 状态机 idle→signing→pending→… | §三、§四 | §三 |
| 业务数据同源、API 唯一来源 | §二、§三 | — |
| UI 事实：已支付仅链上 Paid/对账 | §四 1、6.3 | — |
| 12 缝 #11、17 条 #2/#14 | §四、6.3 | — |
| 异常态：未连接、错链、allowance、disputeWindow、reorg | §五 安全 | §四 |

---

*本文与 [06-DApp架构总览](06-DApp架构总览.md)、[13-1-UI产品级SSOT与页面规范](13-1-UI产品级SSOT与页面规范.md)、[34-前端组件与Design-Tokens落地清单](34-前端组件与Design-Tokens落地清单.md)、[09-技术架构总览](09-技术架构总览-v1.0.md) 配套。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
