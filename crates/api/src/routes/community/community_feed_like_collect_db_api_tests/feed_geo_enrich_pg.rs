//! **GET /api/v1/community/feed** geo enrich · ① PG·IT（`anchor_poi_id` / `max_distance_m` → `venue_name` / `distance_m` / `is_sponsored`）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use tower::ServiceExt;
use uuid::Uuid;

use super::super::feed_geo::stable_distance_m;
use super::helpers::*;

async fn create_feed_geo_probe_post(
    app: &Router,
    token: &str,
    body: &str,
    destination: &str,
    tags: &[&str],
) -> Uuid {
    let body_json = serde_json::json!({
        "body": body,
        "post_type": "text",
        "destination": destination,
        "tags": tags,
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_json.to_string()))
                .unwrap(),
        )
        .await
        .expect("create post");
    let st = res.status();
    let v = response_json(res).await;
    assert_eq!(st, StatusCode::OK, "{:?}", v);
    v["id"].as_str().unwrap().parse().expect("post id uuid")
}

fn feed_posts_array(v: &serde_json::Value) -> Vec<&serde_json::Value> {
    v["posts"]
        .as_array()
        .expect("posts array")
        .iter()
        .collect()
}

#[tokio::test]
async fn matrix_93_d_com_feed_geo_max_distance_m_enrich_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: feed geo enrich (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let (uid_b, token_b) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let dest_kyoto = "京都";
    let post_a = create_feed_geo_probe_post(
        &app,
        &token,
        "geo enrich probe A",
        dest_kyoto,
        &[],
    )
    .await;
    let post_b = create_feed_geo_probe_post(
        &app,
        &token_b,
        "geo enrich probe B",
        "东京",
        &["ad"],
    )
    .await;

    let enrich_uri = "/api/v1/community/feed?limit=50&anchor_poi_id=hotel_lavande";
    let enrich_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(enrich_uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed enrich");
    assert_eq!(enrich_res.status(), StatusCode::OK);
    let enrich_json = response_json(enrich_res).await;
    assert_eq!(enrich_json["status"], "ok");

    let row_a = feed_posts_array(&enrich_json)
        .into_iter()
        .find(|p| p["id"].as_str() == Some(&post_a.to_string()))
        .expect("post A in feed");
    assert_eq!(row_a["venue_name"].as_str(), Some(dest_kyoto));
    let dist_a = row_a["distance_m"].as_i64().expect("distance_m on A");
    assert!((200..=9500).contains(&dist_a));

    let row_b = feed_posts_array(&enrich_json)
        .into_iter()
        .find(|p| p["id"].as_str() == Some(&post_b.to_string()))
        .expect("post B in feed");
    assert_eq!(row_b["venue_name"].as_str(), Some("东京"));
    assert_eq!(row_b["is_sponsored"], serde_json::json!(true));

    let seed_a = format!("hotel_lavande::{}:{}", post_a, dest_kyoto);
    assert_eq!(dist_a, stable_distance_m(&seed_a, 0.2, 9.5));

    let filter_uri =
        "/api/v1/community/feed?limit=50&anchor_poi_id=hotel_lavande&max_distance_m=1000";
    let filter_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(filter_uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed geo filter");
    assert_eq!(filter_res.status(), StatusCode::OK);
    let filter_json = response_json(filter_res).await;
    assert_eq!(filter_json["status"], "ok");

    let filtered = feed_posts_array(&filter_json);
    assert!(
        filtered.iter().any(|p| p["id"].as_str() == Some(&post_a.to_string()))
            || filtered.iter().any(|p| p["id"].as_str() == Some(&post_b.to_string())),
        "filtered feed should include at least one probe post when within bucket"
    );
    let mut prev: i64 = 0;
    for p in &filtered {
        let d = p["distance_m"].as_i64().expect("distance_m");
        assert!(d <= 1000, "post {} distance_m {} > 1000", p["id"], d);
        assert!(prev <= d, "feed should be sorted by distance_m ascending");
        prev = d;
        if p["destination"].as_str().filter(|s| !s.is_empty()).is_some() {
            assert!(
                p.get("venue_name").and_then(|v| v.as_str()).is_some(),
                "venue_name enrich for destination post"
            );
        }
    }

    cleanup_user_and_posts(&pool, uid).await;
    cleanup_user_and_posts(&pool, uid_b).await;
}
