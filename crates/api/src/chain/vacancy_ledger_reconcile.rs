//! S4a / W3 · Vacancy Ledger projection vs on-chain view reconcile.
//! **Never** recomputes `reserve` — compares indexer projection to `vacancyLedger()` + ledger views.

use num_bigint::BigUint;
use sha3::{Digest, Keccak256};
use std::str::FromStr;

use super::vacancy_ledger_indexer::VacancyLedgerSnapshot;

pub const VACANCY_LEDGER_SELECTOR: &str = "ae607b9e";
pub const SWEEP_ENABLED_SELECTOR: &str = "a20b5507";
pub const VACANCY_STATE_SELECTOR: &str = "0d045440";
pub const STEWARD_ACTIVATION_EPOCH_SELECTOR: &str = "123d1b10";

fn selector4(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

fn selector_hex(sig: &str) -> String {
    hex::encode(selector4(sig))
}

fn bytecode_has_selector(code: &str, selector: &str) -> bool {
    code.trim_start_matches("0x")
        .to_ascii_lowercase()
        .contains(&selector.to_ascii_lowercase())
}

fn normalize_addr(addr: &str) -> String {
    let s = addr.trim().trim_start_matches("0x");
    format!("0x{}", s.to_lowercase())
}

fn decode_u256_result(hex_res: &str) -> Option<BigUint> {
    let s = hex_res.trim().trim_start_matches("0x");
    let raw = hex::decode(s).ok()?;
    if raw.is_empty() {
        return None;
    }
    Some(BigUint::from_bytes_be(&raw))
}

fn u256_dec(hex_res: &str) -> Option<String> {
    let n = decode_u256_result(hex_res)?;
    if n == BigUint::ZERO {
        return Some("0".to_string());
    }
    Some(n.to_string())
}

fn decode_bool_word(hex_res: &str) -> Option<bool> {
    let n = decode_u256_result(hex_res)?;
    Some(n != BigUint::ZERO)
}

fn vacancy_state_label(v: u64) -> Option<String> {
    match v {
        0 => Some("STEWARD_ACTIVE".to_string()),
        1 => Some("GRACE_PERIOD".to_string()),
        2 => Some("SWEEP".to_string()),
        _ => None,
    }
}

async fn eth_get_code(rpc_url: &str, to: &str) -> Result<String, String> {
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getCode",
        "params": [normalize_addr(to), "latest"],
        "id": 1
    });
    let client = reqwest::Client::new();
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    res.get("result")
        .and_then(|x| x.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_getCode failed")
                .to_string()
        })
}

async fn eth_call(rpc_url: &str, to: &str, data_hex: &str) -> Result<String, String> {
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{ "to": normalize_addr(to), "data": data_hex }, "latest"],
        "id": 1
    });
    let client = reqwest::Client::new();
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    res.get("result")
        .and_then(|x| x.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_call failed")
                .to_string()
        })
}

/// On-chain Vacancy V1 view availability (bytecode selector probe — no reserve recompute).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VacancyChainCapability {
    pub vacancy_ledger_view: bool,
    pub sweep_enabled_view: bool,
    pub vacancy_state_view: bool,
    pub steward_activation_epoch_view: bool,
}

impl VacancyChainCapability {
    pub fn from_bytecode(vault_code: &str, ledger_code: &str) -> Self {
        Self {
            vacancy_ledger_view: bytecode_has_selector(vault_code, VACANCY_LEDGER_SELECTOR),
            sweep_enabled_view: bytecode_has_selector(vault_code, SWEEP_ENABLED_SELECTOR),
            vacancy_state_view: bytecode_has_selector(ledger_code, VACANCY_STATE_SELECTOR),
            steward_activation_epoch_view: bytecode_has_selector(
                ledger_code,
                STEWARD_ACTIVATION_EPOCH_SELECTOR,
            ),
        }
    }

    pub fn is_vacancy_v1_capable(&self) -> bool {
        self.vacancy_ledger_view
            && self.sweep_enabled_view
            && self.vacancy_state_view
            && self.steward_activation_epoch_view
    }
}

pub async fn probe_vacancy_chain_capability(
    rpc_url: &str,
    vault_address: &str,
    net_profit_ledger_address: &str,
) -> Result<VacancyChainCapability, String> {
    let vault_code = eth_get_code(rpc_url, vault_address).await?;
    let ledger_code = eth_get_code(rpc_url, net_profit_ledger_address).await?;
    Ok(VacancyChainCapability::from_bytecode(&vault_code, &ledger_code))
}

/// On-chain Vacancy SSOT from view calls (no reserve recompute).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VacancyChainView {
    pub principal: String,
    pub swept: String,
    pub reserve: String,
    pub disbursed: String,
    pub sweep_enabled: bool,
    pub state: String,
    pub steward_activation_epoch_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ReconcileFieldMismatch {
    pub field: &'static str,
    pub projection: String,
    pub chain: String,
}

pub fn compare_projection_to_chain(
    projection: &VacancyLedgerSnapshot,
    chain: &VacancyChainView,
) -> Vec<ReconcileFieldMismatch> {
    let mut out = Vec::new();
    for (field, proj, ch) in [
        ("principal", projection.principal.as_str(), chain.principal.as_str()),
        ("swept", projection.swept.as_str(), chain.swept.as_str()),
        ("reserve", projection.reserve.as_str(), chain.reserve.as_str()),
        (
            "disbursed",
            projection.disbursed.as_str(),
            chain.disbursed.as_str(),
        ),
        ("state", projection.state.as_str(), chain.state.as_str()),
        (
            "sweepEnabled",
            if projection.sweep_enabled { "true" } else { "false" },
            if chain.sweep_enabled { "true" } else { "false" },
        ),
    ] {
        let proj_norm = if field == "state" || field == "sweepEnabled" {
            proj.to_string()
        } else {
            normalize_decimal(proj).to_string()
        };
        let chain_norm = if field == "state" || field == "sweepEnabled" {
            ch.to_string()
        } else {
            normalize_decimal(ch).to_string()
        };
        if proj_norm != chain_norm {
            out.push(ReconcileFieldMismatch {
                field,
                projection: proj.to_string(),
                chain: ch.to_string(),
            });
        }
    }
    let proj_epoch = projection
        .steward_activation_epoch_id
        .as_deref()
        .unwrap_or("0");
    let chain_epoch = chain.steward_activation_epoch_id.as_deref().unwrap_or("0");
    if normalize_decimal(proj_epoch) != normalize_decimal(chain_epoch) {
        out.push(ReconcileFieldMismatch {
            field: "stewardActivationEpochId",
            projection: proj_epoch.to_string(),
            chain: chain_epoch.to_string(),
        });
    }
    out
}

fn normalize_decimal(s: &str) -> BigUint {
    BigUint::from_str(s.trim()).unwrap_or_else(|_| BigUint::ZERO)
}

/// `vacancyLedger()` ABI decode — struct order matches Solidity: principal, swept, reserve, disbursed.
fn decode_vacancy_ledger_tuple(hex_res: &str) -> Option<(String, String, String, String)> {
    let s = hex_res.trim().trim_start_matches("0x");
    let raw = hex::decode(s).ok()?;
    if raw.len() < 128 {
        return None;
    }
    let principal = u256_dec(&format!("0x{}", hex::encode(&raw[0..32])))?;
    let swept = u256_dec(&format!("0x{}", hex::encode(&raw[32..64])))?;
    let reserve = u256_dec(&format!("0x{}", hex::encode(&raw[64..96])))?;
    let disbursed = u256_dec(&format!("0x{}", hex::encode(&raw[96..128])))?;
    Some((principal, swept, reserve, disbursed))
}

pub fn snapshot_to_chain_view(projection: &VacancyLedgerSnapshot) -> VacancyChainView {
    VacancyChainView {
        principal: projection.principal.clone(),
        swept: projection.swept.clone(),
        reserve: projection.reserve.clone(),
        disbursed: projection.disbursed.clone(),
        sweep_enabled: projection.sweep_enabled,
        state: projection.state.clone(),
        steward_activation_epoch_id: projection.steward_activation_epoch_id.clone(),
    }
}

pub async fn fetch_vacancy_chain_view(
    rpc_url: &str,
    vault_address: &str,
    net_profit_ledger_address: &str,
) -> Result<VacancyChainView, String> {
    let cap = probe_vacancy_chain_capability(rpc_url, vault_address, net_profit_ledger_address)
        .await?;
    if !cap.is_vacancy_v1_capable() {
        return Err(format!(
            "PRE_VACANCY_V1_BYTECODE: vault vacancyLedger={} sweepEnabled={} ledger vacancyState={} stewardActivationEpochId={}",
            cap.vacancy_ledger_view,
            cap.sweep_enabled_view,
            cap.vacancy_state_view,
            cap.steward_activation_epoch_view
        ));
    }

    let ledger_sel = format!("0x{}", selector_hex("vacancyLedger()"));
    let ledger_raw = eth_call(rpc_url, vault_address, &ledger_sel).await?;
    let (principal, swept, reserve, disbursed) = decode_vacancy_ledger_tuple(&ledger_raw)
        .ok_or_else(|| "decode vacancyLedger() failed".to_string())?;

    let sweep_sel = format!("0x{}", selector_hex("sweepEnabled()"));
    let sweep_raw = eth_call(rpc_url, vault_address, &sweep_sel).await?;
    let sweep_enabled =
        decode_bool_word(&sweep_raw).ok_or_else(|| "decode sweepEnabled() failed".to_string())?;

    let state_sel = format!("0x{}", selector_hex("vacancyState()"));
    let state_raw = eth_call(rpc_url, net_profit_ledger_address, &state_sel).await?;
    let state_v = decode_u256_result(&state_raw)
        .ok_or_else(|| "decode vacancyState() failed".to_string())?
        .to_string()
        .parse::<u64>()
        .map_err(|_| "vacancyState overflow".to_string())?;
    let state =
        vacancy_state_label(state_v).ok_or_else(|| format!("unknown vacancyState {state_v}"))?;

    let epoch_sel = format!("0x{}", selector_hex("stewardActivationEpochId()"));
    let epoch_raw = eth_call(rpc_url, net_profit_ledger_address, &epoch_sel).await?;
    let epoch_n = decode_u256_result(&epoch_raw)
        .ok_or_else(|| "decode stewardActivationEpochId() failed".to_string())?;
    let steward_activation_epoch_id = if epoch_n == BigUint::ZERO {
        None
    } else {
        Some(epoch_n.to_string())
    };

    Ok(VacancyChainView {
        principal,
        swept,
        reserve,
        disbursed,
        sweep_enabled,
        state,
        steward_activation_epoch_id,
    })
}

pub fn chain_view_to_snapshot(jurisdiction: &str, chain: &VacancyChainView) -> VacancyLedgerSnapshot {
    VacancyLedgerSnapshot {
        jurisdiction: jurisdiction.to_string(),
        state: chain.state.clone(),
        principal: chain.principal.clone(),
        swept: chain.swept.clone(),
        reserve: chain.reserve.clone(),
        disbursed: chain.disbursed.clone(),
        sweep_enabled: chain.sweep_enabled,
        steward_activation_epoch_id: chain.steward_activation_epoch_id.clone(),
        last_block: None,
        last_log_index: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vacancy_ledger_indexer::{
        apply_vacancy_event, parse_vacancy_event, VacancyLedgerSnapshot,
        GRACE_STARTED_SIG, JURISDICTION_RESERVE_DISBURSED_SIG, RESERVE_REACHED_SIG,
        STEWARD_ACTIVATED_SIG, SWEEP_EXECUTED_SIG, VACANCY_ENTERED_SIG, vacancy_event_topic0_hex,
    };
    use serde_json::json;

    fn word32(v: &str) -> String {
        format!("0x{:0>64}", v.trim_start_matches("0x"))
    }

    fn enc(words: &[&str]) -> serde_json::Value {
        let mut raw = Vec::new();
        for w in words {
            raw.extend_from_slice(&hex::decode(w.trim_start_matches("0x")).unwrap());
        }
        json!(format!("0x{}", hex::encode(raw)))
    }

    fn topic_jurisdiction(j: &str) -> String {
        let b = j.as_bytes();
        format!(
            "0x{:0>64}",
            hex::encode([
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, b[0], b[1]
            ])
        )
    }

    fn apply_parsed(
        topic0: &str,
        topics: Vec<String>,
        data: serde_json::Value,
        snap: &mut VacancyLedgerSnapshot,
        block: u64,
        idx: u32,
    ) {
        let ev = parse_vacancy_event(topic0, &topics, &data).expect("parse event");
        apply_vacancy_event(snap, &ev, block, idx);
    }

    #[test]
    fn compare_projection_rejects_reserve_recompute_drift() {
        let projection = VacancyLedgerSnapshot {
            jurisdiction: "DE".into(),
            state: "SWEEP".into(),
            principal: "1000".into(),
            swept: "100".into(),
            reserve: "800".into(),
            disbursed: "0".into(),
            sweep_enabled: true,
            steward_activation_epoch_id: None,
            last_block: None,
            last_log_index: None,
        };
        let chain = VacancyChainView {
            principal: "1000".into(),
            swept: "100".into(),
            reserve: "900".into(),
            disbursed: "0".into(),
            sweep_enabled: true,
            state: "SWEEP".into(),
            steward_activation_epoch_id: None,
        };
        let mismatches = compare_projection_to_chain(&projection, &chain);
        assert!(mismatches.iter().any(|m| m.field == "reserve"));
    }

    #[test]
    fn event_vacancy_entered_updates_ledger_dims() {
        let topic0 = vacancy_event_topic0_hex(VACANCY_ENTERED_SIG);
        let topics = vec![topic0.clone(), topic_jurisdiction("DE")];
        let data = enc(&[
            &word32("1"),
            &word32("2"),
            &word32("3e8"),
            &word32("1f4"),
            &word32("64"),
            &word32("0"),
        ]);
        let mut snap = VacancyLedgerSnapshot::default();
        apply_parsed(&topic0, topics, data, &mut snap, 1, 0);
        assert_eq!(snap.state, "GRACE_PERIOD");
        assert_eq!(snap.principal, "1000");
        assert_eq!(snap.reserve, "500");
        assert_eq!(snap.swept, "100");
        assert_eq!(snap.disbursed, "0");
    }

    #[test]
    fn event_grace_started_sets_grace_state() {
        let topic0 = vacancy_event_topic0_hex(GRACE_STARTED_SIG);
        let topics = vec![topic0.clone(), topic_jurisdiction("DE")];
        let data = enc(&[&word32("1")]);
        let mut snap = VacancyLedgerSnapshot::default();
        apply_parsed(&topic0, topics, data, &mut snap, 2, 0);
        assert_eq!(snap.state, "GRACE_PERIOD");
    }

    #[test]
    fn event_sweep_executed_updates_sweep_enabled_and_dims() {
        let topic0 = vacancy_event_topic0_hex(SWEEP_EXECUTED_SIG);
        let topics = vec![
            topic0.clone(),
            topic_jurisdiction("DE"),
            "0x0000000000000000000000000000000000000000000000000000000000000003".into(),
            "0x0000000000000000000000000000000000000000000000000000000000000000".into(),
        ];
        let data = enc(&[
            &word32("1"),
            &word32("32"),
            &word32("3e8"),
            &word32("1f4"),
            &word32("64"),
            &word32("0"),
        ]);
        let mut snap = VacancyLedgerSnapshot::default();
        apply_parsed(&topic0, topics, data, &mut snap, 3, 0);
        assert_eq!(snap.state, "SWEEP");
        assert!(snap.sweep_enabled);
        assert_eq!(snap.swept, "100");
    }

    #[test]
    fn event_reserve_reached_disables_sweep() {
        let topic0 = vacancy_event_topic0_hex(RESERVE_REACHED_SIG);
        let topics = vec![topic0.clone(), topic_jurisdiction("DE")];
        let data = enc(&[
            &word32("1"),
            &word32("4"),
            &word32("3e8"),
            &word32("c8"),
            &word32("190"),
            &word32("0"),
        ]);
        let mut snap = VacancyLedgerSnapshot::default();
        apply_parsed(&topic0, topics, data, &mut snap, 4, 0);
        assert!(!snap.sweep_enabled);
        assert_eq!(snap.reserve, "200");
    }

    #[test]
    fn event_steward_activated_sets_epoch_and_state() {
        let topic0 = vacancy_event_topic0_hex(STEWARD_ACTIVATED_SIG);
        let topics = vec![
            topic0.clone(),
            topic_jurisdiction("DE"),
            "0x0000000000000000000000000000000000000000000000000000000000000000".into(),
        ];
        let data = enc(&[&word32("1"), &word32("5")]);
        let mut snap = VacancyLedgerSnapshot::default();
        apply_parsed(&topic0, topics, data, &mut snap, 5, 0);
        assert_eq!(snap.state, "STEWARD_ACTIVE");
        assert_eq!(snap.steward_activation_epoch_id.as_deref(), Some("5"));
    }

    #[test]
    fn event_jurisdiction_reserve_disbursed_updates_disbursed() {
        let topic0 = vacancy_event_topic0_hex(JURISDICTION_RESERVE_DISBURSED_SIG);
        let topics = vec![
            topic0.clone(),
            topic_jurisdiction("DE"),
            "0x0000000000000000000000000000000000000000000000000000000000000000".into(),
        ];
        let data = enc(&[
            &word32("1"),
            &word32("32"),
            &word32("0"),
            &word32("3e8"),
            &word32("12c"),
            &word32("64"),
            &word32("32"),
        ]);
        let mut snap = VacancyLedgerSnapshot::default();
        apply_parsed(&topic0, topics, data, &mut snap, 6, 0);
        assert_eq!(snap.disbursed, "50");
        assert_eq!(snap.reserve, "300");
    }

    #[test]
    fn capability_probe_detects_pre_vacancy_v1_legacy_bytecode() {
        // Sepolia DE Q-F01 vault: no Vacancy V1 view selectors in bytecode.
        let legacy_vault = "0x608060400ebbc6afa3c2c462";
        let legacy_ledger = "0x60806040e028f42b";
        let cap = VacancyChainCapability::from_bytecode(legacy_vault, legacy_ledger);
        assert!(!cap.vacancy_ledger_view);
        assert!(!cap.sweep_enabled_view);
        assert!(!cap.vacancy_state_view);
        assert!(!cap.steward_activation_epoch_view);
        assert!(!cap.is_vacancy_v1_capable());
    }

    #[test]
    fn capability_probe_detects_full_vacancy_v1_stack() {
        let v1_vault = format!(
            "0x60806040{}{}",
            VACANCY_LEDGER_SELECTOR, SWEEP_ENABLED_SELECTOR
        );
        let v1_ledger = format!(
            "0x60806040{}{}",
            VACANCY_STATE_SELECTOR, STEWARD_ACTIVATION_EPOCH_SELECTOR
        );
        let cap = VacancyChainCapability::from_bytecode(&v1_vault, &v1_ledger);
        assert!(cap.is_vacancy_v1_capable());
    }

    #[test]
    fn six_event_sequence_projection_matches_chain_view() {
        let mut snap = VacancyLedgerSnapshot::default();

        let topic0 = vacancy_event_topic0_hex(VACANCY_ENTERED_SIG);
        apply_parsed(
            &topic0,
            vec![topic0.clone(), topic_jurisdiction("DE")],
            enc(&[
                &word32("1"),
                &word32("2"),
                &word32("3e8"),
                &word32("1f4"),
                &word32("64"),
                &word32("0"),
            ]),
            &mut snap,
            1,
            0,
        );

        let grace = vacancy_event_topic0_hex(GRACE_STARTED_SIG);
        apply_parsed(
            &grace,
            vec![grace.clone(), topic_jurisdiction("DE")],
            enc(&[&word32("1")]),
            &mut snap,
            2,
            0,
        );
        assert_eq!(snap.state, "GRACE_PERIOD");

        let sweep = vacancy_event_topic0_hex(SWEEP_EXECUTED_SIG);
        apply_parsed(
            &sweep,
            vec![
                sweep.clone(),
                topic_jurisdiction("DE"),
                word32("3").into(),
                word32("0").into(),
            ],
            enc(&[
                &word32("1"),
                &word32("32"),
                &word32("3e8"),
                &word32("190"),
                &word32("64"),
                &word32("0"),
            ]),
            &mut snap,
            3,
            0,
        );

        let reserve = vacancy_event_topic0_hex(RESERVE_REACHED_SIG);
        apply_parsed(
            &reserve,
            vec![reserve.clone(), topic_jurisdiction("DE")],
            enc(&[
                &word32("1"),
                &word32("4"),
                &word32("3e8"),
                &word32("c8"),
                &word32("190"),
                &word32("0"),
            ]),
            &mut snap,
            4,
            0,
        );

        let steward = vacancy_event_topic0_hex(STEWARD_ACTIVATED_SIG);
        apply_parsed(
            &steward,
            vec![
                steward.clone(),
                topic_jurisdiction("DE"),
                word32("0").into(),
            ],
            enc(&[&word32("1"), &word32("5")]),
            &mut snap,
            5,
            0,
        );

        let disburse = vacancy_event_topic0_hex(JURISDICTION_RESERVE_DISBURSED_SIG);
        apply_parsed(
            &disburse,
            vec![
                disburse.clone(),
                topic_jurisdiction("DE"),
                word32("0").into(),
            ],
            enc(&[
                &word32("1"),
                &word32("32"),
                &word32("0"),
                &word32("3e8"),
                &word32("12c"),
                &word32("190"),
                &word32("32"),
            ]),
            &mut snap,
            6,
            0,
        );

        let chain = snapshot_to_chain_view(&snap);
        assert_eq!(snap.state, "STEWARD_ACTIVE");
        assert_eq!(snap.disbursed, "50");
        assert_eq!(snap.steward_activation_epoch_id.as_deref(), Some("5"));
        assert!(compare_projection_to_chain(&snap, &chain).is_empty());
    }

    #[test]
    fn chain_view_identity_projection_is_empty_mismatch_list() {
        let chain = VacancyChainView {
            principal: "1000".into(),
            swept: "400".into(),
            reserve: "300".into(),
            disbursed: "50".into(),
            sweep_enabled: false,
            state: "STEWARD_ACTIVE".into(),
            steward_activation_epoch_id: Some("5".into()),
        };
        let snap = chain_view_to_snapshot("DE", &chain);
        assert!(compare_projection_to_chain(&snap, &chain).is_empty());
    }

    #[tokio::test]
    async fn live_de_reconcile_when_env_set() {
        let live = std::env::var("VACANCY_RECONCILE_LIVE").unwrap_or_default();
        if live != "1" && !live.eq_ignore_ascii_case("true") {
            return;
        }
        let rpc = std::env::var("CHAIN_RPC_URL").expect("CHAIN_RPC_URL");
        let vault = std::env::var("UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS")
            .or_else(|_| std::env::var("COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS"))
            .expect("vault address");
        let ledger = std::env::var("COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS").expect("ledger address");

        let cap = probe_vacancy_chain_capability(&rpc, &vault, &ledger)
            .await
            .expect("probe chain capability");
        if !cap.is_vacancy_v1_capable() {
            eprintln!(
                "SKIP live reconcile: PRE_VACANCY_V1_BYTECODE cap={cap:?} vault={vault} ledger={ledger}"
            );
            return;
        }

        let chain = fetch_vacancy_chain_view(&rpc, &vault, &ledger)
            .await
            .expect("fetch chain view");
        let projection = chain_view_to_snapshot("DE", &chain);
        let mismatches = compare_projection_to_chain(&projection, &chain);
        assert!(mismatches.is_empty(), "live reconcile: {mismatches:?}");
    }
}
