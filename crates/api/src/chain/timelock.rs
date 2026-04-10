//! **`GovernanceTimelock.delay()`** 只读 **`eth_call`**（**TT-B110-SEQ6**）：Solidity **`uint256 public immutable delay`** 生成 **`delay()`** getter（任务卡 **`getDelay()`** 口径映射为此符号）。
//! **`governor()` / `admin()`** 地址 getter（**TT-B110-SEQ9**）：**`address public`**，运行时可变；对拍语义见 **`governance_timelock_governor_admin_ssot`**。

use digest::Digest;
use sha3::Keccak256;

use super::ChainConfig;

fn selector4(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

fn normalize_timelock_call_to(a: &str) -> String {
    let t = a.trim();
    if t.starts_with("0x") || t.starts_with("0X") {
        t.to_string()
    } else {
        format!("0x{}", t)
    }
}

fn normalize_address_lower(s: &str) -> String {
    let t = s.trim();
    let hex = t
        .strip_prefix("0x")
        .or_else(|| t.strip_prefix("0X"))
        .unwrap_or(t);
    format!("0x{}", hex.to_ascii_lowercase())
}

fn decode_eth_call_address_result(hex_res: &str) -> Option<String> {
    let s = hex_res.trim().trim_start_matches("0x").trim_start_matches("0X");
    let raw = hex::decode(s).ok()?;
    if raw.len() < 32 {
        return None;
    }
    let addr = &raw[raw.len() - 20..];
    Some(normalize_address_lower(&format!("0x{}", hex::encode(addr))))
}

/// **`governor()`** / **`admin()`** 等 **`address`** 视图 getter；返回 **小写 **`0x`**** 规范串。
pub async fn eth_call_timelock_address_getter(
    rpc_url: &str,
    timelock: &str,
    method_sig: &str,
) -> Result<String, String> {
    let sel = selector4(method_sig);
    let hex_data = format!("0x{}", hex::encode(sel));
    let to = normalize_timelock_call_to(timelock);
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{ "to": to, "data": hex_data }, "latest"],
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
    let r = res
        .get("result")
        .and_then(|x| x.as_str())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or_else(|| "eth_call timelock address getter failed")
                .to_string()
        })?;
    decode_eth_call_address_result(r).ok_or_else(|| "decode timelock address getter failed".to_string())
}

/// 独立 **`eth_call`** 探针：与 **`governance_timelock_delay_ssot`** resolution 对拍。
#[derive(Debug, Clone, serde::Serialize)]
pub struct TimelockDelayProbe {
    pub probe_leg: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delay_seconds: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

pub async fn probe_timelock_delay_chain(chain_config: Option<&ChainConfig>) -> TimelockDelayProbe {
    let Some(c) = chain_config else {
        return TimelockDelayProbe {
            probe_leg: "skipped_no_chain_config",
            delay_seconds: None,
            detail: None,
        };
    };
    if !c.is_configured() {
        return TimelockDelayProbe {
            probe_leg: "skipped_rpc_unconfigured",
            delay_seconds: None,
            detail: None,
        };
    }
    let tl = match c
        .governance_timelock_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        Some(x) => x,
        None => {
            return TimelockDelayProbe {
                probe_leg: "skipped_no_timelock",
                delay_seconds: None,
                detail: None,
            };
        }
    };
    let rpc = c.rpc_url.trim();
    match crate::chain::governor::eth_call_governor_uint256_getter(rpc, tl, "delay()").await {
        Ok(s) => TimelockDelayProbe {
            probe_leg: "eth_call_all_ok",
            delay_seconds: Some(s),
            detail: None,
        },
        Err(e) => TimelockDelayProbe {
            probe_leg: "eth_call_failed",
            delay_seconds: None,
            detail: Some(e),
        },
    }
}

/// **TT-B110-SEQ9**：**`GovernanceTimelock`** **`governor()`** + **`admin()`** 独立双 **`eth_call`** 探针。
#[derive(Debug, Clone, serde::Serialize)]
pub struct TimelockGovernorAdminProbe {
    pub probe_leg: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub governor_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub admin_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

pub async fn probe_timelock_governor_admin_chain(
    chain_config: Option<&ChainConfig>,
) -> TimelockGovernorAdminProbe {
    let Some(c) = chain_config else {
        return TimelockGovernorAdminProbe {
            probe_leg: "skipped_no_chain_config",
            governor_address: None,
            admin_address: None,
            detail: None,
        };
    };
    if !c.is_configured() {
        return TimelockGovernorAdminProbe {
            probe_leg: "skipped_rpc_unconfigured",
            governor_address: None,
            admin_address: None,
            detail: None,
        };
    }
    let tl = match c
        .governance_timelock_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        Some(x) => x,
        None => {
            return TimelockGovernorAdminProbe {
                probe_leg: "skipped_no_timelock",
                governor_address: None,
                admin_address: None,
                detail: None,
            };
        }
    };
    let rpc = c.rpc_url.trim();
    let g = eth_call_timelock_address_getter(rpc, tl, "governor()").await;
    let a = eth_call_timelock_address_getter(rpc, tl, "admin()").await;
    match (&g, &a) {
        (Ok(gv), Ok(av)) => TimelockGovernorAdminProbe {
            probe_leg: "eth_call_all_ok",
            governor_address: Some(gv.clone()),
            admin_address: Some(av.clone()),
            detail: None,
        },
        (Err(e1), Err(e2)) => TimelockGovernorAdminProbe {
            probe_leg: "eth_call_failed",
            governor_address: None,
            admin_address: None,
            detail: Some(format!("governor: {}; admin: {}", e1, e2)),
        },
        _ => {
            let detail = match (&g, &a) {
                (Err(e1), Ok(_)) => format!("governor eth_call failed: {}", e1),
                (Ok(_), Err(e2)) => format!("admin eth_call failed: {}", e2),
                _ => "partial unexpected".to_string(),
            };
            TimelockGovernorAdminProbe {
                probe_leg: "eth_call_partial",
                governor_address: g.as_ref().ok().cloned(),
                admin_address: a.as_ref().ok().cloned(),
                detail: Some(detail),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seq9_governor_admin_selectors_stable_for_eth_call() {
        assert_eq!(
            hex::encode(selector4("governor()")),
            "0c340a24",
            "GovernanceTimelock.governor() selector"
        );
        assert_eq!(
            hex::encode(selector4("admin()")),
            "f851a440",
            "GovernanceTimelock.admin() selector"
        );
    }
}
