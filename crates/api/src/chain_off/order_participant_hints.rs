//! ① Seed/Main-Chain Clarity：非参与方 403 / 错向导接单时的可解释提示（仅测试邮箱或 `SEED_TEST_ACCOUNTS=1`）。

use serde_json::{json, Value};

use super::{order_guide_user_id, ChainOffStore, OrderRow};

pub(crate) fn is_test_participant_email(email: &str) -> bool {
    let e = email.trim().to_ascii_lowercase();
    e.ends_with("@test.com") || e.ends_with("@trustgate-e2e.local")
}

fn infer_debug_chain_label(guide_email: Option<&str>) -> &'static str {
    match guide_email.map(|s| s.trim().to_ascii_lowercase()) {
        Some(ref e) if e == "guide@test.com" => "tourist_guide_seed",
        Some(e) if e.ends_with("@trustgate-e2e.local") => "public_catalog_main",
        _ => "unknown",
    }
}

fn seed_hints_enabled() -> bool {
    std::env::var("SEED_TEST_ACCOUNTS").as_deref() == Ok("1")
}

/// 非参与方 403 / 错向导接单时附带的可解释字段（避免本地手测混链）。
pub(crate) fn order_participant_hint_fields(
    store: &ChainOffStore,
    order: &OrderRow,
) -> Option<Value> {
    let tourist_email = store
        .users
        .get(&order.tourist_id)
        .map(|u| u.email.clone());
    let guide_email = order_guide_user_id(store, order)
        .and_then(|uid| store.users.get(&uid))
        .map(|u| u.email.clone());

    if !seed_hints_enabled() {
        let emails: Vec<&str> = [tourist_email.as_deref(), guide_email.as_deref()]
            .into_iter()
            .flatten()
            .collect();
        if emails.is_empty() || !emails.iter().all(|e| is_test_participant_email(e)) {
            return None;
        }
    }

    let chain = infer_debug_chain_label(guide_email.as_deref());
    let mut fields = json!({
        "hint": "order_participant_mismatch",
        "debug_chain": chain,
    });
    if let Some(ref e) = tourist_email {
        fields["tourist_email"] = json!(e);
    }
    if let Some(ref e) = guide_email {
        if !order.guide_id.is_nil() {
            fields["assigned_guide_email"] = json!(e);
        }
    }
    Some(fields)
}

fn merge_hint_fields(mut body: Value, hint: Value) -> Value {
    if let (Some(base), Some(h)) = (body.as_object_mut(), hint.as_object()) {
        for (k, v) in h {
            base.insert(k.clone(), v.clone());
        }
    }
    body
}

pub(crate) fn order_forbidden_json(store: &ChainOffStore, order: &OrderRow) -> Value {
    let mut body = json!({"error": "forbidden", "message": "forbidden"});
    if let Some(hint) = order_participant_hint_fields(store, order) {
        body = merge_hint_fields(body, hint);
    }
    body
}

pub(crate) fn order_not_assigned_guide_json(store: &ChainOffStore, order: &OrderRow) -> Value {
    let mut body = json!({"error": "not_assigned_guide", "message": "not_assigned_guide"});
    if let Some(hint) = order_participant_hint_fields(store, order) {
        body = merge_hint_fields(body, hint);
    }
    body
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    use super::super::{GuideRow, UserRow};

    fn with_seed_test_accounts_env<F: FnOnce()>(f: F) {
        let _env = crate::test_env_serial::lock();
        let saved = std::env::var("SEED_TEST_ACCOUNTS").ok();
        std::env::set_var("SEED_TEST_ACCOUNTS", "1");
        f();
        match saved {
            Some(v) => std::env::set_var("SEED_TEST_ACCOUNTS", v),
            None => std::env::remove_var("SEED_TEST_ACCOUNTS"),
        }
    }

    fn sample_order(tourist_id: Uuid, guide_id: Uuid) -> OrderRow {
        let now = Utc::now();
        OrderRow {
            id: Uuid::new_v4(),
            tourist_id,
            guide_id,
            amount: "100".into(),
            currency: "USD".into(),
            state: traveltrust_core::OrderState::Created,
            escrow_address: None,
            created_at: now,
            updated_at: now,
            accepted_at: None,
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
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
            }
    }

    fn sample_guide_row(guide_row_id: Uuid, guide_user_id: Uuid) -> GuideRow {
        let now = Utc::now();
        GuideRow {
            id: guide_row_id,
            user_id: guide_user_id,
            city: "Hangzhou".into(),
            country_code: "CN".into(),
            languages: vec!["zh".into()],
            service_types: vec!["walking".into()],
            bio: None,
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
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
            ..Default::default()
            }
    }

    #[test]
    fn hint_public_catalog_main_chain() {
        with_seed_test_accounts_env(|| {
        let mut store = ChainOffStore::default();
        let tourist_id = Uuid::new_v4();
        let guide_user_id = Uuid::new_v4();
        let guide_row_id = Uuid::parse_str("f0e0b101-0001-4001-8001-000000000001").unwrap();
        store.users.insert(
            tourist_id,
            UserRow {
                id: tourist_id,
                email: "tourist@test.com".into(),
                password_hash: None,
                role: "tourist".into(),
                kyc_status: "none".into(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        );
        store.users.insert(
            guide_user_id,
            UserRow {
                id: guide_user_id,
                email: "tg_guide_main@trustgate-e2e.local".into(),
                password_hash: None,
                role: "guide".into(),
                kyc_status: "none".into(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        );
        store.guides.insert(
            guide_row_id,
            sample_guide_row(guide_row_id, guide_user_id),
        );
        let order = sample_order(tourist_id, guide_row_id);
        let body = order_forbidden_json(&store, &order);
        assert_eq!(body["error"], "forbidden");
        assert_eq!(body["assigned_guide_email"], "tg_guide_main@trustgate-e2e.local");
        assert_eq!(body["debug_chain"], "public_catalog_main");
        assert_eq!(body["tourist_email"], "tourist@test.com");
        });
    }

    #[test]
    fn hint_tourist_guide_seed_chain() {
        with_seed_test_accounts_env(|| {
        let mut store = ChainOffStore::default();
        let tourist_id = Uuid::new_v4();
        let guide_user_id = Uuid::new_v4();
        let guide_row_id = Uuid::new_v4();
        store.users.insert(
            tourist_id,
            UserRow {
                id: tourist_id,
                email: "tourist@test.com".into(),
                password_hash: None,
                role: "tourist".into(),
                kyc_status: "none".into(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        );
        store.users.insert(
            guide_user_id,
            UserRow {
                id: guide_user_id,
                email: "guide@test.com".into(),
                password_hash: None,
                role: "guide".into(),
                kyc_status: "none".into(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        );
        store.guides.insert(
            guide_row_id,
            sample_guide_row(guide_row_id, guide_user_id),
        );
        let order = sample_order(tourist_id, guide_row_id);
        let body = order_not_assigned_guide_json(&store, &order);
        assert_eq!(body["error"], "not_assigned_guide");
        assert_eq!(body["assigned_guide_email"], "guide@test.com");
        assert_eq!(body["debug_chain"], "tourist_guide_seed");
        });
    }
}
