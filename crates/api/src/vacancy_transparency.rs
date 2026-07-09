//! W4a · Vacancy Ledger transparency envelope (protocol vs runtime SSOT).
//! Mirrors `registry/vacancy-v1-runtime-deployment-status.v1.yaml` — UI must not guess.

use serde_json::{json, Value};
use std::path::PathBuf;

const REGISTRY_REL: &str = "../../registry/vacancy-v1-runtime-deployment-status.v1.yaml";

#[derive(Clone, Debug)]
pub struct VacancyTransparencyMeta {
    pub protocol_version: String,
    pub protocol_status: String,
    pub runtime_status: String,
    pub runtime_capability: String,
    pub last_verified: String,
    pub network: String,
    pub reconcile_status: String,
}

fn registry_yaml_value() -> Option<Value> {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(REGISTRY_REL);
    let raw = std::fs::read_to_string(path).ok()?;
    serde_yaml::from_str(&raw).ok()
}

fn registry_str(doc: &Value, path: &[&str]) -> Option<String> {
    let mut cur = doc;
    for key in path {
        cur = cur.get(*key)?;
    }
    cur.as_str().map(|s| s.to_string())
}

pub fn vacancy_transparency_meta(chain_id: i64) -> VacancyTransparencyMeta {
    let doc = registry_yaml_value();
    let protocol_version = doc
        .as_ref()
        .and_then(|d| registry_str(d, &["protocol", "protocol_gate"]))
        .map(|g| {
            if g == "VACANCY_LEDGER_V1_PROTOCOL_COMPLETE" {
                "Vacancy Ledger V1".to_string()
            } else {
                g
            }
        })
        .unwrap_or_else(|| "Vacancy Ledger V1".to_string());
    let protocol_status = doc
        .as_ref()
        .and_then(|d| registry_str(d, &["protocol", "implementation_status"]))
        .unwrap_or_else(|| "COMPLETE".to_string());
    let runtime_status = std::env::var("VACANCY_RUNTIME_STATUS").unwrap_or_else(|_| {
        doc.as_ref()
            .and_then(|d| registry_str(d, &["runtime", "environments", "sepolia_de", "status"]))
            .unwrap_or_else(|| "PENDING".to_string())
    });
    let runtime_capability = std::env::var("VACANCY_RUNTIME_CAPABILITY").unwrap_or_else(|_| {
        doc.as_ref()
            .and_then(|d| registry_str(d, &["runtime", "environments", "sepolia_de", "stack"]))
            .unwrap_or_else(|| "Q-F01_LEGACY_BYTECODE".to_string())
    });
    let last_verified = doc
        .as_ref()
        .and_then(|d| registry_str(d, &["updated_utc"]))
        .unwrap_or_else(|| "2026-07-09".to_string());
    let network = match chain_id {
        11155111 => "Sepolia".to_string(),
        1 => "Ethereum Mainnet".to_string(),
        _ => format!("chain_id:{chain_id}"),
    };
    let reconcile_status = if runtime_status.eq_ignore_ascii_case("ACTIVE") {
        "LIVE_RECONCILE_READY".to_string()
    } else {
        doc.as_ref()
            .and_then(|d| {
                registry_str(
                    d,
                    &[
                        "runtime",
                        "capability_probe",
                        "live_reconcile_mode_when_pending",
                    ],
                )
            })
            .unwrap_or_else(|| "SKIPPED_PRE_V1".to_string())
    };

    VacancyTransparencyMeta {
        protocol_version,
        protocol_status,
        runtime_status,
        runtime_capability,
        last_verified,
        network,
        reconcile_status,
    }
}

pub fn meta_to_json(meta: &VacancyTransparencyMeta) -> Value {
    json!({
        "protocolVersion": meta.protocol_version,
        "protocolStatus": meta.protocol_status,
        "runtimeStatus": meta.runtime_status,
        "runtimeCapability": meta.runtime_capability,
        "lastVerified": meta.last_verified,
        "network": meta.network,
        "reconcileStatus": meta.reconcile_status,
    })
}

pub fn known_jurisdictions_from_registry() -> Vec<String> {
    let doc = registry_yaml_value();
    doc.as_ref()
        .and_then(|d| registry_str(d, &["runtime", "environments", "sepolia_de", "jurisdiction"]))
        .map(|j| vec![j])
        .unwrap_or_else(|| vec!["DE".to_string()])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn meta_defaults_separate_protocol_and_runtime() {
        let meta = vacancy_transparency_meta(11155111);
        assert_eq!(meta.protocol_version, "Vacancy Ledger V1");
        assert_eq!(meta.protocol_status, "PASS");
        assert_eq!(meta.network, "Sepolia");
        assert!(
            meta.runtime_status == "PENDING" || meta.runtime_status == "ACTIVE",
            "runtime_status={}",
            meta.runtime_status
        );
    }
}
