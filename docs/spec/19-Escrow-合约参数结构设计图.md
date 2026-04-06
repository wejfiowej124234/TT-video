# Escrow 合约参数结构设计图（MVP 可落地 + 可扩展）

**Version:** 1.0.1  
**与 01/17/18 关系**：本文锁死 **EscrowParams** 结构与事件契约，实现时合约与 Indexer/投影须与本设计一致。产品与数据流见 [17-TravelTrust-MVP-产品与模块清单](17-TravelTrust-MVP-产品与模块清单.md)、[18-TravelTrust-全系统架构图](18-TravelTrust-全系统架构图.md)。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **链上职责边界、snapshotHash 口径** | **§1** |
| **EscrowParams 字段树** | **§2** |
| **资金流与状态机** | **§3** |
| **事件结构** | **§4** |
| **链下版本与哈希约束** | **§5** |
| **合约侧安全检查** | **§6** |
| **ABI / 路由 / 实现对照** | **[14](14-合约-API-ABI-前后端对齐.md)**、**[04 §3.4](04-后端与API.md)** |

---

## 1) 设计目标（锁死）

- **链上只做**：锁定资金 / 释放资金 / 退款 / 争议执行  
- **链下可变内容**（行程、图片、聊天、报价修改）**全部不进链**  
- **链上用 snapshotHash** 绑定「最终确认的订单版本」，保证链上资金 ↔ 链下订单一致  

---

## 2) 核心对象：EscrowParams

```
EscrowFactory.createEscrow(params)
┌────────────────────────────────────────────┐
│ EscrowFactory.createEscrow(EscrowParams)   │
└────────────────────────────────────────────┘
                 │ clone (EIP-1167)
                 ▼
┌────────────────────────────────────────────┐
│                 Escrow Instance            │
│  stores immutable-ish params + state       │
└────────────────────────────────────────────┘
```

**参数结构（建议）**：兼顾 MVP 够用 + 后续可扩展（不破坏事件契约）。

```
EscrowParams
├─ ids
│  ├─ chainId                 uint256
│  ├─ orderId                 bytes32   (后端生成/或用户端生成)
│  ├─ snapshotHash            bytes32   (链下最终版本哈希)
│  └─ schemaVersion           uint16    (事件/参数版本)
│
├─ parties
│  ├─ traveler                address
│  ├─ guide                   address
│  └─ platformFeeRecipient    address   (平台抽成接收地址)
│
├─ asset & pricing
│  ├─ token                   address   (USDC/USDT 等 ERC20)
│  ├─ totalAmount             uint256   (最小单位，按 token decimals)
│  ├─ platformFeeBps          uint16    (例如 800~1200 bps)
│  └─ currencyCodeHash        bytes32   (可选：USDC/USDT 标识哈希，仅展示用)
│
├─ timing
│  ├─ serviceStart            uint64    (可选：链下声明，链上仅存)
│  ├─ serviceEnd              uint64    (可选：链下声明，链上仅存)
│  └─ disputeWindowSeconds    uint32    (可争议窗口)
│
└─ arbitration (MVP 可选，建议预留)
   ├─ arbitrator              address   (多签/仲裁合约/EOA)
   ├─ arbitrationPolicyHash   bytes32   (链下仲裁规则文本哈希)
   └─ arbFeeAmount            uint256   (可选：仲裁费)
```

**为什么这样可落地**：
- **orderId + snapshotHash** 是「链上/链下对齐」最关键锚点  
- **platformFeeBps** 固化收费口径，避免运营口头改  
- 仲裁预留但不强行上 MVP（否则合规模型/运营流程会拖慢上线）  

---

## 3) 资金流与状态机（链上极简）

**状态机**：
- None → **Created** (createEscrow)  
- → **Funded** (deposit by traveler)  
- → **Completed** (release)  
- → **Refunded** (refund)  
- → **Disputed** (openDispute) ［可选］  
- → **Resolved** (executeResolution) ［可选］  

**最小函数（MVP）**：
- `createEscrow(params)`  
- `deposit()` — traveler 存入 totalAmount  
- `release()` — 释放：guide 收款 + platform 抽成  
- `refund()` — 退款：返还 traveler  

**注意**：MVP 建议「向导保证金/10%」先不进链。等订单量起来再做 guideDepositBps 进链，否则冷启动阻力大、合规解释更复杂。与 [17](17-TravelTrust-MVP-产品与模块清单.md) §二 ④ 一致。

---

## 4) 事件结构（建议）

事件即「后端投影的 API」，字段要稳定。

| 事件 | 主要参数 |
|------|----------|
| **EscrowCreated** | orderId, escrow, traveler, guide, token, totalAmount, platformFeeBps, snapshotHash, schemaVersion |
| **Deposited** | orderId, escrow, from, amount |
| **Released** | orderId, escrow, guideAmount, platformFeeAmount |
| **Refunded** | orderId, escrow, travelerAmount |
| **DisputeOpened** ［可选］ | orderId, escrow, opener, reasonHash |
| **ResolutionExecuted** ［可选］ | orderId, escrow, resolutionId, decisionHash |

与 [10-系统级不变量白皮书](10-系统级不变量白皮书-v1.0.md)、[14-合约-API-ABI-前后端对齐](14-合约-API-ABI-前后端对齐.md) 一致。

---

## 5) 链下订单版本与 snapshotHash（强约束）

链下 **Confirm Final Plan** 时生成 snapshotHash：

```
snapshotHash = keccak256(
  orderId,
  travelerUserId,
  guideUserId,
  token,
  totalAmount,
  platformFeeBps,
  itineraryVersion,
  itineraryJsonHash,
  termsHash,
  timestamp
)
```

**链上只存 snapshotHash，不存 itinerary。**

---

## 6) 参数与安全检查清单（合约侧）

- `token != address(0)`  
- `totalAmount > 0`  
- `platformFeeBps <= MAX_BPS`（例如 2000）  
- `traveler != guide`  
- `snapshotHash != 0x0`  
- 费用计算用整型：`fee = totalAmount * bps / 10000`  

---

*实现方案与代码结构须同时遵守 [20-企业级云部署架构图](20-企业级云部署架构图.md) 的部署与 UI 约束。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
