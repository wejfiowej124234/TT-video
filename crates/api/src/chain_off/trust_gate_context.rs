//! PD-009 / 90 §3：从 chain_off store 推导 **`identity_status`** + **`risk_level`**（规则版）。

use uuid::Uuid;

use super::{ChainOffStore, UserRow};

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

fn identity_status_for_trust(user: &UserRow, guide: Option<&super::GuideRow>) -> &'static str {
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

fn risk_level_for_trust(open_as_party: usize) -> &'static str {
    match open_as_party {
        0..=1 => "low",
        2..=3 => "medium",
        _ => "high",
    }
}

/// **`acquisition_publish_gate`** / **`ensure_acquisition_publish_allowed`** 同源 trust 上下文。
pub fn trust_gate_context_for_user(
    store: &ChainOffStore,
    user_id: Uuid,
    user: &UserRow,
) -> (&'static str, &'static str) {
    let guide = store.guides_by_user.get(&user_id).and_then(|gid| store.guides.get(gid));
    let identity_status = identity_status_for_trust(user, guide);
    let open = open_disputes_as_party_count(store, user_id);
    let risk_level = risk_level_for_trust(open);
    (identity_status, risk_level)
}
