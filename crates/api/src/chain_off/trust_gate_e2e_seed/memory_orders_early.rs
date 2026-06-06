//! 订单前半：Created / Draft / 部分 Accepted·Escrowed·Completed（至 **`o_chat_draft`**，不含 risk 四单）。

use chrono::{DateTime, Duration as ChronoDuration, Utc};

use crate::chain_off::ChainOffStore;
use traveltrust_core::OrderState;

use super::ids::TrustGateFixtureIds;
use super::order_fixture::base_order;

pub(super) fn apply(
    store: &mut ChainOffStore,
    ids: &TrustGateFixtureIds,
    now: DateTime<Utc>,
    old_created: DateTime<Utc>,
) {
    store.orders.insert(
        ids.o_cancel_pending,
        base_order(
            ids.o_cancel_pending,
            ids.u_pending,
            ids.gr_main,
            OrderState::Created,
            now,
            "100",
            None,
            None,
            None,
            None,
        ),
    );
    store.orders.insert(
        ids.o_cancel_restricted,
        base_order(
            ids.o_cancel_restricted,
            ids.u_restricted,
            ids.gr_main,
            OrderState::Created,
            now,
            "100",
            None,
            None,
            None,
            None,
        ),
    );
    store.orders.insert(
        ids.o_cancel_risk,
        base_order(
            ids.o_cancel_risk,
            ids.u_risk,
            ids.gr_main,
            OrderState::Created,
            now,
            "100",
            None,
            None,
            None,
            None,
        ),
    );
    store.orders.insert(
        ids.o_tourist_accept,
        base_order(
            ids.o_tourist_accept,
            ids.u_pending,
            ids.gr_main,
            OrderState::Created,
            now,
            "100",
            None,
            None,
            None,
            None,
        ),
    );
    store.orders.insert(
        ids.o_guide_pending_accept,
        base_order(
            ids.o_guide_pending_accept,
            ids.u_clean,
            ids.gr_accept_trust,
            OrderState::Created,
            now,
            "100",
            None,
            None,
            None,
            None,
        ),
    );
    store.orders.insert(
        ids.o_accept_expired,
        base_order(
            ids.o_accept_expired,
            ids.u_clean,
            ids.gr_main,
            OrderState::Created,
            old_created,
            "100",
            None,
            None,
            None,
            None,
        ),
    );
    store.orders.insert(
        ids.o_schedule_conflict,
        base_order(
            ids.o_schedule_conflict,
            ids.u_clean,
            ids.gr_main,
            OrderState::Created,
            now,
            "100",
            Some(ids.june11),
            Some(ids.june13),
            None,
            None,
        ),
    );

    let mut o_dispute = base_order(
        ids.o_dispute_offchain,
        ids.u_pending,
        ids.gr_main,
        OrderState::Accepted,
        now,
        "100",
        None,
        None,
        None,
        Some("pending_bilateral"),
    );
    o_dispute.accepted_at = Some(now);
    o_dispute.tourist_confirmed = Some(false);
    o_dispute.guide_confirmed = Some(false);
    store.orders.insert(ids.o_dispute_offchain, o_dispute);
    store.guide_slot.insert(ids.gr_main, ids.o_dispute_offchain);

    let mut o_inv = base_order(
        ids.o_invalid_accept,
        ids.u_clean,
        ids.gr_inv,
        OrderState::Accepted,
        now,
        "100",
        None,
        None,
        None,
        Some("pending_bilateral"),
    );
    o_inv.accepted_at = Some(now);
    store.orders.insert(ids.o_invalid_accept, o_inv);
    store.guide_slot.insert(ids.gr_inv, ids.o_invalid_accept);

    let mut o_confirm = base_order(
        ids.o_confirm_completion,
        ids.u_pending,
        ids.gr_exec,
        OrderState::Escrowed,
        now,
        "100",
        None,
        None,
        Some(ids.esc.to_string()),
        Some("confirmed"),
    );
    o_confirm.accepted_at = Some(now);
    o_confirm.escrowed_at = Some(now);
    o_confirm.tourist_confirmed = Some(true);
    o_confirm.guide_confirmed = Some(true);
    store.orders.insert(ids.o_confirm_completion, o_confirm);
    store
        .guide_slot
        .insert(ids.gr_exec, ids.o_confirm_completion);

    let mut o_bil = base_order(
        ids.o_bilateral,
        ids.u_clean,
        ids.gr_pending,
        OrderState::Accepted,
        now,
        "100",
        None,
        None,
        None,
        Some("pending_bilateral"),
    );
    o_bil.accepted_at = Some(now);
    o_bil.tourist_confirmed = Some(false);
    o_bil.guide_confirmed = Some(false);
    store.orders.insert(ids.o_bilateral, o_bil);
    store.guide_slot.insert(ids.gr_pending, ids.o_bilateral);

    let mut o_rev = base_order(
        ids.o_review,
        ids.u_pending,
        ids.gr_main,
        OrderState::Completed,
        now - ChronoDuration::days(10),
        "100",
        None,
        None,
        None,
        None,
    );
    o_rev.completed_at = Some(now - ChronoDuration::days(1));
    store.orders.insert(ids.o_review, o_rev);

    store.orders.insert(
        ids.o_chat_draft,
        base_order(
            ids.o_chat_draft,
            ids.u_pending,
            ids.gr_main,
            OrderState::Draft,
            now,
            "100",
            None,
            None,
            None,
            None,
        ),
    );
}
