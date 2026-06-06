//! Admin 导出响应头与摘要：**SHA-256** / **Ed25519**（**`GET …/region-vault/…/export`** 与 **indexer reconcile export** 共用）。
use ed25519_dalek::Signer;

/// 对账报告 **CSV/JSON** 导出响应体完整性：**SHA-256** 头恒有；**Ed25519** 头 **`x-traveltrust-reconcile-export-ed25519`** 仅当配置 **`RECONCILE_EXPORT_ED25519_SEED_HEX`**（公钥见 **`GET /meta.admin_exports`**）。
pub(crate) const RECONCILE_EXPORT_BODY_SHA256_HEADER: &str =
    "x-traveltrust-reconcile-export-sha256";
/// **`export_scope=all`** 时单次导出**最多**行数（与当前筛选一致；**200** 跨页聚合硬上限）。
pub(crate) const ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS: i64 = 2000;
pub(crate) const RECONCILE_EXPORT_TRUNCATED_HEADER: &str =
    "x-traveltrust-reconcile-export-truncated";
pub(crate) const RECONCILE_EXPORT_ED25519_HEADER: &str = "x-traveltrust-reconcile-export-ed25519";

pub(crate) fn reconcile_export_ed25519_hex(
    key: Option<&ed25519_dalek::SigningKey>,
    body: &[u8],
) -> Option<String> {
    let k = key?;
    Some(hex::encode(k.sign(body).to_bytes()))
}

pub(crate) fn reconcile_export_response_sha256_hex(body: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    hex::encode(Sha256::digest(body))
}
