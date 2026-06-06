//! 夹具密码常量与 PG 双写订单 UUID 前缀门闸（与 **`fixture_order_ids_match_pg_upsert_prefix_gate`** 对拍）。

use uuid::Uuid;

pub(crate) const SEED_PASSWORD: &str = "Test123!";

/// 本夹具写入的订单 UUID 前缀（与 `TrustGateFixtureIds` 内 `o_*` / `o_risk_*` 一致），用于 PG 双写时避免误 `upsert` 非夹具行。
pub(crate) fn is_trust_gate_seeded_order_id(id: Uuid) -> bool {
    let s = id.hyphenated().to_string();
    s.starts_with("f0e0c201-0001-4001-8001-") || s.starts_with("f0e0e401-0001-4001-8001-")
}
