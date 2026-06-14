//! `RegionStewardStakePool` 只读 `eth_call`（Protocol Convergence P2 · ②）

use sha3::{Digest, Keccak256};

use super::ChainConfig;

fn evm_fn_selector(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

fn norm_hex_addr(a: &str) -> Result<String, String> {
    let s = a.trim().to_ascii_lowercase();
    let s = s.strip_prefix("0x").unwrap_or(&s);
    if s.len() != 40 || !s.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("invalid_address".into());
    }
    Ok(format!("0x{s}"))
}

/// 两字母国家码；`CN-ZJ` 等子区划回落为国家前缀（与 protocol-ssot stake 对齐）。
pub fn stake_jurisdiction_country_code(jurisdiction: &str) -> Result<String, &'static str> {
    let j = jurisdiction.trim().to_uppercase();
    if j.len() == 2 && j.chars().all(|c| c.is_ascii_alphabetic()) {
        return Ok(j);
    }
    if j.len() > 3 {
        let prefix = &j[..2];
        if prefix.chars().all(|c| c.is_ascii_alphabetic()) {
            let sep = j.as_bytes().get(2).copied();
            if sep == Some(b'-') || sep == Some(b'_') {
                return Ok(prefix.to_string());
            }
        }
    }
    Err("invalid_jurisdiction")
}

/// 两字母辖区 → `bytes2`（例 CN → 0x434e）
pub fn jurisdiction_bytes2(jurisdiction: &str) -> Result<[u8; 2], &'static str> {
    let j = stake_jurisdiction_country_code(jurisdiction)?;
    Ok([j.as_bytes()[0], j.as_bytes()[1]])
}

fn pad_address(addr: &str) -> Result<[u8; 32], String> {
    let norm = norm_hex_addr(addr)?;
    let raw = hex::decode(norm.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() != 20 {
        return Err("invalid_address".into());
    };    let mut out = [0u8; 32];
    out[12..32].copy_from_slice(&raw);
    Ok(out)
}

fn pad_bytes2(j: [u8; 2]) -> [u8; 32] {
    let mut out = [0u8; 32];
    out[0] = j[0];
    out[1] = j[1];
    out
}

async fn eth_call_raw(rpc_url: &str, to: &str, data: &str) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": to, "data": data}, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let hex_result = res.get("result").and_then(|r| r.as_str()).ok_or_else(|| {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_call failed")
            .to_string()
    })?;
    hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())
}

/// Map RPC / empty-contract failures to stable API error codes (502 vs 503).
pub fn classify_eth_call_err(msg: &str) -> &'static str {
    let m = msg.to_ascii_lowercase();
    if m.contains("connection refused")
        || m.contains("failed to connect")
        || m.contains("connect error")
        || m.contains("error sending request")
        || m.contains("actively refused")
        || m.contains("unreachable")
        || m.contains("timed out")
        || m.contains("timeout")
        || m.contains("dns error")
        || m.contains("error decoding response body")
        || m.contains("empty body")
    {
        return "chain_rpc_unavailable";
    };    if m.contains("invalid length") || m.contains("odd number of digits") {
        return "stake_pool_unavailable";
    };    if m.contains("eth_call result too short") || m.contains("eth_call failed") {
        return "stake_pool_unavailable";
    }
    "eth_call_failed"
}

pub fn region_steward_stake_pool_address() -> Option<String> {
    std::env::var("REGION_STEWARD_STAKE_POOL_ADDRESS")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// `hasJurisdictionStake(address,bytes2)`
pub async fn eth_call_has_jurisdiction_stake(
    cfg: &ChainConfig,
    pool: &str,
    wallet: &str,
    jurisdiction: &str,
) -> Result<bool, String> {
    if !cfg.is_configured() {
        return Err("chain_not_configured".into());
    };    let jid = jurisdiction_bytes2(jurisdiction).map_err(|e| e.to_string())?;
    let sel = evm_fn_selector("hasJurisdictionStake(address,bytes2)");
    let mut data = Vec::with_capacity(4 + 64);
    data.extend_from_slice(&sel);
    data.extend_from_slice(&pad_address(wallet)?);
    data.extend_from_slice(&pad_bytes2(jid));
    let raw = eth_call_raw(&cfg.rpc_url, pool, &format!("0x{}", hex::encode(&data))).await?;
    if raw.len() < 32 {
        return Err("eth_call result too short".into());
    }
    Ok(raw[31] == 1)
}

/// `releaseDelaySeconds()` → u256 string
pub async fn eth_call_release_delay_seconds(cfg: &ChainConfig, pool: &str) -> Result<String, String> {
    if !cfg.is_configured() {
        return Err("chain_not_configured".into());
    }
    let sel = evm_fn_selector("releaseDelaySeconds()");
    let raw = eth_call_raw(&cfg.rpc_url, pool, &format!("0x{}", hex::encode(sel))).await?;
    decode_u256_string(&raw)
}

/// `releaseVestSeconds()` → u256 string
pub async fn eth_call_release_vest_seconds(cfg: &ChainConfig, pool: &str) -> Result<String, String> {
    if !cfg.is_configured() {
        return Err("chain_not_configured".into());
    }
    let sel = evm_fn_selector("releaseVestSeconds()");
    let raw = eth_call_raw(&cfg.rpc_url, pool, &format!("0x{}", hex::encode(sel))).await?;
    decode_u256_string(&raw)
}

fn decode_u256_string(raw: &[u8]) -> Result<String, String> {
    if raw.len() < 32 {
        return Err("eth_call result too short".into());
    }
    let mut n = [0u8; 32];
    n.copy_from_slice(&raw[raw.len() - 32..]);
    Ok(u128::from_be_bytes(n[16..32].try_into().unwrap()).to_string())
}

/// Stake position tuple from `stakes(address,bytes2)`
pub struct StakePositionView {
    pub amount: String,
    pub staked_at: u64,
    pub release_requested_at: u64,
    pub released_amount: String,
    pub active: bool,
}

/// `stakes(address,bytes2)` → position
pub async fn eth_call_stake_position(
    cfg: &ChainConfig,
    pool: &str,
    wallet: &str,
    jurisdiction: &str,
) -> Result<StakePositionView, String> {
    if !cfg.is_configured() {
        return Err("chain_not_configured".into());
    }
    let jid = jurisdiction_bytes2(jurisdiction).map_err(|e| e.to_string())?;
    let sel = evm_fn_selector("stakes(address,bytes2)");
    let mut data = Vec::with_capacity(4 + 64);
    data.extend_from_slice(&sel);
    data.extend_from_slice(&pad_address(wallet)?);
    data.extend_from_slice(&pad_bytes2(jid));
    let raw = eth_call_raw(&cfg.rpc_url, pool, &format!("0x{}", hex::encode(&data))).await?;
    if raw.len() < 192 {
        return Err("eth_call result too short".into());
    }
    let amount = decode_u256_string(&raw[0..32])?;
    let staked_at = u64::from_be_bytes(raw[88..96].try_into().map_err(|_| "decode stakedAt")?);
    let release_requested_at =
        u64::from_be_bytes(raw[120..128].try_into().map_err(|_| "decode releaseRequestedAt")?);
    let released_amount = decode_u256_string(&raw[128..160])?;
    let active = raw.len() >= 192 && raw[191] == 1;
    Ok(StakePositionView {
        amount,
        staked_at,
        release_requested_at,
        released_amount,
        active,
    })
}

/// `releasableAmount(address,bytes2)` → decimal string
pub async fn eth_call_releasable_amount(
    cfg: &ChainConfig,
    pool: &str,
    wallet: &str,
    jurisdiction: &str,
) -> Result<String, String> {
    if !cfg.is_configured() {
        return Err("chain_not_configured".into());
    }
    let jid = jurisdiction_bytes2(jurisdiction).map_err(|e| e.to_string())?;
    let sel = evm_fn_selector("releasableAmount(address,bytes2)");
    let mut data = Vec::with_capacity(4 + 64);
    data.extend_from_slice(&sel);
    data.extend_from_slice(&pad_address(wallet)?);
    data.extend_from_slice(&pad_bytes2(jid));
    let raw = eth_call_raw(&cfg.rpc_url, pool, &format!("0x{}", hex::encode(&data))).await?;
    decode_u256_string(&raw)
}

/// `minStakeAmount(bytes2)` → decimal string
pub async fn eth_call_min_stake_amount(
    cfg: &ChainConfig,
    pool: &str,
    jurisdiction: &str,
) -> Result<String, String> {
    if !cfg.is_configured() {
        return Err("chain_not_configured".into());
    };    let jid = jurisdiction_bytes2(jurisdiction).map_err(|e| e.to_string())?;
    let sel = evm_fn_selector("minStakeAmount(bytes2)");
    let mut data = Vec::with_capacity(4 + 32);
    data.extend_from_slice(&sel);
    data.extend_from_slice(&pad_bytes2(jid));
    let raw = eth_call_raw(&cfg.rpc_url, pool, &format!("0x{}", hex::encode(&data))).await?;
    if raw.len() < 32 {
        return Err("eth_call result too short".into());
    };    let mut n = [0u8; 32];
    n.copy_from_slice(&raw[raw.len() - 32..]);
    Ok(u128::from_be_bytes(n[16..32].try_into().unwrap()).to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jurisdiction_bytes2_cn_fr() {
        assert_eq!(jurisdiction_bytes2("CN").unwrap(), [b'C', b'N']);
        assert_eq!(jurisdiction_bytes2("fr").unwrap(), [b'F', b'R']);
        assert_eq!(jurisdiction_bytes2("CN-ZJ").unwrap(), [b'C', b'N']);
        assert!(jurisdiction_bytes2("CHN").is_err());
    }

    /// 由 `smoke-steward-stake-anvil.sh` 注入 env；只读校验 `minStakeAmount(CN)`。
    #[tokio::test]
    #[ignore = "requires anvil deploy; run smoke-steward-stake-anvil.sh"]
    async fn steward_stake_pool_rpc_min_stake() {
        use crate::chain::ChainConfig;

        let rpc = std::env::var("CHAIN_RPC_URL").expect("CHAIN_RPC_URL");
        let pool = std::env::var("REGION_STEWARD_STAKE_POOL_ADDRESS")
            .expect("REGION_STEWARD_STAKE_POOL_ADDRESS");
        let chain_id = std::env::var("CHAIN_ID")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(31337_u64);
        let cfg = ChainConfig {
            rpc_url: rpc,
            chain_id,
            ..ChainConfig::default()
        };
        let min = eth_call_min_stake_amount(&cfg, &pool, "CN")
            .await
            .expect("minStakeAmount eth_call");
        assert!(!min.is_empty() && min != "0", "minStakeAmount(CN) should be positive");
    }

    /// 由 `smoke-steward-stake-anvil.sh` 在部署+stake 后注入 env 并 `--ignored` 执行。
    #[tokio::test]
    #[ignore = "requires anvil deploy; run smoke-steward-stake-anvil.sh"]
    async fn steward_stake_pool_anvil_live_has_stake() {
        use crate::chain::ChainConfig;

        let rpc = std::env::var("CHAIN_RPC_URL").expect("CHAIN_RPC_URL");
        let pool = std::env::var("REGION_STEWARD_STAKE_POOL_ADDRESS")
            .expect("REGION_STEWARD_STAKE_POOL_ADDRESS");
        let wallet = std::env::var("STEWARD_WALLET").expect("STEWARD_WALLET");
        let chain_id = std::env::var("CHAIN_ID")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(31337_u64);
        let cfg = ChainConfig {
            rpc_url: rpc,
            chain_id,
            ..ChainConfig::default()
        };
        let has = eth_call_has_jurisdiction_stake(&cfg, &pool, &wallet, "CN")
            .await
            .expect("hasJurisdictionStake eth_call");
        assert!(has, "expected hasJurisdictionStake(CN)=true after anvil smoke stake");
        let min = eth_call_min_stake_amount(&cfg, &pool, "CN")
            .await
            .expect("minStakeAmount eth_call");
        assert!(!min.is_empty() && min != "0", "minStakeAmount(CN) should be positive");
    }
}
