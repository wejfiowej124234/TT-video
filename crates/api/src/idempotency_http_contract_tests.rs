//! **F-028**：幂等中间件 **HTTP 负例 + `DATABASE_URL` 正路径重放**（**`router::app`** 全栈 **`Router::oneshot`**）；与 **95 §8.2**/**`middleware::idempotency_key_layer`** 同源。**v1.4.257**：**`matrix_93_b_idm_001b_f028_*`** — **`X-Idempotency-Key`** 别名与 **`Idempotency-Key`** 同源重放。
//!
//! **93 §2.4.1 · B-IDM-001**（**ISS-007 窄口径**）：**`matrix_93_b_idm_001_*`** / **`matrix_93_b_idm_001b_*`** ↔ **B-IDM-001**/**F-028** — 判据见 **`spec/93-全站功能验证矩阵-域别回归清单.md`**。

#[cfg(test)]
mod tests {
    use std::sync::{Arc, Mutex};
    use std::time::Duration;

    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use sqlx::postgres::PgPoolOptions;
    use tokio::sync::RwLock;
    use tower::util::ServiceExt;
    use uuid::Uuid;

    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
    use crate::middleware::IdempotencyCache;
    use crate::router::app;
    use crate::state::test_support::api_meta_state;

    static IDEMPOTENCY_HTTP_ENV_LOCK: Mutex<()> = Mutex::new(());

    struct RemoveEnvOnDrop(&'static str);
    impl Drop for RemoveEnvOnDrop {
        fn drop(&mut self) {
            std::env::remove_var(self.0);
        }
    }

    fn chain_off_memory_no_db_pool() -> ChainOffState {
        ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: None,
        }
    }

    #[tokio::test]
    async fn post_missing_idempotency_key_returns_400_when_require_idempotency_key() {
        let _lock = IDEMPOTENCY_HTTP_ENV_LOCK
            .lock()
            .expect("idem http env lock");
        std::env::set_var("REQUIRE_IDEMPOTENCY_KEY", "1");
        let _clear = RemoveEnvOnDrop("REQUIRE_IDEMPOTENCY_KEY");

        let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
        let router = app(
            api_meta_state(Some(chain_off_memory_no_db_pool())),
            idem,
            None,
        );
        // `auth_placeholder_layer` 在幂等层之外先执行：`POST /guides` 会先 **401**；**`trust-growth/ingest`** 为 **public POST**（见 **`middleware::auth_placeholder_layer`**），可命中 **`missing_idempotency_key`**。
        let res = router
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/trust-growth/ingest")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"event":"x","payload":{}}"#))
                    .unwrap(),
            )
            .await
            .expect("oneshot");

        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let v: serde_json::Value =
            serde_json::from_slice(&res.into_body().collect().await.expect("body").to_bytes())
                .expect("json");
        assert_eq!(v["error"], "missing_idempotency_key");
    }

    #[tokio::test]
    async fn post_idempotency_db_persist_failed_returns_503_on_dead_pool() {
        let _lock = IDEMPOTENCY_HTTP_ENV_LOCK
            .lock()
            .expect("idem http env lock");

        let pool = PgPoolOptions::new()
            .max_connections(1)
            .acquire_timeout(Duration::from_millis(200))
            .connect_lazy("postgres://nouser:nopass@127.0.0.1:1/traveltrust_idem_http_gate")
            .expect("lazy dead pool");

        let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
        let router = app(
            api_meta_state(Some(chain_off_memory_no_db_pool())),
            idem,
            Some(pool),
        );
        // Handler 先 **503 `database_unavailable`**（**`chain_off.db_pool`** **None**）；幂等层随后 **`save_cached_response`** 命中 **dead pool** → **`idempotency_db_persist_failed`**。
        let res = router
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/trust-growth/ingest")
                    .header("content-type", "application/json")
                    .header("Idempotency-Key", "idem-http-contract-503-001")
                    .body(Body::from(r#"{"event":"x","payload":{}}"#))
                    .unwrap(),
            )
            .await
            .expect("oneshot");

        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let v: serde_json::Value =
            serde_json::from_slice(&res.into_body().collect().await.expect("body").to_bytes())
                .expect("json");
        assert_eq!(v["error"], "idempotency_db_persist_failed");
    }

    /// **F-028 · API·IT 正路径**：**`REQUIRE_IDEMPOTENCY_KEY=1`** + **`router::app`** + **真实 `DATABASE_URL`**
    /// → **`POST /api/v1/trust-growth/ingest`** 首次 **200** 且 **`idempotency_keys` 落盘**；同 **`Idempotency-Key`**
    /// 二次 **`oneshot`** 返回 **相同 JSON 体**（内存重放；首轮已证 **DB persist** 成功）。
    #[tokio::test]
    async fn matrix_93_b_idm_001_f028_trust_growth_ingest_duplicate_idempotency_key_identical_body_pg(
    ) {
        let _lock = IDEMPOTENCY_HTTP_ENV_LOCK
            .lock()
            .expect("idem http env lock");

        let Some(pool) = crate::it_db_pool::connect_migrated_pg_it_pool().await else {
            eprintln!(
                "skip: matrix_93_b_idm_001_f028_trust_growth_ingest_duplicate_idempotency_key_identical_body_pg (DATABASE_URL unset)"
            );
            return;
        };

        std::env::set_var("REQUIRE_IDEMPOTENCY_KEY", "1");
        let _clear = RemoveEnvOnDrop("REQUIRE_IDEMPOTENCY_KEY");

        let chain_off = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool.clone()),
        };

        let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
        let router = app(
            api_meta_state(Some(chain_off)),
            Arc::clone(&idem),
            Some(pool.clone()),
        );

        let run = Uuid::new_v4();
        let idem_key = format!("idem-f028-pos-{run}");
        let body = format!(
            r#"{{"event":"trust_growth_moment_view","payload":{{"moment":"idem_m_{run}","variant_id":"idem_v_{run}"}}}}"#
        );

        let res1 = router
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/trust-growth/ingest")
                    .header("content-type", "application/json")
                    .header("Idempotency-Key", &idem_key)
                    .body(Body::from(body.clone()))
                    .unwrap(),
            )
            .await
            .expect("oneshot");
        assert_eq!(res1.status(), StatusCode::OK);
        let b1 = res1
            .into_body()
            .collect()
            .await
            .expect("body")
            .to_bytes()
            .to_vec();
        let v1: serde_json::Value = serde_json::from_slice(&b1).expect("json first");
        assert_eq!(v1["ok"], true);
        assert_eq!(v1["status"], "ok");

        let res2 = router
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/trust-growth/ingest")
                    .header("content-type", "application/json")
                    .header("Idempotency-Key", &idem_key)
                    .body(Body::from(body))
                    .unwrap(),
            )
            .await
            .expect("oneshot");
        assert_eq!(res2.status(), StatusCode::OK);
        let b2 = res2
            .into_body()
            .collect()
            .await
            .expect("body")
            .to_bytes()
            .to_vec();
        assert_eq!(b1, b2);

        let kh = crate::db::key_hash("POST", "/api/v1/trust-growth/ingest", idem_key.as_str());
        let n = sqlx::query("DELETE FROM idempotency_keys WHERE key_hash = $1")
            .bind(&kh[..])
            .execute(&pool)
            .await
            .expect("cleanup idempotency_keys")
            .rows_affected();
        assert!(n <= 1);
    }

    /// **F-028 · API·IT 正路径**：同 **`matrix_93_b_idm_001_f028_*`**，但使用 **`X-Idempotency-Key`**（**`middleware` 别名**）→ **双次 `oneshot` 体一致** + **`idempotency_keys` 清理**。
    #[tokio::test]
    async fn matrix_93_b_idm_001b_f028_trust_growth_ingest_duplicate_x_idempotency_key_identical_body_pg(
    ) {
        let _lock = IDEMPOTENCY_HTTP_ENV_LOCK
            .lock()
            .expect("idem http env lock");

        let Some(pool) = crate::it_db_pool::connect_migrated_pg_it_pool().await else {
            eprintln!(
                "skip: matrix_93_b_idm_001b_f028_trust_growth_ingest_duplicate_x_idempotency_key_identical_body_pg (DATABASE_URL unset)"
            );
            return;
        };

        std::env::set_var("REQUIRE_IDEMPOTENCY_KEY", "1");
        let _clear = RemoveEnvOnDrop("REQUIRE_IDEMPOTENCY_KEY");

        let chain_off = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool.clone()),
        };

        let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
        let router = app(
            api_meta_state(Some(chain_off)),
            Arc::clone(&idem),
            Some(pool.clone()),
        );

        let run = Uuid::new_v4();
        let idem_key = format!("idem-f028-xhdr-{run}");
        let body = format!(
            r#"{{"event":"trust_growth_moment_view","payload":{{"moment":"idem_x_m_{run}","variant_id":"idem_x_v_{run}"}}}}"#
        );

        let res1 = router
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/trust-growth/ingest")
                    .header("content-type", "application/json")
                    .header("X-Idempotency-Key", &idem_key)
                    .body(Body::from(body.clone()))
                    .unwrap(),
            )
            .await
            .expect("oneshot");
        assert_eq!(res1.status(), StatusCode::OK);
        let b1 = res1
            .into_body()
            .collect()
            .await
            .expect("body")
            .to_bytes()
            .to_vec();
        let v1: serde_json::Value = serde_json::from_slice(&b1).expect("json first");
        assert_eq!(v1["ok"], true);
        assert_eq!(v1["status"], "ok");

        let res2 = router
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/trust-growth/ingest")
                    .header("content-type", "application/json")
                    .header("X-Idempotency-Key", &idem_key)
                    .body(Body::from(body))
                    .unwrap(),
            )
            .await
            .expect("oneshot");
        assert_eq!(res2.status(), StatusCode::OK);
        let b2 = res2
            .into_body()
            .collect()
            .await
            .expect("body")
            .to_bytes()
            .to_vec();
        assert_eq!(b1, b2);

        let kh = crate::db::key_hash("POST", "/api/v1/trust-growth/ingest", idem_key.as_str());
        let n = sqlx::query("DELETE FROM idempotency_keys WHERE key_hash = $1")
            .bind(&kh[..])
            .execute(&pool)
            .await
            .expect("cleanup idempotency_keys")
            .rows_affected();
        assert!(n <= 1);
    }
}
