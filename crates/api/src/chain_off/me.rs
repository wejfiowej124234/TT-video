//! chain_off 个人中心：get_me、put_me（48 §5.3）

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde_json::{json, Map, Value as JsonValue};
use uuid::Uuid;

use super::{ChainOffState, ChainOffStore, PutMeBody, ReviewRow};
use crate::db;
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

/// 个人中心「五类身份」矩阵：旅行者 / 向导 / 旅行收购 / 商家 / 区域主理人；质押字段随角色逐步接入链上。
fn identity_slots_json(user: &super::UserRow, guide: Option<&super::GuideRow>) -> serde_json::Value {
    use super::users_role_is_traveler_side;
    let role_lc = user.role.to_ascii_lowercase();
    let traveler_active = users_role_is_traveler_side(&role_lc);

    let guide_slot = match guide {
        None => {
            if role_lc == "guide" {
                json!({
                    "id": "guide",
                    "state": "active",
                    "stake_display": JsonValue::Null
                })
            } else {
                json!({
                    "id": "guide",
                    "state": "inactive",
                    "stake_display": JsonValue::Null
                })
            }
        }
        Some(g) => {
            let st = g.status.to_ascii_lowercase();
            let stake = g.stake_amount.trim();
            let stake_json = if stake.is_empty() {
                JsonValue::Null
            } else {
                json!(format!("{stake} USDT"))
            };
            let state = match st.as_str() {
                "pending" => "pending",
                "rejected" | "suspended" => "restricted",
                "active" => "active",
                _ => {
                    if role_lc == "guide" {
                        "active"
                    } else {
                        "inactive"
                    }
                }
            };
            json!({
                "id": "guide",
                "state": state,
                "stake_display": stake_json
            })
        }
    };

    let traveler_slot = json!({
        "id": "traveler",
        "state": if traveler_active { "active" } else { "inactive" },
        "stake_display": JsonValue::Null
    });
    let acquisition_slot = json!({
        "id": "acquisition",
        "state": "inactive",
        "stake_display": JsonValue::Null
    });
    let merchant_active = role_lc == "provider";
    let merchant_slot = json!({
        "id": "merchant",
        "state": if merchant_active { "active" } else { "inactive" },
        "stake_display": JsonValue::Null
    });
    let steward_active = role_lc == "region_steward";
    let steward_slot = json!({
        "id": "region_steward",
        "state": if steward_active { "active" } else { "inactive" },
        "stake_display": JsonValue::Null
    });

    json!([
        traveler_slot,
        guide_slot,
        acquisition_slot,
        merchant_slot,
        steward_slot
    ])
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

/// PD-009：`GET /me.trust` 扩展 — 有 **`db_pool`** 时从 PG **`acquisition_trust_snapshot`** 投影（与前端 **`meTrust.ts`** 同源字段）。
async fn merge_acquisition_trust_from_pg(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    user: &super::UserRow,
    guide: Option<&super::GuideRow>,
    open_disputes: usize,
    trust: &mut JsonValue,
) {
    let identity_status = identity_status_for_trust(user, guide);
    let (risk_level, _) = risk_level_for_trust(open_disputes);
    let db_user = match db::get_user_by_id(pool, user_id).await {
        Ok(Some(u)) => u,
        Ok(None) => db::UserRow {
            id: user.id,
            email: user.email.clone(),
            password_hash: None,
            role: user.role.clone(),
            kyc_status: user.kyc_status.clone(),
            nickname: user.nickname.clone(),
            avatar_url: user.avatar_url.clone(),
            default_wallet_address: user.default_wallet_address.clone(),
            created_at: user.created_at,
            updated_at: user.updated_at,
        },
        Err(e) => {
            eprintln!("WARN: get_user_by_id for acquisition trust snapshot: {e}");
            return;
        }
    };
    let snap = match db::acquisition_trust_snapshot(
        pool,
        user_id,
        &db_user,
        identity_status,
        risk_level,
    )
    .await
    {
        Ok(s) => s,
        Err(e) => {
            eprintln!("WARN: acquisition_trust_snapshot for GET /me: {e}");
            return;
        }
    };
    let JsonValue::Object(m) = trust else {
        return;
    };
    m.insert(
        "acquisition_trust_score".to_string(),
        json!(snap.trust_score),
    );
    m.insert(
        "acquisition_publish_eligible".to_string(),
        json!(snap.publish_eligible),
    );
    m.insert(
        "acquisition_publish_bond_waived".to_string(),
        json!(snap.bond_waived_by_trust),
    );
    m.insert(
        "acquisition_publish_bond_active".to_string(),
        json!(snap.has_publish_bond),
    );
    if let Some(d) = snap.bond_display {
        m.insert("acquisition_publish_bond_display".to_string(), json!(d));
    }
    m.insert(
        "acquisition_listings_published_24h".to_string(),
        json!(snap.listings_published_24h),
    );
    m.insert(
        "acquisition_publish_suspended".to_string(),
        json!(snap.publish_suspended),
    );
    m.insert(
        "acquisition_fulfillment_bond_active".to_string(),
        json!(snap.has_fulfillment_bond),
    );
    if let Some(d) = snap.fulfillment_bond_display {
        m.insert("acquisition_fulfillment_bond_display".to_string(), json!(d));
    }
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
            "wallet_address": g.wallet_address,
            "stake_amount": g.stake_amount,
            "status": g.status
        })
    });
    let identity_slots = identity_slots_json(user, guide_ref);
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
    if let Some(ref pool) = state.db_pool {
        merge_acquisition_trust_from_pg(pool, user_id, user, guide_ref, open_d, &mut trust).await;
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
            "email_verified_at": store
                .user_email_verified_at
                .get(&user_id)
                .map(|t| t.to_rfc3339()),
            "settings_preferences": store.user_settings_preferences.get(&user_id).cloned(),
            "created_at": user.created_at.to_rfc3339()
        },
        "guide": guide_json,
        "trust": trust,
        "stats": stats,
        "identity_slots": identity_slots
    })))
}

pub async fn put_me_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PutMeBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let nickname_patch = body.nickname.clone();
    let avatar_patch = body.avatar_url.clone();
    let wallet_patch = body.default_wallet_address.clone();
    let mut store = state.store.write().await;
    {
        let user = store.users.get_mut(&user_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ))?;
        if let Some(ref n) = nickname_patch {
            user.nickname = Some(n.clone());
        }
        if let Some(ref a) = avatar_patch {
            user.avatar_url = Some(a.clone());
        }
        if let Some(ref w) = wallet_patch {
            user.default_wallet_address = Some(w.clone());
        }
        user.updated_at = chrono::Utc::now();
    }
    let updated_at = store
        .users
        .get(&user_id)
        .map(|u| u.updated_at)
        .unwrap_or_else(chrono::Utc::now);
    if let Some(ref pool) = state.db_pool {
        if let Some(ref nickname) = nickname_patch {
            if let Err(e) = crate::db::update_user_nickname(pool, user_id, nickname).await {
                eprintln!(
                    "[put_me] update_user_nickname user_id={user_id} error={e}"
                );
            }
        }
        if let Some(ref avatar) = avatar_patch {
            if let Err(e) = crate::db::update_user_avatar_url(pool, user_id, avatar).await {
                eprintln!("[put_me] update_user_avatar_url user_id={user_id} error={e}");
            }
        }
        if let Some(ref wallet) = wallet_patch {
            if let Err(e) =
                crate::db::update_user_default_wallet_address(pool, user_id, wallet).await
            {
                eprintln!(
                    "[put_me] update_user_default_wallet_address user_id={user_id} error={e}"
                );
            }
            if let Err(e) = crate::db::sync_primary_wallet_dual_write(
                pool,
                user_id,
                wallet,
                updated_at,
            )
            .await
            {
                eprintln!(
                    "[put_me] sync_primary_wallet_dual_write user_id={user_id} error={e}"
                );
            }
        }
    }
    if let Some(prefs) = body.settings_preferences {
        store.user_settings_preferences.insert(user_id, prefs);
    }
    let user = store.users.get(&user_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("user_not_found")),
    ))?;
    let settings_preferences = store.user_settings_preferences.get(&user_id).cloned();
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
            "email_verified_at": store
                .user_email_verified_at
                .get(&user_id)
                .map(|t| t.to_rfc3339()),
            "settings_preferences": settings_preferences,
            "updated_at": user.updated_at.to_rfc3339()
        }
    })))
}

/// **`GET /api/v1/me/wallets`**（**PD-004** · 有 PG 读表；无 PG 时由内存主钱包合成）。
pub async fn get_me_wallets_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    if let Some(ref pool) = state.db_pool {
        let wallets = crate::db::list_wallets_for_user(pool, user_id)
            .await
            .map_err(|e| {
                eprintln!("[get_me_wallets] list_wallets_for_user error={e}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("internal_error")),
                )
            })?;
        return Ok(Json(json!({ "status": "ok", "wallets": wallets })));
    }
    let store = state.store.read().await;
    let user = store.users.get(&user_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("user_not_found")),
    ))?;
    let wallets = user
        .default_wallet_address
        .as_ref()
        .filter(|a| !a.trim().is_empty())
        .map(|addr| {
            vec![json!({
                "id": format!("memory-primary-{user_id}"),
                "address": addr,
                "label": null,
                "is_primary": true,
                "verified_at": null,
                "created_at": user.updated_at.to_rfc3339(),
                "updated_at": user.updated_at.to_rfc3339()
            })]
        })
        .unwrap_or_default();
    Ok(Json(json!({ "status": "ok", "wallets": wallets })))
}

/// **`GET /api/v1/me/role-applications`**（**PD-007** · 有 PG 读 **`role_applications`**）。
pub async fn get_me_role_applications_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    if let Some(ref pool) = state.db_pool {
        let applications = crate::db::list_role_applications_for_user(pool, user_id)
            .await
            .map_err(|e| {
                eprintln!("[get_me_role_applications] list error={e}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("internal_error")),
                )
            })?;
        return Ok(Json(json!({ "status": "ok", "applications": applications })));
    }
    Ok(Json(json!({ "status": "ok", "applications": [] })))
}
