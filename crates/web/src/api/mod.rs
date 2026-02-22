//! Frontend calling Backend API (docs/04). Hard rule: 唯一数据源=后端 API.

use futures::future::Either;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct MetaResponse {
    pub service: String,
    pub api_version: String,
    pub ssot_version: String,

    #[serde(default)]
    pub finality_n: Option<u64>,

    #[serde(default)]
    pub strict_mode: Option<StrictModeMeta>,

    #[serde(default)]
    pub authority: Option<AuthorityMeta>,

    #[serde(default)]
    pub pause: Option<PauseMeta>,

    #[serde(default)]
    pub indexer: Option<IndexerMeta>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct StrictModeMeta {
    #[serde(default)]
    pub strict_ssot: bool,
    #[serde(default)]
    pub require_idempotency_key: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct AuthorityMeta {
    pub source: String,
    #[serde(default)]
    pub degraded_mode: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct PauseMeta {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub api_allowlist: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct IndexerMeta {
    #[serde(default)]
    pub reorg_detected: bool,
    #[serde(default)]
    pub lag_blocks: u64,
    #[serde(default)]
    pub lag_max_blocks: u64,
    #[serde(default)]
    pub last_seen_finality_n: u64,
    #[serde(default)]
    pub replay_required: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MeResponse {
    pub status: String,
    pub user: serde_json::Value,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ListResponse<T> {
    #[allow(dead_code)]
    pub status: String,
    pub items: Vec<T>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct OrderSummary {
    pub id: String,
    pub status: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DisputeSummary {
    pub id: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SignedIntentRequest {
    pub chain_id: u64,
    pub verifying_contract: String,
    pub signer: String,
    pub signature: String,
    pub typed_data: serde_json::Value,
    pub intent_nonce: Option<String>,
    pub intent_ts_ms: Option<i64>,
}

/// Backend base URL.
pub fn api_base_url() -> String {
    option_env!("VITE_API_BASE_URL")
        .unwrap_or("http://localhost:3000")
        .to_string()
}

fn new_request_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn new_idempotency_key() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn new_message_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn write_timeout() -> Duration {
    // P0: 写操作必须可超时并进入“查询状态”恢复路径；超时后不得假设成功/失败。
    // 这里设置一个保守超时，避免弱网/挂起导致用户误判。
    Duration::from_secs(15)
}

async fn send_with_timeout(
    req: gloo_net::http::Request,
    timeout: Duration,
) -> Result<gloo_net::http::Response, String> {
    let send_fut = req.send();
    let timeout_ms: u32 = timeout
        .as_millis()
        .min(u128::from(u32::MAX))
        .try_into()
        .unwrap_or(u32::MAX);
    let timeout_fut = gloo_timers::future::TimeoutFuture::new(timeout_ms);

    futures::pin_mut!(send_fut);
    futures::pin_mut!(timeout_fut);

    match futures::future::select(send_fut, timeout_fut).await {
        Either::Left((resp, _timeout)) => resp.map_err(|e| e.to_string()),
        Either::Right((_unit, _send_fut)) => Err(format!(
            "timeout after {}s",
            timeout.as_secs().max(1)
        )),
    }
}

async fn parse_json<T: for<'de> Deserialize<'de>>(
    resp: gloo_net::http::Response,
) -> Result<T, String> {
    let status = resp.status();
    let txt = resp.text().await.map_err(|e| e.to_string())?;
    if !(200..=299).contains(&status) {
        return Err(format!("http {}: {}", status, txt));
    }
    serde_json::from_str(&txt).map_err(|e| format!("json parse: {} body={}", e, txt))
}

/// GET /health
pub async fn get_health() -> Result<String, String> {
    let url = format!("{}/health", api_base_url());
    gloo_net::http::Request::get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())
}

/// GET /meta
pub async fn get_meta() -> Result<MetaResponse, String> {
    let url = format!("{}/meta", api_base_url());
    let resp = gloo_net::http::Request::get(&url)
        .header("x-request-id", &new_request_id())
        .send()
        .await
        .map_err(|e| e.to_string())?;
    parse_json(resp).await
}

/// GET /api/v1/me
pub async fn get_me() -> Result<MeResponse, String> {
    let url = format!("{}/api/v1/me", api_base_url());
    let resp = gloo_net::http::Request::get(&url)
        .header("x-request-id", &new_request_id())
        .send()
        .await
        .map_err(|e| e.to_string())?;
    parse_json(resp).await
}

/// GET /api/v1/orders
pub async fn list_orders() -> Result<ListResponse<OrderSummary>, String> {
    let url = format!("{}/api/v1/orders", api_base_url());
    let resp = gloo_net::http::Request::get(&url)
        .header("x-request-id", &new_request_id())
        .send()
        .await
        .map_err(|e| e.to_string())?;
    parse_json(resp).await
}

/// GET /api/v1/disputes
pub async fn list_disputes() -> Result<ListResponse<DisputeSummary>, String> {
    let url = format!("{}/api/v1/disputes", api_base_url());
    let resp = gloo_net::http::Request::get(&url)
        .header("x-request-id", &new_request_id())
        .send()
        .await
        .map_err(|e| e.to_string())?;
    parse_json(resp).await
}

/// GET /api/v1/orders/:id
pub async fn get_order_by_id(order_id: &str) -> Result<serde_json::Value, String> {
    let url = format!("{}/api/v1/orders/{}", api_base_url(), order_id);
    let resp = gloo_net::http::Request::get(&url)
        .header("x-request-id", &new_request_id())
        .send()
        .await
        .map_err(|e| e.to_string())?;
    parse_json(resp).await
}

/// POST /api/v1/orders/:id/confirm-completion (signed intent)
pub async fn post_confirm_completion_intent(
    order_id: &str,
    body: &SignedIntentRequest,
    request_id: Option<&str>,
    idempotency_key: Option<&str>,
) -> Result<serde_json::Value, String> {
    let url = format!("{}/api/v1/orders/{}/confirm-completion", api_base_url(), order_id);
    let request_id = request_id.map(|s| s.to_string()).unwrap_or_else(new_request_id);
    let idempotency_key = idempotency_key
        .map(|s| s.to_string())
        .unwrap_or_else(new_idempotency_key);
    let req = gloo_net::http::Request::post(&url)
        .header("x-request-id", &request_id)
        .header("x-message-id", &new_message_id())
        // Spec要求：写请求必须带 X-Idempotency-Key + x-request-id。
        // 为了兼容历史/中间件，也同时带 Idempotency-Key（同值）。
        .header("X-Idempotency-Key", &idempotency_key)
        .header("Idempotency-Key", &idempotency_key)
        .json(body)
        .map_err(|e| e.to_string())?
        ;
    let resp = send_with_timeout(req, write_timeout()).await?;
    parse_json(resp).await
}

/// POST /api/v1/orders/:id/dispute (signed intent)
pub async fn post_open_dispute_intent(
    order_id: &str,
    body: &SignedIntentRequest,
    request_id: Option<&str>,
    idempotency_key: Option<&str>,
) -> Result<serde_json::Value, String> {
    let url = format!("{}/api/v1/orders/{}/dispute", api_base_url(), order_id);
    let request_id = request_id.map(|s| s.to_string()).unwrap_or_else(new_request_id);
    let idempotency_key = idempotency_key
        .map(|s| s.to_string())
        .unwrap_or_else(new_idempotency_key);
    let req = gloo_net::http::Request::post(&url)
        .header("x-request-id", &request_id)
        .header("x-message-id", &new_message_id())
        .header("X-Idempotency-Key", &idempotency_key)
        .header("Idempotency-Key", &idempotency_key)
        .json(body)
        .map_err(|e| e.to_string())?
        ;
    let resp = send_with_timeout(req, write_timeout()).await?;
    parse_json(resp).await
}
