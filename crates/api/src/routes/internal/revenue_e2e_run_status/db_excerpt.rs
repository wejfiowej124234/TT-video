//! **`orders` 行白名单摘录**（**L2**）。
use serde_json::{json, Value};

use crate::db::DbOrderRow;

pub(crate) fn db_order_row_excerpt(row: &DbOrderRow) -> Value {
    json!({
        "id": row.id.to_string(),
        "status": row.status,
        "escrow_address": row.escrow_address,
        "chain_id": row.chain_id,
        "amount": row.amount,
        "currency": row.currency,
        "created_at": row.created_at.to_rfc3339(),
        "updated_at": row.updated_at.to_rfc3339(),
    })
}
