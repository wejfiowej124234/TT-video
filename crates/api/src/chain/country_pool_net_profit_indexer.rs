//! GAP-IDX-NP-004 · Country Pool Net Profit (D-4555-B) indexer projection.
//!
//! Consumes frozen NetProfit lifecycle events from `country-pool-net-profit-v1` manifest;
//! **never** recomputes split legs off-chain — only validates conservation on `NetProfitSplit`.

use num_bigint::{BigInt, BigUint, Sign};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};

pub const EPOCH_OPENED_SIG: &[u8] = b"EpochOpened(bytes2,uint256,uint64,uint64)";
pub const NET_PROFIT_ACCRUED_SIG: &[u8] =
    b"NetProfitAccrued(bytes2,uint256,address,bytes32,int256,bytes32,uint64)";
pub const EPOCH_CLOSED_SIG: &[u8] = b"EpochClosed(bytes2,uint256,address,int256,int256,int256,uint256,uint256,int256,uint256,uint8)";
pub const LEDGER_FUNDED_FOR_SPLIT_SIG: &[u8] =
    b"LedgerFundedForSplit(bytes2,uint256,address,uint256,address)";
pub const NET_PROFIT_SPLIT_SIG: &[u8] =
    b"NetProfitSplit(bytes2,uint256,address,uint256,uint256,uint256,uint256,bool,uint64,address)";
pub const ACTIVE_STEWARD_CONFIG_SET_SIG: &[u8] =
    b"ActiveStewardConfigSet(bytes2,address,bool,bool,bool,bytes32)";
pub const STEWARD_PATH_DEPOSIT_SIG: &[u8] =
    b"StewardPathDeposit(bytes2,address,uint256,uint256)";
pub const UNALLOCATED_STEWARD_DEPOSIT_SIG: &[u8] =
    b"UnallocatedStewardDeposit(bytes2,address,uint256,uint256)";
pub const UNALLOCATED_STEWARD_RELEASED_SIG: &[u8] =
    b"UnallocatedStewardReleased(bytes2,address,uint256,bytes32)";

pub const DEFAULT_BPS_STEWARD: u16 = 4500;
pub const DEFAULT_BPS_GLOBAL: u16 = 5500;

pub fn net_profit_event_topic0_hex(sig: &[u8]) -> String {
    format!("0x{}", hex::encode(Keccak256::digest(sig)))
}

/// Read-only epoch snapshot served by indexer / governance API.
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct NetProfitEpochSnapshot {
    pub jurisdiction: String,
    pub epoch_id: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub epoch_start: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub epoch_end: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gross_revenue: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allowable_expense: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub net_profit: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub net_profit_prime: Option<String>,
    #[serde(default)]
    pub funded: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steward_amount: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unallocated_amount: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub global_amount: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steward_path_eligible: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub qualified_steward: Option<String>,
    #[serde(default = "default_bps_steward")]
    pub bps_steward_path: u16,
    #[serde(default = "default_bps_global")]
    pub bps_global_treasury: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_steward: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_block: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_log_index: Option<u32>,
}

fn default_bps_steward() -> u16 {
    DEFAULT_BPS_STEWARD
}

fn default_bps_global() -> u16 {
    DEFAULT_BPS_GLOBAL
}

#[derive(Clone, Debug)]
pub struct NetProfitSplitAccounting {
    pub ok: bool,
    pub note: Option<String>,
}

#[derive(Clone, Debug)]
pub enum NetProfitIndexerEvent {
    EpochOpened {
        jurisdiction: String,
        epoch_id: String,
        epoch_start: u64,
        epoch_end: u64,
    },
    NetProfitAccrued {
        jurisdiction: String,
        epoch_id: String,
        amount_signed: String,
        account_code: String,
    },
    EpochClosed {
        jurisdiction: String,
        epoch_id: String,
        gross_revenue: String,
        allowable_expense: String,
        net_profit: String,
        net_profit_prime: String,
        status: u8,
    },
    LedgerFundedForSplit {
        jurisdiction: String,
        epoch_id: String,
        amount: String,
    },
    NetProfitSplit {
        jurisdiction: String,
        epoch_id: String,
        net_profit_prime: String,
        steward_amount: String,
        unallocated_amount: String,
        global_amount: String,
        steward_path_eligible: bool,
        qualified_steward: String,
        accounting: NetProfitSplitAccounting,
    },
    ActiveStewardConfigSet {
        jurisdiction: String,
        steward: String,
    },
    StewardPathDeposit {
        jurisdiction: String,
        epoch_id: String,
        amount: String,
    },
    UnallocatedStewardDeposit {
        jurisdiction: String,
        epoch_id: String,
        amount: String,
    },
    UnallocatedStewardReleased {
        jurisdiction: String,
        amount: String,
    },
}

fn topic_hex_norm(topic0: &str) -> Option<String> {
    let t = topic0.trim_start_matches("0x").to_lowercase();
    if t.len() != 64 {
        return None;
    }
    Some(t)
}

pub fn jurisdiction_from_topic(topic: &str) -> Option<String> {
    let raw = hex::decode(topic.trim_start_matches("0x")).ok()?;
    if raw.len() < 32 {
        return None;
    }
    let j0 = raw[30];
    let j1 = raw[31];
    if !j0.is_ascii_alphabetic() || !j1.is_ascii_alphabetic() {
        return None;
    }
    Some(format!(
        "{}{}",
        char::from(j0.to_ascii_uppercase()),
        char::from(j1.to_ascii_uppercase())
    ))
}

fn decode_data_words(data: &serde_json::Value) -> Option<Vec<Vec<u8>>> {
    let data_str = data.as_str()?;
    let raw = hex::decode(data_str.trim_start_matches("0x")).ok()?;
    if raw.is_empty() || raw.len() % 32 != 0 {
        return None;
    }
    Some(raw.chunks(32).map(|c| c.to_vec()).collect())
}

fn word_to_u256_decimal(w: &[u8]) -> String {
    let n = BigUint::from_bytes_be(w);
    if n == BigUint::ZERO {
        return "0".to_string();
    }
    n.to_string()
}

fn word_to_i256_decimal(w: &[u8]) -> String {
    let n = BigInt::from_bytes_be(Sign::Plus, w);
    n.to_string()
}

fn word_to_u64(w: &[u8]) -> u64 {
    let start = w.len().saturating_sub(8);
    let mut u: u64 = 0;
    for b in &w[start..] {
        u = (u << 8) | (*b as u64);
    }
    u
}

fn word_to_bool(w: &[u8]) -> bool {
    w.last().copied().unwrap_or(0) != 0
}

fn topic_to_address(topic: &str) -> String {
    let raw = topic.trim_start_matches("0x");
    if raw.len() >= 40 {
        format!("0x{}", &raw[raw.len() - 40..])
    } else {
        format!("0x{raw}")
    }
}

fn epoch_id_from_topic(topic: &str) -> Option<String> {
    Some(word_to_u256_decimal(
        hex::decode(topic.trim_start_matches("0x"))
            .ok()?
            .as_slice(),
    ))
}

pub fn parse_net_profit_event(
    topic0: &str,
    topics: &[String],
    data: &serde_json::Value,
) -> Option<NetProfitIndexerEvent> {
    let want = topic_hex_norm(topic0)?;
    let words = decode_data_words(data)?;
    let sigs: &[(&[u8], fn(&[String], &[Vec<u8>]) -> Option<NetProfitIndexerEvent>)] = &[
        (EPOCH_OPENED_SIG, parse_epoch_opened),
        (NET_PROFIT_ACCRUED_SIG, parse_net_profit_accrued),
        (EPOCH_CLOSED_SIG, parse_epoch_closed),
        (LEDGER_FUNDED_FOR_SPLIT_SIG, parse_ledger_funded_for_split),
        (NET_PROFIT_SPLIT_SIG, parse_net_profit_split),
        (ACTIVE_STEWARD_CONFIG_SET_SIG, parse_active_steward_config_set),
        (STEWARD_PATH_DEPOSIT_SIG, parse_steward_path_deposit),
        (UNALLOCATED_STEWARD_DEPOSIT_SIG, parse_unallocated_steward_deposit),
        (UNALLOCATED_STEWARD_RELEASED_SIG, parse_unallocated_steward_released),
    ];
    for (sig, parser) in sigs {
        if hex::encode(Keccak256::digest(sig)) == want {
            return parser(topics, &words);
        }
    }
    None
}

fn parse_epoch_opened(topics: &[String], words: &[Vec<u8>]) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 3 || words.len() < 2 {
        return None;
    }
    Some(NetProfitIndexerEvent::EpochOpened {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        epoch_id: epoch_id_from_topic(topics.get(2)?)?,
        epoch_start: word_to_u64(words.first()?),
        epoch_end: word_to_u64(words.get(1)?),
    })
}

fn parse_net_profit_accrued(topics: &[String], words: &[Vec<u8>]) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 3 || words.len() < 3 {
        return None;
    }
    Some(NetProfitIndexerEvent::NetProfitAccrued {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        epoch_id: epoch_id_from_topic(topics.get(2)?)?,
        account_code: format!("0x{}", hex::encode(words.first()?)),
        amount_signed: word_to_i256_decimal(words.get(1)?),
    })
}

fn parse_epoch_closed(topics: &[String], words: &[Vec<u8>]) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 3 || words.len() < 8 {
        return None;
    }
    Some(NetProfitIndexerEvent::EpochClosed {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        epoch_id: epoch_id_from_topic(topics.get(2)?)?,
        gross_revenue: word_to_i256_decimal(words.get(0)?),
        allowable_expense: word_to_i256_decimal(words.get(1)?),
        net_profit: word_to_i256_decimal(words.get(2)?),
        net_profit_prime: word_to_i256_decimal(words.get(5)?),
        status: words.get(7).map(|w| w.last().copied().unwrap_or(0)).unwrap_or(0),
    })
}

fn parse_ledger_funded_for_split(
    topics: &[String],
    words: &[Vec<u8>],
) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 3 || words.is_empty() {
        return None;
    }
    Some(NetProfitIndexerEvent::LedgerFundedForSplit {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        epoch_id: epoch_id_from_topic(topics.get(2)?)?,
        amount: word_to_u256_decimal(words.first()?),
    })
}

fn parse_net_profit_split(topics: &[String], words: &[Vec<u8>]) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 3 || words.len() < 7 {
        return None;
    }
    let net_profit_prime = word_to_u256_decimal(words.get(0)?);
    let steward_amount = word_to_u256_decimal(words.get(1)?);
    let unallocated_amount = word_to_u256_decimal(words.get(2)?);
    let global_amount = word_to_u256_decimal(words.get(3)?);
    let steward_path_eligible = word_to_bool(words.get(4)?);
    let qualified_steward = topic_to_address(&format!(
        "0x{}",
        hex::encode(words.get(6)?)
    ));
    let accounting = validate_net_profit_split_accounting(
        &net_profit_prime,
        &steward_amount,
        &unallocated_amount,
        &global_amount,
        DEFAULT_BPS_STEWARD,
        DEFAULT_BPS_GLOBAL,
    );
    Some(NetProfitIndexerEvent::NetProfitSplit {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        epoch_id: epoch_id_from_topic(topics.get(2)?)?,
        net_profit_prime,
        steward_amount,
        unallocated_amount,
        global_amount,
        steward_path_eligible,
        qualified_steward,
        accounting,
    })
}

fn parse_active_steward_config_set(
    topics: &[String],
    _words: &[Vec<u8>],
) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 3 {
        return None;
    }
    Some(NetProfitIndexerEvent::ActiveStewardConfigSet {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        steward: topic_to_address(topics.get(2)?),
    })
}

fn parse_steward_path_deposit(topics: &[String], words: &[Vec<u8>]) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 2 || words.len() < 2 {
        return None;
    }
    Some(NetProfitIndexerEvent::StewardPathDeposit {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        amount: word_to_u256_decimal(words.first()?),
        epoch_id: word_to_u256_decimal(words.get(1)?),
    })
}

fn parse_unallocated_steward_deposit(
    topics: &[String],
    words: &[Vec<u8>],
) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 2 || words.len() < 2 {
        return None;
    }
    Some(NetProfitIndexerEvent::UnallocatedStewardDeposit {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        amount: word_to_u256_decimal(words.first()?),
        epoch_id: word_to_u256_decimal(words.get(1)?),
    })
}

fn parse_unallocated_steward_released(
    topics: &[String],
    words: &[Vec<u8>],
) -> Option<NetProfitIndexerEvent> {
    if topics.len() < 2 || words.is_empty() {
        return None;
    }
    Some(NetProfitIndexerEvent::UnallocatedStewardReleased {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
        amount: word_to_u256_decimal(words.first()?),
    })
}

pub fn epoch_status_label(status: u8) -> &'static str {
    match status {
        0 => "OPEN",
        1 => "SPLIT_PENDING",
        2 => "SPLIT_COMPLETED",
        3 => "NO_SPLIT",
        _ => "UNKNOWN",
    }
}

pub fn validate_net_profit_split_accounting(
    net_profit_prime: &str,
    steward_amount: &str,
    unallocated_amount: &str,
    global_amount: &str,
    bps_steward: u16,
    bps_global: u16,
) -> NetProfitSplitAccounting {
    let np = match net_profit_prime.parse::<BigUint>() {
        Ok(v) => v,
        Err(_) => {
            return NetProfitSplitAccounting {
                ok: false,
                note: Some("invalid net_profit_prime".into()),
            };
        }
    };
    let steward = steward_amount.parse::<BigUint>().unwrap_or_default();
    let unallocated = unallocated_amount.parse::<BigUint>().unwrap_or_default();
    let global = global_amount.parse::<BigUint>().unwrap_or_default();

    let sum = &steward + &unallocated + &global;
    if sum != np {
        return NetProfitSplitAccounting {
            ok: false,
            note: Some(format!("conservation_fail: sum={sum} != np={np}")),
        };
    }

    let bps_total = BigUint::from(10_000u32);
    let steward_leg = (&np * BigUint::from(bps_steward as u32)) / &bps_total;
    let global_base = (&np * BigUint::from(bps_global as u32)) / &bps_total;
    let expected_global = &global_base + (&np - &steward_leg - &global_base);
    let steward_leg_sum = &steward + &unallocated;

    if steward_leg_sum != steward_leg {
        return NetProfitSplitAccounting {
            ok: false,
            note: Some(format!(
                "steward_leg_fail: steward+unallocated={steward_leg_sum} != leg={steward_leg}"
            )),
        };
    }
    if global != expected_global {
        return NetProfitSplitAccounting {
            ok: false,
            note: Some(format!(
                "global_leg_fail: global={global} != expected={expected_global}"
            )),
        };
    }

    NetProfitSplitAccounting {
        ok: true,
        note: None,
    }
}

pub fn apply_net_profit_event(
    snap: &mut NetProfitEpochSnapshot,
    ev: &NetProfitIndexerEvent,
    block_number: u64,
    log_index: u32,
) {
    match ev {
        NetProfitIndexerEvent::EpochOpened {
            jurisdiction,
            epoch_id,
            epoch_start,
            epoch_end,
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.epoch_id.clone_from(epoch_id);
            snap.status = "OPEN".to_string();
            snap.epoch_start = Some(*epoch_start);
            snap.epoch_end = Some(*epoch_end);
        }
        NetProfitIndexerEvent::NetProfitAccrued { .. } => {
            // Accrual detail lives in event rows; epoch aggregates finalized on EpochClosed.
        }
        NetProfitIndexerEvent::EpochClosed {
            jurisdiction,
            epoch_id,
            gross_revenue,
            allowable_expense,
            net_profit,
            net_profit_prime,
            status,
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.epoch_id.clone_from(epoch_id);
            snap.gross_revenue = Some(gross_revenue.clone());
            snap.allowable_expense = Some(allowable_expense.clone());
            snap.net_profit = Some(net_profit.clone());
            snap.net_profit_prime = Some(net_profit_prime.clone());
            snap.status = epoch_status_label(*status).to_string();
        }
        NetProfitIndexerEvent::LedgerFundedForSplit {
            jurisdiction,
            epoch_id,
            ..
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.epoch_id.clone_from(epoch_id);
            snap.funded = true;
            if snap.status == "OPEN" {
                snap.status = "SPLIT_PENDING".to_string();
            }
        }
        NetProfitIndexerEvent::NetProfitSplit {
            jurisdiction,
            epoch_id,
            net_profit_prime,
            steward_amount,
            unallocated_amount,
            global_amount,
            steward_path_eligible,
            qualified_steward,
            ..
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.epoch_id.clone_from(epoch_id);
            snap.net_profit_prime = Some(net_profit_prime.clone());
            snap.steward_amount = Some(steward_amount.clone());
            snap.unallocated_amount = Some(unallocated_amount.clone());
            snap.global_amount = Some(global_amount.clone());
            snap.steward_path_eligible = Some(*steward_path_eligible);
            snap.qualified_steward = Some(qualified_steward.clone());
            snap.status = "SPLIT_COMPLETED".to_string();
        }
        NetProfitIndexerEvent::ActiveStewardConfigSet { jurisdiction, steward } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.active_steward = Some(steward.clone());
        }
        NetProfitIndexerEvent::StewardPathDeposit { jurisdiction, epoch_id, .. }
        | NetProfitIndexerEvent::UnallocatedStewardDeposit { jurisdiction, epoch_id, .. } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.epoch_id.clone_from(epoch_id);
        }
        NetProfitIndexerEvent::UnallocatedStewardReleased { jurisdiction, .. } => {
            snap.jurisdiction.clone_from(jurisdiction);
        }
    }
    snap.last_block = Some(block_number);
    snap.last_log_index = Some(log_index);
}

pub fn net_profit_event_type_name(topic0: &str) -> Option<&'static str> {
    let want = topic_hex_norm(topic0)?;
    let sigs: &[(&[u8], &str)] = &[
        (EPOCH_OPENED_SIG, "EpochOpened"),
        (NET_PROFIT_ACCRUED_SIG, "NetProfitAccrued"),
        (EPOCH_CLOSED_SIG, "EpochClosed"),
        (LEDGER_FUNDED_FOR_SPLIT_SIG, "LedgerFundedForSplit"),
        (NET_PROFIT_SPLIT_SIG, "NetProfitSplit"),
        (ACTIVE_STEWARD_CONFIG_SET_SIG, "ActiveStewardConfigSet"),
        (STEWARD_PATH_DEPOSIT_SIG, "StewardPathDeposit"),
        (UNALLOCATED_STEWARD_DEPOSIT_SIG, "UnallocatedStewardDeposit"),
        (UNALLOCATED_STEWARD_RELEASED_SIG, "UnallocatedStewardReleased"),
    ];
    for (sig, name) in sigs {
        if hex::encode(Keccak256::digest(sig)) == want {
            return Some(name);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn topic0_matches_registry_epoch_opened() {
        assert_eq!(
            net_profit_event_topic0_hex(EPOCH_OPENED_SIG),
            "0x08e96b9afbb9e663fe91a850d318a39831b93b08dcd53dcbd78c3495f59d9b7c"
        );
    }

    #[test]
    fn topic0_matches_registry_net_profit_split() {
        assert_eq!(
            net_profit_event_topic0_hex(NET_PROFIT_SPLIT_SIG),
            "0xf4f5eaf93eedea46ff19a08aa2aa34f4c250ebb92ae464b60b3d87338f423f58"
        );
    }

    #[test]
    fn validate_split_conservation_pass_45_55() {
        let acct = validate_net_profit_split_accounting(
            "1000000",
            "450000",
            "0",
            "550000",
            4500,
            5500,
        );
        assert!(acct.ok, "{:?}", acct.note);
    }

    #[test]
    fn validate_split_conservation_unallocated_path() {
        let acct = validate_net_profit_split_accounting(
            "1000000",
            "0",
            "450000",
            "550000",
            4500,
            5500,
        );
        assert!(acct.ok, "{:?}", acct.note);
    }

    #[test]
    fn validate_split_conservation_fail_sum() {
        let acct = validate_net_profit_split_accounting(
            "1000000",
            "450000",
            "0",
            "500000",
            4500,
            5500,
        );
        assert!(!acct.ok);
    }

    #[test]
    fn net_profit_event_type_name_roundtrip() {
        let topic0 = net_profit_event_topic0_hex(NET_PROFIT_SPLIT_SIG);
        assert_eq!(net_profit_event_type_name(&topic0), Some("NetProfitSplit"));
        assert_eq!(
            net_profit_event_type_name(&net_profit_event_topic0_hex(EPOCH_OPENED_SIG)),
            Some("EpochOpened")
        );
    }
}
