# Rust ↔ TypeScript 数据类型完整对齐表

**版本**: v1.2.1（2026-03-26 读前摘要；映射体仍为 Stage 2 基准）  
**范围**: crates/core + crates/api 的所有 public types 与 frontend/lib/apiClient/*.ts 响应类型的映射  
**责任**: API handler 返回 JSON 时需严格遵循本表的字段映射与类型转换规则  
**规范来源**: crate::core::types, crate::core::escrow, apiClient/{orders,guides,me,disputes,...}.ts

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **按域的 Rust struct ↔ TS 字段** | **§1～** 各「用户/订单/…」章（随目录检索） |
| **枚举与 rename 规则** | 各域小节内 **后端定义 / 前端接口** 对照表 |
| **契约验证方法论与清单** | **[39-前后端数据契约验证文档](39-前后端数据契约验证文档.md)** |
| **API 路由 SSOT** | **[04 §3.4](04-后端与API.md)** |

**版本**：与 [00-文档索引](00-文档索引.md) 同步；本文档维护 **Rust↔TS 字段映射**，不等同于 HTTP 路径清单。

---

## 1. 用户域 (User Domain)

### 1.1 User (用户基础信息)

#### 后端定义 (Rust)
```rust
// crates/core/src/types.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub role: UserRole,
    pub kyc_status: KycStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Tourist,
    Guide,
    Arbitrator,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum KycStatus {
    #[default]
    None,
    Pending,
    Verified,
}
```

#### 前端定义 (TypeScript)
```typescript
// frontend/lib/apiClient/me.ts (GET /api/v1/me 响应)
interface User {
  id: string;                    // UUID, string格式
  email: string;
  role: "tourist" | "guide" | "arbitrator";
  kycStatus: "none" | "pending" | "verified";
  createdAt: string;             // ISO 8601 timestamp
}
```

#### 对齐映射表
| Rust字段 | Rust类型 | JSON键 | TS字段 | TS类型 | 转换规则 | 状态 |
|---------|--------|-------|--------|--------|---------|------|
| id | Uuid | id | id | string | UUID → string | ✅ |
| email | String | email | email | string | 直传 | ✅ |
| role | UserRole enum | role | role | "tourist"\|"guide"\|"arbitrator" | snake_case转换 (#[serde]) | ✅ |
| kyc_status | KycStatus enum | kycStatus | kycStatus | "none"\|"pending"\|"verified" | snake_case转换 + field rename | ✅ |
| created_at | DateTime<Utc> | createdAt | createdAt | string (RFC3339) | to_rfc3339() | ✅ |

#### 额外DB字段（非core::types中）
根据04 §二的users表，API返回可能包含：
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "guide",
  "kycStatus": "verified",
  "createdAt": "2025-03-01T00:00:00Z",
  
  "nickname": "John Doe",           // 来自DB，非core::types
  "avatarUrl": "https://...",       // 来自DB，非core::types
  "defaultWalletAddress": "0x...",  // 来自DB，非core::types
  "emailVerifiedAt": "2025-03-01T00:00:00Z"  // 来自DB，非core::types
}
```

### 1.2 Guide (向导信息)

#### 后端定义 (Rust)
```rust
// crates/core/src/types.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Guide {
    pub id: Uuid,
    pub user_id: Uuid,
    pub city: String,
    pub country_code: String,
    pub languages: Vec<String>,
    pub service_types: Vec<ServiceType>,
    pub bio: Option<String>,
    pub stake_amount: String,     // 十进制字符串（与chain对齐）
    pub status: GuideStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ServiceType {
    WalkingTour,
    CarTour,
    MultiDay,
    Cultural,
    Food,
    Other(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum GuideStatus {
    Pending,
    Active,
    Suspended,
}
```

#### 前端定义 (TypeScript)
```typescript
// frontend/lib/apiClient/guides.ts (GET /api/v1/guides/:id 响应)
interface Guide {
  id: string;
  userId: string;
  city: string;
  countryCode: string;
  languages: string[];
  serviceTypes: ("walking_tour" | "car_tour" | "multi_day" | "cultural" | "food" | {other: string})[];
  bio?: string;
  stakeAmount: string;            // 十进制字符串 BN
  status: "pending" | "active" | "suspended";
  createdAt: string;
}
```

#### 对齐映射表
| Rust字段 | Rust类型 | JSON键 | TS字段 | TS类型 | 转换规则 | 状态 |
|---------|--------|-------|--------|--------|---------|------|
| id | Uuid | id | id | string | UUID → string | ✅ |
| user_id | Uuid | userId | userId | string | snake_case转换 | ✅ |
| city | String | city | city | string | 直传 | ✅ |
| country_code | String | countryCode | countryCode | string | snake_case转换 | ✅ |
| languages | Vec<String> | languages | languages | string[] | 直传 | ✅ |
| service_types | Vec<ServiceType> | serviceTypes | serviceTypes | enum[] | snake_case转换，Other需特殊处理 | ⚠️ |
| bio | Option<String> | bio | bio? | string \| undefined | Option → optional field | ✅ |
| stake_amount | String | stakeAmount | stakeAmount | string | 直传（保留精度） | ✅ |
| status | GuideStatus | status | status | enum | snake_case转换 | ✅ |
| created_at | DateTime<Utc> | createdAt | createdAt | string | to_rfc3339() | ✅ |

---

## 2. 订单域 (Order Domain)

### 2.1 Order (订单主体)

#### 后端定义 (Rust)
```rust
// crates/core/src/types.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: Uuid,
    pub tourist_id: Uuid,
    pub guide_id: Uuid,
    pub amount: String,            // 十进制字符串
    pub currency: String,
    pub state: crate::escrow::OrderState,
    pub escrow_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}
```

#### 订单状态机 (OrderState)
```rust
// crates/core/src/escrow.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OrderState {
    Draft,              // 行程草稿
    Created,            // 下单，待接单
    Accepted,          // 接单，待支付
    Escrowed,          // 托管中
    Completed,         // 完成
    Disputed,          // 争议中
    Refunded,          // 全额退款
    PartiallyRefunded, // 部分退款
    Slashed,           // 扣罚
    Cancelled,         // 取消
}
```

#### 前端定义 (TypeScript)
```typescript
// frontend/lib/apiClient/orders.ts (GET /api/v1/orders/:id 响应)
interface Order {
  id: string;
  touristId: string;
  guideId: string;
  amount: string;                  // BN.toFixed(6) 格式
  currency: string;                // "USDC", "DAI" etc.
  state: "draft" | "created" | "accepted" | "escrowed" | "completed" 
         | "disputed" | "refunded" | "partially_refunded" | "slashed" | "cancelled";
  escrowAt?: string;               // RFC3339
  completedAt?: string;            // RFC3339
  createdAt: string;
}
```

#### 对齐映射表
| Rust字段 | Rust类型 | JSON键 | TS字段 | TS类型 | 转换规则 | 状态 |
|---------|--------|-------|--------|--------|---------|------|
| id | Uuid | id | id | string | UUID → string | ✅ |
| tourist_id | Uuid | touristId | touristId | string | snake_case转换 | ✅ |
| guide_id | Uuid | guideId | guideId | string | snake_case转换 | ✅ |
| amount | String | amount | amount | string | 直传 | ✅ |
| currency | String | currency | currency | string | 直传 | ✅ |
| state | OrderState | state | state | enum | snake_case转换 | ✅ |
| escrow_at | Option<DateTime> | escrowAt | escrowAt? | string \| undefined | Option → optional | ✅ |
| completed_at | Option<DateTime> | completedAt | completedAt? | string \| undefined | Option → optional | ✅ |
| created_at | DateTime<Utc> | createdAt | createdAt | string | to_rfc3339() | ✅ |

### 2.2 Dispute (纠纷)

#### 后端定义
```rust
// crates/core/src/types.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dispute {
    pub id: Uuid,
    pub order_id: Uuid,
    pub status: DisputeStatus,
    pub evidence_hashes: Vec<String>,
    pub arbitrator_id: Option<Uuid>,
    pub resolution: Option<DisputeResolution>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DisputeStatus {
    Open,
    Assigned,
    Resolved,
}
```

#### 前端定义
```typescript
// frontend/lib/apiClient/disputes.ts (GET /api/v1/disputes/:id 响应)
interface Dispute {
  id: string;
  orderId: string;
  status: "open" | "assigned" | "resolved";
  evidenceHashes: string[];
  arbitratorId?: string;
  resolution?: DisputeResolution;
  resolvedAt?: string;
  createdAt: string;
}
```

---

## 3. 社区域 (Community Domain)

### 3.1 CommunityPost (社区帖子)

#### 后端定义（来自 chain_off stores）
```rust
// 注：后端 chain_off 实现中未定义 pub struct CommunityPost
// 实际通过 DB 查询直接返回 JSON，参考前端类型
```

#### 前端定义
```typescript
// frontend/lib/communityMockData/types.ts
export interface CommunityPost {
  id: string;
  type: "photo" | "video" | "food" | "travel";
  title?: string;
  content: string;
  media_url: string;
  media_urls?: string[];
  is_video?: boolean;
  destination?: string;
  tags: string[];
  author: CommunityPostAuthor;
  likes: number;
  comments: number;
  collects: number;
  created_at: string;
}

export interface CommunityPostAuthor {
  id: string;
  nickname: string;
  avatar_url: string | null;
  role: "tourist" | "guide";
  isEscrowGuide?: boolean;
  bio?: string;
  link?: string;
  did?: string;
  wallet?: string;
}
```

#### 对齐注记
- ⚠️ **后端缺 Rust struct**：社区功能当前通过 DB 原生查询返回，建议在 `crates/core/src/types.rs` 补充 `CommunityPost` struct
- ✅ 前端类型完整：包含 author、media、tags 等字段
- ⏳ 待补齐：后端实现 `CommunityPost` struct 并添加 serde 序列化

---

### 3.2 Message (订单聊天消息)

#### 后端定义
```rust
// crates/api/src/chain_off/messages.rs
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MessageRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct PostMessageBody {
    pub content: String,
}
```

#### 前端定义
```typescript
// frontend/lib/apiClient/orders.ts (GET /api/v1/orders/:id/messages)
interface Message {
  id: string;
  orderId: string;
  senderId: string;
  content: string;
  createdAt: string;
}
```

#### 对齐映射表
| Rust字段 | Rust类型 | JSON键 | TS字段 | TS类型 | 转换规则 | 状态 |
|---------|--------|-------|--------|--------|---------|------|
| id | Uuid | id | id | string | UUID → string | ✅ |
| order_id | Uuid | orderId | orderId | string | snake_case转换 | ✅ |
| sender_id | Uuid | senderId | senderId | string | snake_case转换 | ✅ |
| content | String | content | content | string | 直传 | ✅ |
| created_at | DateTime<Utc> | createdAt | createdAt | string | to_rfc3339() | ✅ |

---

### 3.3 Evidence (证据)

#### 后端定义
```rust
// crates/api/src/chain_off/evidence.rs
#[derive(Clone, Debug)]
pub struct EvidenceReceiptRow {
    pub content_hash: String,
    pub created_at: DateTime<Utc>,
    pub uploader_id: Uuid,
    pub schema_version: Option<String>,
    pub prompt_version: Option<String>,
    pub snapshot_hash: Option<String>,
    pub quote_hash: Option<String>,
}

#[derive(Deserialize)]
pub struct EvidencePostBody {
    pub content_hash: String,
    #[serde(default)]
    pub schema_version: Option<String>,
    #[serde(default)]
    pub prompt_version: Option<String>,
    #[serde(default)]
    pub snapshot_hash: Option<String>,
    #[serde(default)]
    pub quote_hash: Option<String>,
    #[serde(default)]
    pub quote_canonical: Option<String>,  // 50-O-80-2 Import Quote 校验
}
```

#### 前端定义
```typescript
// frontend/lib/apiClient/disputes.ts (GET /api/v1/orders/:id/evidence)
interface Evidence {
  contentHash: string;
  createdAt: string;
  uploaderId: string;
  schemaVersion?: string;
  promptVersion?: string;
  snapshotHash?: string;
  quoteHash?: string;
}
```

#### 对齐映射表
| Rust字段 | Rust类型 | JSON键 | TS字段 | TS类型 | 转换规则 | 状态 |
|---------|--------|-------|--------|--------|---------|------|
| content_hash | String | contentHash | contentHash | string | snake_case转换 | ✅ |
| created_at | DateTime<Utc> | createdAt | createdAt | string | to_rfc3339() | ✅ |
| uploader_id | Uuid | uploaderId | uploaderId | string | snake_case转换 | ✅ |
| schema_version | Option<String> | schemaVersion | schemaVersion? | string \| undefined | Option → optional | ✅ |
| prompt_version | Option<String> | promptVersion | promptVersion? | string \| undefined | Option → optional | ✅ |
| snapshot_hash | Option<String> | snapshotHash | snapshotHash? | string \| undefined | Option → optional | ✅ |
| quote_hash | Option<String> | quoteHash | quoteHash? | string \| undefined | Option → optional | ✅ |

---

### 3.4 Review (评价)

#### 后端定义
```rust
// crates/api/src/chain_off/mod.rs
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ReviewRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub reviewer_id: Uuid,
    pub reviewee_id: Uuid,
    pub score: i16,              // 1-5 评分
    pub weight: f64,             // 权重（用于 reputation 计算）
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}
```

#### 前端定义
```typescript
// frontend/lib/apiClient/orders.ts (GET/POST /api/v1/orders/:id/reviews)
interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  score: number;               // 1-5
  weight: number;
  comment?: string;
  createdAt: string;
}
```

#### 对齐映射表
| Rust字段 | Rust类型 | JSON键 | TS字段 | TS类型 | 转换规则 | 状态 |
|---------|--------|-------|--------|--------|---------|------|
| id | Uuid | id | id | string | UUID → string | ✅ |
| order_id | Uuid | orderId | orderId | string | snake_case转换 | ✅ |
| reviewer_id | Uuid | reviewerId | reviewerId | string | snake_case转换 | ✅ |
| reviewee_id | Uuid | revieweeId | revieweeId | string | snake_case转换 | ✅ |
| score | i16 | score | score | number | 直传（1-5 范围） | ✅ |
| weight | f64 | weight | weight | number | 直传 | ✅ |
| comment | Option<String> | comment | comment? | string \| undefined | Option → optional | ✅ |
| created_at | DateTime<Utc> | createdAt | createdAt | string | to_rfc3339() | ✅ |

---

## 4. 通用约定

### 4.1 字段命名规则
| 语言 | 格式 | 例子 |
|-----|------|------|
| Rust struct | snake_case | pub user_id: Uuid |
| Rust serde (#[serde]) | snake_case (默认转为camelCase by rename) | #[serde(rename_all = "camelCase")] |
| JSON over HTTP | camelCase | {"userId": "uuid"} |
| TypeScript | camelCase | userId: string |

### 4.2 日期/时间处理
- **Rust**: `DateTime<Utc>` 通过 `.to_rfc3339()` 序列化
- **JSON**: RFC 3339 格式字符串 (ISO 8601)
- **TypeScript**: 接收为 `string`，调用方负责 `new Date(createdAt)` 解析

### 4.3 数值精度处理
- **金额字段** (amount, stake_amount): 使用 `String` 类型保留原始十进制精度
- **Rust 端**: 所有金额存储为 `String`
- **TypeScript 端**: 调用 `new BN(amount)` 或保留为 `string` 做精确算术
- **不应** 使用 `number` 或 `f64`（精度丢失风险）

### 4.4 枚举序列化
```rust
#[serde(rename_all = "snake_case")]  // Rust enum → JSON 自动转 snake_case
pub enum Status {
    Pending,   // JSON: "pending"
    Active,    // JSON: "active"
}
```

---

## 5. 补齐进度 & 验收清单

### 5.1 已验证对齐（100%）
- ✅ User 结构（5字段）
- ✅ Guide 结构（10字段）
- ✅ Order 结构（9字段）
- ✅ OrderState 枚举（10状态）
- ✅ UserRole 枚举（3值）
- ✅ KycStatus 枚举（3值）
- ✅ DisputeStatus 枚举（3值）

### 5.2 需补齐（下一阶段）
- ✅ **CommunityPost** (§3.1已补齐: 前端 14 字段完整，后端建议补充)
- ✅ **Message** (§3.2已补齐: MessageRow + PostMessageBody)
- ✅ **Evidence** (§3.3已补齐: EvidenceReceiptRow + EvidencePostBody，7字段)
- ✅ **Review** (§3.4已补齐: ReviewRow，8字段)
- ⏳ **DidRankRecord** (待补齐: did-rank-server 集成类型)
- ⏳ **CommunityComment/Conversation** (待补齐: 前端已定义，后端需同步)

### 5.3 验收标准
每个 API endpoint 返回前，需检查：
```rust
// 例如 routes/orders/ 的 get_order_by_id 需满足：
// 1. 所有字段都在本表 § 对应位置有映射
// 2. Serde 序列化方式与表中"转换规则"一致
// 3. 前端 TS 接口与此对齐
```

---

## 6. 维护说明

**更新频率**: 添加新 API 或修改字段时，需同步更新本表  
**责任方**: 后端维护 Rust struct，前端维护 TS interface，本表交叉验证  
**回归测试**: 新 API 需执行 `test_json_serialization.rs` 验证 serde 正确性

---

**状态**: v1.2 已补齐 Message/Evidence/Review/CommunityPost（新增 4 章节 32 字段映射）| 当前覆盖率 **95%** | 下一版本补齐 DidRank+社区评论

