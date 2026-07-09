//! /api/v1/did-rank（48 §2.2 routes/did_rank）
//!
//! **50-B3**：有 DB 时 **travelers** 按窗口内已完成订单数；**guides** 按窗口内已完成订单 **金额合计**（`orders.amount`）再按完成单数（spec **30 §3**），响应项另附 **`received_review_count`** / **`avg_received_review_score`**（与窗口内已完成订单联表 **`reviews`**，`reviewee_id`=向导用户；**不**改变 `rank_basis`）；**guides（PostgreSQL）** 另 **`NOT EXISTS`** 剔除 **`community_penalties`** 中 **`status=active`** 且 **`action IN (mute, ban, shadow_ban, limit_feed)`** 且未过期之 **`subject_user_id`**（**160** ↔ **`db::community_penalties::AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES`**）。**`list_guides_did_rank` 失败回退 chain_off 内存榜**时：若 **`chain_off.db_pool`** 存在，则 **`db::list_subject_user_ids_excluded_from_did_rank_guides`** 拉取同口径剔除集合并过滤（批 **685**）。**无** **`db_pool`** 的纯内存 **chain_off** **不**读 **`community_penalties`**。**itineraries** 按订单完成时间（无则回退创建时间）；无 DB 时 chain_off 内存对齐同一口径。**699**：**chain_off** **旅行者榜** **用户过滤** 与 **`users_role_is_traveler_side`** 同源。
//! **period**（`?period=week|month|all`）：`since` 为窗口下界；**排序窗口**落在订单 `completed_at`（游客/向导/行程）；`all` 为全期。响应含 `rank_basis`，见 04 附录 did-rank §2。**811**：**`itineraries[*]`** **`tourist_id`****/**`traveler_id`**（同 UUID 字符串，**87** 与 **`GET /api/v1/orders`** 双读同源）。
//! **guides** 可选 **`?sort=reviews`**：按窗口内评价均分优先（**新** `rank_basis`）；**仅** **`reception_count` ≥ N** 的向导入榜（默认 **N=3**，**`DID_RANK_GUIDE_MIN_COMPLETED_FOR_REPUTATION_SORTS`**）。**`?sort=weighted`**：同上 + §3.1 加权（默认 **0.6/0.4**，**`DID_RANK_GUIDE_WEIGHTED_W_*`** 成对覆盖）；缺省主序**无**该门槛（30 §3）。

use std::borrow::Cow;
use std::collections::{HashMap, HashSet};
use std::env;

use axum::extract::{Query, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use chrono::{DateTime, Duration, Utc};
use serde::Deserialize;
use serde_json::json;

use traveltrust_core::OrderState;
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

const DID_RANK_LIMIT: i64 = 100;
const DID_RANK_LIMIT_USIZE: usize = 100;
const MARKET_DID_RANK_LIMIT: i64 = 100;
const MARKET_DID_RANK_LIMIT_USIZE: usize = 100;
const RANK_BASIS_PROVIDER: &str =
    "provider_fulfillment_orders_then_gross_then_published_listings_in_window";
const RANK_BASIS_ACQUISITION: &str =
    "acquisition_fulfillment_orders_then_gross_then_published_listings_in_window";
const PRIZE_POOL_DEFAULT_AMOUNT: f64 = 100_000.0;

#[derive(Debug, Deserialize, Default)]
pub struct DidRankQuery {
    /// `week` | `month` | `all`（大小写不敏感）；可扩展 `7d` / `30d`
    #[serde(default)]
    pub period: Option<String>,
    /// **仅** `GET …/did-rank/guides`：`reviews` / `weighted` = 见模块注释（**`min_completed`** / **`w_*`** 可由 env 覆盖）；缺省或其它值 = 接待金额主序（30 §3）
    #[serde(default)]
    pub sort: Option<String>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum DidRankPeriod {
    All,
    Week,
    Month,
}

fn resolve_period(raw: Option<&str>) -> DidRankPeriod {
    match raw.map(|s| s.trim().to_ascii_lowercase()).as_deref() {
        Some("week") | Some("7d") => DidRankPeriod::Week,
        Some("month") | Some("30d") => DidRankPeriod::Month,
        Some("all") | Some("") | None => DidRankPeriod::All,
        _ => DidRankPeriod::All,
    }
}

fn period_start(period: DidRankPeriod) -> Option<DateTime<Utc>> {
    let now = Utc::now();
    match period {
        DidRankPeriod::All => None,
        DidRankPeriod::Week => Some(now - Duration::days(7)),
        DidRankPeriod::Month => Some(now - Duration::days(30)),
    }
}

fn period_label(period: DidRankPeriod) -> &'static str {
    match period {
        DidRankPeriod::All => "all",
        DidRankPeriod::Week => "week",
        DidRankPeriod::Month => "month",
    }
}

fn resolve_guide_did_rank_sort(raw: Option<&str>) -> db::GuideDidRankSort {
    match raw.map(|s| s.trim().to_ascii_lowercase()).as_deref() {
        Some("reviews") => db::GuideDidRankSort::AvgReceivedReviewThenReception,
        Some("weighted") => db::GuideDidRankSort::WeightedActivityAndReputation,
        _ => db::GuideDidRankSort::ReceptionGrossThenCount,
    }
}

const RANK_BASIS_GUIDE_RECEPTION: &str = "guide_reception_gross_total_then_completed_count";

#[derive(Clone, Copy, Debug)]
struct GuideDidRankRuntime {
    min_completed_for_reputation_sorts: i64,
    weighted_w_activity: f64,
    weighted_w_reputation: f64,
}

impl Default for GuideDidRankRuntime {
    fn default() -> Self {
        Self {
            min_completed_for_reputation_sorts:
                db::GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS,
            weighted_w_activity: db::GUIDE_DID_RANK_WEIGHTED_W_ACTIVITY,
            weighted_w_reputation: db::GUIDE_DID_RANK_WEIGHTED_W_REPUTATION,
        }
    }
}

fn guide_did_rank_runtime_from_env() -> GuideDidRankRuntime {
    const EPS: f64 = 1e-9;
    let d = GuideDidRankRuntime::default();
    let min = env::var("DID_RANK_GUIDE_MIN_COMPLETED_FOR_REPUTATION_SORTS")
        .ok()
        .and_then(|s| s.trim().parse::<i64>().ok())
        .map(|v| v.clamp(1, 50))
        .unwrap_or(d.min_completed_for_reputation_sorts);
    let w_a_env = env::var("DID_RANK_GUIDE_WEIGHTED_W_ACTIVITY")
        .ok()
        .and_then(|s| s.trim().parse::<f64>().ok());
    let w_r_env = env::var("DID_RANK_GUIDE_WEIGHTED_W_REPUTATION")
        .ok()
        .and_then(|s| s.trim().parse::<f64>().ok());
    let (w_a, w_r) = match (w_a_env, w_r_env) {
        (Some(mut a), Some(mut r)) => {
            a = a.clamp(0.0, 1.0);
            r = r.clamp(0.0, 1.0);
            if a <= EPS && r <= EPS {
                (d.weighted_w_activity, d.weighted_w_reputation)
            } else if a + r > EPS {
                let s = a + r;
                (a / s, r / s)
            } else {
                (d.weighted_w_activity, d.weighted_w_reputation)
            }
        }
        _ => (d.weighted_w_activity, d.weighted_w_reputation),
    };
    GuideDidRankRuntime {
        min_completed_for_reputation_sorts: min,
        weighted_w_activity: w_a,
        weighted_w_reputation: w_r,
    }
}

/// **`check-55` / `smoke`**（默认无 env）断言的 **`rank_basis`**：`min=3` 且 **0.6/0.4** 为历史长键；否则嵌入 **min** 或 **`wNNpct`**。
fn rank_basis_guide_reviews(min_completed: i64) -> String {
    format!(
        "guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_{}",
        min_completed
    )
}

fn rank_basis_guide_weighted(min_completed: i64, wa: f64, wr: f64) -> String {
    const EPS: f64 = 1e-9;
    let def_m = db::GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS;
    let def_a = db::GUIDE_DID_RANK_WEIGHTED_W_ACTIVITY;
    let def_r = db::GUIDE_DID_RANK_WEIGHTED_W_REPUTATION;
    let w_default = (wa - def_a).abs() < EPS && (wr - def_r).abs() < EPS;
    if w_default && min_completed == def_m {
        return "guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3".to_string();
    }
    if w_default {
        return format!(
            "guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_{}",
            min_completed
        );
    }
    let ap = (wa * 100.0).round().clamp(0.0, 100.0) as i32;
    let rp = (wr * 100.0).round().clamp(0.0, 100.0) as i32;
    format!(
        "guide_weighted_volume_norm_w{}pct_review_avg_norm_w{}pct_then_reception_gross_then_completed_count_min_completed_ge_{}",
        ap, rp, min_completed
    )
}

/// 04 附录 did-rank：`since` 为窗口下界；`rank_basis` 标明排序主键（前端可忽略）。
fn did_rank_meta(label: &str, since: Option<DateTime<Utc>>, rank_basis: &str) -> serde_json::Value {
    json!({
        "status": "ok",
        "period": label,
        "since": since.map(|s| s.to_rfc3339()),
        "limit": DID_RANK_LIMIT,
        "rank_basis": rank_basis,
    })
}

/// 公众 DID 榜：与 [`chain_off::public_catalog_surface_filter_enabled`] 同源，排除烟测/演示账号与非 production 向导。
fn did_rank_traveler_board_visible_email(email: &str) -> bool {
    !chain_off::public_catalog_surface_filter_enabled()
        || !chain_off::is_dev_catalog_email(email)
}

fn did_rank_traveler_board_visible(u: &chain_off::UserRow) -> bool {
    did_rank_traveler_board_visible_email(&u.email)
}

fn did_rank_guide_board_visible(store: &chain_off::ChainOffStore, u: &chain_off::UserRow) -> bool {
    did_rank_guide_board_visible_db(Some(store), u.id, &u.email)
}

fn did_rank_guide_board_visible_db(
    store: Option<&chain_off::ChainOffStore>,
    user_id: Uuid,
    email: &str,
) -> bool {
    if !chain_off::public_catalog_surface_filter_enabled() {
        return true;
    }
    if chain_off::is_dev_catalog_email(email) {
        return false;
    }
    if let Some(store) = store {
        if let Some(gid) = store.guides_by_user.get(&user_id) {
            if let Some(g) = store.guides.get(gid) {
                return !chain_off::should_hide_guide_from_public_catalog(g, store);
            }
        }
    }
    true
}

fn count_tourist_completed_in_window(
    store: &chain_off::ChainOffStore,
    tourist_id: Uuid,
    since: Option<DateTime<Utc>>,
) -> usize {
    store
        .orders
        .values()
        .filter(|o| {
            o.state == OrderState::Completed
                && o.tourist_id == tourist_id
                && since.map_or(true, |s| o.completed_at.map(|c| c >= s).unwrap_or(false))
        })
        .count()
}

/// chain_off：向导窗口内接待 **金额合计**（`amount` 按 f64 累加，仅用于开发/演示排序）与 **完成单数**。
fn guide_reception_totals_chain_off(
    store: &chain_off::ChainOffStore,
    guide_user_id: Uuid,
    since: Option<DateTime<Utc>>,
) -> (f64, usize) {
    let Some(guide_row_id) = store.guides_by_user.get(&guide_user_id).copied() else {
        return (0.0, 0);
    };
    let mut sum = 0.0_f64;
    let mut cnt = 0_usize;
    for o in store.orders.values() {
        if o.state != OrderState::Completed {
            continue;
        }
        if o.guide_id != guide_row_id {
            continue;
        }
        if !since.map_or(true, |s| o.completed_at.map(|c| c >= s).unwrap_or(false)) {
            continue;
        }
        cnt += 1;
        sum += o.amount.parse::<f64>().unwrap_or(0.0);
    }
    (sum, cnt)
}

/// chain_off：与 DB 同源语义 — 窗口内 **已完成订单** 上、`reviewee_id` 为向导 **用户 id** 的评价条数与算术均分。
fn guide_received_review_stats_chain_off(
    store: &chain_off::ChainOffStore,
    guide_user_id: Uuid,
    since: Option<DateTime<Utc>>,
) -> (i64, Option<f64>) {
    let mut scores: Vec<i16> = Vec::new();
    for r in &store.reviews {
        if r.reviewee_id != guide_user_id {
            continue;
        }
        let Some(o) = store.orders.get(&r.order_id) else {
            continue;
        };
        if o.state != OrderState::Completed {
            continue;
        }
        if !since.map_or(true, |s| o.completed_at.map(|c| c >= s).unwrap_or(false)) {
            continue;
        }
        scores.push(r.score);
    }
    let n = scores.len() as i64;
    let avg = if n > 0 {
        Some(scores.iter().map(|&s| f64::from(s)).sum::<f64>() / n as f64)
    } else {
        None
    };
    (n, avg)
}

fn travelers_from_chain_off_store(
    store: &chain_off::ChainOffStore,
    since: Option<DateTime<Utc>>,
    viewer: Option<Uuid>,
) -> Vec<serde_json::Value> {
    let mut users: Vec<_> = store
        .users
        .values()
        .filter(|u| chain_off::users_role_is_traveler_side(u.role.as_str()))
        .filter(|u| did_rank_traveler_board_visible(u))
        .cloned()
        .collect();
    users.sort_by(|a, b| {
        let ca = count_tourist_completed_in_window(store, a.id, since);
        let cb = count_tourist_completed_in_window(store, b.id, since);
        cb.cmp(&ca).then_with(|| b.created_at.cmp(&a.created_at))
    });
    users
        .into_iter()
        .take(DID_RANK_LIMIT_USIZE)
        .enumerate()
        .map(|(i, u)| {
            let completed_orders = count_tourist_completed_in_window(store, u.id, since) as i64;
            json!({
                "rank": i + 1,
                "id": u.id.to_string(),
                "nickname": u.nickname,
                "avatar_url": u.avatar_url,
                "default_wallet_address": u.default_wallet_address,
                "is_me": viewer == Some(u.id),
                "completed_orders": completed_orders,
            })
        })
        .collect()
}

fn cmp_opt_f64_desc_avg(a: Option<f64>, b: Option<f64>) -> std::cmp::Ordering {
    use std::cmp::Ordering;
    match (a, b) {
        (Some(x), Some(y)) => y.partial_cmp(&x).unwrap_or(Ordering::Equal),
        (Some(_), None) => Ordering::Less,
        (None, Some(_)) => Ordering::Greater,
        (None, None) => Ordering::Equal,
    }
}

fn guides_from_chain_off_store(
    store: &chain_off::ChainOffStore,
    since: Option<DateTime<Utc>>,
    viewer: Option<Uuid>,
    sort: db::GuideDidRankSort,
    min_completed_for_reputation_sorts: i64,
    weighted_w_activity: f64,
    weighted_w_reputation: f64,
    penalty_excluded: Option<&HashSet<Uuid>>,
) -> Vec<serde_json::Value> {
    let mut scored: Vec<(chain_off::UserRow, f64, usize, i64, Option<f64>)> = store
        .users
        .values()
        .filter(|u| {
            u.role.eq_ignore_ascii_case("guide")
                && !penalty_excluded.map_or(false, |ex| ex.contains(&u.id))
                && did_rank_guide_board_visible(store, u)
        })
        .map(|u| {
            let (vol, cnt) = guide_reception_totals_chain_off(store, u.id, since);
            let (recv_n, recv_avg) = guide_received_review_stats_chain_off(store, u.id, since);
            (u.clone(), vol, cnt, recv_n, recv_avg)
        })
        .collect();
    if sort != db::GuideDidRankSort::ReceptionGrossThenCount {
        let min_c = min_completed_for_reputation_sorts.max(0) as usize;
        scored.retain(|(_, _, cnt, _, _)| *cnt >= min_c);
    }
    match sort {
        db::GuideDidRankSort::ReceptionGrossThenCount => {
            scored.sort_by(|(a, sa, ca, _, _), (b, sb, cb, _, _)| {
                sb.partial_cmp(sa)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| cb.cmp(ca))
                    .then_with(|| b.created_at.cmp(&a.created_at))
            });
        }
        db::GuideDidRankSort::AvgReceivedReviewThenReception => {
            scored.sort_by(|(a, sa, ca, _, avga), (b, sb, cb, _, avgb)| {
                cmp_opt_f64_desc_avg(*avga, *avgb)
                    .then_with(|| sb.partial_cmp(sa).unwrap_or(std::cmp::Ordering::Equal))
                    .then_with(|| cb.cmp(ca))
                    .then_with(|| b.created_at.cmp(&a.created_at))
            });
        }
        db::GuideDidRankSort::WeightedActivityAndReputation => {
            let max_vol = scored
                .iter()
                .map(|(_, v, _, _, _)| *v)
                .fold(0.0_f64, f64::max);
            scored.sort_by(|(a, va, ca, _, avga), (b, vb, cb, _, avgb)| {
                let vol_n_a = if max_vol > 0.0 { va / max_vol } else { 0.0 };
                let vol_n_b = if max_vol > 0.0 { vb / max_vol } else { 0.0 };
                let rev_n_a = avga
                    .map(|x| ((x - 1.0) / 4.0).clamp(0.0, 1.0))
                    .unwrap_or(0.0);
                let rev_n_b = avgb
                    .map(|x| ((x - 1.0) / 4.0).clamp(0.0, 1.0))
                    .unwrap_or(0.0);
                let sa = weighted_w_activity * vol_n_a + weighted_w_reputation * rev_n_a;
                let sb = weighted_w_activity * vol_n_b + weighted_w_reputation * rev_n_b;
                sb.partial_cmp(&sa)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| vb.partial_cmp(va).unwrap_or(std::cmp::Ordering::Equal))
                    .then_with(|| cb.cmp(ca))
                    .then_with(|| b.created_at.cmp(&a.created_at))
            });
        }
    }
    scored
        .into_iter()
        .take(DID_RANK_LIMIT_USIZE)
        .enumerate()
        .map(|(i, (u, vol, cnt, recv_n, recv_avg))| {
            let reception_gross_total = if vol == 0.0 {
                "0".to_string()
            } else {
                format!("{vol}")
            };
            json!({
                "rank": i + 1,
                "id": u.id.to_string(),
                "nickname": u.nickname,
                "avatar_url": u.avatar_url,
                "default_wallet_address": u.default_wallet_address,
                "is_me": viewer == Some(u.id),
                "reception_gross_total": reception_gross_total,
                "reception_count": cnt as i64,
                "received_review_count": recv_n,
                "avg_received_review_score": recv_avg,
            })
        })
        .collect()
}

pub async fn get_did_rank_travelers(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<DidRankQuery>,
) -> impl IntoResponse {
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let period = resolve_period(q.period.as_deref());
    let since = period_start(period);
    let label = period_label(period);

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        if let Ok(rows) =
            db::list_tourists_did_rank_by_completed_orders(pool, DID_RANK_LIMIT, since).await
        {
            let mut travelers: Vec<serde_json::Value> = rows
                .into_iter()
                .filter(|(u, _)| did_rank_traveler_board_visible_email(&u.email))
                .take(DID_RANK_LIMIT_USIZE)
                .enumerate()
                .map(|(i, (u, completed_orders))| {
                    json!({
                        "rank": i + 1,
                        "id": u.id.to_string(),
                        "nickname": u.nickname,
                        "avatar_url": u.avatar_url,
                        "default_wallet_address": u.default_wallet_address,
                        "is_me": viewer == Some(u.id),
                        "completed_orders": completed_orders,
                    })
                })
                .collect();
            apply_market_board_rank_deltas(
                Some(pool),
                &did_rank_travelers_snapshot_key(label),
                &mut travelers,
            )
            .await;
            let mut m = did_rank_meta(label, since, "tourist_completed_orders_in_window");
            m["travelers"] = json!(travelers);
            return Json(m).into_response();
        }
    }
    if let Some(ref co) = state.chain_off {
        let store = co.store.read().await;
        let mut travelers = travelers_from_chain_off_store(&store, since, viewer);
        if let Some(pool) = pool {
            apply_market_board_rank_deltas(
                Some(pool),
                &did_rank_travelers_snapshot_key(label),
                &mut travelers,
            )
            .await;
        }
        let mut m = did_rank_meta(label, since, "tourist_completed_orders_in_window");
        m["travelers"] = json!(travelers);
        return Json(m).into_response();
    }
    let mut m = did_rank_meta(label, since, "tourist_completed_orders_in_window");
    m["travelers"] = json!([]);
    m["note"] = json!("P2 占位：无 DB 且无 chain_off");
    Json(m).into_response()
}

pub async fn get_did_rank_guides(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<DidRankQuery>,
) -> impl IntoResponse {
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let period = resolve_period(q.period.as_deref());
    let since = period_start(period);
    let label = period_label(period);
    let guide_sort = resolve_guide_did_rank_sort(q.sort.as_deref());
    let rt = guide_did_rank_runtime_from_env();
    let rank_basis: Cow<'_, str> = match guide_sort {
        db::GuideDidRankSort::ReceptionGrossThenCount => Cow::Borrowed(RANK_BASIS_GUIDE_RECEPTION),
        db::GuideDidRankSort::AvgReceivedReviewThenReception => Cow::Owned(
            rank_basis_guide_reviews(rt.min_completed_for_reputation_sorts),
        ),
        db::GuideDidRankSort::WeightedActivityAndReputation => {
            Cow::Owned(rank_basis_guide_weighted(
                rt.min_completed_for_reputation_sorts,
                rt.weighted_w_activity,
                rt.weighted_w_reputation,
            ))
        }
    };

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        if let Ok(rows) = db::list_guides_did_rank(
            pool,
            DID_RANK_LIMIT,
            since,
            guide_sort,
            rt.min_completed_for_reputation_sorts,
            rt.weighted_w_activity,
            rt.weighted_w_reputation,
        )
        .await
        {
            let store_filter = if let Some(co) = state.chain_off.as_ref() {
                Some(co.store.read().await)
            } else {
                None
            };
            let mut guides: Vec<serde_json::Value> = rows
                .into_iter()
                .filter(|e| match store_filter.as_ref() {
                    Some(store) => {
                        did_rank_guide_board_visible_db(Some(store), e.user.id, &e.user.email)
                    }
                    None => did_rank_traveler_board_visible_email(&e.user.email),
                })
                .take(DID_RANK_LIMIT_USIZE)
                .enumerate()
                .map(|(i, e)| {
                    let u = e.user;
                    json!({
                        "rank": i + 1,
                        "id": u.id.to_string(),
                        "nickname": u.nickname,
                        "avatar_url": u.avatar_url,
                        "default_wallet_address": u.default_wallet_address,
                        "is_me": viewer == Some(u.id),
                        "reception_gross_total": e.reception_gross_total,
                        "reception_count": e.reception_count,
                        "received_review_count": e.received_review_count,
                        "avg_received_review_score": e.avg_received_review_score,
                    })
                })
                .collect();
            apply_market_board_rank_deltas(
                Some(pool),
                &did_rank_guides_snapshot_key(label, guide_sort),
                &mut guides,
            )
            .await;
            let mut m = did_rank_meta(label, since, rank_basis.as_ref());
            m["guides"] = json!(guides);
            return Json(m).into_response();
        }
    }
    let penalty_excluded: Option<HashSet<Uuid>> =
        if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            db::list_subject_user_ids_excluded_from_did_rank_guides(pool)
                .await
                .ok()
        } else {
            None
        };
    if let Some(ref co) = state.chain_off {
        let store = co.store.read().await;
        let mut guides = guides_from_chain_off_store(
            &store,
            since,
            viewer,
            guide_sort,
            rt.min_completed_for_reputation_sorts,
            rt.weighted_w_activity,
            rt.weighted_w_reputation,
            penalty_excluded.as_ref(),
        );
        if let Some(pool) = pool {
            apply_market_board_rank_deltas(
                Some(pool),
                &did_rank_guides_snapshot_key(label, guide_sort),
                &mut guides,
            )
            .await;
        }
        let mut m = did_rank_meta(label, since, rank_basis.as_ref());
        m["guides"] = json!(guides);
        return Json(m).into_response();
    }
    let mut m = did_rank_meta(label, since, rank_basis.as_ref());
    m["guides"] = json!([]);
    m["note"] = json!("P2 占位：无 DB 且无 chain_off");
    Json(m).into_response()
}

/// G1/55 九附：DID 行程排行榜；有 DB 时从 itineraries 按 created_at 过滤；chain_off 时按订单 created_at 代理
pub async fn get_did_rank_itineraries(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<DidRankQuery>,
) -> impl IntoResponse {
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let period = resolve_period(q.period.as_deref());
    let since = period_start(period);
    let label = period_label(period);

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        let mut rank_basis: &'static str = "order_completed_at";
        let mut rows =
            db::list_itineraries_did_rank_by_order_completion(pool, since, DID_RANK_LIMIT)
                .await
                .unwrap_or_default();
        if rows.is_empty() {
            rank_basis = "itinerary_created_at_fallback";
            if let Ok(mut r) = db::list_itineraries_created_since(pool, since).await {
                r.sort_by(|a, b| b.row.created_at.cmp(&a.row.created_at));
                r.truncate(DID_RANK_LIMIT_USIZE);
                rows = r;
            }
        }
        if !rows.is_empty() {
            let mut itineraries: Vec<serde_json::Value> = rows
                .into_iter()
                .enumerate()
                .map(|(i, e)| {
                    let r = &e.row;
                    let is_me = viewer.is_some_and(|v| e.order_tourist_id == Some(v));
                    let tid = e.order_tourist_id.map(|u| u.to_string());
                    let oid = r.order_id.to_string();
                    json!({
                        "rank": i + 1,
                        "id": oid.clone(),
                        "order_id": oid,
                        "destination": r.destination,
                        "city": r.city,
                        "total_days": r.days_json.as_array().map(|a| a.len()).unwrap_or(0),
                        "version": r.version,
                        "created_at": r.created_at.to_rfc3339(),
                        "is_me": is_me,
                        "tourist_id": tid.clone(),
                        "traveler_id": tid,
                    })
                })
                .collect();
            apply_market_board_rank_deltas(
                Some(pool),
                &format!("itineraries:{label}"),
                &mut itineraries,
            )
            .await;
            let mut m = did_rank_meta(label, since, rank_basis);
            m["itineraries"] = json!(itineraries);
            return Json(m).into_response();
        }
    }
    if let Some(ref co) = state.chain_off {
        let store = co.store.read().await;
        let mut list: Vec<_> = store
            .itineraries
            .iter()
            .filter_map(|(order_id, b)| {
                let o = store.orders.get(order_id)?;
                if o.state != OrderState::Completed {
                    return None;
                }
                let ct = o.completed_at?;
                if !since.map_or(true, |s| ct >= s) {
                    return None;
                }
                Some((
                    ct,
                    order_id,
                    o.tourist_id,
                    b.destination.clone(),
                    b.city.clone(),
                    b.days.len(),
                    b.version,
                ))
            })
            .collect();
        list.sort_by(|a, b| b.0.cmp(&a.0));
        let mut itineraries: Vec<serde_json::Value> = list
            .into_iter()
            .take(DID_RANK_LIMIT_USIZE)
            .enumerate()
            .map(
                |(i, (_ct, order_id, tourist_id, dest, city, days, version))| {
                    let ts = tourist_id.to_string();
                    let oid = order_id.to_string();
                    json!({
                        "rank": i + 1,
                        "id": oid.clone(),
                        "order_id": oid,
                        "destination": dest,
                        "city": city,
                        "total_days": days,
                        "version": version as i32,
                        "is_me": viewer == Some(tourist_id),
                        "tourist_id": ts.clone(),
                        "traveler_id": ts,
                    })
                },
            )
            .collect();
        let mut rank_basis = "order_completed_at";
        if itineraries.is_empty() {
            rank_basis = "itinerary_created_at_proxy";
            let mut list2: Vec<_> = store
                .itineraries
                .iter()
                .filter_map(|(order_id, b)| {
                    let o = store.orders.get(order_id);
                    let in_window =
                        since.map_or(true, |s| o.map(|ord| ord.created_at >= s).unwrap_or(false));
                    if !in_window {
                        return None;
                    }
                    let tourist_id = o.map(|ord| ord.tourist_id);
                    Some((
                        *order_id,
                        tourist_id,
                        b.destination.clone(),
                        b.city.clone(),
                        b.days.len(),
                        b.version,
                    ))
                })
                .collect();
            list2.sort_by(|a, b| b.4.cmp(&a.4));
            itineraries = list2
                .into_iter()
                .take(DID_RANK_LIMIT_USIZE)
                .enumerate()
                .map(|(i, (order_id, tourist_id, dest, city, days, version))| {
                    let is_me = match (viewer, tourist_id) {
                        (Some(v), Some(t)) => v == t,
                        _ => false,
                    };
                    let tid = tourist_id.map(|u| u.to_string());
                    let oid = order_id.to_string();
                    json!({
                        "rank": i + 1,
                        "id": oid.clone(),
                        "order_id": oid,
                        "destination": dest,
                        "city": city,
                        "total_days": days,
                        "version": version as i32,
                        "is_me": is_me,
                        "tourist_id": tid.clone(),
                        "traveler_id": tid,
                    })
                })
                .collect();
        }
        if let Some(pool) = pool {
            apply_market_board_rank_deltas(
                Some(pool),
                &format!("itineraries:{label}"),
                &mut itineraries,
            )
            .await;
        }
        let mut m = did_rank_meta(label, since, rank_basis);
        m["itineraries"] = json!(itineraries);
        return Json(m).into_response();
    }
    let mut m = did_rank_meta(label, since, "order_completed_at");
    m["itineraries"] = json!([]);
    m["note"] = json!("G1 占位：无 DB 且无 chain_off");
    Json(m).into_response()
}

fn prize_pool_balance_as_amount(raw: Option<&str>) -> Option<f64> {
    let s = raw?.trim();
    if s.is_empty() {
        return None;
    }
    s.parse::<f64>().ok().filter(|&n| n.is_finite() && n >= 0.0)
}

fn guide_rank_snapshot_sort_key(guide_sort: db::GuideDidRankSort) -> &'static str {
    match guide_sort {
        db::GuideDidRankSort::ReceptionGrossThenCount => "reception",
        db::GuideDidRankSort::AvgReceivedReviewThenReception => "reviews",
        db::GuideDidRankSort::WeightedActivityAndReputation => "weighted",
    }
}

fn did_rank_travelers_snapshot_key(label: &str) -> String {
    format!("travelers:{label}")
}

fn did_rank_guides_snapshot_key(label: &str, guide_sort: db::GuideDidRankSort) -> String {
    format!(
        "guides:{label}:{}",
        guide_rank_snapshot_sort_key(guide_sort)
    )
}

async fn apply_market_board_rank_deltas(
    pool: Option<&sqlx::PgPool>,
    cache_key: &str,
    rows: &mut [serde_json::Value],
) {
    let mut current: HashMap<String, i64> = HashMap::new();
    for row in rows.iter() {
        if let (Some(id), Some(rank)) = (row["id"].as_str(), row["rank"].as_i64()) {
            current.insert(id.to_string(), rank);
        }
    }
    if let Some(pool) = pool {
        if let Ok(Some(prev)) = db::load_did_rank_rank_snapshot(pool, cache_key).await {
            for row in rows.iter_mut() {
                let Some(id) = row["id"].as_str() else {
                    continue;
                };
                let Some(rank) = row["rank"].as_i64() else {
                    continue;
                };
                if let Some(prev_rank) = prev.get(id) {
                    row["rank_delta"] = json!(*prev_rank - rank);
                }
            }
        }
        let _ = db::upsert_did_rank_rank_snapshot(pool, cache_key, &current).await;
    }
}

fn market_did_rank_meta(
    label: &str,
    since: Option<DateTime<Utc>>,
    rank_basis: &str,
) -> serde_json::Value {
    json!({
        "status": "ok",
        "period": label,
        "since": since.map(|s| s.to_rfc3339()),
        "limit": MARKET_DID_RANK_LIMIT,
        "rank_basis": rank_basis,
    })
}

fn market_board_owner_visible(email: &str) -> bool {
    !chain_off::public_catalog_surface_filter_enabled()
        || !chain_off::is_dev_catalog_email(email)
}

pub async fn get_did_rank_prize_pool(State(state): State<ApiMetaState>) -> impl IntoResponse {
    if let Ok(raw) = env::var("DID_RANK_PRIZE_POOL_MONTHLY_AMOUNT") {
        if let Ok(n) = raw.trim().parse::<f64>() {
            if n.is_finite() && n >= 0.0 {
                return Json(json!({
                    "status": "ok",
                    "monthly_amount": n,
                    "illustrative": true,
                    "source": "env"
                }))
                .into_response();
            }
        }
    }
    if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        if let Ok(Some(row)) = db::get_governance_pool(pool).await {
            if let Some(n) = prize_pool_balance_as_amount(row.balance.as_deref()) {
                return Json(json!({
                    "status": "ok",
                    "monthly_amount": n,
                    "illustrative": true,
                    "source": "governance_pool_db"
                }))
                .into_response();
            }
        }
    }
    Json(json!({
        "status": "ok",
        "monthly_amount": PRIZE_POOL_DEFAULT_AMOUNT,
        "illustrative": true,
        "source": "default"
    }))
    .into_response()
}

pub async fn get_did_rank_providers(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<DidRankQuery>,
) -> impl IntoResponse {
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let period = resolve_period(q.period.as_deref());
    let since = period_start(period);
    let label = period_label(period);
    let cache_key = format!("did_rank:providers:{label}");

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        if let Ok(entries) = db::list_market_did_rank_by_fulfillment(
            pool,
            "provider",
            Some("provider"),
            since,
            MARKET_DID_RANK_LIMIT,
        )
        .await
        {
            let mut providers: Vec<serde_json::Value> = entries
                .into_iter()
                .filter(|e| market_board_owner_visible(&e.user.email))
                .take(MARKET_DID_RANK_LIMIT_USIZE)
                .enumerate()
                .map(|(i, e)| {
                    let u = e.user;
                    json!({
                        "rank": i + 1,
                        "id": u.id.to_string(),
                        "nickname": u.nickname,
                        "avatar_url": u.avatar_url,
                        "default_wallet_address": u.default_wallet_address,
                        "is_me": viewer == Some(u.id),
                        "completed_fulfillment_orders": e.completed_fulfillment_orders,
                        "fulfillment_gross_total": e.fulfillment_gross_total,
                        "published_listings": e.published_listings,
                    })
                })
                .collect();
            apply_market_board_rank_deltas(Some(pool), &cache_key, &mut providers).await;
            let mut m = market_did_rank_meta(label, since, RANK_BASIS_PROVIDER);
            m["owner_role_filter"] = json!("provider");
            m["providers"] = json!(providers);
            return Json(m).into_response();
        }
    }
    let mut m = market_did_rank_meta(label, since, RANK_BASIS_PROVIDER);
    m["owner_role_filter"] = json!("provider");
    m["providers"] = json!([]);
    m["note"] = json!("P2 占位：无 DB 或查询失败");
    Json(m).into_response()
}

pub async fn get_did_rank_acquisitions(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<DidRankQuery>,
) -> impl IntoResponse {
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let period = resolve_period(q.period.as_deref());
    let since = period_start(period);
    let label = period_label(period);
    let cache_key = format!("did_rank:acquisitions:{label}");

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        if let Ok(entries) = db::list_market_did_rank_by_fulfillment(
            pool,
            "acquisition",
            None,
            since,
            MARKET_DID_RANK_LIMIT,
        )
        .await
        {
            let mut acquisitions: Vec<serde_json::Value> = entries
                .into_iter()
                .filter(|e| market_board_owner_visible(&e.user.email))
                .take(MARKET_DID_RANK_LIMIT_USIZE)
                .enumerate()
                .map(|(i, e)| {
                    let u = e.user;
                    json!({
                        "rank": i + 1,
                        "id": u.id.to_string(),
                        "nickname": u.nickname,
                        "avatar_url": u.avatar_url,
                        "default_wallet_address": u.default_wallet_address,
                        "is_me": viewer == Some(u.id),
                        "completed_fulfillment_orders": e.completed_fulfillment_orders,
                        "fulfillment_gross_total": e.fulfillment_gross_total,
                        "published_listings": e.published_listings,
                    })
                })
                .collect();
            apply_market_board_rank_deltas(Some(pool), &cache_key, &mut acquisitions).await;
            let mut m = market_did_rank_meta(label, since, RANK_BASIS_ACQUISITION);
            m["owner_role_filter"] = json!("region_steward");
            m["acquisitions"] = json!(acquisitions);
            return Json(m).into_response();
        }
    }
    let mut m = market_did_rank_meta(label, since, RANK_BASIS_ACQUISITION);
    m["owner_role_filter"] = json!("region_steward");
    m["acquisitions"] = json!([]);
    m["note"] = json!("P2 占位：无 DB 或查询失败");
    Json(m).into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/did-rank/travelers", get(get_did_rank_travelers))
        .route("/api/v1/did-rank/guides", get(get_did_rank_guides))
        .route(
            "/api/v1/did-rank/itineraries",
            get(get_did_rank_itineraries),
        )
        .route("/api/v1/did-rank/prize-pool", get(get_did_rank_prize_pool))
        .route("/api/v1/did-rank/providers", get(get_did_rank_providers))
        .route(
            "/api/v1/did-rank/acquisitions",
            get(get_did_rank_acquisitions),
        )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn guides_from_chain_off_store_filters_penalty_excluded() {
        let mut store = chain_off::ChainOffStore::default();
        let now = Utc::now();
        let kept = Uuid::new_v4();
        let banned = Uuid::new_v4();
        store.users.insert(
            kept,
            chain_off::UserRow {
                id: kept,
                email: "a@test.com".to_string(),
                password_hash: None,
                role: "guide".to_string(),
                kyc_status: "none".to_string(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: now,
                updated_at: now,
            },
        );
        store.users.insert(
            banned,
            chain_off::UserRow {
                id: banned,
                email: "b@test.com".to_string(),
                password_hash: None,
                role: "guide".to_string(),
                kyc_status: "none".to_string(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: now + Duration::seconds(1),
                updated_at: now + Duration::seconds(1),
            },
        );
        let mut ex = HashSet::new();
        ex.insert(banned);
        let out = guides_from_chain_off_store(
            &store,
            None,
            None,
            db::GuideDidRankSort::ReceptionGrossThenCount,
            db::GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS,
            db::GUIDE_DID_RANK_WEIGHTED_W_ACTIVITY,
            db::GUIDE_DID_RANK_WEIGHTED_W_REPUTATION,
            Some(&ex),
        );
        assert_eq!(out.len(), 1);
        assert_eq!(out[0]["id"].as_str().unwrap(), kept.to_string());
    }

    #[test]
    fn resolve_guide_did_rank_sort_accepts_reviews() {
        assert_eq!(
            resolve_guide_did_rank_sort(Some("reviews")),
            db::GuideDidRankSort::AvgReceivedReviewThenReception
        );
        assert_eq!(
            resolve_guide_did_rank_sort(Some(" Reviews ")),
            db::GuideDidRankSort::AvgReceivedReviewThenReception
        );
        assert_eq!(
            resolve_guide_did_rank_sort(Some("garbage")),
            db::GuideDidRankSort::ReceptionGrossThenCount
        );
        assert_eq!(
            resolve_guide_did_rank_sort(None),
            db::GuideDidRankSort::ReceptionGrossThenCount
        );
    }

    #[test]
    fn resolve_guide_did_rank_sort_accepts_weighted() {
        assert_eq!(
            resolve_guide_did_rank_sort(Some("weighted")),
            db::GuideDidRankSort::WeightedActivityAndReputation
        );
        assert_eq!(
            resolve_guide_did_rank_sort(Some(" Weighted ")),
            db::GuideDidRankSort::WeightedActivityAndReputation
        );
    }

    #[test]
    fn guide_reviews_and_weighted_rank_basis_aligns_with_smoke_scripts() {
        assert_eq!(
            super::rank_basis_guide_reviews(db::GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS),
            "guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_3"
        );
        assert_eq!(
            super::rank_basis_guide_weighted(
                db::GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS,
                db::GUIDE_DID_RANK_WEIGHTED_W_ACTIVITY,
                db::GUIDE_DID_RANK_WEIGHTED_W_REPUTATION,
            ),
            "guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3"
        );
    }

    #[test]
    fn rank_basis_reviews_embeds_min_completed() {
        assert_eq!(
            super::rank_basis_guide_reviews(5),
            "guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_5"
        );
    }

    #[test]
    fn rank_basis_weighted_default_w_custom_min_keeps_w60_w40_prefix() {
        assert_eq!(
            super::rank_basis_guide_weighted(
                5,
                db::GUIDE_DID_RANK_WEIGHTED_W_ACTIVITY,
                db::GUIDE_DID_RANK_WEIGHTED_W_REPUTATION,
            ),
            "guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_5"
        );
    }

    #[test]
    fn rank_basis_weighted_custom_w_uses_pct_tokens() {
        assert_eq!(
            super::rank_basis_guide_weighted(3, 0.5, 0.5),
            "guide_weighted_volume_norm_w50pct_review_avg_norm_w50pct_then_reception_gross_then_completed_count_min_completed_ge_3"
        );
    }

    #[test]
    fn resolve_period_accepts_aliases() {
        assert!(matches!(resolve_period(Some("WEEK")), DidRankPeriod::Week));
        assert!(matches!(
            resolve_period(Some("Month")),
            DidRankPeriod::Month
        ));
        assert!(matches!(resolve_period(Some("all")), DidRankPeriod::All));
        assert!(matches!(resolve_period(None), DidRankPeriod::All));
        assert!(matches!(
            resolve_period(Some("garbage")),
            DidRankPeriod::All
        ));
    }

    #[test]
    fn did_rank_meta_all_has_null_since_and_limit_100() {
        let v = did_rank_meta("all", None, "test");
        assert_eq!(v["status"], json!("ok"));
        assert_eq!(v["period"], json!("all"));
        assert!(v["since"].is_null());
        assert_eq!(v["limit"], json!(DID_RANK_LIMIT));
        assert_eq!(v["rank_basis"], json!("test"));
    }

    #[test]
    fn did_rank_meta_week_has_rfc3339_since() {
        let since = Utc::now() - Duration::days(7);
        let v = did_rank_meta("week", Some(since), "test");
        let s = v["since"].as_str().expect("since string");
        assert!(s.len() > 10);
        assert!(s.contains('T') || s.contains('t'));
        assert_eq!(v["limit"], json!(DID_RANK_LIMIT));
        assert_eq!(v["rank_basis"], json!("test"));
    }

    #[tokio::test]
    async fn did_rank_itineraries_chain_off_completed_mirrors_tourist_traveler_id() {
        use crate::chain_off::{
            AmountBreakdown, ChainOffConfig, ChainOffState, ItineraryBundle, OrderRow,
        };
        use crate::state::test_support::api_meta_state;
        use axum::extract::{Query, State};
        use axum::http::HeaderMap;
        use http_body_util::BodyExt;
        use std::sync::Arc;
        use tokio::sync::RwLock;

        let order_id = Uuid::new_v4();
        let tourist = Uuid::new_v4();
        let guide_id = Uuid::new_v4();
        let now = Utc::now();

        let mut store = chain_off::ChainOffStore::default();
        store.orders.insert(
            order_id,
            OrderRow {
                id: order_id,
                tourist_id: tourist,
                guide_id,
                amount: "100".to_string(),
                currency: "USDT".to_string(),
                escrow_address: None,
                state: OrderState::Completed,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: Some(now),
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
                data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            ..Default::default()
            },
        );
        store.itineraries.insert(
            order_id,
            ItineraryBundle {
                order_id,
                version: 1,
                destination: "Tokyo".to_string(),
                city: "Shibuya".to_string(),
                days: vec![],
                amount_breakdown: AmountBreakdown {
                    hotel: 0.,
                    catering: 0.,
                    tickets: 0.,
                    guide_fee: 0.,
                    vehicle: 0.,
                    platform_fee: 0.,
                    total_budget: 0.,
                },
                snapshot_hash: None,
                cover_image: None,
            },
        );

        let co = ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let state = api_meta_state(Some(co));

        let resp = get_did_rank_itineraries(
            State(state),
            HeaderMap::new(),
            Query(DidRankQuery::default()),
        )
        .await
        .into_response();

        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        let items = v["itineraries"].as_array().unwrap();
        assert_eq!(items.len(), 1, "{v}");
        let row = &items[0];
        assert_eq!(row["tourist_id"].as_str().unwrap(), tourist.to_string());
        assert_eq!(row["traveler_id"].as_str().unwrap(), tourist.to_string());
    }
}
