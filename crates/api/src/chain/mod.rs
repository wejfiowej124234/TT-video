//! 链客户端封装（与 01 §8 骨架、09 定稿一致）
//!
//! 职责：读链状态（Escrow / **身份质押池**（`IdentityStakingPool` 部署）/ Registry）、提交交易（执行器代发 executeResolution 等）。
//! 资金状态仅由链上事件驱动，本模块不直接改 DB 资金终态（04 §四）。

#![allow(dead_code)]

pub mod balance_read;
pub mod country_ledger;
pub mod fee_router_verify;
pub mod governor;
pub mod timelock;
pub mod indexer;
pub mod region_vault_verify;
pub mod outbox;
pub mod resolution_tx;
pub mod steward_stake_pool;

use digest::Digest;
use serde::{Deserialize, Serialize};

/// 链配置（RPC、chain_id、合约地址、执行器限额与重试 01 §7 P0）
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ChainConfig {
    pub rpc_url: String,
    pub chain_id: u64,
    pub escrow_factory_address: Option<String>,
    /// FeeRouter 合约地址；设后 `indexer-tick` 额外拉取 `PlatformFeeRouted`（14 §1.1、110）
    pub fee_router_address: Option<String>,
    /// RegionVault 合约地址；设后 `indexer-tick` 额外拉取 `RegionVaultForwarded`（14 §1.1.1、110）
    pub region_vault_address: Option<String>,
    /// **CountryPoolLedgerV0**；设后 **`indexer-tick`** 拉取 **`CountryLedgerCredited`** → **`p5_country_ledger_lines`**（**P5-1-B**）
    pub country_pool_ledger_address: Option<String>,
    /// 份额代币（TTG / Country Pool 等）ERC20 地址列表；`indexer-tick` 写入 `investor_share_transfer_events`（B-085）
    #[serde(default)]
    pub investor_share_token_addresses: Vec<String>,
    /// **身份质押池**部署地址（**`GuideIdentityStakingPool` / `ProviderIdentityStakingPool`**，`IdentityStakingPool`；与旧 **`Staking`** **读接口/事件 topic 兼容**）；设后 **`indexer-tick`** 写入 **`investor_stake_state_events`**（**B-088 Completion**）；**`investor-distribution-accrual`** 与 **`Transfer`** 重放合并
    pub staking_address: Option<String>,
    /// **`InvestorShareLockLedger`** 等锁仓合约地址列表；**`indexer-tick`** 写入 **`investor_lock_state_events`**（**B-088 · 112**）
    #[serde(default)]
    pub investor_lock_contract_addresses: Vec<String>,
    /// **`TravelTrustGovernor`**；设后 **`indexer-tick`** 拉取 **`ProposalCreated` / `VoteCast` / …** 写入 **`governance_proposals_projection`**（**B-089 Completion**）
    pub governor_address: Option<String>,
    /// **`GovernanceTimelock`**；**`GOVERNANCE_TIMELOCK_ADDRESS`**；**TT-B110-SEQ6** **`delay()`** 只读 SSOT
    pub governance_timelock_address: Option<String>,
    /// 与 Governor 绑定的 **`GovernanceVotesToken`**；**`GET …/governance/proposals/:id`** 可选 **`getPastVotes`** 对拍
    pub governance_votes_token_address: Option<String>,
    pub registry_address: Option<String>,
    /// 执行器单笔最大金额（guide_amount + traveler_refund + platform_fee），0 或不设表示不限制
    pub executor_max_amount_per_tx: Option<u128>,
    /// 执行器单日累计上限（可选，0 表示不限制）；需调用方按日累计后传入
    pub executor_max_amount_per_day: Option<u128>,
    /// 执行器发 tx 失败时重试次数（04 §五、01 §9 资金坏链路）
    pub executor_retry_count: u32,
}

impl ChainConfig {
    /// 从环境变量加载；未配置时返回 None（链下模式或未上链）
    pub fn from_env() -> Option<Self> {
        let rpc_url = std::env::var("CHAIN_RPC_URL").ok()?;
        let chain_id = std::env::var("CHAIN_ID")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(137);
        let executor_max_amount_per_tx = std::env::var("CHAIN_EXECUTOR_MAX_AMOUNT_PER_TX")
            .ok()
            .and_then(|s| s.parse().ok())
            .filter(|&v: &u128| v > 0);
        let executor_max_amount_per_day = std::env::var("CHAIN_EXECUTOR_MAX_AMOUNT_PER_DAY")
            .ok()
            .and_then(|s| s.parse().ok())
            .filter(|&v: &u128| v > 0);
        let executor_retry_count = std::env::var("CHAIN_EXECUTOR_RETRY_COUNT")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(3);
        let investor_share_token_addresses = std::env::var("INVESTOR_SHARE_TOKEN_ADDRESSES")
            .ok()
            .map(|s| {
                s.split(',')
                    .map(|x| x.trim().to_string())
                    .filter(|x| !x.is_empty())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let investor_lock_contract_addresses = std::env::var("INVESTOR_LOCK_CONTRACT_ADDRESSES")
            .ok()
            .map(|s| {
                s.split(',')
                    .map(|x| x.trim().to_string())
                    .filter(|x| !x.is_empty())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        Some(Self {
            rpc_url,
            chain_id,
            escrow_factory_address: std::env::var("ESCROW_FACTORY_ADDRESS").ok(),
            fee_router_address: std::env::var("FEE_ROUTER_ADDRESS").ok(),
            region_vault_address: std::env::var("REGION_VAULT_ADDRESS").ok(),
            country_pool_ledger_address: std::env::var("COUNTRY_POOL_LEDGER_ADDRESS").ok(),
            investor_share_token_addresses,
            staking_address: std::env::var("STAKING_ADDRESS").ok(),
            investor_lock_contract_addresses,
            governor_address: std::env::var("GOVERNOR_ADDRESS").ok(),
            governance_timelock_address: std::env::var("GOVERNANCE_TIMELOCK_ADDRESS").ok(),
            governance_votes_token_address: std::env::var("GOVERNANCE_VOTES_TOKEN_ADDRESS").ok(),
            registry_address: std::env::var("REGISTRY_ADDRESS").ok(),
            executor_max_amount_per_tx,
            executor_max_amount_per_day,
            executor_retry_count,
        })
    }

    pub fn is_configured(&self) -> bool {
        !self.rpc_url.is_empty()
    }

    /// 与 `GET /meta` **`chain.contracts.escrow_platform_fee_recipient`** 同源（B-095 / Runbook §7.1）。
    #[must_use]
    pub fn escrow_platform_fee_recipient(&self) -> Option<String> {
        self.fee_router_address
            .as_ref()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    }
}

/// Escrow 链上状态（与 19/01 一致）
#[derive(Clone, Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub enum EscrowChainStatus {
    None,
    Created,
    Funded,
    Completed,
    Refunded,
    Disputed,
    Resolved,
    PartiallyRefunded,
    Slashed,
}

/// escrowOf(bytes32) · status() selectors（与 Sepolia EscrowFactory / Escrow 0.8.19 编译 ABI 对拍）
#[allow(dead_code)]
const SELECTOR_ESCROW_OF: &[u8] = &[0x83, 0xa2, 0x65, 0xa7];
#[allow(dead_code)]
const SELECTOR_STATUS: &[u8] = &[0x20, 0x0d, 0x2e, 0xd2];

/// 读链：eth_call factory.escrowOf(orderId) → escrow.status()，映射到 EscrowChainStatus
#[allow(dead_code)]
pub async fn get_escrow_status(
    config: &ChainConfig,
    order_id_bytes: [u8; 32],
) -> Result<Option<EscrowChainStatus>, String> {
    if !config.is_configured() {
        return Ok(None);
    }
    let factory = config
        .escrow_factory_address
        .as_ref()
        .ok_or("ESCROW_FACTORY_ADDRESS not set")?
        .trim_start_matches("0x");
    let client = reqwest::Client::new();
    let data_escrow_of = format!(
        "0x{}{}",
        hex::encode(SELECTOR_ESCROW_OF),
        hex::encode(order_id_bytes)
    );
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": format!("0x{}", factory), "data": data_escrow_of}, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(&config.rpc_url)
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
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Ok(None);
    }
    let escrow_addr = raw[12..32].to_vec();
    if escrow_addr.iter().all(|&b| b == 0) {
        return Ok(None);
    }
    let escrow_hex = format!("0x{}", hex::encode(&escrow_addr));
    let body2 = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": escrow_hex, "data": format!("0x{}", hex::encode(SELECTOR_STATUS))}, "latest"],
        "id": 2
    });
    let res2: serde_json::Value = client
        .post(&config.rpc_url)
        .json(&body2)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let hex_result2 = res2.get("result").and_then(|r| r.as_str()).ok_or_else(|| {
        res2.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_call status failed")
            .to_string()
    })?;
    let raw2 = hex::decode(hex_result2.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    let status_byte = raw2.last().copied().unwrap_or(0);
    let status = match status_byte {
        0 => EscrowChainStatus::None,
        1 => EscrowChainStatus::Created,
        2 => EscrowChainStatus::Funded,
        3 => EscrowChainStatus::Completed,
        4 => EscrowChainStatus::Refunded,
        5 => EscrowChainStatus::Disputed,
        6 => EscrowChainStatus::Resolved,
        7 => EscrowChainStatus::PartiallyRefunded,
        8 => EscrowChainStatus::Slashed,
        _ => EscrowChainStatus::None,
    };
    Ok(Some(status))
}

/// executeResolution(bytes32,bytes32,uint256,uint256,uint256) 的 4 字节 selector
fn selector_execute_resolution() -> [u8; 4] {
    let h = sha3::Keccak256::digest(b"executeResolution(bytes32,bytes32,uint256,uint256,uint256)");
    [h[0], h[1], h[2], h[3]]
}

/// RLP 编码整数需最小表示（去掉前导零）；至少保留 1 字节
fn trim_leading_zeros(b: &[u8; 32]) -> &[u8] {
    let mut i = 0;
    while i < 31 && b[i] == 0 {
        i += 1;
    }
    &b[i..]
}

/// 将 u128 按 ABI 编码为 32 字节大端
fn u128_to_32_be(v: u128) -> [u8; 32] {
    let mut out = [0u8; 32];
    out[16..32].copy_from_slice(&v.to_be_bytes());
    out
}

/// 执行器：代发 executeResolution（01 §7 P0）；需设置 CHAIN_EXECUTOR_PRIVATE_KEY（hex 32 字节）
pub async fn submit_execute_resolution(
    config: &ChainConfig,
    escrow_address: &str,
    resolution_id: [u8; 32],
    decision_hash: [u8; 32],
    guide_amount: u128,
    traveler_refund: u128,
    platform_fee: u128,
) -> Result<String, String> {
    if !config.is_configured() {
        return Err("chain not configured".to_string());
    }
    let pk_hex = std::env::var("CHAIN_EXECUTOR_PRIVATE_KEY")
        .map_err(|_| "CHAIN_EXECUTOR_PRIVATE_KEY not set (hex 32 bytes)")?;
    let pk_hex = pk_hex.trim_start_matches("0x");
    let pk_bytes = hex::decode(pk_hex).map_err(|e| e.to_string())?;
    let pk = secp256k1::SecretKey::from_slice(&pk_bytes).map_err(|e| e.to_string())?;
    let secp = secp256k1::Secp256k1::new();
    let pubkey = pk.public_key(&secp);
    let pubkey_ser = pubkey.serialize_uncompressed();
    let hash = sha3::Keccak256::digest(&pubkey_ser[1..]);
    let from_addr = &hash[12..32];
    let from_hex = format!("0x{}", hex::encode(from_addr));

    let client = reqwest::Client::new();
    let get_count: serde_json::Value = client
        .post(&config.rpc_url)
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_getTransactionCount",
            "params": [from_hex, "latest"],
            "id": 1
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let nonce_hex = get_count
        .get("result")
        .and_then(|r| r.as_str())
        .ok_or("get nonce failed")?;
    let nonce =
        u64::from_str_radix(nonce_hex.trim_start_matches("0x"), 16).map_err(|e| e.to_string())?;

    let get_gas: serde_json::Value = client
        .post(&config.rpc_url)
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_gasPrice",
            "params": [],
            "id": 2
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let gas_price_hex = get_gas
        .get("result")
        .and_then(|r| r.as_str())
        .ok_or("get gasPrice failed")?;
    let gas_price = u128::from_str_radix(gas_price_hex.trim_start_matches("0x"), 16)
        .map_err(|e| e.to_string())?;

    let escrow = escrow_address.trim_start_matches("0x");
    let to_bytes = if escrow.len() == 40 {
        hex::decode(escrow).map_err(|e| e.to_string())?
    } else {
        return Err("invalid escrow address".to_string());
    };

    let sel = selector_execute_resolution();
    let mut data = Vec::with_capacity(4 + 32 * 5);
    data.extend_from_slice(&sel);
    data.extend_from_slice(&resolution_id);
    data.extend_from_slice(&decision_hash);
    data.extend_from_slice(&u128_to_32_be(guide_amount));
    data.extend_from_slice(&u128_to_32_be(traveler_refund));
    data.extend_from_slice(&u128_to_32_be(platform_fee));

    let gas_limit: u64 = 200_000;
    let value: u128 = 0;
    let chain_id = config.chain_id;

    let mut stream_unsigned = rlp::RlpStream::new_list(9);
    stream_unsigned.append(&nonce);
    stream_unsigned.append(&gas_price);
    stream_unsigned.append(&gas_limit);
    stream_unsigned.append(&to_bytes);
    stream_unsigned.append(&value);
    stream_unsigned.append(&data);
    stream_unsigned.append(&chain_id);
    stream_unsigned.append(&0u8);
    stream_unsigned.append(&0u8);
    let unsigned_rlp = stream_unsigned.out();
    let msg_hash = sha3::Keccak256::digest(unsigned_rlp.as_ref());
    let msg =
        secp256k1::Message::from_digest_slice(msg_hash.as_ref()).map_err(|e| e.to_string())?;
    let sig = secp.sign_ecdsa_recoverable(&msg, &pk);
    let (recovery_id, sig_compact) = sig.serialize_compact();
    let v: u64 = chain_id * 2 + 35 + (recovery_id.to_i32() as u64);
    let r: [u8; 32] = sig_compact[0..32].try_into().map_err(|_| "sig r")?;
    let s: [u8; 32] = sig_compact[32..64].try_into().map_err(|_| "sig s")?;

    let mut stream_signed = rlp::RlpStream::new_list(9);
    stream_signed.append(&nonce);
    stream_signed.append(&gas_price);
    stream_signed.append(&gas_limit);
    stream_signed.append(&to_bytes);
    stream_signed.append(&value);
    stream_signed.append(&data);
    stream_signed.append(&v);
    let r_trim: &[u8] = trim_leading_zeros(&r);
    let s_trim: &[u8] = trim_leading_zeros(&s);
    stream_signed.append(&r_trim);
    stream_signed.append(&s_trim);
    let signed_rlp = stream_signed.out();
    let raw_hex = format!("0x{}", hex::encode(signed_rlp.as_ref()));

    let send: serde_json::Value = client
        .post(&config.rpc_url)
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_sendRawTransaction",
            "params": [raw_hex],
            "id": 3
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    if let Some(err) = send.get("error") {
        let msg = err
            .get("message")
            .and_then(|m| m.as_str())
            .unwrap_or("unknown");
        return Err(format!("eth_sendRawTransaction error: {}", msg));
    }
    let tx_hash = send
        .get("result")
        .and_then(|r| r.as_str())
        .ok_or("no tx hash in response")?;
    Ok(tx_hash.to_string())
}

/// `totalSupply()` → ABI uint256 字（`0x` + 64 hex），供份额对账（B-085）
pub async fn erc20_total_supply_word_hex(
    config: &ChainConfig,
    token_address: &str,
) -> Result<String, String> {
    if !config.is_configured() {
        return Err("chain rpc not configured".into());
    }
    let token = token_address.trim_start_matches("0x");
    if token.len() != 40 || !token.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("invalid token_address".into());
    }
    let h = sha3::Keccak256::digest(b"totalSupply()");
    let selector = hex::encode(&h[0..4]);
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": format!("0x{}", token), "data": format!("0x{}", selector)}, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(&config.rpc_url)
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
            .unwrap_or("eth_call totalSupply failed")
            .to_string()
    })?;
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("totalSupply return too short".into());
    }
    let w = &raw[raw.len() - 32..];
    Ok(format!("0x{}", hex::encode(w)))
}
