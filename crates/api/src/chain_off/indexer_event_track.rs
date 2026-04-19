//! 91 §八：`event_log` **分轨**（**track_type**）与 **`chain_id`** 并列 — 索引器写入前分类。
use crate::chain::ChainConfig;

use super::event_name_from_topic0;

fn normalize_hex_addr(a: &str) -> String {
    let s = a.trim_start_matches("0x");
    format!("0x{}", s.to_lowercase())
}

fn cfg_matches(cfg: &Option<String>, log_address: &str) -> bool {
    let Some(s) = cfg else {
        return false;
    };
    let t = s.trim();
    if t.is_empty() {
        return false;
    }
    normalize_hex_addr(t) == normalize_hex_addr(log_address)
}

/// 返回 **`A`** / **`B`** / **`Escrow`** / **`Staking`** / **`Vault`**（与 91 分轨命名一致）。
pub fn classify_event_log_track(
    cfg: &ChainConfig,
    log_address: &str,
    topic0: &str,
) -> Result<&'static str, String> {
    if let Some(name) = event_name_from_topic0(topic0) {
        return Ok(match name {
            "EscrowCreated"
            | "Paid"
            | "DisputeOpened"
            | "Released"
            | "Refunded"
            | "ResolutionExecuted"
            | "PartialRefundExecuted"
            | "SlashedExecuted" => "Escrow",
            "PlatformFeeRouted" | "CountryLedgerCredited" => "A",
            "RegionVaultForwarded" | "RegionShareSnapshotLine" => "Vault",
            "ProposalCreated"
            | "VoteCast"
            | "ProposalQueued"
            | "ProposalExecuted"
            | "ProposalCanceled" => "B",
            _ => {
                return Err(format!("unmapped known event for rail: {name}"));
            }
        });
    }

    if cfg_matches(&cfg.fee_router_address, log_address)
        || cfg_matches(&cfg.country_pool_ledger_address, log_address)
    {
        return Ok("A");
    }
    if cfg_matches(&cfg.region_vault_address, log_address) {
        return Ok("Vault");
    }
    if cfg_matches(&cfg.governor_address, log_address)
        || cfg_matches(&cfg.timelock_address, log_address)
        || cfg_matches(&cfg.treasury_address, log_address)
    {
        return Ok("B");
    }
    if cfg_matches(&cfg.guide_staking_address, log_address)
        || cfg_matches(&cfg.staking_provider_address, log_address)
    {
        return Ok("Staking");
    }
    if cfg_matches(&cfg.escrow_factory_address, log_address) {
        return Ok("Escrow");
    }

    for tok in &cfg.investor_lock_contract_addresses {
        if cfg_matches(&Some(tok.clone()), log_address) {
            return Ok("Staking");
        }
    }

    Err(
        "event_log track_type: unknown topic0 and log_address not in configured rails (see 91 §八)"
            .into(),
    )
}

/// 默认 **开启**：**`INDEXER_EVENT_LOG_TRACK_ENFORCE=0`** / **`false`** / **`off`** 关闭分轨校验（仅迁移/排障）。
pub fn indexer_event_log_track_enforce_enabled() -> bool {
    std::env::var("INDEXER_EVENT_LOG_TRACK_ENFORCE")
        .ok()
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            !(t.is_empty()
                || t == "0"
                || t == "false"
                || t == "off"
                || t == "no")
        })
        .unwrap_or(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sha3::{Digest, Keccak256};

    #[test]
    fn classify_deposited_topic_as_escrow() {
        let sig = b"Deposited(bytes32,address,address,uint256)";
        let topic0 = format!("0x{}", hex::encode(Keccak256::digest(sig)));
        let cfg = ChainConfig::default();
        assert_eq!(
            classify_event_log_track(&cfg, "0x0001", &topic0).expect("Paid"),
            "Escrow"
        );
    }

    #[test]
    fn classify_platform_fee_routed_as_a() {
        let sig = b"PlatformFeeRouted(address,uint256,uint256,uint256,uint256,uint256)";
        let topic0 = format!("0x{}", hex::encode(Keccak256::digest(sig)));
        let cfg = ChainConfig::default();
        assert_eq!(
            classify_event_log_track(&cfg, "0x0", &topic0).expect("pfr"),
            "A"
        );
    }

    #[test]
    fn unknown_topic_matches_configured_fee_router_addr() {
        let mut cfg = ChainConfig::default();
        cfg.fee_router_address = Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into());
        let topic = "0x0000000000000000000000000000000000000000000000000000000000000001";
        assert_eq!(
            classify_event_log_track(&cfg, "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", topic)
                .expect("addr"),
            "A"
        );
    }
}
