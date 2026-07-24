//! Resend HTTP API（`TRAVELTRUST_EMAIL_TRANSPORT=resend`）。**不**改变 **`auth_email_tokens`** 仅存 **HMAC** 的设计；仅替代 **`log`** 的投递层。

use std::time::Duration;

use serde_json::json;

const DEFAULT_RESEND_API_BASE: &str = "https://api.resend.com";

fn resend_api_base() -> String {
    std::env::var("TRAVELTRUST_RESEND_API_BASE")
        .ok()
        .map(|s| s.trim().trim_end_matches('/').to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_RESEND_API_BASE.to_string())
}

/// Resend 发件人（须为 Resend 已验证域），例：`TravelTrust <noreply@yourdomain.com>`。
pub fn read_resend_from() -> Option<String> {
    std::env::var("TRAVELTRUST_RESEND_FROM")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

pub fn read_resend_api_key() -> Option<String> {
    std::env::var("TRAVELTRUST_RESEND_API_KEY")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// `POST /emails`；失败返回人读错误串（**不含** API Key）。
/// `html_body` 可选；有则 Resend 同时投递 HTML + 纯文本（客户端择优渲染）。
pub async fn send_via_resend(
    to_email: &str,
    subject: &str,
    text_body: &str,
    html_body: Option<&str>,
) -> Result<(), String> {
    let api_key = read_resend_api_key().ok_or_else(|| {
        "TRAVELTRUST_RESEND_API_KEY missing or empty (required when TRAVELTRUST_EMAIL_TRANSPORT=resend)"
            .to_string()
    })?;
    let from = read_resend_from().ok_or_else(|| {
        "TRAVELTRUST_RESEND_FROM missing or empty (required when TRAVELTRUST_EMAIL_TRANSPORT=resend)"
            .to_string()
    })?;
    let base = resend_api_base();
    let url = format!("{}/emails", base);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(25))
        .build()
        .map_err(|e| format!("resend_http_client_build_failed: {e}"))?;
    // List-Unsubscribe + Reply-To 有助于部分客户端降 spam 分；无追踪像素依赖（正文无 tracking）。
    let mut body = json!({
        "from": from,
        "to": [to_email],
        "subject": subject,
        "text": text_body,
        "headers": {
            "List-Unsubscribe": "<mailto:noreply@web3-ttg.com?subject=unsubscribe>",
            "X-Entity-Ref-ID": "traveltrust-auth",
        },
        "tags": [
            { "name": "category", "value": "auth_transactional" }
        ],
    });
    if let Some(html) = html_body.filter(|s| !s.trim().is_empty()) {
        body.as_object_mut()
            .expect("resend body object")
            .insert("html".to_string(), json!(html));
    }
    let resp = client
        .post(&url)
        .header("Authorization", format!("Bearer {api_key}"))
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("resend_http_send_failed: {e}"))?;
    if resp.status().is_success() {
        return Ok(());
    }
    let status = resp.status();
    let txt = resp
        .text()
        .await
        .unwrap_or_else(|_| "<body unreadable>".to_string());
    let snippet: String = txt.chars().take(512).collect();
    Err(format!(
        "resend_http_non_success: status={status} body_snippet={snippet}"
    ))
}
