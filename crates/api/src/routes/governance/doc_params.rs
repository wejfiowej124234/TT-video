//! `protocol-reference`*、`/params`（**TT-MOD-B3-05 · `doc_params`**）。

use axum::http::header::{HeaderName, HeaderValue};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::routes::governance_doc_reference;

use super::common::add_placeholder_header;

/// `GET …/protocol-reference` 的 **`X-Implementation-Status`**（P5-5-2；与 04 §3.4 契约一致）。
pub(crate) const GOV_HTTP_IMPL_STATUS_DOC_REFERENCE: &str = "doc-reference";
/// `GET …/protocol-reference/pending` 的 **`X-Implementation-Status`**。
pub(crate) const GOV_HTTP_IMPL_STATUS_DOC_REFERENCE_PENDING: &str = "doc-reference-pending";

/// GET /api/v1/governance/protocol-reference — 84 文档镜像（非链上真值）
pub async fn get_protocol_reference() -> impl IntoResponse {
    let mut res = Json(governance_doc_reference::protocol_reference_json()).into_response();
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static(GOV_HTTP_IMPL_STATUS_DOC_REFERENCE),
    );
    res
}

/// GET /api/v1/governance/protocol-reference/pending — 待生效参数包（默认与文档镜像一致；可选 env 深度合并）
pub async fn get_protocol_reference_pending() -> impl IntoResponse {
    let mut res =
        Json(governance_doc_reference::protocol_reference_pending_json()).into_response();
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static(GOV_HTTP_IMPL_STATUS_DOC_REFERENCE_PENDING),
    );
    res
}

/// GET /api/v1/governance/params — 治理参数聚合占位（`/governance/params` 页主数据仍为 protocol-reference + pending）
pub async fn get_governance_params() -> impl IntoResponse {
    let mut res = Json(json!({
        "status": "ok",
        "params": {},
        "items": [],
        "data_source": "placeholder",
        "protocol_reference_doc_version": governance_doc_reference::DOC_VERSION,
        "protocol_reference_reads": [
            {
                "relative_path": "/api/v1/governance/protocol-reference",
                "x_implementation_status": GOV_HTTP_IMPL_STATUS_DOC_REFERENCE
            },
            {
                "relative_path": "/api/v1/governance/protocol-reference/pending",
                "x_implementation_status": GOV_HTTP_IMPL_STATUS_DOC_REFERENCE_PENDING
            }
        ],
        "note": "49 G 占位：五项费用等对拍见 GET …/protocol-reference 与 …/pending；本端点为契约占位"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}
