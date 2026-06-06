use super::helpers::{
    app_stack_bm004, assert_bm004_post_get_delete_get_order_absent,
    assert_bm004_post_get_delete_guide_absent, assert_bm004_post_get_guide_bookmarks,
    assert_bm004_post_get_market_bookmarks, cleanup_bookmark_order_bundle, db_it_lock,
    pool_or_skip, run_b_mkt_004_me_market_bookmark_flow, seed_bm004_bookmark_fixture,
};

#[tokio::test]
async fn f020_post_market_bookmark_order_then_get_lists_it() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f020_post_market_bookmark_order_then_get_lists_it (DATABASE_URL unset)");
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id) =
        run_b_mkt_004_me_market_bookmark_flow(&pool).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// [93 · B-MKT-004] 与 **`f020_*`** 同源（须 **`DATABASE_URL`**）。
#[tokio::test]
async fn matrix_93_b_mkt_004_me_market_bookmark_flow() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_b_mkt_004_me_market_bookmark_flow (DATABASE_URL unset)");
        return;
    };    let (order_id, guide_row_id, tourist_id, guide_user_id) =
        run_b_mkt_004_me_market_bookmark_flow(&pool).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004** → **§8.2 · F-020**：**`router::app`** 主栈 **`POST|GET …/me/market-bookmarks`**（与 **`me::router()`** **子栈** **`matrix_93_b_mkt_004_me_market_bookmark_flow`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_004_f020_post_get_market_bookmarks_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004_f020_post_get_market_bookmarks_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router, &token, order_id).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004** → **§8.2 · F-020**：**`router::app`** **`POST|GET|DELETE|GET …/me/market-bookmarks`**（**`order`** **星标取消** 后主列表 **不含** **`order_id`**）。
#[tokio::test]
async fn matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_delete_get_order_absent(router, &token, order_id).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-013** → **§8.2 · F-020**：**`router::app`** **`POST …/me/market-bookmarks`** **`target_type=guide`** **`target_id=guides.id`**→**`GET`** **`guide_ids`** **PG 列表含之**。
#[tokio::test]
async fn matrix_93_b_mkt_004d_f020_post_guide_bookmark_then_get_guide_ids_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004d_f020_post_guide_bookmark_then_get_guide_ids_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_guide_bookmarks(router, &token, guide_row_id).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-013** → **§8.2 · F-020**：**`router::app`** **`POST|GET|DELETE|GET …/me/market-bookmarks`** **`guide`** **取消星标** **`guide_ids`** **不含** **`guides.id`**。
#[tokio::test]
async fn matrix_93_b_mkt_004e_f020_post_guide_bookmark_delete_get_guide_ids_absent_app_stack_ok_pg()
{
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004e_f020_post_guide_bookmark_delete_get_guide_ids_absent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_delete_guide_absent(router, &token, guide_row_id).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}
