//! S4a · Vacancy Ledger V1 indexer projection (EV-01 · PCM §2).
//!
//! Consumes six frozen Vacancy events; **never** recomputes `reserve` from `principal - swept - disbursed`.
//! Dashboard / Admin (S4b) must read this snapshot as SSOT.

use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};

pub const VACANCY_ENTERED_SIG: &[u8] =
    b"VacancyEntered(uint16,bytes2,uint256,uint256,uint256,uint256,uint256)";
pub const GRACE_STARTED_SIG: &[u8] = b"GraceStarted(uint16,bytes2,uint256,uint32)";
pub const SWEEP_EXECUTED_SIG: &[u8] =
    b"SweepExecuted(uint16,bytes2,uint256,uint256,address,uint256,uint256,uint256,uint256)";
pub const RESERVE_REACHED_SIG: &[u8] =
    b"ReserveReached(uint16,bytes2,uint256,uint256,uint256,uint256,uint256)";
pub const STEWARD_ACTIVATED_SIG: &[u8] = b"StewardActivated(uint16,bytes2,uint256,address)";
pub const JURISDICTION_RESERVE_DISBURSED_SIG: &[u8] =
    b"JurisdictionReserveDisbursed(uint16,bytes2,uint256,address,bytes32,uint256,uint256,uint256,uint256)";

pub fn vacancy_event_topic0_hex(sig: &[u8]) -> String {
    format!("0x{}", hex::encode(Keccak256::digest(sig)))
}

/// Read-only snapshot served by indexer / admin API (S4a schema v1).
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct VacancyLedgerSnapshot {
    pub jurisdiction: String,
    pub state: String,
    pub principal: String,
    pub swept: String,
    pub reserve: String,
    pub disbursed: String,
    pub sweep_enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steward_activation_epoch_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_block: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_log_index: Option<u32>,
}

#[derive(Clone, Debug)]
pub enum VacancyIndexerEvent {
    VacancyEntered {
        jurisdiction: String,
        principal: String,
        reserve: String,
        swept: String,
        disbursed: String,
    },
    GraceStarted {
        jurisdiction: String,
    },
    SweepExecuted {
        jurisdiction: String,
        principal: String,
        reserve: String,
        swept: String,
        disbursed: String,
    },
    ReserveReached {
        jurisdiction: String,
        principal: String,
        reserve: String,
        swept: String,
        disbursed: String,
    },
    StewardActivated {
        jurisdiction: String,
        steward_activation_epoch_id: String,
    },
    JurisdictionReserveDisbursed {
        jurisdiction: String,
        principal: String,
        reserve: String,
        swept: String,
        disbursed: String,
    },
}

fn topic_hex_norm(topic0: &str) -> Option<String> {
    let t = topic0.trim_start_matches("0x").to_lowercase();
    if t.len() != 64 {
        return None;
    }
    Some(t)
}

fn jurisdiction_from_topic(topic: &str) -> Option<String> {
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
    let n = num_bigint::BigUint::from_bytes_be(w);
    if n == num_bigint::BigUint::ZERO {
        return "0".to_string();
    }
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

/// Map topic0 + log payload → typed Vacancy event (six-event allowlist).
pub fn parse_vacancy_event(
    topic0: &str,
    topics: &[String],
    data: &serde_json::Value,
) -> Option<VacancyIndexerEvent> {
    let want = topic_hex_norm(topic0)?;
    let words = decode_data_words(data)?;
    let sigs: &[(&[u8], fn(&[String], &[Vec<u8>]) -> Option<VacancyIndexerEvent>)] = &[
        (VACANCY_ENTERED_SIG, parse_vacancy_entered),
        (GRACE_STARTED_SIG, parse_grace_started),
        (SWEEP_EXECUTED_SIG, parse_sweep_executed),
        (RESERVE_REACHED_SIG, parse_reserve_reached),
        (STEWARD_ACTIVATED_SIG, parse_steward_activated),
        (
            JURISDICTION_RESERVE_DISBURSED_SIG,
            parse_jurisdiction_reserve_disbursed,
        ),
    ];
    for (sig, parser) in sigs {
        if hex::encode(Keccak256::digest(sig)) == want {
            return parser(topics, &words);
        }
    }
    None
}

fn parse_vacancy_entered(
    topics: &[String],
    words: &[Vec<u8>],
) -> Option<VacancyIndexerEvent> {
    if topics.len() < 2 || words.len() < 6 {
        return None;
    }
    let jurisdiction = jurisdiction_from_topic(topics.get(1)?)?;
    Some(VacancyIndexerEvent::VacancyEntered {
        jurisdiction,
        principal: word_to_u256_decimal(words.get(2)?),
        reserve: word_to_u256_decimal(words.get(3)?),
        swept: word_to_u256_decimal(words.get(4)?),
        disbursed: word_to_u256_decimal(words.get(5)?),
    })
}

fn parse_grace_started(topics: &[String], _words: &[Vec<u8>]) -> Option<VacancyIndexerEvent> {
    if topics.len() < 2 {
        return None;
    }
    Some(VacancyIndexerEvent::GraceStarted {
        jurisdiction: jurisdiction_from_topic(topics.get(1)?)?,
    })
}

fn parse_sweep_executed(topics: &[String], words: &[Vec<u8>]) -> Option<VacancyIndexerEvent> {
    if topics.len() < 2 || words.len() < 6 {
        return None;
    }
    let jurisdiction = jurisdiction_from_topic(topics.get(1)?)?;
    Some(VacancyIndexerEvent::SweepExecuted {
        jurisdiction,
        principal: word_to_u256_decimal(words.get(2)?),
        reserve: word_to_u256_decimal(words.get(3)?),
        swept: word_to_u256_decimal(words.get(4)?),
        disbursed: word_to_u256_decimal(words.get(5)?),
    })
}

fn parse_reserve_reached(topics: &[String], words: &[Vec<u8>]) -> Option<VacancyIndexerEvent> {
    if topics.len() < 2 || words.len() < 6 {
        return None;
    }
    let jurisdiction = jurisdiction_from_topic(topics.get(1)?)?;
    Some(VacancyIndexerEvent::ReserveReached {
        jurisdiction,
        principal: word_to_u256_decimal(words.get(2)?),
        reserve: word_to_u256_decimal(words.get(3)?),
        swept: word_to_u256_decimal(words.get(4)?),
        disbursed: word_to_u256_decimal(words.get(5)?),
    })
}

fn parse_steward_activated(topics: &[String], words: &[Vec<u8>]) -> Option<VacancyIndexerEvent> {
    if topics.len() < 3 || words.len() < 2 {
        return None;
    }
    let jurisdiction = jurisdiction_from_topic(topics.get(1)?)?;
    Some(VacancyIndexerEvent::StewardActivated {
        jurisdiction,
        steward_activation_epoch_id: word_to_u64(words.get(1)?).to_string(),
    })
}

fn parse_jurisdiction_reserve_disbursed(
    topics: &[String],
    words: &[Vec<u8>],
) -> Option<VacancyIndexerEvent> {
    if topics.len() < 2 || words.len() < 7 {
        return None;
    }
    let jurisdiction = jurisdiction_from_topic(topics.get(1)?)?;
    Some(VacancyIndexerEvent::JurisdictionReserveDisbursed {
        jurisdiction,
        principal: word_to_u256_decimal(words.get(3)?),
        reserve: word_to_u256_decimal(words.get(4)?),
        swept: word_to_u256_decimal(words.get(5)?),
        disbursed: word_to_u256_decimal(words.get(6)?),
    })
}

/// Apply parsed event to jurisdiction snapshot (event-emitted ledger dims only).
pub fn apply_vacancy_event(
    snap: &mut VacancyLedgerSnapshot,
    ev: &VacancyIndexerEvent,
    block_number: u64,
    log_index: u32,
) {
    match ev {
        VacancyIndexerEvent::VacancyEntered {
            jurisdiction,
            principal,
            reserve,
            swept,
            disbursed,
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.state = "GRACE_PERIOD".to_string();
            snap.principal.clone_from(principal);
            snap.reserve.clone_from(reserve);
            snap.swept.clone_from(swept);
            snap.disbursed.clone_from(disbursed);
        }
        VacancyIndexerEvent::GraceStarted { jurisdiction } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.state = "GRACE_PERIOD".to_string();
        }
        VacancyIndexerEvent::SweepExecuted {
            jurisdiction,
            principal,
            reserve,
            swept,
            disbursed,
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.state = "SWEEP".to_string();
            snap.sweep_enabled = true;
            snap.principal.clone_from(principal);
            snap.reserve.clone_from(reserve);
            snap.swept.clone_from(swept);
            snap.disbursed.clone_from(disbursed);
        }
        VacancyIndexerEvent::ReserveReached {
            jurisdiction,
            principal,
            reserve,
            swept,
            disbursed,
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.state = "SWEEP".to_string();
            snap.sweep_enabled = false;
            snap.principal.clone_from(principal);
            snap.reserve.clone_from(reserve);
            snap.swept.clone_from(swept);
            snap.disbursed.clone_from(disbursed);
        }
        VacancyIndexerEvent::StewardActivated {
            jurisdiction,
            steward_activation_epoch_id,
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.state = "STEWARD_ACTIVE".to_string();
            snap.steward_activation_epoch_id = Some(steward_activation_epoch_id.clone());
        }
        VacancyIndexerEvent::JurisdictionReserveDisbursed {
            jurisdiction,
            principal,
            reserve,
            swept,
            disbursed,
        } => {
            snap.jurisdiction.clone_from(jurisdiction);
            snap.principal.clone_from(principal);
            snap.reserve.clone_from(reserve);
            snap.swept.clone_from(swept);
            snap.disbursed.clone_from(disbursed);
        }
    }
    snap.last_block = Some(block_number);
    snap.last_log_index = Some(log_index);
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

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

    #[test]
    fn topic0_hashes_match_ssot() {
        assert_eq!(
            vacancy_event_topic0_hex(VACANCY_ENTERED_SIG),
            "0x66426c6f7405996f797b8a96cd698e68aab79f62b872539cb911bb89b5060044"
        );
        assert_eq!(
            vacancy_event_topic0_hex(JURISDICTION_RESERVE_DISBURSED_SIG),
            "0x63024984fd54ef8df0bd024bf0de9e95be6716212477b737fb4fb7064ce8f27e"
        );
    }

    #[test]
    fn apply_sweep_and_disburse_updates_snapshot_without_recompute() {
        let topic0 = vacancy_event_topic0_hex(SWEEP_EXECUTED_SIG);
        let topics = vec![topic0.clone(), topic_jurisdiction("JP")];
        let data = enc(&[
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x00000000000000000000000000000000000000000000000000000000000f4240",
            "0x000000000000000000000000000000000000000000000000000000000007a120",
            "0x000000000000000000000000000000000000000000000000000000000003d090",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);
        let ev = parse_vacancy_event(&topic0, &topics, &data).unwrap();
        let mut snap = VacancyLedgerSnapshot::default();
        apply_vacancy_event(&mut snap, &ev, 100, 1);
        assert_eq!(snap.jurisdiction, "JP");
        assert_eq!(snap.state, "SWEEP");
        assert_eq!(snap.principal, "1000000");
        assert_eq!(snap.reserve, "500000");
        assert_eq!(snap.swept, "250000");
        assert_eq!(snap.disbursed, "0");
        assert!(snap.sweep_enabled);

        let topic0_rr = vacancy_event_topic0_hex(RESERVE_REACHED_SIG);
        let topics_rr = vec![topic0_rr.clone(), topic_jurisdiction("JP")];
        let data_rr = enc(&[
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x00000000000000000000000000000000000000000000000000000000000f4240",
            "0x0000000000000000000000000000000000000000000000000000000000027100",
            "0x00000000000000000000000000000000000000000000000000000000000cb350",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);
        let ev_rr = parse_vacancy_event(&topic0_rr, &topics_rr, &data_rr).unwrap();
        apply_vacancy_event(&mut snap, &ev_rr, 101, 2);
        assert!(!snap.sweep_enabled);
        assert_eq!(snap.reserve, "160000");
    }
}
