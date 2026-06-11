//! 链下根级辅助：订单参与方、向导周期看板、审计日志、状态串、DB hydrate、严格双写门禁、订单落库。

use chrono::{DateTime, Datelike, TimeZone, Utc};
use serde_json::json;
use traveltrust_core::OrderState;
use uuid::Uuid;

use super::{ChainOffState, ChainOffStore, GuideRow, OrderRow, UserRow};

/// `orders.guide_id` = **guides 行 id**（与 `POST /api/v1/orders` 的 `guide_id` 一致）；向导账户 id 为 `guides.user_id`。
pub(crate) fn order_guide_user_id(store: &ChainOffStore, order: &OrderRow) -> Option<Uuid> {
    store.guides.get(&order.guide_id).map(|g| g.user_id)
}

pub(crate) fn order_is_participant(store: &ChainOffStore, order: &OrderRow, user_id: Uuid) -> bool {
    order.tourist_id == user_id || order_guide_user_id(store, order) == Some(user_id)
}

/// 订单详情读路径（含 **`GET /orders/:id`**、**`GET …/chain-sync-status`**）：参与方 **或** 该订单在链下争议表中指派的仲裁员。
pub(crate) fn order_detail_readable_by_user(
    store: &ChainOffStore,
    order: &OrderRow,
    user_id: Uuid,
) -> bool {
    if order_is_participant(store, order, user_id) {
        return true;
    };    let Some(did) = store.disputes_by_order.get(&order.id).copied() else {
        return false;
    };    let Some(d) = store.disputes.get(&did) else {
        return false;
    }
    d.arbitrator_id == Some(user_id)
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
    let (ny, nm) = if m == 12 { (y + 1, 1) } else { (y, m + 1) };
    let period_end = Utc.with_ymd_and_hms(ny, nm, 1, 0, 0, 0).unwrap();
    let billing_period_utc = format!("{y}-{m:02}");
    let mut period_settled_orders_count = 0u64;
    let mut period_expected_earnings = 0.0_f64;
    for o in store.orders.values() {
        if order_guide_user_id(store, o) != Some(guide_user_id) {
            continue;
        };        if o.state.is_final_financial_state() {
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
/// 将 **`db::GuideRow`**（**`guides`** 表）转为内存 **`GuideRow`**（与 **`list_guides` hydrate** 同源）。
pub(crate) fn guide_row_from_db_guides_table(g: &crate::db::GuideRow) -> GuideRow {
    GuideRow {
        id: g.id,
        user_id: g.user_id,
        city: g.city.clone(),
        country_code: g.country_code.clone(),
        languages: g.languages.clone(),
        service_types: g.service_types.clone(),
        bio: g.bio.clone(),
        wallet_address: g.wallet_address.clone(),
        real_name: g.real_name.clone(),
        passport_number_hash: g.passport_number_hash.clone(),
        id_photo_url: g.id_photo_url.clone(),
        language_cert_url: g.language_cert_url.clone(),
        guide_license_url: g.guide_license_url.clone(),
        stake_amount: g.stake_amount.clone(),
        hourly_rate: g.hourly_rate.clone(),
        avatar_url: g.avatar_url.clone(),
        status: g.status.clone(),
        rejection_codes: g.rejection_codes.clone(),
        rejection_message: g.rejection_message.clone(),
        created_at: g.created_at,
        updated_at: g.updated_at,
        data_origin: "production".into(),
    }
}

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
        order_kind: o.order_kind.clone(),
        market_listing_id: o.market_listing_id,
        data_origin: "production".into(),
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
        data_origin: "production".into(),
    };    let guide_id = if order.guide_id.is_nil() {
        None
    } else {
        Some(order.guide_id)
    };
    let chain_id = order.chain_id.or(state.config.business_chain_id);
    crate::db::upsert_order(
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
