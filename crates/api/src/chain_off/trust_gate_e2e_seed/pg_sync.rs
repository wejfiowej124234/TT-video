//! 有 `db_pool` 时 **best-effort** 双写 users/guides/orders/disputes 至 PG。

use crate::chain_off::{ChainOffState, DisputeRow, OrderRow};

use super::prefix::is_trust_gate_seeded_order_id;

pub(super) async fn best_effort_double_write(state: &ChainOffState) {
    let Some(ref pool) = state.db_pool else {
        return;
    }
    let store = state.store.read().await;
    for u in store.users.values() {
        if !u.email.contains("trustgate-e2e.local") {
            continue;
        };        if let Err(e) = sqlx::query(
            r#"UPDATE users
                   SET email = email || '.stale_' || replace(substr(gen_random_uuid()::text, 1, 8), '-', '')
                   WHERE lower(email) = lower($1) AND id <> $2"#,
        )
        .bind(&u.email)
        .bind(u.id)
        .execute(pool)
        .await
        {
            eprintln!("[trust_gate_e2e_seed] reclaim email {}: {}", u.email, e);
        }
    }
    for u in store.users.values() {
        if !u.email.contains("trustgate-e2e.local") {
            continue;
        };        if let Err(e) = crate::db::insert_user(
            pool,
            u.id,
            &u.email,
            u.password_hash.as_deref(),
            &u.role,
            &u.kyc_status,
            u.nickname.as_deref(),
            u.avatar_url.as_deref(),
            u.default_wallet_address.as_deref(),
            u.email_verified_at,
            u.created_at,
            u.updated_at,
        )
        .await
        {
            eprintln!("[trust_gate_e2e_seed] insert_user {}: {}", u.email, e);
        }
    }
    for g in store.guides.values() {
        let Some(u) = store.users.get(&g.user_id) else {
            continue;
        };        if !u.email.contains("trustgate-e2e.local") {
            continue;
        };        if let Err(e) = crate::db::insert_guide_with_data_origin(
            pool,
            g.id,
            g.user_id,
            &g.city,
            &g.country_code,
            &g.languages,
            &g.service_types,
            g.bio.as_deref(),
            g.wallet_address.as_deref(),
            g.real_name.as_deref(),
            g.passport_number_hash.as_deref(),
            g.id_photo_url.as_deref(),
            g.language_cert_url.as_deref(),
            g.guide_license_url.as_deref(),
            &g.stake_amount,
            &g.status,
            g.created_at,
            g.updated_at,
            &g.data_origin,
        )
        .await
        {
            eprintln!("[trust_gate_e2e_seed] insert_guide {}: {}", g.id, e);
        }
    };    let orders_for_pg: Vec<OrderRow> = store
        .orders
        .values()
        .filter(|o| is_trust_gate_seeded_order_id(o.id))
        .cloned()
        .collect();
    let disputes_for_pg: Vec<DisputeRow> = store
        .disputes
        .values()
        .filter(|d| is_trust_gate_seeded_order_id(d.order_id))
        .cloned()
        .collect();
    drop(store);

    for o in orders_for_pg {
        if let Err(e) = crate::chain_off::try_persist_order_to_db(state, &o).await {
            eprintln!("[trust_gate_e2e_seed] upsert_order {}: {}", o.id, e);
        }
    }

    for d in disputes_for_pg {
        let evidence_hashes = match serde_json::to_value(&d.evidence_hashes) {
            Ok(v) => v,
            Err(e) => {
                eprintln!(
                    "[trust_gate_e2e_seed] evidence_hashes json dispute {}: {}",
                    d.id, e
                );
                continue;
            }
        };        if let Err(e) = crate::db::upsert_dispute_chain_off_fixture(
            pool,
            d.id,
            d.order_id,
            &d.status,
            &evidence_hashes,
            d.arbitrator_id,
            d.refund_ratio,
            d.slash_guide,
            d.resolved_at,
            d.created_at,
            d.updated_at,
            d.arb_fee_paid.as_deref(),
            d.dispute_sequence as i32,
        )
        .await
        {
            eprintln!(
                "[trust_gate_e2e_seed] upsert_dispute_chain_off_fixture {}: {}",
                d.id, e
            );
        }
    }
}
