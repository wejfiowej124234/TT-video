//! `GET /api/v1/governance/ttg-exchange/quote` — **96-18** TTG 兑换报价机读契约（① 合同面；真链兑接待 **②** 再接 Router/Treasury）。

use axum::extract::Query;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::{Duration, Utc};
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
pub struct TtgExchangeQuoteQuery {
    pub pay_stable: Option<String>,
    /// 可选；未实现定价时忽略，保留 query 形状供前端对拍
    pub pay_amount: Option<String>,
}

fn normalize_pay_stable(raw: Option<&str>) -> Result<&'static str, ()> {
    match raw.unwrap_or("USDC").trim().to_ascii_uppercase().as_str() {
        "USDC" => Ok("USDC"),
        _ => Err(()),
    }
}

pub async fn get_ttg_exchange_quote(Query(q): Query<TtgExchangeQuoteQuery>) -> impl IntoResponse {
    let pay_stable = match normalize_pay_stable(q.pay_stable.as_deref()) {
        Ok(s) => s,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_pay_stable",
                    "message": "invalid_pay_stable",
                    "allowed_pay_stablecoins": ["USDC"],
                })),
            )
                .into_response();
        }
    };    let expires_at = Utc::now() + Duration::hours(1);
    Json(json!({
        "status": "ok",
        "schema_version": 1,
        "pair_type": "stablecoin_to_governance_token",
        "pay_stable": pay_stable,
        "receive_symbol": "TTG",
        "receive_token_role": "governance",
        "pay_amount": q.pay_amount,
        "receive_amount": null,
        "rate": null,
        "expires_at": expires_at.to_rfc3339(),
        "escrow_settlement": {
            "allowed_pay_stablecoins": ["USDC"],
            "default_pay_stable": "USDC",
            "rule": "Trip Escrow and pool settlement use USDC (SETTLEMENT_TOKEN per 01). TTG exchange preview is USDC→TTG only; not a stablecoin swap path."
        },
        "meta": {
            "implementation_status": "ttg_exchange_quote_contract_only",
            "execute_path": null,
            "doc": "docs/spec/96-18-商家与主理人准入费用与治理币兑换设计.md"
        }
    }))
    .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request;
    use axum::routing::get;
    use axum::Router;
    use tower::ServiceExt;

    #[tokio::test]
    async fn quote_usdc_to_ttg_contract_shape() {
        let app = Router::new().route(
            "/api/v1/governance/ttg-exchange/quote",
            get(get_ttg_exchange_quote),
        );
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/governance/ttg-exchange/quote?pay_stable=USDC")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let body = axum::body::to_bytes(res.into_body(), usize::MAX)
            .await
            .unwrap();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["status"], "ok");
        assert_eq!(v["pair_type"], "stablecoin_to_governance_token");
        assert_eq!(v["pay_stable"], "USDC");
        assert_eq!(v["receive_symbol"], "TTG");
        assert_eq!(
            v["meta"]["implementation_status"],
            "ttg_exchange_quote_contract_only"
        );
    }

    #[tokio::test]
    async fn quote_rejects_stable_swap_narrative_fields_only_usdt_usdc() {
        let app = Router::new().route(
            "/api/v1/governance/ttg-exchange/quote",
            get(get_ttg_exchange_quote),
        );
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/governance/ttg-exchange/quote?pay_stable=DAI")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = axum::body::to_bytes(res.into_body(), usize::MAX)
            .await
            .unwrap();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "invalid_pay_stable");
    }
}
