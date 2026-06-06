use reqwest::header::{HeaderMap as ReqHeaderMap, HeaderValue, AUTHORIZATION};
use serde_json::Value;

pub(crate) fn stripe_http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .expect("reqwest client for stripe")
}

pub(crate) fn auth_bearer(secret_key: &str) -> Result<HeaderValue, &'static str> {
    HeaderValue::from_str(&format!("Bearer {secret_key}"))
        .map_err(|_| "invalid_stripe_secret_header")
}

pub(crate) async fn stripe_post_form(
    client: &reqwest::Client,
    secret_key: &str,
    path: &str,
    form_body: String,
    stripe_idempotency_key: Option<&str>,
) -> Result<Value, String> {
    let url = format!("https://api.stripe.com/v1/{path}");
    let mut headers = ReqHeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        auth_bearer(secret_key).map_err(|e| e.to_string())?,
    );
    headers.insert(
        reqwest::header::CONTENT_TYPE,
        HeaderValue::from_static("application/x-www-form-urlencoded"),
    );
    if let Some(idem) = stripe_idempotency_key {
        if let Ok(h) = HeaderValue::from_str(idem) {
            headers.insert(
                reqwest::header::HeaderName::from_static("stripe-idempotency-key"),
                h,
            );
        }
    };    let res = client
        .post(url)
        .headers(headers)
        .body(form_body)
        .send()
        .await
        .map_err(|e| format!("stripe_network:{e}"))?;
    let status = res.status();
    let text = res
        .text()
        .await
        .map_err(|e| format!("stripe_read_body:{e}"))?;
    let v: Value = serde_json::from_str(&text).unwrap_or(serde_json::json!({ "raw": text }));
    if !status.is_success() {
        let msg = v["error"]["message"].as_str().unwrap_or("stripe_error");
        return Err(format!("stripe_http_{status}: {msg}"));
    }
    Ok(v)
}

pub(crate) async fn stripe_get_json(
    client: &reqwest::Client,
    secret_key: &str,
    path: &str,
) -> Result<Value, String> {
    let url = format!("https://api.stripe.com/v1/{path}");
    let mut headers = ReqHeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        auth_bearer(secret_key).map_err(|e| e.to_string())?,
    );
    let res = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| format!("stripe_network:{e}"))?;
    let status = res.status();
    let text = res
        .text()
        .await
        .map_err(|e| format!("stripe_read_body:{e}"))?;
    let v: Value = serde_json::from_str(&text).unwrap_or(serde_json::json!({ "raw": text }));
    if !status.is_success() {
        let msg = v["error"]["message"].as_str().unwrap_or("stripe_error");
        return Err(format!("stripe_http_{status}: {msg}"));
    }
    Ok(v)
}
