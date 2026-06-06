//! [state-machine.v1.md](../../../../docs/spec/governance-token/state-machine.v1.md) 只读 JSON 镜像（Protocol Convergence P2）。

use serde_json::{json, Value};

pub const STATE_MACHINE_REF: &str = "docs/spec/governance-token/state-machine.v1.md";
pub const STATE_MACHINE_VERSION: &str = "1.0.0";

fn machine(
    machine_code: &str,
    domain: &str,
    entity_type: &str,
    states: &[&str],
    transitions: Value,
) -> Value {
    json!({
        "machine_code": machine_code,
        "domain": domain,
        "entity_type": entity_type,
        "version": STATE_MACHINE_VERSION,
        "states": states,
        "transitions": transitions
    })
}

/// 与 state-machine.v1 §0～§5 同批；**非**链上/DB 实时读数。
pub fn governance_state_machines_json() -> Value {
    json!({
        "status": "ok",
        "doc_ref": STATE_MACHINE_REF,
        "doc_version": STATE_MACHINE_VERSION,
        "protocol_ssot_version": crate::routes::governance_doc_reference::PROTOCOL_SSOT_VERSION,
        "note": "Target governance lifecycle enums (snake_case); runtime entity state lives in DB/API writes.",
        "machines": [
            machine(
                "steward_application",
                "governance",
                "steward_application",
                &[
                    "draft",
                    "stake_pending",
                    "under_review",
                    "approved",
                    "rejected",
                    "withdrawn",
                    "stake_release_pending",
                    "released",
                ],
                json!({
                    "draft": ["stake_pending", "withdrawn"],
                    "stake_pending": ["under_review", "rejected", "withdrawn"],
                    "under_review": ["approved", "rejected"],
                    "approved": [],
                    "rejected": ["stake_release_pending"],
                    "stake_release_pending": ["released"],
                    "withdrawn": [],
                    "released": []
                }),
            ),
            machine(
                "steward_seat",
                "governance",
                "region_seat",
                &[
                    "pending",
                    "active",
                    "watch",
                    "probation",
                    "inactive",
                    "replaceable",
                    "released",
                ],
                json!({
                    "pending": ["active"],
                    "active": ["watch", "inactive", "replaceable", "released"],
                    "watch": ["active", "probation", "inactive"],
                    "probation": ["active", "inactive"],
                    "inactive": ["replaceable", "released"],
                    "replaceable": ["released"],
                    "released": []
                }),
            ),
            machine(
                "country_jurisdiction",
                "governance",
                "jurisdiction",
                &["planned", "active", "watch", "wind_down", "dissolved"],
                json!({
                    "planned": ["active"],
                    "active": ["watch", "wind_down"],
                    "watch": ["active", "wind_down"],
                    "wind_down": ["dissolved"],
                    "dissolved": []
                }),
            ),
            machine(
                "country_pool_redemption",
                "governance",
                "pool_redemption_request",
                &[
                    "request",
                    "queued",
                    "epoch_open",
                    "pro_rata_settled",
                    "claimable",
                    "claimed",
                    "cancelled",
                    "rejected",
                ],
                json!({
                    "request": ["queued", "cancelled", "rejected"],
                    "queued": ["epoch_open", "cancelled"],
                    "epoch_open": ["pro_rata_settled"],
                    "pro_rata_settled": ["claimable"],
                    "claimable": ["claimed"],
                    "claimed": [],
                    "cancelled": [],
                    "rejected": []
                }),
            ),
            machine(
                "region_share_eligibility",
                "governance",
                "region_share_position",
                &["ineligible", "eligible", "grace", "inactive"],
                json!({
                    "ineligible": ["eligible"],
                    "eligible": ["grace", "inactive"],
                    "grace": ["eligible", "inactive"],
                    "inactive": ["eligible"]
                }),
            ),
        ]
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn state_machines_include_five_machine_codes() {
        let v = governance_state_machines_json();
        let machines = v["machines"].as_array().expect("machines");
        assert_eq!(machines.len(), 5);
        let codes: Vec<_> = machines
            .iter()
            .map(|m| m["machine_code"].as_str().unwrap())
            .collect();
        assert!(codes.contains(&"steward_application"));
        assert!(codes.contains(&"country_pool_redemption"));
    }

    #[test]
    fn steward_application_states_are_snake_case() {
        let v = governance_state_machines_json();
        let app = v["machines"]
            .as_array()
            .unwrap()
            .iter()
            .find(|m| m["machine_code"] == "steward_application")
            .unwrap();
        for s in app["states"].as_array().unwrap() {
            let name = s.as_str().unwrap();
            assert_eq!(name, name.to_lowercase());
            assert!(!name.contains('-'));
        }
    }
}
