//! **Task B-1**：辖区 → **CountryPoolLedger** 地址的 **独立配置模板**（与 **`ChainConfig.COUNTRY_POOL_LEDGER_ADDRESS`** **无回落**）。
//!
//! - **禁止**从 **`fee_router`** / **`p5_country_ledger_lines`** 等 **推导** 本注册表。
//! - 供 **`GET /api/v1/country-ledger/:jurisdiction`** 声明 **`data_source: chain_ssot`** 的 **配置命中** 口径。

use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;

const ENV_CONFIG_PATH: &str = "JURISDICTION_COUNTRY_LEDGER_CONFIG_PATH";

/// 启动时自 **`JURISDICTION_COUNTRY_LEDGER_CONFIG_PATH`** 加载；未设置或读失败 → **空注册表**（路由 **404**，**不**回落单址 env）。
#[derive(Debug, Clone, Default)]
pub struct JurisdictionCountryLedgerRegistry {
    /// 两字母大写辖区 → 规范化 **`0x` + 40 hex** 账本合约地址
    by_jurisdiction: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
struct FileRoot {
    #[serde(default)]
    entries: Vec<FileEntry>,
}

#[derive(Debug, Deserialize)]
struct FileEntry {
    jurisdiction: String,
    #[serde(rename = "COUNTRY_POOL_LEDGER_ADDRESS")]
    country_pool_ledger_address: String,
}

impl JurisdictionCountryLedgerRegistry {
    #[must_use]
    pub fn empty() -> Self {
        Self {
            by_jurisdiction: HashMap::new(),
        }
    }

    /// 自环境变量路径加载；路径缺失/空/读失败 → 空注册表并 **`eprintln`**（**不**失败启动）。
    #[must_use]
    pub fn from_env() -> Self {
        let path = match std::env::var(ENV_CONFIG_PATH) {
            Ok(p) if !p.trim().is_empty() => p,
            _ => return Self::empty(),
        };
        Self::load_from_path(Path::new(path.trim())).unwrap_or_else(|e| {
            eprintln!(
                "JurisdictionCountryLedgerRegistry: {}={} load failed: {}; registry empty (no fallback)",
                ENV_CONFIG_PATH,
                path.trim(),
                e
            );
            Self::empty()
        })
    }

    pub fn load_from_path(path: &Path) -> Result<Self, String> {
        let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
        Self::parse_json(&bytes)
    }

    pub fn parse_json(bytes: &[u8]) -> Result<Self, String> {
        let root: FileRoot = serde_json::from_slice(bytes).map_err(|e| e.to_string())?;
        let mut by_jurisdiction = HashMap::new();
        for e in root.entries {
            let Ok(j) = normalize_jurisdiction_key(&e.jurisdiction) else {
                continue;
            };
            if !ledger_address_acceptable(&e.country_pool_ledger_address) {
                continue;
            }
            let addr = crate::chain::country_ledger::normalize_evm_address(
                e.country_pool_ledger_address.trim(),
            );
            by_jurisdiction.insert(j, addr);
        }
        Ok(Self { by_jurisdiction })
    }

    #[must_use]
    pub fn from_map(map: HashMap<String, String>) -> Self {
        Self {
            by_jurisdiction: map,
        }
    }

    /// 是否在本 **模板** 中为该辖区配置了 **非零** 账本地址（**不**读库、**不**读 **`ChainConfig`**）。
    #[must_use]
    pub fn has_chain_ssot_entry(&self, jurisdiction_upper: &str) -> bool {
        self.by_jurisdiction.contains_key(jurisdiction_upper)
    }

    #[must_use]
    pub fn arc_from_env() -> Arc<Self> {
        Arc::new(Self::from_env())
    }
}

fn normalize_jurisdiction_key(raw: &str) -> Result<String, ()> {
    let j = raw.trim().to_ascii_uppercase();
    if j.len() != 2 || !j.chars().all(|c| c.is_ascii_alphabetic()) {
        return Err(());
    }
    Ok(j)
}

fn ledger_address_acceptable(raw: &str) -> bool {
    let s = raw.trim();
    if s.is_empty() {
        return false;
    }
    let n = crate::chain::country_ledger::normalize_evm_address(s);
    let Some(h) = n.strip_prefix("0x") else {
        return false;
    };
    if h.len() != 40 || !h.chars().all(|c| c.is_ascii_hexdigit()) {
        return false;
    }
    h.chars().any(|c| c != '0')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_skips_invalid_jurisdiction_and_zero_address() {
        let j = br#"
        {
          "entries": [
            { "jurisdiction": "CN", "COUNTRY_POOL_LEDGER_ADDRESS": "0x1111111111111111111111111111111111111111" },
            { "jurisdiction": "BAD", "COUNTRY_POOL_LEDGER_ADDRESS": "0x2222222222222222222222222222222222222222" },
            { "jurisdiction": "DE", "COUNTRY_POOL_LEDGER_ADDRESS": "0x0000000000000000000000000000000000000000" }
          ]
        }"#;
        let r = JurisdictionCountryLedgerRegistry::parse_json(j).unwrap();
        assert!(r.has_chain_ssot_entry("CN"));
        assert!(!r.has_chain_ssot_entry("DE"));
        assert!(!r.has_chain_ssot_entry("BAD"));
    }
}
