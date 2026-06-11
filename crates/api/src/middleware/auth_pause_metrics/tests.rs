//! 单测自 `mod.rs` 旁拆出，满足 **50-O-B2** / **`check-48-line-count`** 单文件行数门禁。

mod internal_gate_tests {
    use super::super::internal_secret_gate_denies;

    #[test]
    fn no_gate_off_internal_path() {
        assert!(!internal_secret_gate_denies(
            "/api/v1/orders",
            Some("secret"),
            None
        ));
    }

    #[test]
    fn no_gate_when_secret_unset() {
        assert!(!internal_secret_gate_denies(
            "/api/v1/internal/indexer-tick",
            None,
            None
        ));
    }

    #[test]
    fn no_gate_when_secret_empty() {
        assert!(!internal_secret_gate_denies(
            "/api/v1/internal/indexer-tick",
            Some("   "),
            None
        ));
    }

    #[test]
    fn denies_when_header_missing() {
        assert!(internal_secret_gate_denies(
            "/api/v1/internal/indexer-tick",
            Some("abc"),
            None
        ));
    }

    #[test]
    fn denies_when_header_wrong() {
        assert!(internal_secret_gate_denies(
            "/api/v1/internal/indexer-tick",
            Some("abc"),
            Some("wrong")
        ));
    }

    #[test]
    fn allows_when_header_matches_trimmed() {
        assert!(!internal_secret_gate_denies(
            "/api/v1/internal/indexer-tick",
            Some(" abc "),
            Some(" abc ")
        ));
    }
}

mod auth_placeholder_strict_gate_tests {
    //! STRICT_SESSION_GATE=1 时须 Bearer；与 04 / 缺口官方总表 P1-A 一致。环境变量用互斥锁串行化，避免与并行 `cargo test` 打架。

    use super::super::auth_placeholder_layer;
    use axum::{
        body::Body,
        http::{Method, Request, StatusCode},
        routing::{get, post},
        Router,
    };
    use std::sync::{Mutex, OnceLock};
    use tower::ServiceExt;

    static STRICT_GATE_ENV_MUTEX: OnceLock<Mutex<()>> = OnceLock::new();

    fn env_lock() -> std::sync::MutexGuard<'static, ()> {
        STRICT_GATE_ENV_MUTEX
            .get_or_init(|| Mutex::new(()))
            .lock()
            .expect("strict gate test mutex poisoned")
    }

    struct StrictGateEnvGuard {
        previous: Option<String>,
    }

    impl StrictGateEnvGuard {
        fn set(value: &str) -> Self {
            let previous = std::env::var("STRICT_SESSION_GATE").ok();
            std::env::set_var("STRICT_SESSION_GATE", value);
            Self { previous }
        }
    }

    impl Drop for StrictGateEnvGuard {
        fn drop(&mut self) {
            match &self.previous {
                Some(s) => std::env::set_var("STRICT_SESSION_GATE", s),
                None => std::env::remove_var("STRICT_SESSION_GATE"),
            }
        }
    }

    fn test_app() -> Router {
        Router::new()
            .route("/api/v1/orders", get(|| async { "ok" }))
            .route("/api/v1/community/feed", get(|| async { "pub" }))
            .route("/api/v1/did-rank/prize-pool", get(|| async { "pool" }))
            .route(
                "/api/v1/uploads/profile-avatars/:name",
                get(|| async { "avatar" }),
            )
            .route(
                "/api/v1/hooks/stripe/onboarding",
                post(|| async { "hook-ok" }),
            )
            .route(
                "/api/v1/catalog/countries",
                get(|| async { "catalog" }),
            )
            .layer(axum::middleware::from_fn(auth_placeholder_layer))
    }

    #[test]
    fn stripe_onboarding_webhook_post_public_without_auth() {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/hooks/stripe/onboarding")
                        .method(Method::POST)
                        .header("Content-Type", "application/json")
                        .body(Body::from("{}"))
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[test]
    fn strict_on_rejects_x_user_id_only() {
        let _lock = env_lock();
        let _g = StrictGateEnvGuard::set("1");
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/orders")
                        .method(axum::http::Method::GET)
                        .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn strict_on_allows_bearer_token() {
        let _lock = env_lock();
        let _g = StrictGateEnvGuard::set("1");
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/orders")
                        .method(axum::http::Method::GET)
                        .header("Authorization", "Bearer tts_test_token")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[test]
    fn strict_on_rejects_empty_bearer() {
        let _lock = env_lock();
        let _g = StrictGateEnvGuard::set("1");
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/orders")
                        .method(axum::http::Method::GET)
                        .header("Authorization", "Bearer ")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn strict_on_community_get_still_public() {
        let _lock = env_lock();
        let _g = StrictGateEnvGuard::set("1");
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/community/feed")
                        .method(axum::http::Method::GET)
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[test]
    fn strict_on_profile_avatar_upload_get_public_without_auth() {
        let _lock = env_lock();
        let _g = StrictGateEnvGuard::set("1");
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/uploads/profile-avatars/550e8400-e29b-41d4-a716-446655440000.jpg")
                        .method(axum::http::Method::GET)
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[test]
    fn strict_on_did_rank_prize_pool_get_public_without_auth() {
        let _lock = env_lock();
        let _g = StrictGateEnvGuard::set("1");
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/did-rank/prize-pool")
                        .method(axum::http::Method::GET)
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[test]
    fn strict_on_catalog_get_public_without_auth() {
        let _lock = env_lock();
        let _g = StrictGateEnvGuard::set("1");
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/catalog/countries")
                        .method(axum::http::Method::GET)
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[test]
    fn strict_off_allows_x_user_id() {
        let _lock = env_lock();
        let _g = StrictGateEnvGuard::set("0");
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime");
        let res = rt.block_on(async {
            test_app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/orders")
                        .method(axum::http::Method::GET)
                        .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
        });
        assert_eq!(res.status(), StatusCode::OK);
    }
}

mod pause_allowlist_tests {
    use super::super::pause_allowlist_match;

    #[test]
    fn default_allowlist_matches_meta_build() {
        let allow = "GET /health;GET /meta;GET /meta/build;GET /api/v1/media/access/*";
        assert!(pause_allowlist_match(allow, "GET /meta/build"));
    }

    #[test]
    fn default_media_access_pattern_matches_uuid_path() {
        let allow = "GET /health;GET /meta;GET /meta/build;GET /api/v1/media/access/*";
        assert!(pause_allowlist_match(
            allow,
            "GET /api/v1/media/access/550e8400-e29b-41d4-a716-446655440000"
        ));
    }

    #[test]
    fn media_access_pattern_does_not_match_other_api() {
        let allow = "GET /api/v1/media/access/*";
        assert!(!pause_allowlist_match(allow, "GET /api/v1/orders"));
    }
}
