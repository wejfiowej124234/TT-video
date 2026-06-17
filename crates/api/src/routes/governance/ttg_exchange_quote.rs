//! `GET /api/v1/governance/ttg-exchange/quote` — **96-18** TTG 兑换报价（① 固定价 Mock · **②** Router/Treasury）。

use axum::extract::Query;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::{Duration, Utc};
use serde::Deserialize;
use serde_json::json;

use crate::routes::governance_doc_reference::{
    TTG_FDV_CNY, TTG_MOCK_USDC_CNY_FX, TTG_REF_PRICE_CNY, TTG_REFERENCE_PRICE_V1_ID,
    TTG_REFERENCE_PRICE_V1_REF,
};

#[derive(Debug, Deserialize)]
pub struct TtgExchangeQuoteQuery {
    pub pay_stable: Option<String>,
    pub pay_amount: Option<String>,
}

fn normalize_pay_stable(raw: Option<&str>) -> Result<&'static str, ()> {
    match raw.unwrap_or("USDC").trim().to_ascii_uppercase().as_str() {
        "USDC" => Ok("USDC"),
        _ => Err(()),
    }
}

fn parse_positive_decimal(raw: &str) -> Option<f64> {
    let s = raw.trim().replace(',', "");
    if s.is_empty() {
        return None;
    }
    if !s.chars().all(|c| c.is_ascii_digit() || c == '.') {
        return None;
    }
    let n: f64 = s.parse().ok()?;
    if !n.is_finite() || n <= 0.0 {
        return None;
    }
    Some(n)
}

fn mock_usdc_per_ttg() -> f64 {
    TTG_REF_PRICE_CNY / TTG_MOCK_USDC_CNY_FX
}

fn format_swap_amount(amount: f64) -> String {
    if amount >= 1.0 {
        format!("{amount:.4}")
    } else {
        format!("{amount:.8}")
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
    };
    let expires_at = Utc::now() + Duration::hours(1);
    let rate = mock_usdc_per_ttg();
    let (receive_amount, pay_amount_out) = match q.pay_amount.as_deref().and_then(parse_positive_decimal) {
        Some(pay) => {
            let receive = pay / rate;
            (
                Some(json!(format_swap_amount(receive))),
                Some(json!(format_swap_amount(pay))),
            )
        }
        None => (None, None),
    };

    Json(json!({
        "status": "ok",
        "schema_version": 2,
        "pair_type": "stablecoin_to_governance_token",
        "pay_stable": pay_stable,
        "receive_symbol": "TTG",
        "receive_token_role": "governance",
        "pay_amount": pay_amount_out,
        "receive_amount": receive_amount,
        "rate": format!("{rate:.12}"),
        "rate_unit": "USDC_per_TTG",
        "reference_price_cny_per_ttg": TTG_REF_PRICE_CNY,
        "fdv_cny": TTG_FDV_CNY,
        "expires_at": expires_at.to_rfc3339(),
        "escrow_settlement": {
            "allowed_pay_stablecoins": ["USDC"],
            "default_pay_stable": "USDC",
            "rule": "Trip Escrow and pool settlement use USDC (SETTLEMENT_TOKEN per 01). TTG exchange preview is USDC→TTG only; not a stablecoin swap path."
        },
        "meta": {
            "implementation_status": "ttg_exchange_quote_mock_fixed_v1",
            "execute_path": null,
            "valuation_anchor_id": TTG_REFERENCE_PRICE_V1_ID,
            "doc": TTG_REFERENCE_PRICE_V1_REF,
            "phase": "local_mock_only_not_testnet_router"
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
            "ttg_exchange_quote_mock_fixed_v1"
        );
        assert_eq!(v["schema_version"], 2);
        assert!(v["rate"].as_str().is_some());
    }

    #[tokio::test]
    async fn quote_returns_receive_amount_when_pay_amount_present() {
        let app = Router::new().route(
            "/api/v1/governance/ttg-exchange/quote",
            get(get_ttg_exchange_quote),
        );
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/governance/ttg-exchange/quote?pay_stable=USDC&pay_amount=720")
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
        assert_eq!(v["receive_amount"], "25.9200");
        assert_eq!(v["reference_price_cny_per_ttg"], 200.0);
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
