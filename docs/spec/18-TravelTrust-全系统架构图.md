# TravelTrust MVP 全系统架构图（真实可落地版）

**Version:** 1.0  
**与 01/09/17 关系**：本文为**全系统架构图**的集中呈现（总体分层、模块交互、数据流闭环）；实现与模块边界以 [01-总库总览](01-总库总览.md)、[09-技术架构总览](09-技术架构总览-v1.0.md)、[17-TravelTrust-MVP-产品与模块清单](17-TravelTrust-MVP-产品与模块清单.md) 为准。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

---

## 一、总体分层架构图（宏观结构）

```
┌──────────────────────────────────────────────┐
│                  用户浏览器                 │
│  Next.js + React + wagmi + viem + R3F      │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│                前端应用层                   │
│                                              │
│  Experience 层（Landing / Discover）        │
│  Marketplace 层（Order / Chat）             │
│  Protocol Console（EscrowDetail）           │
│  Dispute Center                             │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│                Rust API 层                  │
│  Axum + SQLx + Auth + RBAC                  │
│                                              │
│  - 用户系统                                 │
│  - 订单系统                                 │
│  - 聊天系统                                 │
│  - AI 行程生成                              │
│  - 风控                                     │
│  - 仲裁模块                                 │
└──────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐      ┌────────────────┐
│ CockroachDB   │      │   Redis        │
│ 分布式数据库   │      │ 会话/缓存      │
└───────────────┘      └────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│             链监听 Indexer                  │
│  alloy + Finality + Reorg 处理              │
│  event_log → projection → reconciliation    │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│             Polygon 区块链                  │
│                                              │
│   EscrowFactory                             │
│   Escrow 合约                               │
│   USDC 合约                                 │
└──────────────────────────────────────────────┘
```

---

## 二、详细模块交互架构图

### 1️⃣ 订单创建阶段（链下）

```
User (Traveler)
    │
    ▼
填写参数 → AI 生成 itinerary
    │
    ▼
Draft Order 存入 DB
    │
    ▼
发布悬赏（status = Open）
```

**模块涉及**：AI Service、orders 表、itineraries 表、users 表。

---

### 2️⃣ 撮合与协商阶段（链下）

```
Guide 浏览订单
    │
    ▼
点击接单
    │
    ▼
进入聊天模块
    │
    ▼
生成新版本（version++）
    │
    ▼
双方点击 Confirm
    │
    ▼
生成 snapshotHash
    │
    ▼
状态 = Confirmed
```

**数据库涉及**：orders、order_versions、messages。

---

### 3️⃣ Escrow 创建阶段（链上）

```
Traveler 点击 Deposit
    │
    ▼
wagmi 调用 EscrowFactory.createEscrow
    │
    ▼
Escrow 合约生成
    │
    ▼
Traveler 存入资金
    │
    ▼
状态 = Funded
```

**链上记录**：EscrowCreated、Paid。

**后端**：Indexer 监听 → 写入 event_log → 更新 orders_projection。

---

### 4️⃣ 完成阶段

```
双方点击完成
    │
    ▼
调用 Escrow.release()
    │
    ▼
资金分配：Guide 收款、平台抽成
    │
    ▼
Escrow 状态 = Completed
```

---

### 5️⃣ 争议阶段

```
Traveler 发起 dispute
    │
    ▼
DB 记录 dispute
    │
    ▼
仲裁员裁决
    │
    ▼
执行 executeResolution
    │
    ▼
链上更新
```

与 [01](01-总库总览.md) §7 执行器、[03](03-业务流程与风控.md) 争议流程一致。

---

## 三、数据流闭环图（最重要）

```
[前端行为]
    │
    ▼
Rust API
    │
    ▼
CockroachDB（链下业务真相）
    │
    ▼
Escrow 合约（链上资金真相）
    │
    ▼
Indexer 监听事件
    │
    ▼
event_log（append-only）
    │
    ▼
orders_projection（可重建）
    │
    ▼
API 返回前端
```

**核心原则**：资金终态 = 链上事件；DB 只是投影。与 [10-系统级不变量白皮书](10-系统级不变量白皮书-v1.0.md) 一致。

---

## 四、数据库核心结构图

- users  
- profiles  
- orders  
- order_versions  
- messages  
- itineraries  
- ratings  
- disputes  
- event_log  
- orders_projection  
- reconciliation_reports  

与 [04-后端与API](04-后端与API.md)、[17](17-TravelTrust-MVP-产品与模块清单.md) §五 一致。

---

## 五、链上合约结构图

```
EscrowFactory
    │
    ├── createEscrow(orderId, snapshotHash)
    │
    └── 部署 Minimal Proxy Escrow

Escrow
    │
    ├── deposit()
    ├── release()
    ├── refund()
    └── dispute()
```

与 [17](17-TravelTrust-MVP-产品与模块清单.md) §二 ④、[19-Escrow-合约参数结构设计图](19-Escrow-合约参数结构设计图.md)、contracts/README 一致。

---

## 六、系统边界（必须锁死）

| 链上 | 链下 |
|------|------|
| 资金锁定 | 行程 |
| 资金释放 | 聊天 |
| 争议执行 | AI |
| | 报价修改 |
| | 评分 |

与 [17](17-TravelTrust-MVP-产品与模块清单.md) §六 一致。

---

## 七、完整逻辑闭环

```
AI 生成
→ 发布悬赏
→ 接单协商
→ 确认 snapshot
→ Escrow 创建
→ 存款
→ 完成
→ 释放
→ 评分
```

---

## 八、真实可落地性分析

本架构具备：

- **不托管用户资金**（资金在合约内）  
- **平台收入清晰**（抽成在 release 时分配）  
- **冷启动可行**（链下撮合与链上托管分离）  
- **技术复杂度可控**（Indexer + projection + 明确边界）  
- **可逐步升级**（Governance/质押等后续扩展）

---

*本文与 [01-总库总览](01-总库总览.md)、[09-技术架构总览](09-技术架构总览-v1.0.md)、[17-TravelTrust-MVP-产品与模块清单](17-TravelTrust-MVP-产品与模块清单.md) 配套。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
