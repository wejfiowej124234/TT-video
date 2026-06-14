//! L3 · Local Multi-Identity Closure — **`identity_slots` 与写 RBAC 对齐**（① 本地）。
//! **不**改 schema；经营写路径以槽位 **active** 为准，**不**再要求 `users.role` 互斥。

use axum::{http::StatusCode, Json};
use serde_json::{json, Value};
use uuid::Uuid;

use super::{
    application_status_to_slot_state, provider_application::ProviderApplicationRow,
    steward_application::StewardApplicationRow, ChainOffStore, GuideRow, UserRow,
};

/// PATCH 四轨 settings 统一 403 键（与 GET `profile_patch_allowed` 对拍）。
pub const ERR_IDENTITY_SLOT_PROFILE_PATCH_FORBIDDEN: &str = "identity_slot_profile_patch_forbidden";

pub fn identity_profile_patch_forbidden() -> (StatusCode, Json<Value>) {
    (
        StatusCode::FORBIDDEN,
        Json(crate::api_json::err_key(ERR_IDENTITY_SLOT_PROFILE_PATCH_FORBIDDEN)),
    )
}

pub fn attach_identity_profile_patch_gate(profile: &mut Value, slot_state: &str, patch_allowed: bool) {
    if let Some(obj) = profile.as_object_mut() {
        obj.insert("slot_state".to_string(), json!(slot_state));
        obj.insert("profile_patch_allowed".to_string(), json!(patch_allowed));
    }
}

pub fn guide_profile_patch_gate(user: &UserRow, guide: &GuideRow) -> (&'static str, bool) {
    let allowed = guide_slot_active(user, Some(guide));
    let slot_state = if allowed {
        "active"
    } else {
        application_status_to_slot_state(&guide.status)
    };
    (slot_state, allowed)
}

pub fn merchant_profile_patch_gate(
    user: &UserRow,
    app: &ProviderApplicationRow,
) -> (&'static str, bool) {
    let allowed = merchant_slot_active(user, Some(app));
    let slot_state = if allowed {
        "active"
    } else {
        application_status_to_slot_state(&app.status)
    };
    (slot_state, allowed)
}

pub fn steward_profile_patch_gate(
    user: &UserRow,
    app: &StewardApplicationRow,
) -> (&'static str, bool) {
    let allowed = steward_slot_active(user, Some(app));
    let slot_state = if allowed {
        "active"
    } else {
        application_status_to_slot_state(&app.status)
    };
    (slot_state, allowed)
}

pub fn acquisition_profile_patch_gate(slot_state: &str) -> (&'static str, bool) {
    let st = match slot_state.trim().to_ascii_lowercase().as_str() {
        "active" => "active",
        "pending" => "pending",
        "restricted" => "restricted",
        _ => "inactive",
    };
    (st, st == "active")
}

fn slot_state_is_active(state: &str) -> bool {
    state == "active"
}

/// 商家槽 **active**：`users.role=provider` **或** provider 申请 **approved**。
pub fn merchant_slot_active(user: &UserRow, app: Option<&ProviderApplicationRow>) -> bool {
    if user.role == "provider" {
        return true;
    }
    app.map(|a| slot_state_is_active(application_status_to_slot_state(&a.status)))
        .unwrap_or(false)
}

/// 主理人槽 **active**。
pub fn steward_slot_active(user: &UserRow, app: Option<&StewardApplicationRow>) -> bool {
    if user.role == "region_steward" {
        return true;
    }
    app.map(|a| slot_state_is_active(application_status_to_slot_state(&a.status)))
        .unwrap_or(false)
}

/// 向导槽 **active**（guides 行 + role 回退）。
pub fn guide_slot_active(user: &UserRow, guide: Option<&GuideRow>) -> bool {
    if let Some(g) = guide {
        let st = application_status_to_slot_state(&g.status);
        if slot_state_is_active(st) {
            return true;
        }
        if st == "restricted" {
            return false;
        }
    }
    user.role == "guide"
}

pub fn merchant_slot_active_in_store(store: &ChainOffStore, user_id: Uuid) -> bool {
    let Some(user) = store.users.get(&user_id) else {
        return false;
    };
    let app = store.provider_applications_by_user.get(&user_id);
    merchant_slot_active(user, app)
}

pub fn steward_slot_active_in_store(store: &ChainOffStore, user_id: Uuid) -> bool {
    let Some(user) = store.users.get(&user_id) else {
        return false;
    };
    let app = store.steward_applications_by_user.get(&user_id);
    steward_slot_active(user, app)
}

pub fn guide_slot_active_in_store(store: &ChainOffStore, user_id: Uuid) -> bool {
    let Some(user) = store.users.get(&user_id) else {
        return false;
    };
    let guide = store
        .guides_by_user
        .get(&user_id)
        .and_then(|gid| store.guides.get(gid));
    guide_slot_active(user, guide)
}

pub fn provider_application_approved_in_store(store: &ChainOffStore, user_id: Uuid) -> bool {
    store
        .provider_applications_by_user
        .get(&user_id)
        .map(|a| slot_state_is_active(application_status_to_slot_state(&a.status)))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use serde_json::json;
    use uuid::Uuid;

    use super::super::GuideRow;

    fn user(role: &str) -> UserRow {
        UserRow {
            id: Uuid::new_v4(),
            email: "multi-demo@test.com".into(),
            password_hash: None,
            role: role.into(),
            kyc_status: "none".into(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[test]
    fn merchant_active_from_approved_app_when_role_guide() {
        let u = user("guide");
        let app = ProviderApplicationRow {
            id: Uuid::new_v4(),
            user_id: u.id,
            status: "approved".into(),
            payload: json!({}),
            submitted_at: Utc::now(),
            updated_at: Utc::now(),
            rejection_codes: vec![],
            rejection_message: None,
        };
        assert!(merchant_slot_active(&u, Some(&app)));
    }

    #[test]
    fn guide_patch_gate_pending_is_read_only() {
        let u = user("traveler");
        let g = GuideRow {
            id: Uuid::new_v4(),
            user_id: u.id,
            status: "pending".into(),
            city: "Hangzhou".into(),
            country_code: "CN".into(),
            languages: vec![],
            service_types: vec![],
            bio: None,
            hourly_rate: None,
            avatar_url: None,
            public_title: None,
            wallet_address: None,
            real_name: None,
            passport_number_hash: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
            stake_amount: "0".into(),
            rejection_codes: vec![],
            rejection_message: None,
            data_origin: "production".into(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let (st, ok) = guide_profile_patch_gate(&u, &g);
        assert_eq!(st, "pending");
        assert!(!ok);
    }

    #[test]
    fn acquisition_patch_gate_only_active() {
        let (st, ok) = acquisition_profile_patch_gate("active");
        assert!(ok);
        assert_eq!(st, "active");
        let (_, ok2) = acquisition_profile_patch_gate("inactive");
        assert!(!ok2);
    }
}
