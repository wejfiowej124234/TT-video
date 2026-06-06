use super::helpers::{
    app_with_pool, cleanup_users_posts_and_reports, db_it_lock, pool_or_skip,
    run_d_com_009_me_posts_flow, run_d_com_010_report_flow,
};

#[tokio::test]
async fn f018_post_community_report_persists_ok_when_target_post_exists() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f018_post_community_report_persists_ok_when_target_post_exists (DATABASE_URL unset)");
        return;
    }
    let (reporter_id, author_id, post_id, _token) =
        run_d_com_010_report_flow(&pool, app_with_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[reporter_id, author_id], &[post_id]).await;
}

#[tokio::test]
async fn f019_get_me_posts_lists_inserted_post() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f019_get_me_posts_lists_inserted_post (DATABASE_URL unset)");
        return;
    }
    let (uid, post_id) = run_d_com_009_me_posts_flow(&pool, app_with_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[uid], &[post_id]).await;
}

/// **93 · D-COM-010** → **§8.2 · F-018**。
#[tokio::test]
async fn matrix_93_d_com_010_post_report_persists_pg_row() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_d_com_010_post_report_persists_pg_row (DATABASE_URL unset)");
        return;
    }
    let (reporter_id, author_id, post_id, _token) =
        run_d_com_010_report_flow(&pool, app_with_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[reporter_id, author_id], &[post_id]).await;
}

/// **93 · D-COM-009** → **§8.2 · F-019**。
#[tokio::test]
async fn matrix_93_d_com_009_get_me_posts_lists_own_post() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_d_com_009_get_me_posts_lists_own_post (DATABASE_URL unset)");
        return;
    }
    let (uid, post_id) = run_d_com_009_me_posts_flow(&pool, app_with_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[uid], &[post_id]).await;
}
