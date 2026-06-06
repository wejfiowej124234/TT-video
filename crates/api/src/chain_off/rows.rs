//! 链下内存行类型：**`UserRow`** / **`GuideRow`** / **`OrderRow`** / **`ReviewRow`** / **`DisputeRow`**。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use traveltrust_core::OrderState;
use uuid::Uuid;

// ---------- 内存行（与 `ChainOffStore` 字段同源） ----------

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
    /// 个人简介（与 `users.bio`、PUT /me `bio` 对齐）
    #[serde(default)]
    pub bio: Option<String>,
    #[serde(default)]
    pub email_verified_at: Option<DateTime<Utc>>,
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
    pub status: String,
    /// Admin 拒绝资质时的机器可读原因码（`guides.rejection_codes`）
    #[serde(default)]
    pub rejection_codes: Vec<String>,
    /// 人读拒绝说明（`guides.rejection_message`）
    #[serde(default)]
    pub rejection_message: Option<String>,
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
