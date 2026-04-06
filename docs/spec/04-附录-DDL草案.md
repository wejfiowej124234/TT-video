# 04 附录：数据库 DDL 草案（CockroachDB/PostgreSQL）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **各表 CREATE 草案** | **正文按表分节**（`event_log` 起） |
| **与业务/API 字段对齐** | **[04-后端与API](04-后端与API.md) §一、§二** |
| **域划分与迁移组织** | **[04-数据库架构与表分类](04-数据库架构与表分类.md)** |
| **接库执行清单** | **[41](41-后端数据库接库与落地清单.md)** |

**用途**：满足 [11-开发前准备清单](11-开发前准备清单.md) §一 项 9「数据库 DDL 草案完成」及 §二 门禁「DDL 草案完成」。与 [04-后端与API](04-后端与API.md) §一§二、01 §5 事件与投影、01 §9 对账一致。实现时可按需调整类型与约束，须保持 append-only、checkpoint 含 logIndex、投影可重建等约束。

**适用**：CockroachDB 或 PostgreSQL；迁移工具建议 SQLx migrations 或等价，见 04 §四 数据库迁移策略。

---

## 1. event_log（append-only，链事件表）

仅追加，不覆盖、不删除；主键含 (chain_id, block_number, log_index) 或 (chain_id, tx_hash, log_index) 以保证唯一与重放顺序。

```sql
-- 链上事件原始表（append-only）
CREATE TABLE event_log (
    id                  BIGSERIAL PRIMARY KEY,
    chain_id            BIGINT NOT NULL,
    block_number        BIGINT NOT NULL,
    block_hash          BYTEA NOT NULL,
    tx_hash             BYTEA NOT NULL,
    log_index           INT NOT NULL,
    event_type          TEXT NOT NULL,  -- EscrowCreated | Paid | DisputeOpened | ResolutionExecuted
    payload             JSONB NOT NULL,
    finality_n_used     INT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (chain_id, block_number, log_index)
);

CREATE INDEX idx_event_log_chain_block ON event_log (chain_id, block_number);
CREATE INDEX idx_event_log_event_type ON event_log (chain_id, event_type);
```

---

## 2. checkpoints_sharded（索引器消费进度）

每 shard（如 chain_id + consumer_id）一条最新 checkpoint；(block_number, log_index) 严格小于等于已确认 finality 高度。

```sql
CREATE TABLE checkpoints_sharded (
    consumer_id         TEXT NOT NULL,
    chain_id            BIGINT NOT NULL,
    block_number        BIGINT NOT NULL,
    log_index           INT NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (consumer_id, chain_id)
);
```

---

## 3. orders_projection（订单投影，可重建）

由 event_log 重放生成；可删除后从 event_log 重建。资金终态仅来自链事件驱动。

```sql
CREATE TABLE orders_projection (
    order_id            BYTEA PRIMARY KEY,  -- bytes32 orderId
    chain_id            BIGINT NOT NULL,
    escrow_address      BYTEA,
    tourist_id          UUID REFERENCES users(id),
    guide_id            UUID REFERENCES users(id),
    status              TEXT NOT NULL,
    amount              NUMERIC(36,18),
    token               BYTEA,
    paid_at_block       BIGINT,
    paid_at_log_index   INT,
    completed_at_block  BIGINT,
    dispute_opened_at_block BIGINT,
    resolution_type     TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_projection_chain_status ON orders_projection (chain_id, status);
```

---

## 4. reconciliation_reports（对账报告，只追加）

对账任务产出；三段式（自动/半自动/人工）触发条件与 01 §9、17 条 #15 一致。

```sql
CREATE TABLE reconciliation_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type         TEXT NOT NULL,
    chain_id            BIGINT,
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    summary             JSONB,
    details_path        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. correction_log（纠偏与对账修正，只追加）

人工修复或对账修正只写此表，不直接改 orders_projection 资金终态；主状态由重放生成，见 01 §10 17 条 #12。

```sql
CREATE TABLE correction_log (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BYTEA NOT NULL,
    chain_id            BIGINT NOT NULL,
    correction_type     TEXT NOT NULL,
    reason              TEXT,
    payload             JSONB,
    approved_by         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_correction_log_order ON correction_log (chain_id, order_id);
```

---

## 6. executor_executions（执行器执行记录，幂等）

resolutionId 幂等；双人审批与 01 §7、17 条 #11 一致。

```sql
CREATE TABLE executor_executions (
    resolution_id       BYTEA PRIMARY KEY,
    order_id            BYTEA NOT NULL,
    chain_id            BIGINT NOT NULL,
    escrow_address      BYTEA NOT NULL,
    resolution_type     TEXT NOT NULL,
    tx_hash             BYTEA,
    status              TEXT NOT NULL,
    approved_by         TEXT,
    snapshot_hash       BYTEA,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7. idempotency_keys（幂等键，API/队列去重）

与 01 幂等与键 P0、17 条 #14 一致；requestId/idempotency-key、队列消费、执行器 resolutionId、连点 orderId+action 等。

```sql
CREATE TABLE idempotency_keys (
    key_hash            BYTEA PRIMARY KEY,
    key_scope           TEXT NOT NULL,
    response_snapshot   JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ
);

CREATE INDEX idx_idempotency_keys_scope ON idempotency_keys (key_scope);
```

---

## 7.5. itineraries（P15/17 区域① 行程生成层，占位）

与 17 区域①、[27-P15-实现记录](27-archived/27-P15-实现记录.md) 一致；订单草稿（Draft）可关联行程，确认后转 Created。实现时与 orders 表扩展（status=Draft）或 draft_orders 对齐。

```sql
CREATE TABLE itineraries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            BYTEA,           -- 关联订单（Draft 时可为 NULL，确认后填）
    draft_id            TEXT,            -- 草稿唯一标识（实现时与 Draft 订单或临时 id 对齐）
    version             INT NOT NULL DEFAULT 1,
    day_index           INT NOT NULL,    -- 第几天
    content_json        JSONB NOT NULL,  -- 当日行程内容（景点、时段、说明等）
    amount_breakdown    JSONB,           -- 可选：当日金额拆分
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_itineraries_order ON itineraries (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_itineraries_draft ON itineraries (draft_id) WHERE draft_id IS NOT NULL;
```

---

## 8. 与 04 §二 业务表的关系

§二 所述 **users、guides、orders、reviews、stakes、disputes** 等业务表结构见 [04-后端与API §二](04-后端与API.md)。本附录 §9 给出业务表 DDL 草案，与 crates/api chain_off 内存结构对齐，便于接入 PostgreSQL 后持久化用户/向导/订单等。

---

## 9. 业务表 DDL 草案（用户/向导/订单/争议等，供 DB 连接用）

与 04 §二、chain_off::ChainOffStore 对齐；实现时可按需增删字段或索引。主键与 04 §二 一致。

```sql
-- 9.1 users（用户）
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT,
    role                TEXT NOT NULL DEFAULT 'tourist',
    kyc_status          TEXT NOT NULL DEFAULT 'none',
    nickname            TEXT,
    avatar_url          TEXT,
    default_wallet_address TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users (LOWER(email));

-- 9.2 sessions（登录态 token -> user_id）
CREATE TABLE sessions (
    token               TEXT PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON sessions (user_id);

-- 9.3 guides（向导）
CREATE TABLE guides (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    city                TEXT NOT NULL,
    country_code        TEXT NOT NULL DEFAULT '',
    languages            JSONB NOT NULL DEFAULT '[]',
    service_types       JSONB NOT NULL DEFAULT '[]',
    bio                 TEXT,
    wallet_address      TEXT,
    real_name           TEXT,
    passport_number_hash TEXT,
    id_photo_url        TEXT,
    language_cert_url   TEXT,
    stake_amount        TEXT NOT NULL DEFAULT '0',
    status              TEXT NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_guides_user ON guides (user_id);
CREATE INDEX idx_guides_status ON guides (status);

-- 9.4 orders（订单；资金终态以链事件为准时可与 orders_projection 对账）
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tourist_id          UUID NOT NULL REFERENCES users(id),
    guide_id            UUID NOT NULL REFERENCES guides(id),
    amount              TEXT NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'USD',
    status              TEXT NOT NULL,
    escrow_address      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at         TIMESTAMPTZ,
    escrowed_at         TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    trip_end_at         TIMESTAMPTZ,
    dispute_deadline_at TIMESTAMPTZ,
    snapshot_hash       TEXT
);
CREATE INDEX idx_orders_tourist ON orders (tourist_id);
CREATE INDEX idx_orders_guide ON orders (guide_id);
CREATE INDEX idx_orders_status ON orders (status);

-- 9.5 reviews（评价）
CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id),
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    reviewee_id         UUID NOT NULL REFERENCES users(id),
    score               SMALLINT NOT NULL,
    weight              NUMERIC NOT NULL DEFAULT 1,
    comment             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_order ON reviews (order_id);
CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id);

-- 9.6 disputes（争议）
CREATE TABLE disputes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL UNIQUE REFERENCES orders(id),
    status              TEXT NOT NULL,
    evidence_hashes     JSONB NOT NULL DEFAULT '[]',
    arbitrator_id       UUID REFERENCES users(id),
    refund_ratio        NUMERIC,
    slash_guide         BOOLEAN,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_disputes_order ON disputes (order_id);

-- 9.7 evidence_receipts（证据回执，order_id -> 多条）
CREATE TABLE evidence_receipts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id),
    content_hash        TEXT NOT NULL,
    uploader_id         UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evidence_receipts_order ON evidence_receipts (order_id);

-- 9.8 order_messages（订单聊天，P16）
CREATE TABLE order_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id),
    sender_id           UUID NOT NULL REFERENCES users(id),
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_messages_order ON order_messages (order_id);

-- 9.9 guide_slot（档期占位：guide_id -> order_id，Accepted/Escrowed 时占档）
CREATE TABLE guide_slot (
    guide_id            UUID PRIMARY KEY REFERENCES guides(id) ON DELETE CASCADE,
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE
);

-- 9.10 itineraries（行程包，P15/17；与 Draft 订单关联时可复用或扩展）
-- 见 §7.5；若与 orders 合并 Draft 则可为 orders 表加 itinerary_json 等字段，此处可省略独立表。
```

---

## 10. Migration 003 更新（2025-03-06 企业级审计后补充）

**目的**：修复企业级审计报告识别的关键数据库缺口（orders 链映射字段、guides DID 字段、itineraries 完整表、community 9 表群、evidence_receipts 完整结构）。

**执行方式**：以 `crates/api/migrations/` 下 **SQLx 时间戳迁移** 为准（`sqlx migrate run`）。历史文档中的 `migrations/001_*.sql` / `003_add_chain_fields_and_community.sql` 等路径已废弃；本节保留为 DDL 备忘，与实文件逐条对照以仓库迁移为准。

### 10.1 Orders 表补充字段（Critical P1）

为支持链下-链上映射与 01 §5、14 对齐，orders 表需补充：

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS chain_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id BYTEA;  -- bytes32 链上 orderId
-- escrow_address 已存在（§9.4），若为 TEXT 需与链保持一致（实现时定稿）
ALTER TABLE orders ADD COLUMN IF NOT EXISTS image TEXT;  -- 订单封面（56-S11）
-- snapshot_hash 已存在（§9.4）
```

### 10.2 Guides 表补充字段（High P1，DID 与证件，已部分覆盖）

§9.3 已含 `wallet_address`, `real_name`, `passport_number_hash`, `id_photo_url`, `language_cert_url`；migration 003 为幂等补充（`IF NOT EXISTS`）。

### 10.3 Itineraries 完整表（Medium P1，52 统一表）

代替 §7.5 占位，完整实现：

```sql
CREATE TABLE IF NOT EXISTS itineraries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES orders(id) ON DELETE CASCADE,
    version             INT NOT NULL DEFAULT 1,
    destination         TEXT NOT NULL,
    city                TEXT,
    total_days          INT NOT NULL,
    travel_date         DATE,
    daily_itinerary     JSONB NOT NULL DEFAULT '[]',  -- [{day_index, content_text, city, attractions:[], dining:[], hotel, images:[]}]
    amount_breakdown    JSONB,
    highlights          JSONB,
    snapshot_hash       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_itineraries_order ON itineraries (order_id);
```

### 10.4 Community 9 表群（High P1，31 附加与 55 阶段）

与 [31-附录-Web3交流社区功能扩展](31-附录-Web3交流社区功能扩展.md) §7、04 §3.4 社区路由一致：

```sql
-- 社区帖子
CREATE TABLE community_posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body                TEXT NOT NULL,
    post_type           TEXT,
    destination         TEXT,
    tags                JSONB DEFAULT '[]',
    media_urls          JSONB DEFAULT '[]',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 评论
CREATE TABLE community_comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    parent_id           UUID REFERENCES community_comments(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 点赞
CREATE TABLE community_likes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (post_id, user_id)
);

-- 收藏
CREATE TABLE community_collects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (post_id, user_id)
);

-- 关注
CREATE TABLE community_follows (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (follower_id, following_id)
);

-- 好友
CREATE TABLE community_friends (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_a_id < user_b_id),
    UNIQUE (user_a_id, user_b_id)
);

-- 好友申请
CREATE TABLE community_friend_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (from_user_id, to_user_id)
);

-- 会话
CREATE TABLE community_conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 私信消息
CREATE TABLE community_dm_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES community_conversations(id) ON DELETE CASCADE,
    sender_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_comments_post ON community_comments (post_id);
CREATE INDEX idx_community_likes_post ON community_likes (post_id);
CREATE INDEX idx_community_collects_user ON community_collects (user_id);
CREATE INDEX idx_community_follows_follower ON community_follows (follower_id);
CREATE INDEX idx_community_follows_following ON community_follows (following_id);
CREATE INDEX idx_community_dm_messages_conv ON community_dm_messages (conversation_id);
```

### 10.5 Evidence_receipts 完整表（Critical P1，覆盖 §9.7）

扩展 §9.7 简单定义为完整结构（支持 Import Quote 证据链，80-附录-01）：

```sql
-- DROP TABLE IF EXISTS evidence_receipts;  -- 若需重建
CREATE TABLE IF NOT EXISTS evidence_receipts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    uploader_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_hash        TEXT NOT NULL,
    content_url         TEXT,
    quote_hash          TEXT,
    quote_canonical     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evidence_receipts_order ON evidence_receipts (order_id);
```

### 10.6 Sessions 与 Feedback（55 阶段 S10）

```sql
-- sessions 已在 §9.2 定义

-- 反馈/提议（54-S19 用户与官方沟通窗口）
CREATE TABLE IF NOT EXISTS community_feedback (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending',
    official_reply      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_feedback_user ON community_feedback (user_id);
CREATE INDEX idx_community_feedback_status ON community_feedback (status);
```

---

**迁移与回滚**：须使用可回放迁移机制（如 SQLx migrations），每次 schema 变更须有 down 或前滚修复方案，见 04 §四 数据库迁移策略。业务表与 event_log/checkpoints/orders_projection 等可放在同一迁移目录，先业务表后链相关表。

*本文与 01 §5/§9、02 §十二、04、11 §一§二 配套。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
