//! startup 单测：validate_events_jsonl、ingest_events_from_jsonl 门禁（48 优化：自 mod 拆出）

use super::*;
use crate::chain;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::state::ProjectorCheckpoint;

fn make_temp_dir(name: &str) -> PathBuf {
    let mut p = std::env::temp_dir();
    let n = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    p.push(format!("traveltrust_{}_{}", name, n));
    fs::create_dir_all(&p).unwrap();
    p
}

#[test]
fn validate_jsonl_counts_duplicates_in_file() {
    let dir = make_temp_dir("validate_jsonl");
    let input = dir.join("events.jsonl");
    let line = r#"{"chain_id":1,"tx_hash":"0xaaa","block_hash":"0xbbb","block_number":10,"log_index":0,"kind":"X"}"#;
    fs::write(&input, format!("{}\n{}\n", line, line)).unwrap();

    let r = validate_events_jsonl(&input).unwrap();
    assert_eq!(r.parsed_events, 2);
    assert_eq!(r.unique_in_file, 1);
    assert_eq!(r.duplicates_in_file, 1);
}

#[test]
fn ingest_rejects_non_duplicate_event_before_checkpoint() {
    let dir = make_temp_dir("ingest_gate");
    let input = dir.join("events.jsonl");
    fs::write(
        &input,
        r#"{"chain_id":1,"tx_hash":"0xaaa","block_hash":"0xbbb","block_number":1,"log_index":0,"kind":"X"}"#,
    )
    .unwrap();

    let seen_keys = dir.join("seen.json");
    let events_log = dir.join("indexer_events.jsonl");
    let audit_log = dir.join("indexer_audit.jsonl");
    let mut state = IndexerState {
        checkpoint: ProjectorCheckpoint {
            block_number: 5,
            log_index: 0,
        },
        last_seen_finality_n: 12,
    };

    let err = ingest_events_from_jsonl(&input, &seen_keys, &events_log, &audit_log, &mut state, 12)
        .unwrap_err();
    assert!(err.contains("event at/before checkpoint"));
}

fn sample_indexer_chain() -> chain::ChainConfig {
    chain::ChainConfig {
        rpc_url: "http://127.0.0.1:8545".into(),
        chain_id: 137,
        escrow_factory_address: Some("0x0000000000000000000000000000000000000001".into()),
        ..Default::default()
    }
}

#[test]
fn enforce_finality_floor_skips_when_no_chain_config() {
    assert!(enforce_indexer_finality_floor(1, &None, Some(12), false).is_ok());
}

#[test]
fn enforce_finality_floor_skips_when_factory_missing() {
    let c = chain::ChainConfig {
        rpc_url: "http://x".into(),
        escrow_factory_address: None,
        ..Default::default()
    };
    assert!(enforce_indexer_finality_floor(1, &Some(c), Some(12), true).is_ok());
}

#[test]
fn enforce_finality_floor_strict_defaults_to_12_when_chain_ready() {
    let c = sample_indexer_chain();
    assert!(enforce_indexer_finality_floor(11, &Some(c.clone()), None, true).is_err());
    assert!(enforce_indexer_finality_floor(12, &Some(c), None, true).is_ok());
}

#[test]
fn enforce_finality_floor_min_env_without_strict() {
    let c = sample_indexer_chain();
    assert!(enforce_indexer_finality_floor(7, &Some(c.clone()), Some(8), false).is_err());
    assert!(enforce_indexer_finality_floor(8, &Some(c), Some(8), false).is_ok());
}

#[test]
fn enforce_finality_floor_no_gate_without_min_or_strict() {
    let c = sample_indexer_chain();
    assert!(enforce_indexer_finality_floor(3, &Some(c), None, false).is_ok());
}
