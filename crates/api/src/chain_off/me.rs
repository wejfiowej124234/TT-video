//! chain_off 个人中心：get_me、put_me（48 §5.3）

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde_json::{json, Map, Value as JsonValue};
use uuid::Uuid;

use super::{ChainOffState, ChainOffStore, PutMeBody, ReviewRow};
use traveltrust_core::OrderState;

/// 87：对外 API 角色标签，与存量 `users.role` 并存（`tourist` → `traveler`；**697** 起 `traveler` 落库则直通）。
fn role_traveltrust_public(db_role: &str) -> String {
    match db_role {
        "tourist" => "traveler".to_string(),
        other => other.to_string(),
    }
}

fn open_disputes_as_party_count(store: &ChainOffStore, user_id: Uuid) -> usize {
    store
        .disputes
        .values()
        .filter(|d| {
            if d.status != "open" {
                return false;
            }
            let Some(o) = store.orders.get(&d.order_id) else {
                return false;
            };
            if o.tourist_id == user_id {
                return true;
            }
            store
                .guides
                .get(&o.guide_id)
                .map(|g| g.user_id == user_id)
                .unwrap_or(false)
        })
        .count()
}

/// 90 §3.1：账户级身份状态（规则版；非完整 identity_profiles 状态机）
fn identity_status_for_trust(
    user: &super::UserRow,
    guide: Option<&super::GuideRow>,
) -> &'static str {
    let k = user.kyc_status.to_ascii_lowercase();
    if k.contains("suspend") || k.contains("banned") {
        return "restricted";
    }
    if k == "pending" || k == "in_review" {
        return "pending_review";
    }
    if let Some(g) = guide {
        match g.status.as_str() {
            "pending" => return "pending_review",
            "rejected" | "suspended" => return "restricted",
            _ => {}
        }
    }
    "active"
}

/// 90 §3.4：风险标签规则版（open 争议计数 → low/medium/high；与 100 深度引擎联动前占位）
fn risk_level_for_trust(open_as_party: usize) -> (&'static str, String) {
    let basis = format!("open_disputes_as_party:{open_as_party}");
    let level = match open_as_party {
        0..=1 => "low",
        2..=3 => "medium",
        _ => "high",
    };
    (level, basis)
}

/// 90 §3.4：`risk_reason_codes`（规则版；与 `risk_basis` 同源信号，机器键便于 Admin/审计）
fn risk_reason_codes(identity_status: &str, open_as_party: usize) -> Vec<&'static str> {
    let mut v = Vec::new();
    match identity_status {
        "restricted" => v.push("IDENTITY_RESTRICTED"),
        "pending_review" => v.push("IDENTITY_PENDING_VERIFICATION"),
        _ => {}
    }
    match open_as_party {
        0 => {}
        1 => v.push("OPEN_DISPUTES_PRESENT"),
        2..=3 => v.push("OPEN_DISPUTES_ELEVATED"),
        _ => v.push("OPEN_DISPUTES_CRITICAL"),
    }
    v
}

/// 90 §3.4：`recommended_actions`（规则版处置建议；100 引擎接入后可扩展/覆盖）
fn recommended_actions_for_trust(identity_status: &str, risk_level: &str) -> Vec<&'static str> {
    use std::collections::BTreeSet;
    let mut s: BTreeSet<&'static str> = BTreeSet::new();
    match identity_status {
        "restricted" => {
            s.insert("human_review");
            s.insert("limit_trading");
        }
        "pending_review" => {
            s.insert("await_verification");
        }
        _ => {}
    }
    match risk_level {
        "high" => {
            s.insert("human_review");
            s.insert("limit_new_high_value_orders");
        }
        "medium" => {
            s.insert("enhanced_monitoring");
        }
        _ => {}
    }
    s.into_iter().collect()
}

/// 90 §八 / §3.4：向导接单前信任门禁（规则版，与 `GET /me.trust` 同源）。无阻塞返回 `None`。
pub(crate) fn order_accept_trust_gate(
    store: &super::ChainOffStore,
    guide_user_id: Uuid,
    guide: &super::GuideRow,
) -> Option<&'static str> {
    let Some(user) = store.users.get(&guide_user_id) else {
        return None;
    };
    let identity = identity_status_for_trust(user, Some(guide));
    if identity == "restricted" {
        return Some("trust_identity_restricted");
    }
    if identity == "pending_review" {
        return Some("trust_guide_pending_review");
    }
    let open_d = open_disputes_as_party_count(store, guide_user_id);
    let (risk, _) = risk_level_for_trust(open_d);
    if risk == "high" {
        return Some("trust_risk_too_high");
    }
    None
}

/// 90 §四.1 / §3.4：游客 **下单**、**mock 付款** 前信任门禁（与 `GET /me.trust` 同源；若同账号有向导行则一并推导 `identity_status`）。
/// `pending_review` 使用 **`trust_verification_pending`**（与接单侧 **`trust_guide_pending_review`** 区分文案）。
pub(crate) fn tourist_order_trust_gate(
    store: &super::ChainOffStore,
    tourist_user_id: Uuid,
) -> Option<&'static str> {
    let Some(user) = store.users.get(&tourist_user_id) else {
        return None;
    };
    let guide_ref = store
        .guides_by_user
        .get(&tourist_user_id)
        .and_then(|gid| store.guides.get(gid));
    let identity = identity_status_for_trust(user, guide_ref);
    if identity == "restricted" {
        return Some("trust_identity_restricted");
    }
    if identity == "pending_review" {
        return Some("trust_verification_pending");
    }
    let open_d = open_disputes_as_party_count(store, tourist_user_id);
    let (risk, _) = risk_level_for_trust(open_d);
    if risk == "high" {
        return Some("trust_risk_too_high");
    }
    None
}

/// 90 §四：订单**参与方**写操作前信任门禁（游客 → `tourist_order_trust_gate`；向导 → `order_accept_trust_gate`）。
/// 调用方须已校验 `order_is_participant`；非参与方返回 `None`。
pub(crate) fn order_participant_trust_gate(
    store: &super::ChainOffStore,
    user_id: Uuid,
    order: &super::OrderRow,
) -> Option<&'static str> {
    if user_id == order.tourist_id {
        return tourist_order_trust_gate(store, user_id);
    }
    let Some(guide) = store.guides.get(&order.guide_id) else {
        return None;
    };
    if guide.user_id != user_id {
        return None;
    }
    order_accept_trust_gate(store, user_id, guide)
}

/// 90 / 07 §5.0：身份与验证最小摘要（与 `user.kyc_status` 同源；便于前端只读 `trust` 块）
fn me_trust_json(
    user: &super::UserRow,
    guide: Option<&super::GuideRow>,
    open_disputes_as_party: usize,
) -> serde_json::Value {
    let wallet_linked = user
        .default_wallet_address
        .as_ref()
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);
    let identity_status = identity_status_for_trust(user, guide);
    let (risk_level, risk_basis) = risk_level_for_trust(open_disputes_as_party);
    let risk_reason_codes: Vec<_> = risk_reason_codes(identity_status, open_disputes_as_party)
        .into_iter()
        .map(JsonValue::from)
        .collect();
    let recommended_actions: Vec<_> = recommended_actions_for_trust(identity_status, risk_level)
        .into_iter()
        .map(JsonValue::from)
        .collect();

    let mut m = Map::new();
    m.insert("kyc_status".to_string(), json!(user.kyc_status));
    m.insert("wallet_linked".to_string(), json!(wallet_linked));
    m.insert(
        "guide_registration_status".to_string(),
        match guide {
            Some(g) => json!(g.status),
            None => JsonValue::Null,
        },
    );
    m.insert("identity_status".to_string(), json!(identity_status));
    m.insert("risk_level".to_string(), json!(risk_level));
    m.insert("risk_basis".to_string(), json!(risk_basis));
    m.insert(
        "risk_reason_codes".to_string(),
        JsonValue::Array(risk_reason_codes),
    );
    m.insert(
        "recommended_actions".to_string(),
        JsonValue::Array(recommended_actions),
    );
    m.insert("rule".to_string(), json!("90 §6 Partial：identity_status 由 kyc_status + guide.status 推导；risk_level 由未决争议（status=open）且订单参与方为当前用户计数推导；risk_reason_codes/recommended_actions 为同源规则版；非 100 风控引擎终态"));

    if let Some(g) = guide {
        if g.status == "rejected" {
            m.insert(
                "guide_registration_rejection_codes".to_string(),
                json!(g.rejection_codes),
            );
            if let Some(msg) = g
                .rejection_message
                .as_ref()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
            {
                m.insert(
                    "guide_registration_rejection_message".to_string(),
                    json!(msg),
                );
            }
        }
    }

    JsonValue::Object(m)
}

/// 90 §6 Reputation API（Partial）：向导侧加权均分 + 全角色「已提交评价」权重合计（与 POST …/reviews 同源 ReviewWeight）
fn me_reputation_json(
    role: &str,
    guide_reviews: &[&ReviewRow],
    weighted_avg: Option<f64>,
    reviewer_reviews: &[&ReviewRow],
) -> JsonValue {
    let n_rev = reviewer_reviews.len();
    let sum_w_rev: f64 = reviewer_reviews.iter().map(|r| r.weight).sum();
    let as_reviewer = json!({
        "reviews_written_count": n_rev,
        "sum_review_weights": sum_w_rev,
    });
    let formula_reviewer = "sum_review_weights = sum(weight) for reviews you authored; each weight from traveltrust_core::ReviewWeight at submit (order amount × your account age factors)";
    let formula_guide = "weighted_avg_score = sum(score*weight)/sum(weight); each weight from traveltrust_core::ReviewWeight at submit (order amount × reviewer account age factors)";

    if role != "guide" {
        return json!({
            "rule_version": "me_reputation_summary_v2",
            "as_guide": JsonValue::Null,
            "as_reviewer": as_reviewer,
            "note": "weighted guide reputation applies when role=guide",
            "formula": formula_reviewer,
        });
    }
    let n = guide_reviews.len();
    let sum_w: f64 = guide_reviews.iter().map(|r| r.weight).sum();
    json!({
        "rule_version": "me_reputation_summary_v2",
        "as_guide": {
            "reviews_received_count": n,
            "sum_review_weights": sum_w,
            "weighted_avg_score": weighted_avg
        },
        "as_reviewer": as_reviewer,
        "formula": format!("{formula_guide}. {formula_reviewer}"),
    })
}

pub async fn get_me_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let user = store.users.get(&user_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("user_not_found")),
    ))?;
    let my_orders: Vec<_> = store
        .orders
        .values()
        .filter(|o| super::order_is_participant(&store, o, user_id))
        .collect();
    let orders_total = my_orders.len();
    let total_spent: f64 = my_orders
        .iter()
        .filter(|o| o.tourist_id == user_id && o.state.is_final_financial_state())
        .filter_map(|o| o.amount.parse::<f64>().ok())
        .sum();
    let reviews_count = store
        .reviews
        .iter()
        .filter(|r| r.reviewer_id == user_id)
        .count();
    let orders_guided = my_orders
        .iter()
        .filter(|o| super::order_guide_user_id(&store, o) == Some(user_id))
        .count();
    let completed_as_guide = my_orders
        .iter()
        .filter(|o| {
            super::order_guide_user_id(&store, o) == Some(user_id)
                && o.state == OrderState::Completed
        })
        .count();
    let total_earned: f64 = my_orders
        .iter()
        .filter(|o| {
            super::order_guide_user_id(&store, o) == Some(user_id)
                && o.state.is_final_financial_state()
        })
        .filter_map(|o| o.amount.parse::<f64>().ok())
        .sum();
    let guide_row_for_reviews = store.guides_by_user.get(&user_id).copied();
    let guide_reviews: Vec<_> = match guide_row_for_reviews {
        Some(gid) => store
            .reviews
            .iter()
            .filter(|r| r.reviewee_id == gid)
            .collect(),
        None => Vec::new(),
    };
    let reviewer_reviews: Vec<_> = store
        .reviews
        .iter()
        .filter(|r| r.reviewer_id == user_id)
        .collect();
    let avg_score = if guide_reviews.is_empty() {
        None
    } else {
        Some(
            guide_reviews
                .iter()
                .map(|r| r.score as f64 * r.weight)
                .sum::<f64>()
                / guide_reviews
                    .iter()
                    .map(|r| r.weight)
                    .sum::<f64>()
                    .max(1e-9),
        )
    };
    let disputes_resolved = store
        .disputes
        .values()
        .filter(|d| d.arbitrator_id == Some(user_id))
        .count();
    let stats = match user.role.as_str() {
        r if super::users_role_is_traveler_side(r) => json!({
            "orders_total": orders_total,
            "total_spent": total_spent,
            "reviews_count": reviews_count
        }),
        "guide" => {
            let mut base = json!({
                "orders_total": orders_total,
                "orders_guided": orders_guided,
                "completed_count": completed_as_guide,
                "total_earned": total_earned,
                "avg_score": avg_score,
                "reviews_count": reviews_count
            });
            let period = super::guide_period_dashboard_stats(&store, user_id, Utc::now());
            if let (Some(bo), Some(po)) = (base.as_object_mut(), period.as_object()) {
                for (k, v) in po {
                    bo.insert(k.clone(), v.clone());
                }
            }
            base
        }
        "arbitrator" => json!({
            "orders_total": orders_total,
            "disputes_resolved": disputes_resolved
        }),
        _ => json!({ "orders_total": orders_total }),
    };
    let guide_ref = store
        .guides_by_user
        .get(&user_id)
        .and_then(|guide_id| store.guides.get(guide_id));
    let guide_json = guide_ref.map(|g| {
        json!({
            "id": g.id.to_string(),
            "wallet_address": g.wallet_address
        })
    });
    let open_d = open_disputes_as_party_count(&store, user_id);
    let reputation = me_reputation_json(
        user.role.as_str(),
        &guide_reviews,
        avg_score,
        &reviewer_reviews,
    );
    let mut trust = me_trust_json(user, guide_ref, open_d);
    if let JsonValue::Object(ref mut m) = trust {
        m.insert("reputation".to_string(), reputation);
    }
    Ok(Json(json!({
        "status": "ok",
        "user": {
            "id": user.id.to_string(),
            "email": user.email,
            "role": user.role,
            "role_traveltrust": role_traveltrust_public(&user.role),
            "kyc_status": user.kyc_status,
            "nickname": user.nickname,
            "avatar_url": user.avatar_url,
            "default_wallet_address": user.default_wallet_address,
            "created_at": user.created_at.to_rfc3339()
        },
        "guide": guide_json,
        "trust": trust,
        "stats": stats
    })))
}

pub async fn put_me_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PutMeBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    let user = store.users.get_mut(&user_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("user_not_found")),
    ))?;
    if let Some(n) = body.nickname {
        user.nickname = Some(n);
    }
    if let Some(a) = body.avatar_url {
        user.avatar_url = Some(a);
    }
    if let Some(w) = body.default_wallet_address {
        user.default_wallet_address = Some(w);
    }
    user.updated_at = chrono::Utc::now();
    Ok(Json(json!({
        "status": "ok",
        "user": {
            "id": user.id.to_string(),
            "email": user.email,
            "role": user.role,
            "role_traveltrust": role_traveltrust_public(&user.role),
            "nickname": user.nickname,
            "avatar_url": user.avatar_url,
            "default_wallet_address": user.default_wallet_address,
            "updated_at": user.updated_at.to_rfc3339()
        }
    })))
}
