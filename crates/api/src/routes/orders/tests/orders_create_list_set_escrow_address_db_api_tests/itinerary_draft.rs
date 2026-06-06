use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use serde_json::json;
use tower::ServiceExt;

use super::support::{auth_bearer_value, response_json};

pub(super) async fn post_itinerary_draft_ok(
    app: Router,
    token: &str,
    city: &str,
    travel_date: &str,
) -> String {
    let itin = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/itineraries")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(token))
                .body(Body::from(
                    json!({
                        "destination": "中国",
                        "city": city,
                        "travel_date": travel_date,
                        "days": 2,
                        "budget_min": 1000.0,
                        "budget_max": 2000.0
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        itin.status(),
        StatusCode::OK,
        "{:?}",
        response_json(itin).await
    );
    let j = response_json(itin).await;
    assert_eq!(j["status"], "ok");
    j["order_id"].as_str().expect("order_id").to_string()
}
