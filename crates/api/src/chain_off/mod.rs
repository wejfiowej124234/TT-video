//! P3 Phase 2 链下核心业务流程：用户/向导 CRUD、订单状态机、评价与权重、争议（仅 DB）。
//! 与 04 §二§三、01/03 一致；支付与链为 mock。

#![allow(dead_code)]

use chrono::{Datelike, DateTime, TimeZone, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use traveltrust_core::OrderState;
use uuid::Uuid;

pub(crate) fn data_origin_production_string() -> String {
    "production".to_string()
}

// ---------- 配置（01/03 超时与争议窗口：dispute_deadline ≥ auto_complete_at） ----------

#[derive(Clone)]
pub struct ChainOffConfig {
    /// 与 **`CHAIN_ID`** / **`chain::ChainConfig.chain_id`** 同源：新订单双写 **`orders.chain_id`**；纯链下未配 RPC 时为 **None**
    pub business_chain_id: Option<i64>,
    /// 接单超时（秒）
    pub accept_ttl_secs: i64,
    /// 支付超时（秒）
    pub payment_ttl_secs: i64,
    /// 确认完成/自动放款前天数（行程结束后 N 天）
    pub auto_complete_days: i64,
    /// 争议窗口截止相对行程结束的天数（须 ≥ auto_complete_days）
    pub dispute_window_days: i64,
    /// 评价窗口：完成订单后 N 天内可评（03 §2.2）
    pub review_window_days: i64,
    /// **`GOVERNANCE_ORDER_DEADLINE_CHAIN_SSOT`**：为真时 **`rating_deadline`** 优先 **`eth_call` `TravelTrustGovernor.orderRatingReviewWindowDays()`**（**`GOVERNOR_ADDRESS`** + **`CHAIN_RPC_URL`**）；读失败 / 无 Governor / 链上值越界 → **fail-closed** 回退 **`P3_REVIEW_WINDOW_DAYS`**（**`review_window_days`**）；见 **`chain/governor.rs`**、**`chain_off/orders.rs`**
    pub governance_order_deadline_chain_ssot: bool,
    /// **`GOVERNANCE_GOVERNOR_VIEW_PARAMS_CHAIN_SSOT`**：**`GET /meta` `governance`** / admin / reconcile 对 **`votingDelayBlocks`/`votingPeriodBlocks`/`quorumNumeratorBps`** 做链读与对拍（**TT-B110-SEQ5**）；**不**改 **`GET /api/v1/orders*`**。
    pub governance_governor_view_params_chain_ssot: bool,
    /// **`GOVERNANCE_TIMELOCK_DELAY_CHAIN_SSOT`**：**`GovernanceTimelock.delay()`**（**`getDelay()`** 口径）链读与对拍（**TT-B110-SEQ6**）；**不**改 **`GET /api/v1/orders*`**。
    pub governance_timelock_delay_chain_ssot: bool,
    /// **`GOVERNANCE_GOVERNOR_PROPOSAL_THRESHOLD_CHAIN_SSOT`**：**`TravelTrustGovernor.proposalThresholdVotes()`** 链读与对拍（**TT-B110-SEQ8**）；**不**改 **`GET /api/v1/orders*`**。
    pub governance_governor_proposal_threshold_chain_ssot: bool,
    /// **`GOVERNANCE_TIMELOCK_GOVERNOR_ADMIN_CHAIN_SSOT`**：**`GovernanceTimelock.governor()` / `admin()`** 链读与对拍（**TT-B110-SEQ9**）；**不**改 **`GET /api/v1/orders*`**。
    pub governance_timelock_governor_admin_chain_ssot: bool,
    /// **`GOVERNANCE_GOVERNOR_PROPOSAL_COUNT_CHAIN_SSOT`**：**`proposalCount()`** vs 投影行数（**TT-B110-SEQ10**）；**不**改 **`GET /api/v1/orders*`**。
    pub governance_governor_proposal_count_chain_ssot: bool,
    /// **`GOVERNANCE_GOVERNOR_TOKEN_TIMELOCK_CHAIN_SSOT`**：**`token()`** / **`timelock()`** **`immutable`** 引用地址链读与对拍（**TT-B110-SEQ11**）；**不**改 **`GET /api/v1/orders*`**。
    pub governance_governor_token_timelock_chain_ssot: bool,
    /// **`GOVERNANCE_PROPOSAL_COUNT_MAX_INDEXER_LAG`**：**`chain − projection`** 允许上限（默认 **32**）。
    pub governance_proposal_count_max_indexer_lag: u64,
    /// 仲裁费基数（03 §3.2 重复争议费用递增）；0 表示不校验
    pub arb_base_fee: f64,
}

impl Default for ChainOffConfig {
    fn default() -> Self {
        Self {
            business_chain_id: None,
            accept_ttl_secs: 24 * 3600,
            payment_ttl_secs: 30 * 60, // 80 §4.9 payment_window 建议 30 分钟
            auto_complete_days: 7,
            dispute_window_days: 7,
            review_window_days: 14,
            governance_order_deadline_chain_ssot: false,
            governance_governor_view_params_chain_ssot: false,
            governance_timelock_delay_chain_ssot: false,
            governance_governor_proposal_threshold_chain_ssot: false,
            governance_timelock_governor_admin_chain_ssot: false,
            governance_governor_proposal_count_chain_ssot: false,
            governance_governor_token_timelock_chain_ssot: false,
            governance_proposal_count_max_indexer_lag: 32,
            arb_base_fee: 0.0,
        }
    }
}

impl ChainOffConfig {
    pub fn from_env() -> Self {
        let auto_complete_days = std::env::var("P3_AUTO_COMPLETE_DAYS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(7);
        let dispute_window_days = std::env::var("P3_DISPUTE_WINDOW_DAYS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(7);
        let dispute_window_days = dispute_window_days.max(auto_complete_days);
        let business_chain_id = std::env::var("CHAIN_ID")
            .ok()
            .and_then(|s| s.parse::<i64>().ok())
            .or_else(|| {
                if std::env::var("CHAIN_RPC_URL")
                    .ok()
                    .map(|s| !s.trim().is_empty())
                    .unwrap_or(false)
                {
                    Some(137)
                } else {
                    None
                }
            });
        Self {
            business_chain_id,
            accept_ttl_secs: std::env::var("P3_ACCEPT_TTL_SECS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(24 * 3600),
            payment_ttl_secs: {
                let minutes = std::env::var("PAYMENT_WINDOW_MINUTES")
                    .ok()
                    .and_then(|v| v.parse::<i64>().ok())
                    .filter(|&x| x > 0);
                if let Some(m) = minutes {
                    m * 60
                } else {
                    std::env::var("P3_PAYMENT_TTL_SECS")
                        .ok()
                        .and_then(|v| v.parse().ok())
                        .unwrap_or(30 * 60)
                }
            },
            auto_complete_days,
            dispute_window_days,
            review_window_days: std::env::var("P3_REVIEW_WINDOW_DAYS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(14),
            governance_order_deadline_chain_ssot: std::env::var("GOVERNANCE_ORDER_DEADLINE_CHAIN_SSOT")
                .ok()
                .map(|s| {
                    matches!(
                        s.trim().to_ascii_lowercase().as_str(),
                        "1" | "true" | "on" | "yes"
                    )
                })
                .unwrap_or(false),
            governance_governor_view_params_chain_ssot: std::env::var(
                "GOVERNANCE_GOVERNOR_VIEW_PARAMS_CHAIN_SSOT",
            )
            .ok()
            .map(|s| {
                matches!(
                    s.trim().to_ascii_lowercase().as_str(),
                    "1" | "true" | "on" | "yes"
                )
            })
            .unwrap_or(false),
            governance_timelock_delay_chain_ssot: std::env::var(
                "GOVERNANCE_TIMELOCK_DELAY_CHAIN_SSOT",
            )
            .ok()
            .map(|s| {
                matches!(
                    s.trim().to_ascii_lowercase().as_str(),
                    "1" | "true" | "on" | "yes"
                )
            })
            .unwrap_or(false),
            governance_governor_proposal_threshold_chain_ssot: std::env::var(
                "GOVERNANCE_GOVERNOR_PROPOSAL_THRESHOLD_CHAIN_SSOT",
            )
            .ok()
            .map(|s| {
                matches!(
                    s.trim().to_ascii_lowercase().as_str(),
                    "1" | "true" | "on" | "yes"
                )
            })
            .unwrap_or(false),
            governance_timelock_governor_admin_chain_ssot: std::env::var(
                "GOVERNANCE_TIMELOCK_GOVERNOR_ADMIN_CHAIN_SSOT",
            )
            .ok()
            .map(|s| {
                matches!(
                    s.trim().to_ascii_lowercase().as_str(),
                    "1" | "true" | "on" | "yes"
                )
            })
            .unwrap_or(false),
            governance_governor_proposal_count_chain_ssot: std::env::var(
                "GOVERNANCE_GOVERNOR_PROPOSAL_COUNT_CHAIN_SSOT",
            )
            .ok()
            .map(|s| {
                matches!(
                    s.trim().to_ascii_lowercase().as_str(),
                    "1" | "true" | "on" | "yes"
                )
            })
            .unwrap_or(false),
            governance_governor_token_timelock_chain_ssot: std::env::var(
                "GOVERNANCE_GOVERNOR_TOKEN_TIMELOCK_CHAIN_SSOT",
            )
            .ok()
            .map(|s| {
                matches!(
                    s.trim().to_ascii_lowercase().as_str(),
                    "1" | "true" | "on" | "yes"
                )
            })
            .unwrap_or(false),
            governance_proposal_count_max_indexer_lag: std::env::var(
                "GOVERNANCE_PROPOSAL_COUNT_MAX_INDEXER_LAG",
            )
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(32),
            arb_base_fee: std::env::var("P3_ARB_BASE_FEE")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(0.0),
        }
    }
}

// ---------- 内存存储 ----------

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UserRow {
    pub id: Uuid,
    pub email: String,
    pub password_hash: Option<String>,
    pub role: String,
    pub kyc_status: String,
    #[serde(default)]
    pub nickname: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub default_wallet_address: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GuideRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub city: String,
    pub country_code: String,
    pub languages: Vec<String>,
    pub service_types: Vec<String>,
    pub bio: Option<String>,
    #[serde(default)]
    pub wallet_address: Option<String>,
    #[serde(default)]
    pub real_name: Option<String>,
    #[serde(default)]
    pub passport_number_hash: Option<String>,
    #[serde(default)]
    pub id_photo_url: Option<String>,
    #[serde(default)]
    pub language_cert_url: Option<String>,
    /// 向导证/资格证 URL（C2 可选，待产品决策）
    #[serde(default)]
    pub guide_license_url: Option<String>,
    pub stake_amount: String,
    /// 市场卡片时薪（字符串金额；与 `GET /guides` `hourly_rate` 同源）
    #[serde(default)]
    pub hourly_rate: Option<String>,
    /// 市场卡片头像 URL（与账户 `users.avatar_url` 分轨）
    #[serde(default)]
    pub avatar_url: Option<String>,
    pub status: String,
    /// Admin 拒绝资质时的机器可读原因码（`guides.rejection_codes`）
    #[serde(default)]
    pub rejection_codes: Vec<String>,
    /// 人读拒绝说明（`guides.rejection_message`）
    #[serde(default)]
    pub rejection_message: Option<String>,
    /// 企业级数据分离：`production` | `test` | `demo`
    #[serde(default = "data_origin_production_string")]
    pub data_origin: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OrderRow {
    pub id: Uuid,
    pub tourist_id: Uuid,
    pub guide_id: Uuid,
    pub amount: String,
    pub currency: String,
    /// P5 链上模式：createEscrow 后写入的合约地址
    #[serde(default)]
    pub escrow_address: Option<String>,
    pub state: OrderState,
    pub created_at: DateTime<Utc>,
    pub accepted_at: Option<DateTime<Utc>>,
    pub escrowed_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub dispute_deadline_at: Option<DateTime<Utc>>,
    pub auto_complete_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
    /// 档期区间（80 §4.15.6）；有值时接单/锁定/释放由 schedule_engine 执行
    #[serde(default)]
    pub start_date: Option<chrono::NaiveDate>,
    #[serde(default)]
    pub end_date: Option<chrono::NaiveDate>,
    /// 53 子状态：pending_bilateral / confirmed / rating_pending / rating_confirmed 等
    #[serde(default)]
    pub sub_status: Option<String>,
    /// 53 双边确认：游客已确认行程与金额
    #[serde(default)]
    pub tourist_confirmed: Option<bool>,
    /// 53 双边确认：向导已确认行程与金额
    #[serde(default)]
    pub guide_confirmed: Option<bool>,
    /// 53 评分：游客已确认评分与材料
    #[serde(default)]
    pub rating_tourist_confirmed: Option<bool>,
    /// 53 评分：向导已确认评分与材料
    #[serde(default)]
    pub rating_guide_confirmed: Option<bool>,
    /// 业务归属链（**`orders.chain_id`** 同源）；**None** = 未配置或未 hydrate
    #[serde(default)]
    pub chain_id: Option<i64>,
    /// 企业级数据分离：`production` | `test` | `demo`
    #[serde(default = "data_origin_production_string")]
    pub data_origin: String,
    /// PD-009 / F-021：**`acquisition_listing`** · **`merchant_listing`** 等
    #[serde(default)]
    pub order_kind: Option<String>,
    #[serde(default)]
    pub market_listing_id: Option<Uuid>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ReviewRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub reviewer_id: Uuid,
    pub reviewee_id: Uuid,
    pub score: i16,
    pub weight: f64,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DisputeRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub status: String,
    pub evidence_hashes: Vec<String>,
    pub arbitrator_id: Option<Uuid>,
    pub refund_ratio: Option<f64>,
    pub slash_guide: Option<bool>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    /// 仲裁费占位（03 §3.2；链下 P3 可记 0 或 mock 值，链上 P5 再收）
    #[serde(default)]
    pub arb_fee_paid: Option<String>,
    /// 争议序号（同一订单第几次争议，重复争议费用递增 03 §3.2）
    #[serde(default)]
    pub dispute_sequence: u32,
}

impl Default for OrderRow {
    fn default() -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::nil(),
            tourist_id: Uuid::nil(),
            guide_id: Uuid::nil(),
            amount: String::new(),
            currency: String::new(),
            escrow_address: None,
            state: OrderState::Created,
            created_at: now,
            accepted_at: None,
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: now,
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: None,
            data_origin: data_origin_production_string(),
            order_kind: None,
            market_listing_id: None,
        }
    }
}

mod steward_application;
pub use steward_application::*;
mod provider_kyb;
mod provider_application;
pub use provider_application::*;

pub struct ChainOffStore {
    pub users: HashMap<Uuid, UserRow>,
    pub guides: HashMap<Uuid, GuideRow>,
    pub guides_by_user: HashMap<Uuid, Uuid>,
    pub orders: HashMap<Uuid, OrderRow>,
    pub reviews: Vec<ReviewRow>,
    pub disputes: HashMap<Uuid, DisputeRow>,
    pub disputes_by_order: HashMap<Uuid, Uuid>,
    pub sessions: HashMap<String, Uuid>,
    /// 档期占位（03 §1.3）：guide_id -> order_id，Accepted/Escrowed 时占档，终态或取消时解档
    pub guide_slot: HashMap<Uuid, Uuid>,
    /// 证据回执（order_id -> receipts）
    pub evidence_receipts: HashMap<Uuid, Vec<EvidenceReceiptRow>>,
    /// P15/17 ① 行程包（order_id = Draft 订单 id）
    pub itineraries: HashMap<Uuid, ItineraryBundle>,
    /// P16/17 ② 聊天消息（order_id -> 消息列表，按时间序）
    pub messages: HashMap<Uuid, Vec<MessageRow>>,
    /// 区域主理人申请（user_id -> 申请行；① chain_off 内存真源）
    pub steward_applications_by_user: HashMap<Uuid, steward_application::StewardApplicationRow>,
    /// 商家资质申请（user_id -> 申请行；① chain_off 内存真源）
    pub provider_applications_by_user: HashMap<Uuid, provider_application::ProviderApplicationRow>,
    /// `PUT /me` `settings_preferences`（通知 / 社区可见性 · ① chain_off）
    pub user_settings_preferences: HashMap<Uuid, serde_json::Value>,
    /// `POST /auth/verify-email` 一次性令牌 → user_id（① chain_off · 无 PG 邮件时）
    pub email_verify_tokens: HashMap<String, Uuid>,
    /// 邮箱验证完成时间（侧表 · 避免扩展 `UserRow` 全仓初始化）
    pub user_email_verified_at: HashMap<Uuid, DateTime<Utc>>,
    /// `POST /auth/register/send-verification-code` → 注册前 6 位验证码（key = 小写邮箱）
    pub register_verification_codes: HashMap<String, RegisterVerificationCodeEntry>,
    /// **`GET/PATCH /api/v1/me/acquisition-profile`** 公开展示字段（① chain_off 内存）
    pub acquisition_profiles_by_user: HashMap<Uuid, AcquisitionProfileRow>,
}

/// 注册验证码条目（① chain_off 内存 · 10 分钟有效）
#[derive(Clone, Debug)]
pub struct RegisterVerificationCodeEntry {
    pub code: String,
    pub expires_at: DateTime<Utc>,
    pub sent_at: DateTime<Utc>,
}

/// **`PATCH /api/v1/me/acquisition-profile`** 可写字段（① chain_off 内存真源）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AcquisitionProfileRow {
    #[serde(default)]
    pub public_bio: Option<String>,
    #[serde(default)]
    pub tagline: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    pub updated_at: DateTime<Utc>,
}

impl Default for ChainOffStore {
    fn default() -> Self {
        Self {
            users: HashMap::new(),
            guides: HashMap::new(),
            guides_by_user: HashMap::new(),
            orders: HashMap::new(),
            reviews: Vec::new(),
            disputes: HashMap::new(),
            disputes_by_order: HashMap::new(),
            sessions: HashMap::new(),
            guide_slot: HashMap::new(),
            evidence_receipts: HashMap::new(),
            itineraries: HashMap::new(),
            messages: HashMap::new(),
            steward_applications_by_user: HashMap::new(),
            provider_applications_by_user: HashMap::new(),
            user_settings_preferences: HashMap::new(),
            email_verify_tokens: HashMap::new(),
            user_email_verified_at: HashMap::new(),
            register_verification_codes: HashMap::new(),
            acquisition_profiles_by_user: HashMap::new(),
        }
    }
}

#[derive(Clone)]
pub struct ChainOffState {
    pub store: Arc<RwLock<ChainOffStore>>,
    pub config: ChainOffConfig,
    /// 当设置时：注册/登录双写 DB；启动时已从 DB hydrate 到 store
    pub db_pool: Option<sqlx::PgPool>,
}

/// `orders.guide_id` = **guides 行 id**（与 `POST /api/v1/orders` 的 `guide_id` 一致）；向导账户 id 为 `guides.user_id`。
pub(crate) fn order_guide_user_id(store: &ChainOffStore, order: &OrderRow) -> Option<Uuid> {
    store.guides.get(&order.guide_id).map(|g| g.user_id)
}

pub(crate) fn order_is_participant(store: &ChainOffStore, order: &OrderRow, user_id: Uuid) -> bool {
    order.tourist_id == user_id || order_guide_user_id(store, order) == Some(user_id)
}

/// B-078：`GET …/me` 与 `GET …/me/stats` 的 **guide** `stats` 扩展。口径：**UTC 自然月** `[month_start, next_month_start)`；**`period_settled_orders_count`** = 向导侧订单 **`updated_at`** 落入该区间且 **`state.is_final_financial_state()`**；**`period_expected_earnings`** = 同向导 **`Accepted`/`Escrowed`/`Disputed`** 的 **`amount` 之和**（进行中管线，完成一单后通常下降、已结计数上升）。
pub(crate) fn guide_period_dashboard_stats(
    store: &ChainOffStore,
    guide_user_id: Uuid,
    now: DateTime<Utc>,
) -> serde_json::Value {
    let y = now.year();
    let m = now.month();
    let period_start = Utc.with_ymd_and_hms(y, m, 1, 0, 0, 0).unwrap();
    let (ny, nm) = if m == 12 {
        (y + 1, 1)
    } else {
        (y, m + 1)
    };
    let period_end = Utc.with_ymd_and_hms(ny, nm, 1, 0, 0, 0).unwrap();
    let billing_period_utc = format!("{y}-{m:02}");
    let mut period_settled_orders_count = 0u64;
    let mut period_expected_earnings = 0.0_f64;
    for o in store.orders.values() {
        if order_guide_user_id(store, o) != Some(guide_user_id) {
            continue;
        }
        if o.state.is_final_financial_state() {
            if o.updated_at >= period_start && o.updated_at < period_end {
                period_settled_orders_count += 1;
            }
        } else if matches!(
            o.state,
            OrderState::Accepted | OrderState::Escrowed | OrderState::Disputed
        ) {
            if let Ok(a) = o.amount.parse::<f64>() {
                period_expected_earnings += a;
            }
        }
    }
    json!({
        "billing_period_utc": billing_period_utc,
        "period_expected_earnings": period_expected_earnings,
        "period_settled_orders_count": period_settled_orders_count,
    })
}

/// 53 / 04：订单关键写成功后的 stderr 单行审计（`grep audit_key_write`）。`request_id` 取自请求头 `x-request-id`，缺省为 `-`（服务端生成的 id 见 `[req]` 中间件行）。
pub(crate) fn audit_key_write_stderr(
    op: &'static str,
    request_id: Option<&str>,
    user_id: Uuid,
    order_id: Uuid,
) {
    let rid = request_id
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("-");
    eprintln!(
        "audit_key_write op={} request_id={} user_id={} order_id={}",
        op, rid, user_id, order_id
    );
}

mod json_response;
pub(crate) use json_response::status_json_response_with_429_retry_header;

mod roles;
pub(crate) use roles::users_role_is_traveler_side;
mod auth;
pub use auth::*;
mod me;
pub use me::*;
mod pagination;
pub use pagination::{parse_order_list_page, OrderListPage};
mod discover;
pub use discover::*;
mod community_public_surface;
mod market_public_surface;
pub mod market_guide_filter;
pub use community_public_surface::*;
pub use market_public_surface::*;
mod acquisition_trust;
#[allow(unused_imports)] // PD-009 parity 测试经 `crate::chain_off::check_acquisition_trust_pg_memory_parity`
pub use acquisition_trust::*;
mod market_listing_orders;
pub use market_listing_orders::*;
mod trust_gate_context;
pub use trust_gate_context::trust_gate_context_for_user;
pub(crate) mod trust_gate_e2e_seed;
pub(crate) use trust_gate_e2e_seed::seed_trust_gate_e2e_fixtures;
mod persistence_gate;
pub(crate) use persistence_gate::ensure_durable_writes_available;
mod messages;
pub use messages::*;
mod reviews;
pub use reviews::*;
mod disputes;
pub use disputes::*;
mod evidence;
pub use evidence::*;
mod itineraries;
pub use itineraries::*;
mod guides;
mod guide_profile;
mod identity_slot_profiles;
mod schedule_booking;
pub use guides::*;
pub use guide_profile::*;
pub use identity_slot_profiles::*;
mod order_participant_hints;
mod orders;
pub use orders::*;
mod orders_flow;
pub use orders_flow::*;
mod reconcile;
pub use reconcile::*;
pub(crate) mod governance_view_params_ssot;
pub(crate) mod governance_timelock_delay_ssot;
pub(crate) mod governance_proposal_threshold_ssot;
pub(crate) mod governance_timelock_governor_admin_ssot;
pub(crate) mod governance_proposal_count_ssot;
pub(crate) mod governance_proposal_tail_drift_b172;
pub(crate) mod governance_proposal_state_chain_vs_projection_b149;
pub(crate) mod governance_timelock_delay_meta_mirror_b173;
pub(crate) mod governance_governor_token_timelock_ssot;
pub(crate) use governance_view_params_ssot::governor_view_params_ssot_admin_overview_bundle;
pub(crate) use governance_timelock_delay_ssot::timelock_delay_ssot_admin_overview_bundle;
pub(crate) use governance_proposal_threshold_ssot::proposal_threshold_ssot_admin_overview_bundle;
pub(crate) use governance_timelock_governor_admin_ssot::timelock_governor_admin_ssot_admin_overview_bundle;
pub(crate) use governance_proposal_count_ssot::proposal_count_ssot_admin_overview_bundle;
pub(crate) use governance_proposal_tail_drift_b172::governor_proposal_tail_drift_observability_b172;
pub(crate) use governance_proposal_state_chain_vs_projection_b149::governor_proposal_state_chain_vs_projection_observability_b149;
pub(crate) use governance_timelock_delay_meta_mirror_b173::timelock_delay_meta_mirror_observability_b173;
pub(crate) use governance_governor_token_timelock_ssot::governor_token_timelock_ssot_admin_overview_bundle;
mod replay_orders_projection;
pub(crate) use replay_orders_projection::replay_orders_projection_from_event_log;
mod replay_governance_proposals;
pub(crate) use replay_governance_proposals::replay_governance_proposals_from_event_log;
mod reload_orders_db;
pub use reload_orders_db::reload_orders_from_db_into_store;

// ---------- 辅助 ----------

/// 70：`GET /api/v1/admin/users/:id`；**永不**包含 `password_hash`。
pub fn user_admin_detail_envelope(u: &UserRow) -> serde_json::Value {
    json!({
        "status": "ok",
        "user": {
            "id": u.id.to_string(),
            "email": u.email,
            "role": u.role,
            "kyc_status": u.kyc_status,
            "nickname": u.nickname,
            "avatar_url": u.avatar_url,
            "default_wallet_address": u.default_wallet_address,
            "created_at": u.created_at.to_rfc3339(),
            "updated_at": u.updated_at.to_rfc3339(),
        }
    })
}

pub(crate) fn order_state_to_str(s: OrderState) -> &'static str {
    match s {
        OrderState::Draft => "draft",
        OrderState::Created => "created",
        OrderState::Accepted => "accepted",
        OrderState::Escrowed => "escrowed",
        OrderState::Completed => "completed",
        OrderState::Disputed => "disputed",
        OrderState::Refunded => "refunded",
        OrderState::PartiallyRefunded => "partially_refunded",
        OrderState::Slashed => "slashed",
        OrderState::Cancelled => "cancelled",
    }
}

pub(crate) fn str_to_order_state(s: &str) -> Option<OrderState> {
    Some(match s {
        "draft" => OrderState::Draft,
        "created" => OrderState::Created,
        "accepted" => OrderState::Accepted,
        "escrowed" => OrderState::Escrowed,
        "completed" => OrderState::Completed,
        "disputed" => OrderState::Disputed,
        "refunded" => OrderState::Refunded,
        "partially_refunded" => OrderState::PartiallyRefunded,
        "slashed" => OrderState::Slashed,
        "cancelled" => OrderState::Cancelled,
        _ => return None,
    })
}

/// 将 DB 订单行转为内存 OrderRow（启动 hydrate 用）；53 含 sub_status 与确认字段；55-S1 NULL guide_id → nil
pub(crate) fn order_from_db(o: &crate::db::DbOrderRow) -> OrderRow {
    OrderRow {
        id: o.id,
        tourist_id: o.tourist_id,
        guide_id: o.guide_id.unwrap_or(Uuid::nil()),
        amount: o.amount.clone(),
        currency: o.currency.clone(),
        escrow_address: o.escrow_address.clone(),
        state: str_to_order_state(&o.status).unwrap_or(OrderState::Created),
        created_at: o.created_at,
        accepted_at: o.accepted_at,
        escrowed_at: o.escrowed_at,
        completed_at: o.completed_at,
        dispute_deadline_at: o.dispute_deadline_at,
        auto_complete_at: o.auto_complete_at,
        updated_at: o.updated_at,
        start_date: o.start_date,
        end_date: o.end_date,
        sub_status: o.sub_status.clone(),
        tourist_confirmed: o.tourist_confirmed,
        guide_confirmed: o.guide_confirmed,
        rating_tourist_confirmed: o.rating_tourist_confirmed,
        rating_guide_confirmed: o.rating_guide_confirmed,
        chain_id: o.chain_id,
        data_origin: o.data_origin.clone(),
        order_kind: o.order_kind.clone(),
        market_listing_id: o.market_listing_id,
    }
}

/// `TRAVELTRUST_STRICT_ORDER_DB_WRITE=1`：订单 `upsert_order` 失败须回滚本次内存变更并 503（各 handler 实现回滚）。
#[inline]
pub(crate) fn strict_order_db_write_enabled() -> bool {
    std::env::var("TRAVELTRUST_STRICT_ORDER_DB_WRITE").as_deref() == Ok("1")
}

/// `TRAVELTRUST_STRICT_AUTH_DB_WRITE=1`：注册/登录时用户或会话 DB 写入失败须回滚内存并 503。
#[inline]
pub(crate) fn strict_auth_db_write_enabled() -> bool {
    std::env::var("TRAVELTRUST_STRICT_AUTH_DB_WRITE").as_deref() == Ok("1")
}

/// `TRAVELTRUST_STRICT_SEED_DB_WRITE=1`：`SEED_TEST_ACCOUNTS` 注入时须先落库再写入内存；任一步失败则跳过该账号且不写内存。
#[inline]
pub(crate) fn strict_seed_db_write_enabled() -> bool {
    std::env::var("TRAVELTRUST_STRICT_SEED_DB_WRITE").as_deref() == Ok("1")
}

/// `TRAVELTRUST_STRICT_GUIDE_DB_WRITE=1`：向导注册 `insert_guide` 失败须从内存移除并 503。
#[inline]
pub(crate) fn strict_guide_db_write_enabled() -> bool {
    std::env::var("TRAVELTRUST_STRICT_GUIDE_DB_WRITE").as_deref() == Ok("1")
}

/// 订单落库（有 db_pool 时）；无 pool 视为 Ok。供严格双写路径检测失败。
pub(crate) async fn try_persist_order_to_db(
    state: &ChainOffState,
    order: &OrderRow,
) -> Result<(), sqlx::Error> {
    let Some(ref pool) = state.db_pool else {
        return Ok(());
    };
    let guide_id = if order.guide_id.is_nil() {
        None
    } else {
        Some(order.guide_id)
    };
    let chain_id = order.chain_id.or(state.config.business_chain_id);
    crate::db::upsert_order_with_data_origin(
        pool,
        order.id,
        order.tourist_id,
        guide_id,
        &order.amount,
        &order.currency,
        order_state_to_str(order.state),
        order.escrow_address.as_deref(),
        order.created_at,
        order.updated_at,
        order.accepted_at,
        order.escrowed_at,
        order.completed_at,
        order.dispute_deadline_at,
        order.auto_complete_at,
        order.start_date,
        order.end_date,
        order.sub_status.as_deref(),
        order.tourist_confirmed,
        order.guide_confirmed,
        order.rating_tourist_confirmed,
        order.rating_guide_confirmed,
        chain_id,
        &order.data_origin,
        order.order_kind.as_deref(),
        order.market_listing_id,
    )
    .await
}

/// 订单落库双写（有 db_pool 时）；状态变更后调用；链事件投影后也可调用
pub(crate) async fn persist_order_if_db(state: &ChainOffState, order: &OrderRow) {
    if let Err(e) = try_persist_order_to_db(state, order).await {
        eprintln!(
            "[audit] db upsert_order failed order_id={} error={}",
            order.id, e
        );
    }
}

#[cfg(test)]
mod tests_disputes;
#[cfg(test)]
mod tests_events_itinerary;
#[cfg(test)]
mod tests_guides_me_orders;
#[cfg(test)]
mod tests_reviews_evidence;
