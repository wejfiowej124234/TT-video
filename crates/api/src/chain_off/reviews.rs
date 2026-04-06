//! chain_off 评价：SubmitReviewBody、reviews_list、review_submit（48 §5.5；**815** Admin **`review`**、**816** **`GET|POST …/orders/:id/reviews`** **`items[]`****/**`review`** **`tourist_id`****/**`traveler_id`** **87**）
//!
//! Phase 5 / 03：防刷 — 可选按 (order_id, reviewer) 分钟级限流；低分须说明（REVIEW_LOW_SCORE_COMMENT_MIN_CHARS）。

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value as JsonValue};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use uuid::Uuid;

use super::{
    disputes::{dispute_party_mirror, dispute_party_mirror_ids},
    order_state_to_str, ChainOffState, ReviewRow,
};
use traveltrust_core::{can_submit_review, ReviewWeight, ReviewWeightBreakdown};

#[derive(Deserialize)]
pub struct SubmitReviewBody {
    pub score: i16,
    pub comment: Option<String>,
}

fn reviewer_account_age_days(created_at: chrono::DateTime<Utc>) -> u64 {
    Utc::now()
        .signed_duration_since(created_at)
        .num_days()
        .max(0) as u64
}

fn json_weight_breakdown(b: &ReviewWeightBreakdown) -> JsonValue {
    json!({
        "rule_version": b.rule_version,
        "order_amount": b.order_amount,
        "account_age_days": b.account_age_days,
        "amount_factor": b.amount_factor,
        "age_factor": b.age_factor,
        "weight": b.weight,
        "guide_historical_score_reserved": b.guide_historical_score_reserved,
    })
}

/// 70：`GET /api/v1/admin/reviews/:id`；`meta.source` 与列表 `applied_filters.source` 同源语义（database / memory / memory_fallback）；**87** **`order_tourist_id`** 双读。
pub fn review_admin_detail_envelope(
    r: &ReviewRow,
    source: &str,
    order_tourist_id: Option<Uuid>,
) -> JsonValue {
    let (tourist_id, traveler_id) = dispute_party_mirror_ids(order_tourist_id);
    json!({
        "status": "ok",
        "review": {
            "id": r.id.to_string(),
            "order_id": r.order_id.to_string(),
            "tourist_id": tourist_id,
            "traveler_id": traveler_id,
            "reviewer_id": r.reviewer_id.to_string(),
            "reviewee_id": r.reviewee_id.to_string(),
            "score": r.score,
            "weight": r.weight,
            "comment": r.comment,
            "created_at": r.created_at.to_rfc3339(),
        },
        "meta": {
            "source": source
        }
    })
}

/// 每 (order_id, reviewer) 每分钟提交次数上限；0 = 不启用（默认）。
fn review_rate_limit_check(
    order_id: Uuid,
    user_id: Uuid,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let limit = std::env::var("REVIEW_MAX_REQUESTS_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(0);
    if limit == 0 {
        return Ok(());
    }
    static STORE: OnceLock<Mutex<HashMap<(Uuid, Uuid), Vec<Instant>>>> = OnceLock::new();
    let store = STORE.get_or_init(|| Mutex::new(HashMap::new()));
    let now = Instant::now();
    let window = Duration::from_secs(60);
    let mut guard = store.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key("rate_limit_unavailable")),
        )
    })?;
    let key = (order_id, user_id);
    let vec = guard.entry(key).or_default();
    vec.retain(|t| now.saturating_duration_since(*t) < window);
    if vec.len() >= limit as usize {
        return Err((
            StatusCode::TOO_MANY_REQUESTS,
            Json(json!({
                "error": "review_rate_limit_exceeded",
                "message": "review_rate_limit_exceeded",
                "max_per_minute": limit,
            })),
        ));
    }
    vec.push(now);
    Ok(())
}

/// 评分 ≤2 时要求评论达到最小长度（与 EVIDENCE 限流同模式：0 = 关闭校验）。
fn review_low_score_comment_check(
    score: i16,
    comment: Option<&str>,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let min_len = std::env::var("REVIEW_LOW_SCORE_COMMENT_MIN_CHARS")
        .ok()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(20);
    if min_len == 0 || score > 2 {
        return Ok(());
    }
    let n = comment.map(str::trim).unwrap_or("").len();
    if n < min_len {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "review_comment_required_for_low_score",
                "message": "review_comment_required_for_low_score",
                "min_chars": min_len,
                "max_score_for_rule": 2,
            })),
        ));
    }
    Ok(())
}

pub async fn reviews_list_impl(
    state: ChainOffState,
    order_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let order = store.orders.get(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    let (mirror_tourist, mirror_traveler) = dispute_party_mirror(Some(order));
    let items: Vec<_> = store
        .reviews
        .iter()
        .filter(|r| r.order_id == order_id)
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "order_id": r.order_id.to_string(),
                "tourist_id": mirror_tourist.clone(),
                "traveler_id": mirror_traveler.clone(),
                "reviewer_id": r.reviewer_id.to_string(),
                "reviewee_id": r.reviewee_id.to_string(),
                "score": r.score,
                "weight": r.weight,
                "comment": r.comment,
                "created_at": r.created_at.to_rfc3339()
            })
        })
        .collect();
    Ok(Json(json!({
        "status": "ok",
        "items": items,
        "meta": {
            "review_weight_rule_version": "review_weight_v1",
            "review_weight_rule": "weight = clamp(order_amount/1000,0.1,10) * clamp(reviewer_account_age_days/365,0.5,3); see traveltrust_core::ReviewWeight"
        }
    })))
}

pub async fn review_submit_impl(
    state: ChainOffState,
    order_id: Uuid,
    user_id: Uuid,
    Json(body): Json<SubmitReviewBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    if body.score < 1 || body.score > 5 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("score_must_be_1_to_5")),
        ));
    }

    review_rate_limit_check(order_id, user_id)?;
    review_low_score_comment_check(body.score, body.comment.as_deref())?;

    let strict_db = std::env::var("TRAVELTRUST_STRICT_REVIEW_DB_WRITE").as_deref() == Ok("1");

    let (row, weight_breakdown) = {
        let store = state.store.read().await;
        let order = store.orders.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if !crate::chain_off::order_is_participant(&store, order, user_id) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            ));
        }
        if let Some(err_key) =
            crate::chain_off::me::order_participant_trust_gate(&store, user_id, order)
        {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key(err_key)),
            ));
        }
        if !can_submit_review(order.state) {
            return Err((
                StatusCode::CONFLICT,
                Json(
                    json!({"error": "order_not_final_financial_state", "message": "order_not_final_financial_state", "current": order_state_to_str(order.state)}),
                ),
            ));
        }
        let completed_at = order.completed_at.ok_or((
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("order_has_no_completed_at")),
        ))?;
        let window_end = completed_at + chrono::Duration::days(state.config.review_window_days);
        if Utc::now() > window_end {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({
                    "error": "review_window_expired",
                    "message": "review_window_expired",
                    "review_window_days": state.config.review_window_days,
                    "completed_at": completed_at.to_rfc3339(),
                    "window_ends_at": window_end.to_rfc3339()
                })),
            ));
        }
        let reviewee_id = if order.tourist_id == user_id {
            order.guide_id
        } else {
            order.tourist_id
        };
        if store
            .reviews
            .iter()
            .any(|r| r.order_id == order_id && r.reviewer_id == user_id)
        {
            return Err((
                StatusCode::CONFLICT,
                Json(crate::api_json::err_key("already_reviewed")),
            ));
        }
        let reviewer = store.users.get(&user_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ))?;
        let amount: f64 = order.amount.parse().unwrap_or(0.0);
        let account_age_days = reviewer_account_age_days(reviewer.created_at);
        let weight_calc = ReviewWeight {
            order_amount: amount,
            guide_historical_score: 0.0,
            account_age_days,
        };
        let weight = weight_calc.weight();
        let weight_breakdown = weight_calc.breakdown();
        let id = Uuid::new_v4();
        let now = Utc::now();
        let row = ReviewRow {
            id,
            order_id,
            reviewer_id: user_id,
            reviewee_id,
            score: body.score,
            weight,
            comment: body.comment,
            created_at: now,
        };
        (row, weight_breakdown)
    };

    if let Some(ref pool) = state.db_pool {
        match crate::db::insert_review(
            pool,
            row.id,
            row.order_id,
            row.reviewer_id,
            row.reviewee_id,
            row.score,
            row.weight,
            row.comment.as_deref(),
            row.created_at,
        )
        .await
        {
            Ok(true) => {}
            Ok(false) => {
                let existing = match crate::db::fetch_review_by_order_and_reviewer(
                    pool, order_id, user_id,
                )
                .await
                {
                    Ok(v) => v,
                    Err(e) => {
                        eprintln!("[audit] fetch_review_by_order_and_reviewer failed order_id={} error={}", order_id, e);
                        if strict_db {
                            return Err((
                                StatusCode::SERVICE_UNAVAILABLE,
                                Json(json!({
                                    "error": "review_db_persist_failed",
                                    "message": "review_db_persist_failed",
                                    "rule": "TRAVELTRUST_STRICT_REVIEW_DB_WRITE=1",
                                })),
                            ));
                        }
                        return Err((
                            StatusCode::CONFLICT,
                            Json(crate::api_json::err_key("already_reviewed")),
                        ));
                    }
                };
                let Some(db) = existing else {
                    return Err((
                        StatusCode::CONFLICT,
                        Json(crate::api_json::err_key("already_reviewed")),
                    ));
                };
                let synced = ReviewRow {
                    id: db.id,
                    order_id: db.order_id,
                    reviewer_id: db.reviewer_id,
                    reviewee_id: db.reviewee_id,
                    score: db.score,
                    weight: db.weight,
                    comment: db.comment,
                    created_at: db.created_at,
                };
                {
                    let mut store = state.store.write().await;
                    if !store
                        .reviews
                        .iter()
                        .any(|r| r.order_id == order_id && r.reviewer_id == user_id)
                    {
                        store.reviews.push(synced.clone());
                    }
                }
                let store_ro = state.store.read().await;
                let order = store_ro.orders.get(&order_id);
                let (tourist_id, traveler_id) = dispute_party_mirror(order);
                return Ok(Json(json!({
                    "status": "ok",
                    "review": {
                        "id": synced.id.to_string(),
                        "order_id": order_id.to_string(),
                        "tourist_id": tourist_id,
                        "traveler_id": traveler_id,
                        "score": synced.score,
                        "weight": synced.weight,
                        "weight_breakdown": JsonValue::Null,
                        "weight_breakdown_note": "persisted_review_inputs_not_replayed"
                    }
                })));
            }
            Err(e) => {
                eprintln!(
                    "[audit] db insert_review failed review_id={} error={}",
                    row.id, e
                );
                if strict_db {
                    return Err((
                        StatusCode::SERVICE_UNAVAILABLE,
                        Json(json!({
                            "error": "review_db_persist_failed",
                            "message": "review_db_persist_failed",
                            "rule": "TRAVELTRUST_STRICT_REVIEW_DB_WRITE=1 requires successful DB insert; retry with same Idempotency-Key if applicable (ops/RUNBOOK §9)",
                        })),
                    ));
                }
            }
        }
    }

    {
        let mut store = state.store.write().await;
        let _ = store.orders.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if store
            .reviews
            .iter()
            .any(|r| r.order_id == order_id && r.reviewer_id == user_id)
        {
            return Err((
                StatusCode::CONFLICT,
                Json(crate::api_json::err_key("already_reviewed")),
            ));
        }
        store.reviews.push(row.clone());
    }

    let store = state.store.read().await;
    let order = store.orders.get(&order_id);
    let (tourist_id, traveler_id) = dispute_party_mirror(order);

    Ok(Json(json!({
        "status": "ok",
        "review": {
            "id": row.id.to_string(),
            "order_id": order_id.to_string(),
            "tourist_id": tourist_id,
            "traveler_id": traveler_id,
            "score": body.score,
            "weight": row.weight,
            "weight_breakdown": json_weight_breakdown(&weight_breakdown)
        }
    })))
}
