use std::sync::Arc;

use axum::body::Body;
use axum::http::{header, HeaderValue, Request, StatusCode};
use chrono::Utc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_session, insert_user};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::admin;

use super::helpers::*;

#[tokio::test]
async fn matrix_93_d_adm_003_f030_get_admin_schema_migrations_lists_pg_rows() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_003_f030_get_admin_schema_migrations_lists_pg_rows (DATABASE_URL unset)"
        );
        return;
    };
    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user admin it");
    let session_token = format!("admin_it_sess_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin it");

    let auth = format!("Bearer {}", session_token);
    let app =
        admin::router().with_state(meta_admin_with_db_pool(pool.clone(), admin, &session_token));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/schema/migrations?limit=5")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let items = &v["items"];
    assert!(items["schema_versions"].is_array());
    assert!(items["migration_histories"].is_array());
    assert!(items["migration_rollbacks"].is_array());
    assert!(items["backfill_jobs"].is_array());
    assert!(items["dual_write_checks"].is_array());

    cleanup_admin_it_user(&pool, admin_id).await;
}

/// **93 · D-ADM-003** → **§8.2 · F-030**：**`_sqlx_migrations`** **`COUNT(*)>0`** **且** **`GET /api/v1/admin/schema/migrations`** **200** **`status=ok`**（**Admin Bearer**；**PG 已迁移** 与 **抽检端点** 锚定）。
#[tokio::test]
async fn matrix_93_d_adm_003_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_003_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_pg (DATABASE_URL unset)"
        );
        return;
    };
    let mig_count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .expect("count _sqlx_migrations");
    assert!(
        mig_count > 0,
        "D-ADM-003 PG anchor: expected at least one applied sqlx migration"
    );

    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user admin it");
    let session_token = format!("admin_it_sess_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin it");

    let auth = format!("Bearer {}", session_token);
    let app =
        admin::router().with_state(meta_admin_with_db_pool(pool.clone(), admin, &session_token));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/schema/migrations?limit=5")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let items = &v["items"];
    assert!(items["schema_versions"].is_array());
    assert!(items["migration_histories"].is_array());

    cleanup_admin_it_user(&pool, admin_id).await;
}

/// **93 · D-ADM-003** → **§8.2 · F-030**：**`GET …/admin/schema/migrations`**（**`router::app`**；**Admin Bearer**）。
#[tokio::test]
async fn matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let mig_count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .expect("count _sqlx_migrations");
    assert!(
        mig_count > 0,
        "D-ADM-003 PG anchor: expected at least one applied sqlx migration"
    );

    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user admin it");
    let session_token = format!("admin_it_sess_app_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin it");

    let auth = format!("Bearer {}", session_token);
    let meta = meta_admin_with_db_pool(pool.clone(), admin, &session_token);
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/schema/migrations?limit=5")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let items = &v["items"];
    assert!(items["schema_versions"].is_array());
    assert!(items["migration_histories"].is_array());

    cleanup_admin_it_user(&pool, admin_id).await;
}

/// **93 · D-ADM-003** → **§8.2 · F-030**：**`router::app`** **`GET …/admin/schema/migrations`** **`migration_histories`** **非空** **且** **条数 ≤ `_sqlx_migrations`**（**v1.4.259**：测内 **`migration_histories`** 种子行，**不**依赖环境预填）。
#[tokio::test]
async fn matrix_93_d_adm_003c_f030_get_admin_migrations_returns_non_empty_migration_histories_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_003c_f030_get_admin_migrations_returns_non_empty_migration_histories_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let mig_count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .expect("count _sqlx_migrations");
    assert!(
        mig_count > 0,
        "D-ADM-003 PG anchor: expected at least one applied sqlx migration"
    );

    insert_migration_history_it_seed(&pool).await;

    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user admin it");
    let session_token = format!("admin_it_sess_hist_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin it");

    let auth = format!("Bearer {}", session_token);
    let meta = meta_admin_with_db_pool(pool.clone(), admin, &session_token);
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/schema/migrations?limit=500")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let hist = v["items"]["migration_histories"]
        .as_array()
        .expect("migration_histories array");
    assert!(!hist.is_empty(), "expected non-empty migration_histories");
    assert!(
        hist.len() as i64 <= mig_count,
        "migration_histories len {} should not exceed _sqlx_migrations count {}",
        hist.len(),
        mig_count
    );

    cleanup_admin_it_user(&pool, admin_id).await;
    cleanup_migration_history_it_seeds(&pool).await;
}
