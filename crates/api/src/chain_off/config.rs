//! 链下配置：**`ChainOffConfig`**（01/03 超时与争议窗口；治理链读开关等）。

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
    /// **`GOVERNANCE_ORDER_DEADLINE_CHAIN_SSOT`**：为真时 **`rating_deadline`** 优先 **`eth_call` `TravelTrustGovernor.orderRatingReviewWindowDays()`**（**`GOVERNOR_ADDRESS`** + **`CHAIN_RPC_URL`**）；读失败 / 无 Governor / 链上值越界 → **fail-closed** 回退 **`P3_REVIEW_WINDOW_DAYS`**（**`review_window_days`**）；见 **`chain/governor.rs`**、**`chain_off/orders/`**
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
            governance_order_deadline_chain_ssot: std::env::var(
                "GOVERNANCE_ORDER_DEADLINE_CHAIN_SSOT",
            )
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
