//! P0 **`balance_lines_v1`**（04 §3.4）— **`GET /api/v1/governance/pool`** 与 reconcile 二验共用。

use serde_json::{json, Value};

/// 与 `routes/governance/governance_pool.rs` 的 **`attach_balance_lines_v1`** 同源（additive 四行）。
pub fn balance_lines_v1_from_parts(
    pool_balance: Option<String>,
    pool_currency: Option<String>,
    country_pool: Option<String>,
    treasury_pool: Option<String>,
    treasury_erc20_pool: Option<String>,
    treasury_erc20_currency: Option<String>,
) -> Vec<Value> {
    let mut lines: Vec<Value> = Vec::new();
    lines.push(json!({
        "balance": pool_balance,
        "track_type": "A",
        "source": "FeeRouter",
        "currency": pool_currency
    }));
    lines.push(json!({
        "balance": country_pool,
        "track_type": "A",
        "source": "RegionVault",
        "currency": pool_currency
    }));
    lines.push(json!({
        "balance": treasury_pool,
        "track_type": "B",
        "source": "Treasury",
        "currency": "native"
    }));
    lines.push(json!({
        "balance": treasury_erc20_pool,
        "track_type": "B",
        "source": "Treasury",
        "currency": treasury_erc20_currency
    }));
    lines
}
