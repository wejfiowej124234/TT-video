//! 夹具 **users** / **guides** 行（`@trustgate-e2e.local`）。

use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::chain_off::{ChainOffStore, GuideRow, UserRow};

use super::ids::TrustGateFixtureIds;

pub(super) fn apply(
    store: &mut ChainOffStore,
    ids: &TrustGateFixtureIds,
    password_hash: &str,
    now: DateTime<Utc>,
) {
    let users: [(Uuid, &str, &str, &str); 20] = [
        (
            ids.u_pending,
            "tg_tourist_pending@trustgate-e2e.local",
            "tourist",
            "pending",
        ),
        (
            ids.u_restricted,
            "tg_tourist_restricted@trustgate-e2e.local",
            "tourist",
            "suspended",
        ),
        (
            ids.u_risk,
            "tg_tourist_risk@trustgate-e2e.local",
            "tourist",
            "none",
        ),
        (
            ids.u_clean,
            "tg_tourist_clean@trustgate-e2e.local",
            "tourist",
            "none",
        ),
        (
            ids.u_stranger,
            "tg_tourist_stranger@trustgate-e2e.local",
            "tourist",
            "none",
        ),
        (
            ids.u_g_main,
            "tg_guide_main@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_second,
            "tg_guide_second@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_pending,
            "tg_guide_pending@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_arb,
            "tg_arbitrator@trustgate-e2e.local",
            "arbitrator",
            "none",
        ),
        (
            ids.u_g_r0,
            "tg_guide_risk0@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_r1,
            "tg_guide_risk1@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_r2,
            "tg_guide_risk2@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_r3,
            "tg_guide_risk3@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_evid,
            "tg_guide_evid@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_exec,
            "tg_guide_exec@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_inv,
            "tg_guide_invalid@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_done,
            "tg_guide_done@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_accept_trust,
            "tg_guide_accept_trust@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_rate,
            "tg_guide_rate@trustgate-e2e.local",
            "guide",
            "none",
        ),
        (
            ids.u_g_hex,
            "tg_guide_hex@trustgate-e2e.local",
            "guide",
            "none",
        ),
    ];

    for (id, email, role, kyc) in users {
        store.users.insert(
            id,
            UserRow {
                id,
                email: email.to_string(),
                password_hash: Some(password_hash.to_string()),
                role: role.to_string(),
                kyc_status: kyc.to_string(),
                nickname: Some("TG E2E".to_string()),
                avatar_url: None,
                default_wallet_address: None,
                created_at: now,
                updated_at: now,
            },
        );
    };    let guides: [(Uuid, Uuid, &str); 14] = [
        (ids.gr_main, ids.u_g_main, "active"),
        (ids.gr_second, ids.u_g_second, "active"),
        (ids.gr_pending, ids.u_g_pending, "pending"),
        (ids.gr_r0, ids.u_g_r0, "active"),
        (ids.gr_r1, ids.u_g_r1, "active"),
        (ids.gr_r2, ids.u_g_r2, "active"),
        (ids.gr_r3, ids.u_g_r3, "active"),
        (ids.gr_evid, ids.u_g_evid, "active"),
        (ids.gr_exec, ids.u_g_exec, "active"),
        (ids.gr_inv, ids.u_g_inv, "active"),
        (ids.gr_done, ids.u_g_done, "active"),
        (ids.gr_accept_trust, ids.u_g_accept_trust, "pending"),
        (ids.gr_rate, ids.u_g_rate, "active"),
        (ids.gr_hex, ids.u_g_hex, "active"),
    ];

    for (gid, uid_u, st) in guides {
        store.guides.insert(
            gid,
            GuideRow {
                id: gid,
                user_id: uid_u,
                city: "杭州".to_string(),
                country_code: "CN".to_string(),
                languages: vec!["zh".to_string()],
                service_types: vec!["walking".to_string()],
                bio: Some("trust-gate e2e".to_string()),
                wallet_address: ids.wal.clone(),
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".to_string(),
                hourly_rate: None,
                avatar_url: None,
                public_title: None,
                status: st.to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
                data_origin: "production".into(),
                ..Default::default()
            },
        );
        store.guides_by_user.insert(uid_u, gid);
    }
}
