//! FeeRouter `PlatformFeeRouted`：DB 投影与 `eth_getTransactionReceipt` 解码对账（B-081、83/84、110）

use sha3::{Digest, Keccak256};

use crate::chain::ChainConfig;
use crate::chain_off::parse_platform_fee_routed;
use crate::db::FeeRouterRoutedEventRow;

/// `keccak256("PlatformFeeRouted(address,uint256,uint256,uint256,uint256,uint256)")` topic0
pub fn platform_fee_routed_topic0_hex() -> String {
    let h = Keccak256::digest(
        b"PlatformFeeRouted(address,uint256,uint256,uint256,uint256,uint256)",
    );
    format!("0x{}", hex::encode(h))
}

fn norm_hex_addr(a: &str) -> String {
    let s = a.trim().to_ascii_lowercase();
    let s = s.strip_prefix("0x").unwrap_or(&s);
    format!("0x{:0>40}", s)
}

fn norm_u256_hex(h: &str) -> String {
    let s = h.trim().to_ascii_lowercase();
    let s = s.strip_prefix("0x").unwrap_or(&s);
    if s.len() > 64 {
        return h.to_string();
    }
    format!("0x{:0>64}", s)
}

fn evm_fn_selector(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

/// `eth_call` FeeRouter 无参 address getter，返回 checksummed 小写 `0x`+40 hex
pub async fn eth_call_address_getter(rpc_url: &str, router: &str, sig: &str) -> Result<String, String> {
    let router = router.trim();
    let sel = evm_fn_selector(sig);
    let data = format!("0x{}", hex::encode(sel));
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": router, "data": data}, "latest"],
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
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    let addr20 = &raw[raw.len() - 20..];
    Ok(norm_hex_addr(&format!("0x{}", hex::encode(addr20))))
}

/// `eth_call` **`FeeRouter.distributePaused()`**（路由级配置开关；**非**余额读取）。
pub async fn eth_call_fee_router_distribute_paused(
    rpc_url: &str,
    router: &str,
) -> Result<bool, String> {
    let router = router.trim();
    let sel = evm_fn_selector("distributePaused()");
    let data = format!("0x{}", hex::encode(sel));
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": router, "data": data}, "latest"],
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
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    match raw[31] {
        0 => Ok(false),
        1 => Ok(true),
        b => Err(format!("invalid bool slot byte {b}")),
    }
}

fn decode_uint256_slot_be(raw: &[u8]) -> Result<u128, String> {
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    let slot = &raw[raw.len() - 32..];
    let mut v: u128 = 0;
    for &b in slot {
        v = v
            .checked_mul(256)
            .ok_or_else(|| "uint256 slot overflow".to_string())?;
        v = v
            .checked_add(b as u128)
            .ok_or_else(|| "uint256 slot overflow".to_string())?;
    }
    Ok(v)
}

/// `eth_call` **`FeeRouter.BPS_COUNTRY()`**（路由 BPS 配置；**非**余额、**非**分配结果）。
pub async fn eth_call_fee_router_bps_country(
    rpc_url: &str,
    router: &str,
) -> Result<u128, String> {
    let router = router.trim();
    let sel = evm_fn_selector("BPS_COUNTRY()");
    let data = format!("0x{}", hex::encode(sel));
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": router, "data": data}, "latest"],
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
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    decode_uint256_slot_be(&raw)
}

/// **`eth_getBalance(FeeRouter, latest)`** — 合约地址上 **原生币** 余额（Wei，`0x` hex）。
/// **仅** 供 **`chain_alignment_hint`** 观测；**非** ERC20 平台费持仓、**非** `governance/pool` SSOT。
pub async fn eth_get_fee_router_native_balance_wei_hex(
    rpc_url: &str,
    router: &str,
) -> Result<String, String> {
    let addr = norm_hex_addr(router.trim());
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getBalance",
        "params": [addr, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(rpc_url.trim())
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
            .unwrap_or("eth_getBalance failed")
            .to_string()
    })?;
    if hex_result.len() < 3 || !hex_result.starts_with("0x") {
        return Err("eth_getBalance result not hex quantity".to_string());
    }
    Ok(norm_u256_hex(hex_result))
}

fn eth_call_balance_slot_hex_from_result(hex_result: &str) -> Result<String, String> {
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    let slot = &raw[raw.len() - 32..];
    Ok(norm_u256_hex(&format!("0x{}", hex::encode(slot))))
}

/// `eth_call` **`ERC20.balanceOf(holder)`** — 返回 **余额 u256** 规范 **`0x` hex**（全宽 uint256；**仅** hint，**非** `governance/pool` SSOT）。
pub async fn eth_call_erc20_balance_of_holder_hex(
    rpc_url: &str,
    erc20_token: &str,
    holder: &str,
) -> Result<String, String> {
    let token = norm_hex_addr(erc20_token.trim());
    let holder_h = norm_hex_addr(holder.trim());
    let holder_word = holder_h
        .strip_prefix("0x")
        .ok_or_else(|| "holder address invalid".to_string())?;
    let arg = format!("{:0>64}", holder_word);
    let sel = evm_fn_selector("balanceOf(address)");
    let data = format!("0x{}{}", hex::encode(sel), arg);
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": token, "data": data}, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(rpc_url.trim())
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
    eth_call_balance_slot_hex_from_result(hex_result)
}

/// 读 FeeRouter 四个分层收款地址（与合约 `FeeRouter.sol` 公开 immutable 一致）
pub async fn read_fee_router_recipients(
    rpc_url: &str,
    router: &str,
) -> Result<serde_json::Value, String> {
    let country = eth_call_address_getter(rpc_url, router, "countryBucket()").await?;
    let stakers = eth_call_address_getter(rpc_url, router, "globalStakers()").await?;
    let reserve = eth_call_address_getter(rpc_url, router, "globalReserve()").await?;
    let ops = eth_call_address_getter(rpc_url, router, "globalOps()").await?;
    Ok(serde_json::json!({
        "country_bucket": country,
        "global_stakers": stakers,
        "global_reserve": reserve,
        "global_ops": ops,
    }))
}

/// `eth_getTransactionReceipt` → 取 `logIndex` 匹配的一条 log
pub async fn fetch_receipt_log_at_index(
    rpc_url: &str,
    tx_hash: &str,
    want_log_index: u32,
) -> Result<Option<(String, Vec<String>, serde_json::Value)>, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getTransactionReceipt",
        "params": [tx_hash.trim()],
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
    let receipt = match res.get("result") {
        Some(r) if !r.is_null() => r,
        _ => {
            return Err(res
                .get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_getTransactionReceipt failed")
                .to_string());
        }
    };
    let logs = receipt
        .get("logs")
        .and_then(|l| l.as_array())
        .ok_or_else(|| "receipt.logs missing".to_string())?;
    for log in logs {
        let li = log
            .get("logIndex")
            .and_then(|x| x.as_str())
            .and_then(|s| u32::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .unwrap_or(0);
        if li != want_log_index {
            continue;
        }
        let addr = log
            .get("address")
            .and_then(|a| a.as_str())
            .unwrap_or("")
            .to_string();
        let topics: Vec<String> = log
            .get("topics")
            .and_then(|t| t.as_array())
            .map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect())
            .unwrap_or_default();
        let data = log.get("data").cloned().unwrap_or(serde_json::Value::Null);
        return Ok(Some((addr, topics, data)));
    }
    Ok(None)
}

/// 将单行 DB 投影与链上 receipt log 比对；返回 JSON 样本行（运维可读）
pub async fn verify_fee_router_row_vs_chain(
    config: &ChainConfig,
    row: &FeeRouterRoutedEventRow,
    expected_router: &str,
    topic0: &str,
) -> serde_json::Value {
    let want_topic0 = topic0.trim().to_ascii_lowercase();
    let router_cfg = norm_hex_addr(expected_router);
    let router_row = norm_hex_addr(&row.router_address);

    match fetch_receipt_log_at_index(&config.rpc_url, &row.tx_hash, row.log_index as u32).await {
        Err(e) => {
            return serde_json::json!({
                "ok": false,
                "chain_id": row.chain_id,
                "block_number": row.block_number,
                "log_index": row.log_index,
                "tx_hash": row.tx_hash,
                "error": e,
            });
        }
        Ok(None) => {
            return serde_json::json!({
                "ok": false,
                "chain_id": row.chain_id,
                "block_number": row.block_number,
                "log_index": row.log_index,
                "tx_hash": row.tx_hash,
                "error": "log_not_found_in_receipt",
            });
        }
        Ok(Some((log_addr, topics, data))) => {
            let log_router = norm_hex_addr(&log_addr);
            if log_router != router_row || log_router != router_cfg {
                return serde_json::json!({
                    "ok": false,
                    "chain_id": row.chain_id,
                    "block_number": row.block_number,
                    "log_index": row.log_index,
                    "tx_hash": row.tx_hash,
                    "error": "router_address_mismatch",
                    "log_address": log_router,
                    "db_router_address": router_row,
                    "config_router_address": router_cfg,
                });
            }
            let t0 = topics
                .first()
                .map(|s| s.trim().to_ascii_lowercase())
                .unwrap_or_default();
            if t0 != want_topic0 {
                return serde_json::json!({
                    "ok": false,
                    "chain_id": row.chain_id,
                    "block_number": row.block_number,
                    "log_index": row.log_index,
                    "tx_hash": row.tx_hash,
                    "error": "topic0_mismatch",
                    "want_topic0": want_topic0,
                    "got_topic0": t0,
                });
            }
            let Some((token, words)) = parse_platform_fee_routed(&topics, &data) else {
                return serde_json::json!({
                    "ok": false,
                    "chain_id": row.chain_id,
                    "block_number": row.block_number,
                    "log_index": row.log_index,
                    "tx_hash": row.tx_hash,
                    "error": "parse_platform_fee_routed_failed",
                });
            };
            if norm_hex_addr(&token) != norm_hex_addr(&row.token_address) {
                return serde_json::json!({
                    "ok": false,
                    "chain_id": row.chain_id,
                    "block_number": row.block_number,
                    "log_index": row.log_index,
                    "tx_hash": row.tx_hash,
                    "error": "field_mismatch",
                    "field": "token_address",
                    "chain": token,
                    "db": row.token_address,
                });
            }
            let u256_pairs = [
                ("amount_u256_hex", words[0].as_str(), row.amount_u256_hex.as_str()),
                ("to_country_u256_hex", words[1].as_str(), row.to_country_u256_hex.as_str()),
                ("to_stakers_u256_hex", words[2].as_str(), row.to_stakers_u256_hex.as_str()),
                ("to_reserve_u256_hex", words[3].as_str(), row.to_reserve_u256_hex.as_str()),
                ("to_ops_u256_hex", words[4].as_str(), row.to_ops_u256_hex.as_str()),
            ];
            for (name, chain_v, db_v) in u256_pairs {
                if norm_u256_hex(chain_v) != norm_u256_hex(db_v) {
                    return serde_json::json!({
                        "ok": false,
                        "chain_id": row.chain_id,
                        "block_number": row.block_number,
                        "log_index": row.log_index,
                        "tx_hash": row.tx_hash,
                        "error": "field_mismatch",
                        "field": name,
                        "chain": chain_v,
                        "db": db_v,
                    });
                }
            }
            serde_json::json!({
                "ok": true,
                "chain_id": row.chain_id,
                "block_number": row.block_number,
                "log_index": row.log_index,
                "tx_hash": row.tx_hash,
                "router_address": log_router,
                "token_address": norm_hex_addr(&token),
                "amount_u256_hex": norm_u256_hex(&words[0]),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::FeeRouterRoutedEventRow;
    use chrono::Utc;
    use serde_json::json;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use uuid::Uuid;

    #[test]
    fn platform_fee_routed_topic0_stable() {
        let t = platform_fee_routed_topic0_hex();
        assert!(t.starts_with("0x"));
        assert_eq!(t.len(), 66);
    }

    #[test]
    fn norm_u256_hex_pads() {
        assert_eq!(norm_u256_hex("0x1"), "0x0000000000000000000000000000000000000000000000000000000000000001");
    }

    /// B-081：单笔 **DB 投影行** 与 **`eth_getTransactionReceipt.logs[]`**（与 **`eth_getLogs`** 同字段解码路径）逐字段一致。
    #[tokio::test]
    async fn b081_db_row_matches_transaction_receipt_platform_fee_routed_decode() {
        let topic0 = platform_fee_routed_topic0_hex();
        let router = "0x1111111111111111111111111111111111111111";
        let token_addr = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        let token_topic = format!(
            "0x000000000000000000000000{}",
            token_addr
        );
        let mut data_bytes = Vec::new();
        for v in 1u8..=5u8 {
            let mut w = [0u8; 32];
            w[31] = v;
            data_bytes.extend_from_slice(&w);
        }
        let data_hex = format!("0x{}", hex::encode(&data_bytes));

        let receipt = json!({
            "logs": [{
                "address": router,
                "logIndex": "0x0",
                "topics": [topic0, token_topic],
                "data": data_hex
            }]
        });
        let rpc_body = json!({"jsonrpc":"2.0", "id": 1, "result": receipt}).to_string();

        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let payload = rpc_body.clone();
        tokio::spawn(async move {
            let (mut sock, _) = listener.accept().await.unwrap();
            let mut buf = vec![0u8; 16384];
            let _ = sock.read(&mut buf).await;
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                payload.len(),
                payload
            );
            let _ = sock.write_all(response.as_bytes()).await;
        });

        let tx_hash = "0x0101010101010101010101010101010101010101010101010101010101010101";
        let row = FeeRouterRoutedEventRow {
            id: Uuid::nil(),
            chain_id: 31337,
            block_number: 100,
            log_index: 0,
            block_hash: "0x0202020202020202020202020202020202020202020202020202020202020202"
                .to_string(),
            tx_hash: tx_hash.to_string(),
            router_address: router.to_string(),
            token_address: format!("0x{token_addr}"),
            amount_u256_hex: norm_u256_hex("0x1"),
            to_country_u256_hex: norm_u256_hex("0x2"),
            to_stakers_u256_hex: norm_u256_hex("0x3"),
            to_reserve_u256_hex: norm_u256_hex("0x4"),
            to_ops_u256_hex: norm_u256_hex("0x5"),
            inserted_at: Utc::now(),
        };

        let mut cfg = ChainConfig::default();
        cfg.rpc_url = format!("http://{}", addr);
        cfg.chain_id = 31337;
        cfg.fee_router_address = Some(router.to_string());

        let out = verify_fee_router_row_vs_chain(&cfg, &row, router, &topic0).await;
        assert_eq!(out.get("ok"), Some(&json!(true)), "expected ok:true, got {out:?}");
        assert_eq!(out.get("tx_hash").and_then(|x| x.as_str()), Some(tx_hash));
    }
}
