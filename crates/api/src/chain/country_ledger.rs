//! P5-1-B：**CountryPoolLedgerV0** `CountryLedgerCredited` 解码（与 **B-116** `fee_router_verify` 模式平行，**不**复用其表）
//! P5-1-C：合约 **view** 只读（**`GET …/governance/country-ledger/{j}`**），与 **B-110** 池键 **正交**。

use sha3::{Digest, Keccak256};

/// `pilotJurisdiction()`
const SEL_PILOT_JURISDICTION: [u8; 4] = [0x31, 0xfe, 0xd6, 0xbc];
/// `balance(address)`
const SEL_BALANCE: [u8; 4] = [0xe3, 0xd6, 0x70, 0xd7];
/// `totalCredited(bytes2,address)`
const SEL_TOTAL_CREDITED: [u8; 4] = [0x65, 0x3e, 0x7a, 0x6c];
/// `version()`
const SEL_VERSION: [u8; 4] = [0x54, 0xfd, 0x4d, 0x50];

/// 规范 **0x + 40 hex**（响应体展示与 **`eth_call` `to`** 一致）
#[must_use]
pub fn normalize_evm_address(a: &str) -> String {
    norm_hex_addr40(a)
}

fn norm_hex_addr40(a: &str) -> String {
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

fn eth_call_uint256_result_to_norm_hex(hex_result: &str) -> Result<String, String> {
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    let slot = &raw[raw.len() - 32..];
    Ok(norm_u256_hex(&format!("0x{}", hex::encode(slot))))
}

/// 路径/查询 **jurisdiction** → ABI **`bytes2`** 左填 32 字（与 **Solidity** 编码一致）。
pub fn jurisdiction_id_to_abi_word_hex(j: &str) -> Result<String, String> {
    let j = j.trim();
    let b = j.as_bytes();
    if b.len() != 2
        || !b[0].is_ascii_alphabetic()
        || !b[1].is_ascii_alphabetic()
    {
        return Err("jurisdiction must be exactly two ASCII letters".to_string());
    }
    let mut w = [0u8; 32];
    w[30] = b[0].to_ascii_uppercase();
    w[31] = b[1].to_ascii_uppercase();
    Ok(hex::encode(w))
}

/// `pilotJurisdiction()` 返回槽解码为 **两字母** `jurisdiction_id`。
pub fn decode_pilot_jurisdiction_result(result_hex: &str) -> Result<String, String> {
    let raw = hex::decode(result_hex.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("pilotJurisdiction result too short".to_string());
    }
    let j0 = raw[raw.len() - 32 + 30];
    let j1 = raw[raw.len() - 32 + 31];
    if !j0.is_ascii_alphabetic() || !j1.is_ascii_alphabetic() {
        return Err("pilotJurisdiction not two ASCII letters".to_string());
    }
    Ok(format!(
        "{}{}",
        char::from(j0.to_ascii_uppercase()),
        char::from(j1.to_ascii_uppercase())
    ))
}

fn u256_word_first_u64(w: &[u8]) -> u64 {
    let mut u: u64 = 0;
    for b in w.iter().take(32) {
        u = u.saturating_mul(256).saturating_add(*b as u64);
    }
    u
}

/// `version()` 动态 **`string`** 返回值解码。
pub fn decode_version_string_result(result_hex: &str) -> Result<String, String> {
    let raw = hex::decode(result_hex.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 64 {
        return Err("version() result too short".to_string());
    }
    let off = u256_word_first_u64(&raw[0..32]) as usize;
    if off + 32 > raw.len() {
        return Err("version string offset out of range".to_string());
    }
    let len = u256_word_first_u64(&raw[off..off + 32]) as usize;
    let start = off + 32;
    if start + len > raw.len() {
        return Err("version string length out of range".to_string());
    }
    String::from_utf8(raw[start..start + len].to_vec()).map_err(|e| e.to_string())
}

async fn eth_call_data(rpc_url: &str, to: &str, data: &str) -> Result<String, String> {
    let to = norm_hex_addr40(to);
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": to, "data": data}, "latest"],
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
    res.get("result")
        .and_then(|r| r.as_str())
        .map(std::string::ToString::to_string)
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_call failed")
                .to_string()
        })
}

/// **`CountryPoolLedgerV0.pilotJurisdiction()`**
pub async fn eth_call_country_ledger_pilot_jurisdiction(
    rpc_url: &str,
    ledger_contract: &str,
) -> Result<String, String> {
    let data = format!("0x{}", hex::encode(SEL_PILOT_JURISDICTION));
    let r = eth_call_data(rpc_url, ledger_contract, &data).await?;
    decode_pilot_jurisdiction_result(&r)
}

/// **`CountryPoolLedgerV0.balance(token)`**
pub async fn eth_call_country_ledger_balance(
    rpc_url: &str,
    ledger_contract: &str,
    token: &str,
) -> Result<String, String> {
    let token_w = norm_hex_addr40(token);
    let tw = token_w.strip_prefix("0x").ok_or("token address invalid")?;
    let arg = format!("{:0>64}", tw);
    let data = format!("0x{}{}", hex::encode(SEL_BALANCE), arg);
    let r = eth_call_data(rpc_url, ledger_contract, &data).await?;
    eth_call_uint256_result_to_norm_hex(&r)
}

/// **`CountryPoolLedgerV0.totalCredited(jurisdiction, token)`**
pub async fn eth_call_country_ledger_total_credited(
    rpc_url: &str,
    ledger_contract: &str,
    jurisdiction_abi_word_hex64: &str,
    token: &str,
) -> Result<String, String> {
    let jh = jurisdiction_abi_word_hex64
        .trim_start_matches("0x")
        .to_ascii_lowercase();
    if jh.len() != 64 {
        return Err("jurisdiction word must be 64 hex chars".to_string());
    }
    let token_w = norm_hex_addr40(token);
    let tw = token_w.strip_prefix("0x").ok_or("token address invalid")?;
    let arg2 = format!("{:0>64}", tw);
    let data = format!(
        "0x{}{}{}",
        hex::encode(SEL_TOTAL_CREDITED),
        jh,
        arg2
    );
    let r = eth_call_data(rpc_url, ledger_contract, &data).await?;
    eth_call_uint256_result_to_norm_hex(&r)
}

/// **`CountryPoolLedgerV0.version()`**
pub async fn eth_call_country_ledger_version_string(
    rpc_url: &str,
    ledger_contract: &str,
) -> Result<String, String> {
    let data = format!("0x{}", hex::encode(SEL_VERSION));
    let r = eth_call_data(rpc_url, ledger_contract, &data).await?;
    decode_version_string_result(&r)
}

/// 与 `contracts/src/CountryPoolLedgerV0.sol` 一致
pub const COUNTRY_LEDGER_CREDITED_EVENT_SIGNATURE: &[u8] =
    b"CountryLedgerCredited(bytes2,address,uint256,bytes32)";

#[must_use]
pub fn country_ledger_credited_topic0_hex() -> String {
    let h = Keccak256::digest(COUNTRY_LEDGER_CREDITED_EVENT_SIGNATURE);
    format!("0x{}", hex::encode(h))
}

/// 解析 **CountryLedgerCredited**：`topics[1]` = jurisdiction（bytes2 右对齐），`topics[2]` = token，`data` = amount∥ref。
pub fn parse_country_ledger_credited(
    topics: &[String],
    data: &serde_json::Value,
) -> Option<(String, String, String, String)> {
    if topics.len() < 3 {
        return None;
    }
    let t1 = hex::decode(topics[1].trim_start_matches("0x")).ok()?;
    if t1.len() != 32 {
        return None;
    }
    let j0 = t1[30];
    let j1 = t1[31];
    let jurisdiction_id = if j0.is_ascii_uppercase() && j1.is_ascii_uppercase() {
        String::from_utf8(vec![j0, j1]).ok()?
    } else {
        format!("{:02X}{:02X}", j0, j1)
    };
    let token = topic_to_address_hex(topics.get(2)?)?;
    let data_str = data.as_str()?;
    let raw = hex::decode(data_str.trim_start_matches("0x")).ok()?;
    if raw.len() < 64 {
        return None;
    }
    let amount_hex = format!("0x{}", hex::encode(&raw[0..32]));
    let ref_hex = format!("0x{}", hex::encode(&raw[32..64]));
    Some((jurisdiction_id, token, amount_hex, ref_hex))
}

fn topic_to_address_hex(topic: &str) -> Option<String> {
    let b = hex::decode(topic.trim_start_matches("0x")).ok()?;
    if b.len() != 32 {
        return None;
    }
    Some(format!("0x{}", hex::encode(&b[12..32])))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn topic0_matches_cast_sig_event() {
        assert_eq!(
            country_ledger_credited_topic0_hex().to_ascii_lowercase(),
            "0x75fbffb1586e731cb51112bb599ae72cfabfdefa0c0be0f3e6616958c84833d9"
        );
    }

    #[test]
    fn decode_version_country_ledger_ssot_v0() {
        let h = "0x0000000000000000000000000000000000000000000000000000000000000020\
                 0000000000000000000000000000000000000000000000000000000000000016\
                 636f756e7472795f6c65646765725f73736f745f763000000000000000000000";
        let s = decode_version_string_result(h).expect("decode");
        assert_eq!(s, "country_ledger_ssot_v0");
    }

    #[test]
    fn decode_pilot_de() {
        let h = "0x0000000000000000000000000000000000000000000000000000000000004445";
        assert_eq!(decode_pilot_jurisdiction_result(h).unwrap(), "DE");
    }

    #[test]
    fn parse_de_and_amount_ref() {
        let topic0 = country_ledger_credited_topic0_hex();
        let topic1 =
            "0x0000000000000000000000000000000000000000000000000000000000004445".to_string();
        let topic2 =
            "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
        let topics = vec![topic0, topic1, topic2];
        let data = json!("0x000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000ff");
        let (j, tok, amt, rf) =
            parse_country_ledger_credited(&topics, &data).expect("parse");
        assert_eq!(j, "DE");
        assert_eq!(
            tok.to_ascii_lowercase(),
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        );
        assert_eq!(
            amt.to_ascii_lowercase(),
            "0x000000000000000000000000000000000000000000000000000000000000002a"
        );
        assert_eq!(
            rf.to_ascii_lowercase(),
            "0x00000000000000000000000000000000000000000000000000000000000000ff"
        );
    }
}
