//! `GET /api/v1/me/steward-application` · `POST /api/v1/steward/applications` — 区域主理人申请（① 本地 · Protocol Convergence P2）

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use super::ChainOffState;
use crate::db;
use crate::routes::governance_doc_reference::{protocol_ssot_json, steward_stake_quote_for_jurisdictions};

pub const STEWARD_APP_STATES: &[&str] = &[
    "draft",
    "stake_pending",
    "under_review",
    "approved",
    "rejected",
    "withdrawn",
    "stake_release_pending",
    "released",
];

#[derive(Clone, Debug)]
pub struct StewardApplicationRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub status: String,
    pub jurisdictions: Vec<String>,
    pub wallet_address: String,
    pub payload: Value,
    pub submitted_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
    pub rejection_codes: Vec<String>,
    pub rejection_message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PostStewardApplicationBody {
    pub jurisdictions: Vec<String>,
    pub legal_name: String,
    pub contact_email: String,
    pub wallet_address: String,
    #[serde(default)]
    pub motivation: Option<String>,
    #[serde(default)]
    pub country_code: Option<String>,
}

fn normalize_wallet(w: &str) -> Option<String> {
    let w = w.trim();
    if w.len() <= 42 && w.starts_with("0x") && w[2..].chars().all(|c| c.is_ascii_hexdigit()) {
        Some(w.to_string())
    } else {
        None
    }
}

async fn assert_wallet_verified_for_address(
    state: ChainOffState,
    user_id: Uuid,
    expected_wallet: &str,
) -> Result<(), (StatusCode, Json<Value>)> {
    let expected = expected_wallet.trim().to_ascii_lowercase();
    if !expected.starts_with("0x") || expected.len() > 42 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_wallet_address", "message": "invalid_wallet_address"})),
        ));
    }
    let ttl = std::env::var("WALLET_VERIFICATION_TTL_SECONDS")
        .ok()
        .and_then(|s| s.parse().ok())
        .filter(|&n| n > 0)
        .unwrap_or(86_400);
    let checked_at = Utc::now();
    if let Some(ref pool) = state.db_pool {
        if let Ok(Some(row)) = db::get_latest_verified_wallet_for_user(pool, user_id).await {
            let age = (checked_at - row.verified_at).num_seconds().max(0);
            if age <= ttl && row.wallet_address.to_ascii_lowercase() == expected {
                return Ok(());
            }
        }
    }
    Err((
        StatusCode::FORBIDDEN,
        Json(json!({
            "error": "wallet_verify_required",
            "message": "wallet_verify_required"
        })),
    ))
}

fn steward_application_json(user_role: &str, app: Option<StewardApplicationRow>) -> Value {
    if user_role == "region_steward" {
        return json!({
            "status": "ok",
            "application": {
                "status": "approved",
                "lifecycle_state": "approved",
                "user_role": "region_steward"
            },
            "meta": { "implementation_status": "steward_application_role_active" }
        });
    };    let Some(a) = app else {
        return json!({
            "status": "ok",
            "application": null,
            "meta": { "implementation_status": "steward_application_none" }
        });
    };    let quote = steward_stake_quote_for_jurisdictions(&a.jurisdictions).ok();
    json!({
        "status": "ok",
        "application": {
            "id": a.id.to_string(),
            "status": a.status,
            "lifecycle_state": a.status,
            "machine_code": "steward_application",
            "jurisdictions": a.jurisdictions,
            "wallet_address": a.wallet_address,
            "payload": a.payload,
            "submitted_at": a.submitted_at.to_rfc3339(),
            "updated_at": a.updated_at.to_rfc3339(),
            "rejection_codes": a.rejection_codes,
            "rejection_message": a.rejection_message,
            "stake_quote": quote
        },
        "meta": { "implementation_status": "steward_application_read" }
    })
}

pub async fn get_steward_application_me_impl(
    co: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = co.store.read().await;
    let role = store
        .users
        .get(&user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    let app = store.steward_applications_by_user.get(&user_id).cloned();
    Ok(Json(steward_application_json(&role, app)))
}

pub async fn post_steward_application_impl(
    co: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PostStewardApplicationBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    if body.jurisdictions.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "jurisdictions_required",
                "message": "jurisdictions_required"
            })),
        ));
    };    let mut jurisdictions: Vec<String> = body
        .jurisdictions
        .iter()
        .map(|j| j.trim().to_uppercase())
        .filter(|j| !j.is_empty())
        .collect();
    jurisdictions.sort();
    jurisdictions.dedup();
    if steward_stake_quote_for_jurisdictions(&jurisdictions).is_err() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_jurisdiction",
                "message": "invalid_jurisdiction"
            })),
        ));
    };    let Some(wallet) = normalize_wallet(&body.wallet_address) else {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_wallet_address",
                "message": "invalid_wallet_address"
            })),
        ));
    };    if body.legal_name.trim().is_empty() || body.contact_email.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "validation_failed",
                "message": "validation_failed"
            })),
        ));
    }

    assert_wallet_verified_for_address(co.clone(), user_id, &wallet).await?;

    let store_read = co.store.read().await;
    let role = store_read
        .users
        .get(&user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    if role == "region_steward" {
        return Err((
            StatusCode::CONFLICT,
            Json(json!({
                "error": "steward_role_already_active",
                "message": "steward_role_already_active"
            })),
        ));
    };    let existing = store_read.steward_applications_by_user.get(&user_id).cloned();
    drop(store_read);

    if let Some(ref ex) = existing {
        if matches!(ex.status.as_str(), "under_review" | "approved" | "stake_pending") {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "steward_application_in_progress",
                    "message": "steward_application_in_progress"
                })),
            ));
        }
    };    let now = Utc::now();
    let app_id = existing.as_ref().map(|a| a.id).unwrap_or_else(Uuid::new_v4);
    let payload = json!({
        "legal_name": body.legal_name.trim(),
        "contact_email": body.contact_email.trim(),
        "motivation": body.motivation.as_deref().unwrap_or("").trim(),
        "country_code": body.country_code.as_deref().unwrap_or("").trim(),
    });
    let row = StewardApplicationRow {
        id: app_id,
        user_id,
        status: "stake_pending".to_string(),
        jurisdictions: jurisdictions.clone(),
        wallet_address: wallet,
        payload: payload.clone(),
        submitted_at: existing.as_ref().map(|a| a.submitted_at).unwrap_or(now),
        updated_at: now,
        rejection_codes: vec![],
        rejection_message: None,
    };

    {
        let mut store = co.store.write().await;
        store.steward_applications_by_user.insert(user_id, row.clone());
    };
    if let Some(pool) = co.db_pool.as_ref() {
        let meta = json!({
            "phase": "P2",
            "source": "steward_applications",
            "payload": payload,
            "jurisdictions": jurisdictions,
            "wallet_address": row.wallet_address,
        });
        db::dual_write_after_steward_application_submit(
            pool,
            user_id,
            app_id,
            &meta,
            now,
        )
        .await;
    }

    Ok(Json(steward_application_json(&role, Some(row))))
}

pub async fn get_steward_application_for_user_impl(
    co: ChainOffState,
    target_user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = co.store.read().await;
    if store.users.get(&target_user_id).is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "user_not_found", "message": "user_not_found"})),
        ));
    };    let user_role = store
        .users
        .get(&target_user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    let app = store.steward_applications_by_user.get(&target_user_id).cloned();
    Ok(Json(steward_application_json(&user_role, app)))
}

/// Admin 列表：内存真源 **`steward_applications_by_user`**（可选 **`status`** 过滤）。
pub async fn list_steward_applications_admin_impl(
    co: ChainOffState,
    status_filter: Option<String>,
) -> Json<Value> {
    let store = co.store.read().await;
    let filter = status_filter
        .as_deref()
        .map(|s| s.trim().to_ascii_lowercase())
        .filter(|s| !s.is_empty());
    let mut items: Vec<Value> = store
        .steward_applications_by_user
        .iter()
        .filter(|(_, app)| {
            filter.as_ref().map_or(true, |f| app.status.to_ascii_lowercase() == *f)
        })
        .map(|(user_id, app)| {
            let email = store.users.get(user_id).map(|u| u.email.clone());
            let role = store
                .users
                .get(user_id)
                .map(|u| u.role.clone())
                .unwrap_or_else(|| "traveler".to_string());
            json!({
                "user_id": user_id,
                "email": email,
                "user_role": role,
                "application": {
                    "id": app.id,
                    "status": app.status,
                    "lifecycle_state": app.status,
                    "jurisdictions": app.jurisdictions,
                    "legal_name": app.payload.get("legal_name"),
                    "wallet_address": app.wallet_address,
                    "submitted_at": app.submitted_at.to_rfc3339(),
                    "rejection_codes": app.rejection_codes,
                }
            })
        })
        .collect();
    items.sort_by(|a, b| {
        let ta = a["application"]["submitted_at"].as_str().unwrap_or("");
        let tb = b["application"]["submitted_at"].as_str().unwrap_or("");
        tb.cmp(ta)
    });
    Json(json!({
        "status": "ok",
        "items": items,
        "meta": { "implementation_status": "steward_applications_admin_list" }
    }))
}

#[derive(Debug, Deserialize)]
pub struct PatchStewardApplicationReviewBody {
    pub status: String,
    #[serde(default)]
    pub rejection_codes: Vec<String>,
    #[serde(default)]
    pub rejection_message: Option<String>,
}

fn steward_review_status_valid(status: &str) -> bool {
    matches!(
        status,
        "under_review" | "approved" | "rejected" | "stake_release_pending"
    )
}

/// Admin 审核主理人申请（① 内存真源；PG 时双写 `role_applications`）。
pub async fn admin_review_steward_application_impl(
    co: ChainOffState,
    target_user_id: Uuid,
    Json(body): Json<PatchStewardApplicationReviewBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let status = body.status.trim().to_ascii_lowercase();
    if !steward_review_status_valid(&status) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "steward_application_invalid_review_status",
                "message": "steward_application_invalid_review_status"
            })),
        ));
    };    let mut store = co.store.write().await;
    let app = store
        .steward_applications_by_user
        .get(&target_user_id)
        .cloned()
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({
                "error": "steward_application_not_found",
                "message": "steward_application_not_found"
            })),
        ))?;

    let now = Utc::now();
    let codes: Vec<String> = body
        .rejection_codes
        .iter()
        .map(|c| c.trim().to_string())
        .filter(|c| !c.is_empty())
        .collect();
    let rejection_message = body
        .rejection_message
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    let next_status = if status == "rejected" {
        "rejected".to_string()
    } else {
        status.clone()
    };

    let updated = StewardApplicationRow {
        status: next_status.clone(),
        updated_at: now,
        rejection_codes: if next_status == "rejected" {
            codes.clone()
        } else {
            vec![]
        },
        rejection_message: if next_status == "rejected" {
            rejection_message.clone()
        } else {
            None
        },
        ..app
    };
    store
        .steward_applications_by_user
        .insert(target_user_id, updated.clone());

    if next_status == "approved" {
        if let Some(u) = store.users.get_mut(&target_user_id) {
            u.role = "region_steward".to_string();
            u.updated_at = now;
        }
    };    let app_id = updated.id;
    drop(store);

    if let Some(ref pool) = co.db_pool {
        db::dual_write_after_steward_application_review(
            pool,
            target_user_id,
            app_id,
            &next_status,
            &codes,
            rejection_message.as_deref(),
            now,
        )
        .await;
        if next_status == "approved" {
            let _ = db::update_user_role_if_safe(pool, target_user_id, "region_steward").await;
        }
    }

    Ok(Json(json!({
        "status": "ok",
        "user_id": target_user_id,
        "application_status": next_status,
        "lifecycle_state": next_status,
        "user_role_updated": next_status == "approved",
        "meta": { "implementation_status": "steward_application_admin_review" }
    })))
}

pub fn redemption_quote_json(jurisdiction_id: &str) -> Result<Value, &'static str> {
    let id = jurisdiction_id.trim().to_uppercase();
    let ssot = protocol_ssot_json();
    let row = ssot["jurisdictions"]
        .as_array()
        .and_then(|rows| rows.iter().find(|r| r["id"].as_str() == Some(id.as_str())));
    let Some(row) = row else {
        return Err("invalid_jurisdiction");
    };    let lock = ssot["lock_tiers"].clone();
    Ok(json!({
        "status": "ok",
        "jurisdiction_id": id,
        "machine_code": "country_pool_redemption",
        "subscription_lock_months": row["subscription_lock_months"].as_u64()
            .or_else(|| lock["country_pool_subscription_lock_months"].as_u64()),
        "redemption_window_days_per_quarter": lock["redemption_window_days_per_quarter"],
        "redemption_max_nav_pct_bps": lock["redemption_max_nav_pct_bps"],
        "nav_redemption_non_principal": true,
        "note": "Target NAV pro-rata redemption; not principal guarantee (fund-flow-ssot §4).",
        "meta": { "implementation_status": "redemption_quote_doc_ssot" }
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cn_fr_cumulative_stake_quote_850_bps() {
        let q = steward_stake_quote_for_jurisdictions(&["CN".into(), "FR".into()]).unwrap();
        assert_eq!(q["cumulative_steward_stake_bps"], 850);
        assert_eq!(q["cumulative_ttg_units_required"], 850_000);
    }

    #[test]
    fn redemption_quote_cn_has_lock_tiers() {
        let q = redemption_quote_json("CN").unwrap();
        assert_eq!(q["subscription_lock_months"], 24);
        assert_eq!(q["redemption_max_nav_pct_bps"], 1000);
    }

    #[test]
    fn steward_review_status_validates_state_machine_subset() {
        assert!(steward_review_status_valid("under_review"));
        assert!(steward_review_status_valid("approved"));
        assert!(!steward_review_status_valid("reviewing"));
    }

    #[tokio::test]
    async fn steward_application_requires_wallet_verify() {
        use std::sync::Arc;
        use tokio::sync::RwLock;

        use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};

        let uid = Uuid::new_v4();
        let now = Utc::now();
        let mut store = ChainOffStore::default();
        store.users.insert(
            uid,
            UserRow {
                id: uid,
                email: "steward-no-verify@test.com".to_string(),
                password_hash: None,
                role: "traveler".to_string(),
                kyc_status: "none".to_string(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: now,
                updated_at: now,
            },
        );
        let co = ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        };

        let err = post_steward_application_impl(
            co,
            uid,
            Json(PostStewardApplicationBody {
                jurisdictions: vec!["CN".to_string()],
                legal_name: "No Verify".to_string(),
                contact_email: "steward-no-verify@test.com".to_string(),
                wallet_address: "0x4a62316623ad457F02cDC5D997deD67a383EC569".to_string(),
                motivation: None,
                country_code: None,
            }),
        )
        .await
        .expect_err("must reject unverified wallet");

        assert_eq!(err.0, StatusCode::FORBIDDEN);
        assert_eq!(
            err.1 .0.get("error").and_then(|v| v.as_str()),
            Some("wallet_verify_required")
        );
    }

    #[tokio::test]
    async fn admin_steward_approve_sets_region_steward_role() {
        use std::sync::Arc;
        use tokio::sync::RwLock;

        use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};

        let uid = Uuid::new_v4();
        let now = Utc::now();
        let wallet = "0x4a62316623ad457F02cDC5D997deD67a383EC569".to_string();
        let mut store = ChainOffStore::default();
        store.users.insert(
            uid,
            UserRow {
                id: uid,
                email: "steward-admin-test@test.com".to_string(),
                password_hash: None,
                role: "traveler".to_string(),
                kyc_status: "none".to_string(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: now,
                updated_at: now,
            },
        );
        let app_id = Uuid::new_v4();
        store.steward_applications_by_user.insert(
            uid,
            StewardApplicationRow {
                id: app_id,
                user_id: uid,
                status: "stake_pending".to_string(),
                jurisdictions: vec!["CN".to_string()],
                wallet_address: wallet,
                payload: json!({
                    "legal_name": "Test Steward",
                    "contact_email": "steward-admin-test@test.com"
                }),
                submitted_at: now,
                updated_at: now,
                rejection_codes: vec![],
                rejection_message: None,
            },
        );
        let co = ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        };

        let list = list_steward_applications_admin_impl(co.clone(), Some("stake_pending".into())).await;
        assert_eq!(list["items"].as_array().map(|a| a.len()), Some(1));

        let _ = admin_review_steward_application_impl(
            co.clone(),
            uid,
            Json(PatchStewardApplicationReviewBody {
                status: "approved".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
            }),
        )
        .await
        .expect("approve");

        let store = co.store.read().await;
        assert_eq!(store.users.get(&uid).map(|u| u.role.as_str()), Some("region_steward"));
        assert_eq!(
            store
                .steward_applications_by_user
                .get(&uid)
                .map(|a| a.status.as_str()),
            Some("approved")
        );
    }
}
