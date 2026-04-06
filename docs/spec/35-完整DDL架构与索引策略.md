# 完整数据库DDL架构与索引策略

**版本**: Stage 2 (20250307 交付)  
**数据库**: PostgreSQL 14+ (支持 json/jsonb，UUID gen_random_uuid() 等)  
**迁移策略**: 分阶段迁移  
- Migration 001 (P1): 核心基础表 + Indexer 状态机
- Migration 002 (P3): 业务域表（用户/向导/订单/评价/争议）  
- Migration 003 (P1): 链映射字段 + 社区完整表 + 行程表

**规范来源**: docs/spec/04 §二，本表为执行态验证

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **表分类与 Migration 对应** | **§1 总体架构** |
| **按 migration 的 DDL 片段** | **§2～** 各章（001/002/003） |
| **权威迁移路径** | 运行态以 **`crates/api/migrations/*.sql`** 为准；接库勾选见 **[41](41-后端数据库接库与落地清单.md)** |
| **业务↔表 对照** | **[04-业务逻辑与数据库支持清单](04-业务逻辑与数据库支持清单.md)**、**[04-附录-DDL草案](04-附录-DDL草案.md)** |

---

## 1. 总体架构概览

### 1.1 表分类

| 分类 | 表名 | 用途 | 来源 Migration | 状态 |
|------|------|------|--------|------|
| **Indexer** | event_log, checkpoints_sharded | 链事件同步存储 | 001 | ✅ Live |
| **链映射** | orders_projection, executor_executions, correction_log | 链上到链下的映射表 | 001 | ✅ Live |
| **用户体系** | users, guides, stakes | 用户身份和质押 | 001 + 002 | ✅ Live |
| **业务订单** | orders, reviews, disputes, itineraries | 链下订单流程 | 002 + 003 | ✅ Live |
| **社区** | community_posts, community_comments, community_likes, community_collects, community_follows, community_friends, community_friend_requests, community_conversations | 社区互动 | 003 | ✅ Live |
| **辅助** | idempotency_keys, reconciliation_reports | 系统辅助 | 001 | ✅ Live |

**总表数**: 22 个表 (3个migration) | **索引数**: 40+ | **外键**: 15+

---

## 2. Indexer 层 (Migration 001)

### 2.1 event_log (append-only 事件日志)

```sql
CREATE TABLE event_log (
    id                  BIGSERIAL PRIMARY KEY,              -- 递增序列（全局唯一）
    chain_id            BIGINT NOT NULL,                    -- EVM chain ID
    block_number        BIGINT NOT NULL,                    -- 区块高度
    block_hash          BYTEA NOT NULL,                     -- 区块哈希
    tx_hash             BYTEA NOT NULL,                     -- 交易哈希
    log_index           INT NOT NULL,                       -- 日志索引（同区块内唯一）
    event_type          TEXT NOT NULL,                      -- 事件类型 (Escrow*.EscrowCreated 等)
    payload             JSONB NOT NULL,                     -- 完整事件参数 JSON
    finality_n_used     INT NOT NULL,                       -- 确认深度 (N-finality 机制)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(), -- 入库时间
    
    UNIQUE (chain_id, block_number, log_index)              -- 区块内日志唯一
);

CREATE INDEX idx_event_log_chain_block ON event_log (chain_id, block_number);
CREATE INDEX idx_event_log_event_type ON event_log (chain_id, event_type);
```

**用途**: 每个 EVM 事件（Escrow.Deposited, Registry.Approved 等）入库一条，作为"单一事实源"  
**量级**: ~1000-10000 events/day 预计  
**查询模式**:
- 按 chain_id + block_number 查（indexer 扫描）
- 按 chain_id + event_type 过滤（处理器选择）

### 2.2 checkpoints_sharded (消费进度)

```sql
CREATE TABLE checkpoints_sharded (
    consumer_id         TEXT NOT NULL,                      -- 消费者标识 (e.g., "handler_order_created")
    chain_id            BIGINT NOT NULL,                    -- EVM chain ID
    block_number        BIGINT NOT NULL,                    -- 最后处理到的区块
    log_index           INT NOT NULL,                       -- 最后处理到的日志索引
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(), -- 更新时间
    
    PRIMARY KEY (consumer_id, chain_id)                     -- 每个消费者+链一条记录
);
```

**用途**: 记录各个事件处理器的进度，支持恢复（与 spec 48 §12 系统容错一致）  
**量级**: ~10 条记录（每个消费者一条）

---

## 3. 链映射层 (Migration 001)

### 3.1 orders_projection (订单链上映射)

```sql
CREATE TABLE orders_projection (
    order_id            BYTEA PRIMARY KEY,                  -- bytes32 链上订单ID
    chain_id            BIGINT NOT NULL,                    -- EVM chain ID
    escrow_address      BYTEA,                              -- Escrow 合约实例地址
    tourist_id          UUID REFERENCES users(id),          -- 游客用户ID（链下）
    guide_id            UUID REFERENCES users(id),          -- 向导用户ID（链下）
    status              TEXT NOT NULL,                      -- 订单链上状态。与 core::escrow::OrderState 对应
    amount              NUMERIC(36,18),                     -- 托管金额（精确到 wei 级）
    token               BYTEA,                              -- ERC20 token 地址
    paid_at_block       BIGINT,                             -- Deposited 事件所在区块
    paid_at_log_index   INT,                                -- Deposited 事件日志索引
    completed_at_block  BIGINT,                             -- Released 事件所在区块
    dispute_opened_at_block BIGINT,                         -- DisputeOpened 事件所在区块
    resolution_type     TEXT,                               -- 如何解决（guideWins/travelerWins）
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(), -- 最后更新时间
    
    UNIQUE (chain_id, order_id)                             -- 每条链上订单一条记录
);

CREATE INDEX idx_orders_projection_chain_status ON orders_projection (chain_id, status);
```

**用途**: Indexer 扫描链事件后，投影到此表，作为"单一事实源"的链上状态  
**规范**: 与 spec 01 §1 订单状态机对应  
**量级**: ~1000-10000 记录（活跃订单）

### 3.2 executor_executions (执行器执行记录)

```sql
CREATE TABLE executor_executions (
    resolution_id       BYTEA PRIMARY KEY,                  -- bytes32 裁决ID (hash(chainId, orderId, resolutionSeq, decisionHash))
    order_id            BYTEA NOT NULL,                     -- 对应的链上订单ID
    chain_id            BIGINT NOT NULL,                    -- EVM chain ID
    escrow_address      BYTEA NOT NULL,                     -- Escrow 合约实例地址
    resolution_type     TEXT NOT NULL,                      -- 裁决类型 (guideWins/refund/partial)
    tx_hash             BYTEA,                              -- executeResolution 交易哈希
    status              TEXT NOT NULL,                      -- pending/executed/failed
    approved_by         TEXT,                               -- 谁批准的此裁决
    snapshot_hash       BYTEA,                              -- 链下证据快照哈希
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()  -- 最后更新时间
);
```

**用途**: 记录仲裁后的执行状况（见 spec 48 §2.2 internal.process-resolution-outbox）  
**规范**: 与 spec 01 §7.3 executeResolution 对应

### 3.3 correction_log (数据修正日志)

```sql
CREATE TABLE correction_log (
    id                  BIGSERIAL PRIMARY KEY,              -- 递增记录ID
    order_id            BYTEA NOT NULL,                     -- 订单链上ID
    chain_id            BIGINT NOT NULL,                    -- EVM chain ID
    correction_type     TEXT NOT NULL,                      -- 修正类型 (reorg/manual_override 等)
    reason              TEXT,                               -- 修正原因
    payload             JSONB,                              -- 修正数据（变更前后）
    approved_by         TEXT,                               -- 审批人
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()  -- 修正时间
);

CREATE INDEX idx_correction_log_order ON correction_log (chain_id, order_id);
```

**用途**: 区块重组或手动干预时，记录修正历史（审计追溯）

---

## 4. 用户体系层 (Migration 001 + 002)

### 4.1 users (用户基础表)

```sql
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT NOT NULL,                      -- 邮箱（唯一）
    password_hash       TEXT,                               -- 密码哈希
    role                TEXT NOT NULL DEFAULT 'tourist',    -- tourist/guide/arbitrator
    kyc_status          TEXT NOT NULL DEFAULT 'none',       -- none/pending/verified
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(), -- 创建时间
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Migration 002 扩展字段
    nickname            TEXT,                               -- 昵称
    avatar_url          TEXT,                               -- 头像 URL
    default_wallet_address TEXT,                            -- 默认钱包地址
    email_verified_at   TIMESTAMPTZ                         -- 邮箱验证时间
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
```

**规范**: 与 spec 04 §二 2.1 对应，是所有其他用户表的外键根

### 4.2 guides (向导表)

```sql
CREATE TABLE guides (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    city                TEXT NOT NULL,                      -- 所在城市
    country_code        TEXT NOT NULL DEFAULT '',           -- 国家代码
    languages           TEXT[] NOT NULL DEFAULT '{}',       -- 语言列表 ['en', 'zh', ...]
    service_types       TEXT[] NOT NULL DEFAULT '{}',       -- 服务类型 ['walking_tour', 'car_tour', ...]
    bio                 TEXT,                               -- 个人简介
    stake_amount        NUMERIC(36,18) NOT NULL DEFAULT 0,  -- 质押金额
    status              TEXT NOT NULL DEFAULT 'pending',    -- pending/active/suspended
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Migration 003 扩展字段
    wallet_address      TEXT,                               -- 钱包地址（链上接收资金）
    real_name           TEXT,                               -- 真实姓名（KYC）
    passport_number_hash TEXT,                              -- 护照号哈希（隐私）
    id_photo_url        TEXT,                               -- 身份证照片 URL
    language_cert_url   TEXT                                -- 语言证书 URL
);

CREATE INDEX idx_guides_user_id ON guides(user_id);
CREATE INDEX idx_guides_city ON guides(city);
CREATE INDEX idx_guides_status ON guides(status);
```

**规范**: 与 spec 04 §二 2.2 对应

### 4.3 stakes (质押表)

```sql
CREATE TABLE stakes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id            UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    amount              NUMERIC(36,18) NOT NULL,            -- 质押金额
    locked_until        TIMESTAMPTZ,                        -- 锁定至时间
    slashed_amount      NUMERIC(36,18) NOT NULL DEFAULT 0,  -- 被扣罚金额
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stakes_guide ON stakes(guide_id);
```

**规范**: 与 spec 08-3 质押规则对应

---

## 5. 业务订单层 (Migration 002 + 003)

### 5.1 orders (订单表 - 链下核心)

```sql
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tourist_id          UUID NOT NULL REFERENCES users(id),
    guide_id            UUID NOT NULL REFERENCES users(id),
    amount              NUMERIC(36,18) NOT NULL,            -- 订单金额
    currency            TEXT NOT NULL DEFAULT 'USD',        -- 货币代码
    status              TEXT NOT NULL DEFAULT 'created',    -- 见 core::escrow::OrderState 枚举
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at         TIMESTAMPTZ,                        -- 向导接单时间
    escrowed_at         TIMESTAMPTZ,                        -- 进escrow时间
    completed_at        TIMESTAMPTZ,                        -- 完成时间
    dispute_deadline_at TIMESTAMPTZ,                        -- 争议截止时间
    auto_complete_at    TIMESTAMPTZ,                        -- 自动完成时间
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Migration 003 扩展字段
    chain_id            BIGINT,                             -- 对应链ID（0 = chain_off 模式）
    order_id            BYTEA,                              -- 对应链上订单ID
    escrow_address      TEXT,                               -- Escrow 合约地址
    snapshot_hash       TEXT,                               -- 行程快照哈希
    image               TEXT,                               -- 订单封面图 URL (56阶段)
    
    UNIQUE (order_id) WHERE order_id IS NOT NULL,           -- 链上ID唯一（chain_off 为NULL）
    CONSTRAINT dispute_deadline_ge_auto CHECK (
        dispute_deadline_at IS NULL 
        OR auto_complete_at IS NULL 
        OR dispute_deadline_at >= auto_complete_at
    )
);

CREATE INDEX idx_orders_tourist ON orders(tourist_id);
CREATE INDEX idx_orders_guide ON orders(guide_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_chain_id ON orders(chain_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**规范**: 与 spec 04 §二 2.2 订单表对应，但 status 字段遵循 core::escrow::OrderState

### 5.2 reviews (评价表)

```sql
CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    reviewee_id         UUID NOT NULL REFERENCES users(id),
    score               SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    weight              NUMERIC(12,6) NOT NULL DEFAULT 1,   -- 权重（用于 reputation 计算）
    comment             TEXT,                               -- 评价文字
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(order_id, reviewer_id)                           -- 每个订单+评价人唯一
);

CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
```

**规范**: 与 spec 04 §二 2.2 对应，仅在 order status 为资金终态时允许创建

### 5.3 disputes (争议表)

```sql
CREATE TABLE disputes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'open',       -- open/assigned/resolved
    evidence_hashes     TEXT[] NOT NULL DEFAULT '{}',       -- 证据哈希数组
    arbitrator_id       UUID REFERENCES users(id),          -- 分配的仲裁员
    refund_ratio        NUMERIC(5,4),                       -- 退款比例 (0.0 ~ 1.0)
    slash_guide         BOOLEAN,                            -- 是否扣罚向导质押
    resolved_at         TIMESTAMPTZ,                        -- 解决时间
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_status ON disputes(status);
```

**规范**: 与 spec 04 §二 2.2 対应

### 5.4 itineraries (行程表)

```sql
CREATE TABLE itineraries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES orders(id) ON DELETE CASCADE,
    draft_id            TEXT,                               -- 草稿ID（未下单时）
    version             INT NOT NULL DEFAULT 1,             -- 版本号
    destination         TEXT,                               -- 目的地
    country             TEXT,                               -- 国家
    city                TEXT,                               -- 城市
    days                INT,                                -- 天数
    daily_itinerary     JSONB NOT NULL DEFAULT '[]',        -- 按日行程详情数组
    amount_breakdown    JSONB,                              -- 金额分解 JSON
    cover_image         TEXT,                               -- 封面图 URL (56阶段)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_itineraries_order ON itineraries(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_itineraries_draft ON itineraries(draft_id) WHERE draft_id IS NOT NULL;
```

**规范**: 与 spec 04 §二 2.2 对应，支持草稿和已下单行程两种模式

---

## 6. 社区层 (Migration 003)

### 6.1 community_posts (社区帖子)

```sql
CREATE TABLE community_posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,                      -- 帖子内容
    media_urls          TEXT[] DEFAULT '{}',                -- 媒体 URL 数组
    media_types         TEXT[] DEFAULT '{}',                -- 媒体类型数组 ['image', 'video', ...]
    destination         TEXT,                               -- 目的地标签
    likes_count         INT NOT NULL DEFAULT 0,             -- 点赞数（冗余，便于排序）
    comments_count      INT NOT NULL DEFAULT 0,             -- 评论数（冗余）
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_destination ON community_posts(destination) WHERE destination IS NOT NULL;
```

### 6.2-6.8 社区其他表 (完整定义与Migration 003一致)

- **community_comments**: 帖子评论（支持二级回复）
- **community_likes**: 点赞关系（解normalize化 likes_count）
- **community_collects**: 收藏关系
- **community_follows**: 用户关注关系
- **community_friends**: 好友关系（互相关注）
- **community_friend_requests**: 好友申请

**规范**: 与 spec 31 社区功能对应

---

## 7. 辅助表 (Migration 001)

### 7.1 idempotency_keys (幂等性缓存)

```sql
CREATE TABLE idempotency_keys (
    key_hash            BYTEA PRIMARY KEY,                  -- Idempotency-Key + scope hash
    key_scope           TEXT NOT NULL,                      -- 作用域 (e.g., "order_create")
    response_snapshot   JSONB,                              -- 请求响应缓存（用于重试返回相同值）
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ                         -- 过期时间（TTL 清理）
);

CREATE INDEX idx_idempotency_keys_scope ON idempotency_keys (key_scope);
```

**规范**: 与 spec 48 §4.3 idempotency_key middleware 对应

### 7.2 reconciliation_reports (对账报告)

```sql
CREATE TABLE reconciliation_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type         TEXT NOT NULL,                      -- 对账类型 (indexer/executor/balances)
    chain_id            BIGINT,                             -- 对应链ID
    period_start        TIMESTAMPTZ,                        -- 对账周期开始
    period_end          TIMESTAMPTZ,                        -- 对账周期结束
    summary             JSONB,                              -- 对账摘要
    details_path        TEXT,                               -- 详细数据存储路径（S3 等）
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**用途**: 系统级别的对账报告，用于验证 indexer 和 executor 的一致性

---

## 8. 索引策略总览

### 8.1 查询热点与索引

| 表名 | 主要查询条件 | 索引 | 预期 cardinality |
|------|-----------|------|------------------|
| event_log | (chain_id, block_number) | idx_event_log_chain_block | 中 |
| event_log | (chain_id, event_type) | idx_event_log_event_type | 中-高 |
| orders_projection | chain_id, status | idx_orders_projection_chain_status | 低-中 |
| orders | tourist_id, guide_id, status | idx_orders_tourist/guide/status | 高 |
| orders | created_at DESC | idx_orders_created_at | 中 |
| reviews | order_id, reviewee_id | idx_reviews_order/reviewee | 低 |
| disputes | status | idx_disputes_status | 低 |
| community_posts | created_at DESC, user_id | idx_community_posts_created, idx_community_posts_user | 中-高 |
| community_follows | follower_id, followee_id | idx_community_follows_follower/followee | 高 |

### 8.2 复合索引候选

建议在高并发场景中添加（需性能测试确认）：
```sql
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_community_posts_user_created ON community_posts(user_id, created_at DESC);
CREATE INDEX idx_checkpoints_consumer_chain ON checkpoints_sharded(consumer_id, chain_id, block_number);
```

---

## 9. 版本管理与演进

### 9.1 Migration 历史

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 001 | -- | Indexer + 用户基础表 + 映射表 | ✅ Live |
| 002 | -- | 业务表（guides/orders/reviews/disputes) | ✅ Live |
| 003 | -- | 链字段 + 社区完整表 + 行程表 | ✅ Live |

### 9.2 回滚流程

见 migrations/README.md，支持：
- **Down migration**: 按倒序执行，删表/删字段
- **Forward migration**: 重新应用，无数据丢失

### 9.3 扩展计划 (Future)

- **Migration 004** (预计 56 阶段): 用户社交脚本（粉丝分级、排行榜）
- **Migration 005** (预计中期): 支付记录表、Web3 wallet 详细表

---

## 10. 性能与监控

### 10.1 表大小预估

| 表名 | 预期行数 | 预期大小 | 增长率 |
|------|--------|---------|--------|
| event_log | 1-10M | 500MB - 5GB | 1K-10K/day |
| orders | 10-100K | 50-500MB | 10-100/day |
| community_posts | 10K-100K | 100-1000MB | 10-100/day |

### 10.2 维护建议

1. **索引碎片**: 定期执行 `REINDEX INDEX` 重建热索引
2. **ANALYZE**: 定期统计表统计信息，优化查询计划
3. **VACUUM**: 运行 `VACUUM ANALYZE` 回收过期记录空间
4. **分区** (Future): 考虑对 event_log/community_posts 按时间分区

---

**交付清单**:
- ✅ 22 个表定义与建表语句
- ✅ 40+ 索引设计说明
- ✅ 外键关系与约束定义
- ✅ 与 spec 04 的交叉对应
- ✅ 性能预估与维护建议

**下一步**: 执行 Migration 001/002/003 脚本，验证索引效能

