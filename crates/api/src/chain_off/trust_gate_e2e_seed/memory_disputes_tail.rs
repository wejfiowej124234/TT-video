//! Risk 四单、证据 / resolve / exec 争议、行程 draft 夹具。

use chrono::{DateTime, Duration as ChronoDuration, Utc};

use crate::chain_off::itineraries::{AmountBreakdown, ItineraryBundle, ItineraryDayRow};
use crate::chain_off::{ChainOffStore, DisputeRow};
use traveltrust_core::OrderState;

use super::ids::TrustGateFixtureIds;
use super::order_fixture::base_order;

pub(super) fn apply(store: &mut ChainOffStore, ids: &TrustGateFixtureIds, now: DateTime<Utc>) {
    let esc = ids.esc.to_string();
    let esc_exec = ids.esc_exec.to_string();

    let risk = [
        (ids.o_risk_0, ids.gr_r0, ids.d_risk_0),
        (ids.o_risk_1, ids.gr_r1, ids.d_risk_1),
        (ids.o_risk_2, ids.gr_r2, ids.d_risk_2),
        (ids.o_risk_3, ids.gr_r3, ids.d_risk_3),
    ];
    for (oid, gid, did) in risk {
        let mut ord = base_order(
            oid,
            ids.u_risk,
            gid,
            OrderState::Escrowed,
            now - ChronoDuration::days(20),
            "50",
            None,
            None,
            Some(esc.clone()),
            Some("confirmed"),
        );
        ord.accepted_at = Some(now - ChronoDuration::days(21));
        ord.escrowed_at = Some(now - ChronoDuration::days(20));
        store.orders.insert(oid, ord);
        store.guide_slot.insert(gid, oid);
        store.disputes.insert(
            did,
            DisputeRow {
                id: did,
                order_id: oid,
                status: "open".to_string(),
                evidence_hashes: vec![],
                arbitrator_id: None,
                refund_ratio: None,
                slash_guide: None,
                resolved_at: None,
                created_at: now,
                updated_at: now,
                arb_fee_paid: None,
                dispute_sequence: 1,
            },
        );
        store.disputes_by_order.insert(oid, did);
    };    let mut o_e = base_order(
        ids.o_evidence,
        ids.u_pending,
        ids.gr_evid,
        OrderState::Escrowed,
        now,
        "80",
        None,
        None,
        Some(esc.clone()),
        Some("confirmed"),
    );
    o_e.accepted_at = Some(now);
    o_e.escrowed_at = Some(now);
    store.orders.insert(ids.o_evidence, o_e);
    store.guide_slot.insert(ids.gr_evid, ids.o_evidence);
    store.disputes.insert(
        ids.d_evidence,
        DisputeRow {
            id: ids.d_evidence,
            order_id: ids.o_evidence,
            status: "open".to_string(),
            evidence_hashes: vec![],
            arbitrator_id: None,
            refund_ratio: None,
            slash_guide: None,
            resolved_at: None,
            created_at: now,
            updated_at: now,
            arb_fee_paid: None,
            dispute_sequence: 1,
        },
    );
    store
        .disputes_by_order
        .insert(ids.o_evidence, ids.d_evidence);

    let mut o_erl = base_order(
        ids.o_evidence_rate,
        ids.u_clean,
        ids.gr_rate,
        OrderState::Escrowed,
        now,
        "70",
        None,
        None,
        Some(esc.clone()),
        Some("confirmed"),
    );
    o_erl.accepted_at = Some(now);
    o_erl.escrowed_at = Some(now);
    store.orders.insert(ids.o_evidence_rate, o_erl);
    store.guide_slot.insert(ids.gr_rate, ids.o_evidence_rate);
    store.disputes.insert(
        ids.d_evidence_rate,
        DisputeRow {
            id: ids.d_evidence_rate,
            order_id: ids.o_evidence_rate,
            status: "open".to_string(),
            evidence_hashes: vec![],
            arbitrator_id: None,
            refund_ratio: None,
            slash_guide: None,
            resolved_at: None,
            created_at: now,
            updated_at: now,
            arb_fee_paid: None,
            dispute_sequence: 1,
        },
    );
    store
        .disputes_by_order
        .insert(ids.o_evidence_rate, ids.d_evidence_rate);

    let mut o_ehex = base_order(
        ids.o_evidence_hex,
        ids.u_clean,
        ids.gr_hex,
        OrderState::Escrowed,
        now,
        "60",
        None,
        None,
        Some(esc.clone()),
        Some("confirmed"),
    );
    o_ehex.accepted_at = Some(now);
    o_ehex.escrowed_at = Some(now);
    store.orders.insert(ids.o_evidence_hex, o_ehex);
    store.guide_slot.insert(ids.gr_hex, ids.o_evidence_hex);
    store.disputes.insert(
        ids.d_evidence_hex,
        DisputeRow {
            id: ids.d_evidence_hex,
            order_id: ids.o_evidence_hex,
            status: "open".to_string(),
            evidence_hashes: vec![],
            arbitrator_id: None,
            refund_ratio: None,
            slash_guide: None,
            resolved_at: None,
            created_at: now,
            updated_at: now,
            arb_fee_paid: None,
            dispute_sequence: 1,
        },
    );
    store
        .disputes_by_order
        .insert(ids.o_evidence_hex, ids.d_evidence_hex);

    let mut o_res = base_order(
        ids.o_resolve_carrier,
        ids.u_clean,
        ids.gr_second,
        OrderState::Escrowed,
        now - ChronoDuration::hours(2),
        "90",
        None,
        None,
        Some(esc.clone()),
        Some("confirmed"),
    );
    o_res.accepted_at = Some(now - ChronoDuration::hours(3));
    o_res.escrowed_at = Some(now - ChronoDuration::hours(2));
    store.orders.insert(ids.o_resolve_carrier, o_res);
    store
        .guide_slot
        .insert(ids.gr_second, ids.o_resolve_carrier);
    store.disputes.insert(
        ids.d_resolve_open,
        DisputeRow {
            id: ids.d_resolve_open,
            order_id: ids.o_resolve_carrier,
            status: "open".to_string(),
            evidence_hashes: vec![],
            arbitrator_id: None,
            refund_ratio: None,
            slash_guide: None,
            resolved_at: None,
            created_at: now,
            updated_at: now,
            arb_fee_paid: None,
            dispute_sequence: 1,
        },
    );
    store
        .disputes_by_order
        .insert(ids.o_resolve_carrier, ids.d_resolve_open);

    let mut o_ex = base_order(
        ids.o_exec,
        ids.u_clean,
        ids.gr_done,
        OrderState::Completed,
        now - ChronoDuration::days(4),
        "120",
        None,
        None,
        Some(esc_exec),
        None,
    );
    o_ex.accepted_at = Some(now - ChronoDuration::days(5));
    o_ex.escrowed_at = Some(now - ChronoDuration::days(4));
    o_ex.completed_at = Some(now - ChronoDuration::days(1));
    store.orders.insert(ids.o_exec, o_ex);
    store.disputes.insert(
        ids.d_exec,
        DisputeRow {
            id: ids.d_exec,
            order_id: ids.o_exec,
            status: "resolved".to_string(),
            evidence_hashes: vec![],
            arbitrator_id: Some(ids.u_arb),
            refund_ratio: Some(0.0),
            slash_guide: Some(false),
            resolved_at: Some(now - ChronoDuration::days(1)),
            created_at: now - ChronoDuration::days(3),
            updated_at: now - ChronoDuration::days(1),
            arb_fee_paid: None,
            dispute_sequence: 1,
        },
    );
    store.disputes_by_order.insert(ids.o_exec, ids.d_exec);

    let bundle = ItineraryBundle {
        order_id: ids.o_chat_draft,
        version: 1,
        destination: "中国".to_string(),
        city: "上海".to_string(),
        days: vec![ItineraryDayRow {
            day_index: 1,
            content_text: "e2e draft day".to_string(),
            ..Default::default()
        }],
        amount_breakdown: AmountBreakdown {
            hotel: 0.0,
            catering: 0.0,
            tickets: 0.0,
            guide_fee: 100.0,
            vehicle: 0.0,
            platform_fee: 0.0,
            total_budget: 100.0,
        },
        snapshot_hash: None,
        cover_image: None,
    };
    store.itineraries.insert(ids.o_chat_draft, bundle);
}
