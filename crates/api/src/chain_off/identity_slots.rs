//! **`GET /api/v1/me` · `identity_slots[]`** — 一账号多身份槽（① 本地 · PD-001～009）。
//! **guide / merchant / region_steward**：由 **`guides` 行** + **申请单** + **`users.role`** 独立派生，**不**互斥隐藏其它已开通槽。

use serde_json::{json, Value as JsonValue};

use super::provider_application::ProviderApplicationRow;
use super::steward_application::StewardApplicationRow;
use super::{GuideRow, UserRow};

fn normalize_status(raw: &str) -> String {
    raw.trim().to_ascii_lowercase()
}

/// 申请单 / legacy 状态 → 槽位四字状态机（PD-007 对齐）。
pub fn application_status_to_slot_state(status: &str) -> &'static str {
    match normalize_status(status).as_str() {
        "approved" | "active" => "active",
        "pending"
        | "submitted"
        | "reviewing"
        | "under_review"
        | "stake_pending"
        | "payment_pending"
        | "confirm_pending"
        | "draft"
        | "stake_release_pending" => "pending",
        "rejected" | "suspended" | "restricted" | "withdrawn" | "released" | "exiting"
        | "exited" => "restricted",
        _ => "inactive",
    }
}

fn guide_slot_from_row(guide: &GuideRow, role_lc: &str) -> JsonValue {
    let st = normalize_status(&guide.status);
    let stake = guide.stake_amount.trim();
    let stake_json = if stake.is_empty() {
        JsonValue::Null
    } else {
        json!(format!("{stake} USDC"))
    };
    let state = match st.as_str() {
        "pending" => "pending",
        "rejected" | "suspended" | "exiting" | "exited" => "restricted",
        "active" => "active",
        _ if role_lc == "guide" => "active",
        _ => "inactive",
    };
    json!({
        "id": "guide",
        "state": state,
        "stake_display": stake_json
    })
}

fn merchant_slot(
    role_lc: &str,
    provider_app: Option<&ProviderApplicationRow>,
) -> JsonValue {
    let state = if role_lc == "provider" {
        "active"
    } else if let Some(app) = provider_app {
        application_status_to_slot_state(&app.status)
    } else {
        "inactive"
    };
    json!({
        "id": "merchant",
        "state": state,
        "stake_display": JsonValue::Null
    })
}

fn steward_slot(
    role_lc: &str,
    steward_app: Option<&StewardApplicationRow>,
) -> JsonValue {
    let state = if role_lc == "region_steward" {
        "active"
    } else if let Some(app) = steward_app {
        application_status_to_slot_state(&app.status)
    } else {
        "inactive"
    };
    json!({
        "id": "region_steward",
        "state": state,
        "stake_display": JsonValue::Null
    })
}

fn acquisition_slot(acquisition_state: Option<&str>, stake_display: Option<String>) -> JsonValue {
    let state = acquisition_state
        .map(normalize_status)
        .filter(|s| s == "active" || s == "pending" || s == "restricted" || s == "inactive")
        .unwrap_or_else(|| "inactive".to_string());
    json!({
        "id": "acquisition",
        "state": state,
        "stake_display": stake_display.map(JsonValue::String).unwrap_or(JsonValue::Null)
    })
}

/// 构建五槽 JSON 数组（内存 / PG 收购快照均可注入）。
pub fn build_identity_slots(
    user: &UserRow,
    guide: Option<&GuideRow>,
    provider_app: Option<&ProviderApplicationRow>,
    steward_app: Option<&StewardApplicationRow>,
    acquisition_state: Option<&str>,
    acquisition_stake_display: Option<String>,
) -> JsonValue {
    let role_lc = user.role.to_ascii_lowercase();

    let traveler_slot = json!({
        "id": "traveler",
        "state": "active",
        "stake_display": JsonValue::Null
    });

    let guide_slot = match guide {
        Some(g) => guide_slot_from_row(g, &role_lc),
        None if role_lc == "guide" => json!({
            "id": "guide",
            "state": "active",
            "stake_display": JsonValue::Null
        }),
        None => json!({
            "id": "guide",
            "state": "inactive",
            "stake_display": JsonValue::Null
        }),
    };

    json!([
        traveler_slot,
        guide_slot,
        acquisition_slot(acquisition_state, acquisition_stake_display),
        merchant_slot(&role_lc, provider_app),
        steward_slot(&role_lc, steward_app),
    ])
}

/// 有 PG **`acquisition_trust_snapshot`** 合并进 `trust` 后，回写收购槽（修复 memory 硬编码 inactive）。
pub fn patch_acquisition_slot_from_trust(slots: &mut JsonValue, trust: &JsonValue) {
    let Some(arr) = slots.as_array_mut() else {
        return;
    };
    let suspended = trust
        .get("acquisition_publish_suspended")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let eligible = trust
        .get("acquisition_publish_eligible")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let bond_display = trust
        .get("acquisition_publish_bond_display")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let state = if suspended {
        "restricted"
    } else if eligible {
        "active"
    } else if trust.get("acquisition_trust_score").is_some()
        || trust.get("acquisition_publish_bond_active").is_some()
    {
        "inactive"
    } else {
        return;
    };
    for slot in arr.iter_mut() {
        if slot.get("id") == Some(&JsonValue::String("acquisition".into())) {
            if let Some(obj) = slot.as_object_mut() {
                obj.insert("state".into(), json!(state));
                obj.insert(
                    "stake_display".into(),
                    bond_display.map(JsonValue::String).unwrap_or(JsonValue::Null),
                );
            }
            break;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    fn demo_user(role: &str) -> UserRow {
        UserRow {
            id: Uuid::new_v4(),
            email: "multi-demo@test.com".into(),
            password_hash: None,
            role: role.into(),
            kyc_status: "none".into(),
            nickname: Some("Multi Demo".into()),
            avatar_url: None,
            default_wallet_address: Some("0x104FCb93B5e097F92c93Ee4621C487C6C953D212".into()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    fn demo_guide(user_id: Uuid) -> GuideRow {
        GuideRow {
            id: Uuid::new_v4(),
            user_id,
            city: "杭州".into(),
            country_code: "CN".into(),
            languages: vec!["zh".into()],
            service_types: vec!["walking".into()],
            bio: Some("demo".into()),
            wallet_address: None,
            real_name: None,
            passport_number_hash: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
            stake_amount: "100".into(),
            hourly_rate: None,
            avatar_url: None,
            public_title: None,
            status: "active".into(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            data_origin: "production".into(),
            ..Default::default()
            }
    }

    #[test]
    fn traveler_active_for_guide_role_multi_slot() {
        let user = demo_user("guide");
        let guide = demo_guide(user.id);
        let provider = ProviderApplicationRow {
            id: Uuid::new_v4(),
            user_id: user.id,
            status: "approved".into(),
            payload: json!({}),
            submitted_at: Utc::now(),
            updated_at: Utc::now(),
            rejection_codes: vec![],
            rejection_message: None,
        };
        let slots = build_identity_slots(&user, Some(&guide), Some(&provider), None, Some("inactive"), None);
        let arr = slots.as_array().expect("array");
        assert_eq!(arr[0]["state"], "active");
        assert_eq!(arr[1]["state"], "active");
        assert_eq!(arr[3]["state"], "active");
    }

    #[test]
    fn merchant_from_approved_app_without_provider_role() {
        let user = demo_user("guide");
        let provider = ProviderApplicationRow {
            id: Uuid::new_v4(),
            user_id: user.id,
            status: "reviewing".into(),
            payload: json!({}),
            submitted_at: Utc::now(),
            updated_at: Utc::now(),
            rejection_codes: vec![],
            rejection_message: None,
        };
        let slots = build_identity_slots(&user, None, Some(&provider), None, None, None);
        let arr = slots.as_array().unwrap();
        assert_eq!(arr[3]["state"], "pending");
    }
}
