//! `GET /api/v1/discover/orders`：可浏览订单列表（48 §2.2、49 D、04 §3.4）。
//! 前端 **自由市场** 主页面为 Next **`/market`**（**`/discover`** 仅为客户端重定向壳，非第二套列表 API）。

use axum::extract::{Query, State};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;

use crate::chain_off;
use crate::state::ApiMetaState;

#[derive(Debug, Deserialize)]
pub struct DiscoverOrdersQuery {
    pub country: Option<String>,
    pub city: Option<String>,
    pub days: Option<u32>,
    pub limit: Option<u32>,
    pub cursor: Option<String>,
}

pub async fn get_discover_orders(
    State(state): State<ApiMetaState>,
    Query(q): Query<DiscoverOrdersQuery>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let page = match chain_off::parse_order_list_page(q.limit, q.cursor) {
            Ok(p) => p,
            Err(e) => {
                return (
                    axum::http::StatusCode::BAD_REQUEST,
                    Json(json!({"error": e, "message": e})),
                )
                    .into_response();
            }
        };
        return match chain_off::discover_orders_list_impl(
            co.clone(),
            q.country,
            q.city,
            q.days,
            page,
        )
        .await
        {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    Json(json!({ "status": "ok", "items": [] })).into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route("/api/v1/discover/orders", get(get_discover_orders))
}
