# TravelTrust MVP 完整产品与模块清单（真实可落地版）

**Version:** 1.0  
**阶段:** MVP 可上线版本  
**目标:** 跑通真实订单 + Escrow 资金闭环  

可直接发给 AI 执行的完整产品与模块清单；结构按真实世界可运营逻辑拆分，并明确链上 / 链下 / 风控 / UI 区域边界。**全系统架构图**（分层、模块交互、数据流闭环）见 [18-TravelTrust-全系统架构图](18-TravelTrust-全系统架构图.md)。与 [01-总库总览](01-总库总览.md)、[07-开发流程与顺序](07-开发流程与顺序.md)、[13-1-UI产品级SSOT与页面规范](13-1-UI产品级SSOT与页面规范.md) 配套。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

---

## 一、系统总体分区（必须锁死）

系统分为 **6 大区域模块**：

| # | 区域 | 链上/链下 |
|---|------|------------|
| 1 | AI 行程生成层 | 链下 |
| 2 | Marketplace 撮合层 | 链下 |
| 3 | 协议控制台 | 链下 UI + 链上交互 |
| 4 | Escrow 托管层 | 链上 |
| 5 | 风控与仲裁层 | 链下 + 链上执行 |
| 6 | 用户与身份系统 | 链下 |

---

## 二、区域模块清单（按区域拆分）

### ① AI 行程生成层（Off-chain）

**功能目标**：生成旅行方案与预算，生成 Draft Order。

**输入字段**：目的地、城市、出行日期、天数、酒店类型、美食偏好、交通需求、预算范围、额外备注。

**输出结构**：
- 每日行程（图片 + 文本）
- 费用明细：酒店费用、餐饮费用、门票、导游费、车辆费、平台服务费（预估）、总预算
- `version = 1`
- `状态 = Draft`

**存储模块**：数据库表 `itineraries`、`orders (status = Draft)`。

---

### ② Marketplace 撮合层（Off-chain）

| 页面/模块 | 内容 |
|-----------|------|
| **Discover 页面** | 浏览订单；卡片展示：图片 + 目的地 + 预算 + 天数 |
| **Order Detail 页面（未确认阶段）** | 行程展示、价格展示、版本号、聊天入口 |
| **聊天模块** | Traveler ↔ Guide 双向聊天；修改价格、修改行程；每次修改 `version++`，记录历史版本。表：`order_versions`、`messages` |
| **确认最终版本** | 双方点击 **Confirm Final Plan**；生成 `snapshotHash = keccak256(orderData)`；状态：`Confirmed` |

---

### ③ 协议控制台（UI + 链上交互）

此区域是**最严肃模块**。

**页面：Escrow Detail**

必须展示：当前状态、总金额、币种、snapshotHash、交易记录、finality 状态、操作按钮。

**交易交互规范**：
- 所有链操作必须弹出 **Signature Modal**
- 显示：chainId、contract address、function、amount、gas
- 显示交易状态机：idle → signing → pending → confirmed → final / failed

与 [13-1](13-1-UI产品级SSOT与页面规范.md) 交易交互规范、[09](09-技术架构总览-v1.0.md) txMachine 一致。

---

### ④ Escrow 托管层（On-chain）

**MVP 合约必须只做 4 件事**：`createEscrow(params)`、`deposit()`、`release()`、`refund()`。参数结构（EscrowParams）与事件契约见 [19-Escrow-合约参数结构设计图](19-Escrow-合约参数结构设计图.md)。

**状态机（链上）**：Created → Funded → Completed / Disputed → Resolved → Closed。

**资金结构**：
- **Traveler**：存入全额订单金额
- **平台**：抽 8~12%
- **Guide**：收剩余

**暂不做（第一阶段）**：导游 10000U 质押、每单保证金、DAO 治理。

---

### ⑤ 风控与仲裁层

**Dispute Center** 必须包含：时间线、双方陈述、证据上传、裁决结果、执行记录（txHash）。

**仲裁执行流程**：仲裁员裁决 → 后端审批 → 执行 `executeResolution` 写入链上。与 01 §7 执行器、03 争议流程一致。

---

### ⑥ 用户与身份系统

| 用户类型 | 能力 |
|----------|------|
| **Traveler** | 发布订单、Escrow 存款、评分 |
| **Guide** | 注册、接单、履约、评分 |

**注册模块**：邮箱注册、密码、角色选择、默认自动登录。

**数据库表**：`users`、`profiles`、`ratings`。

---

## 三、页面结构（UI 分区）

| 分区 | 页面 | 说明 |
|------|------|------|
| **A. Experience 层** | Landing | 品牌、3D Hero、协议说明 |
| | Discover | 订单卡片、滚动展示 |
| **B. Protocol Console** | OrderFlow | 当前状态、价格、参与人、确认按钮 |
| | EscrowDetail | 金融级 UI、无 3D、无动画 |
| **C. Governance** | （后续阶段） | 暂不做 |

与 [13](13-协议级UI设计宪法.md)、[13-1](13-1-UI产品级SSOT与页面规范.md) 分区一致。

---

## 四、异常态必须实现

- 钱包未连接  
- 链错误  
- allowance 不足  
- 余额不足  
- finality 未达  
- 争议窗口过期  

与 13-1「异常态与风控态」一致。

---

## 五、数据库核心表

- users  
- orders  
- order_versions  
- messages  
- itineraries  
- ratings  
- disputes  
- event_log  
- orders_projection  

与 04、01 对账与投影设计一致。

---

## 六、系统边界（写给 AI 的强制规则）

1. **链上只做资金锁定与释放**  
2. **聊天与行程全部链下**  
3. **所有资金终态来自链事件**  
4. **UI 必须分区**（Experience / Protocol Console）  
5. **3D 不得进入资金页**  
6. **交易必须走状态机**（idle → signing → … → final/failed）  
7. **snapshotHash 必须绑定 Escrow**  

---

## 七、MVP 上线目标

- 完整跑通 1 笔真实订单  
- 完整 Escrow 托管  
- 完整释放  
- 可 dispute  
- 可评分  

---

## 八、AI 执行指令模板

向 AI 下发任务时可说：

> 基于 TravelTrust MVP 产品与模块清单（[17](17-TravelTrust-MVP-产品与模块清单.md)），请实现模块 X。  
> 必须遵守：链上只处理资金、snapshotHash 必须存在、Escrow 页面金融级、禁止 3D 进入资金页。

---

## 结论

本清单结构可真实上线、避免监管与工程复杂度爆炸，并可逐步升级成协议型产品。

---

*本文与 [01-总库总览](01-总库总览.md)、[07-开发流程与顺序](07-开发流程与顺序.md)、[13-1-UI产品级SSOT与页面规范](13-1-UI产品级SSOT与页面规范.md) 配套。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
