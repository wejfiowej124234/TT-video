use super::helpers::*;

#[tokio::test]
async fn f021_get_provider_listings_includes_inserted_published_row() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: f021_get_provider_listings_includes_inserted_published_row (DATABASE_URL unset)"
        );
        return;
    };
    let (listing_id, owner_id) = run_b_mkt_005_provider_catalog_listing_flow(&pool).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// [93 · B-MKT-005] 与 **`f021_*`** 同源（须 **`DATABASE_URL`**）。
#[tokio::test]
async fn matrix_93_b_mkt_005_provider_catalog_listings_flow() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_b_mkt_005_provider_catalog_listings_flow (DATABASE_URL unset)");
        return;
    };
    let (listing_id, owner_id) = run_b_mkt_005_provider_catalog_listing_flow(&pool).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

#[tokio::test]
async fn f022_get_acquisition_listings_includes_inserted_published_row() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f022_get_acquisition_listings_includes_inserted_published_row (DATABASE_URL unset)");
        return;
    };
    let (listing_id, owner_id) = run_b_mkt_006_acquisition_catalog_listing_flow(&pool).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// [93 · B-MKT-006] 与 **`f022_*`** 同源（须 **`DATABASE_URL`**）。
#[tokio::test]
async fn matrix_93_b_mkt_006_acquisition_catalog_listings_flow() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_006_acquisition_catalog_listings_flow (DATABASE_URL unset)"
        );
        return;
    };
    let (listing_id, owner_id) = run_b_mkt_006_acquisition_catalog_listing_flow(&pool).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-005** → **§8.2 · F-021**：**`router::app`** 主栈 **`GET …/market/provider/listings`**（与 **`market_subsite::router()`** **`matrix_93_b_mkt_005_provider_catalog_listings_flow`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_005_f021_get_provider_listings_app_stack_ok_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_005_f021_get_provider_listings_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let (listing_id, owner_id) = seed_b_mkt_005_provider_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_005_provider_catalog_listings(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-006** → **§8.2 · F-022**：**`router::app`** 主栈 **`GET …/market/acquisition/listings`**（与 **`market_subsite::router()`** **`matrix_93_b_mkt_006_acquisition_catalog_listings_flow`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_006_f022_get_acquisition_listings_app_stack_ok_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_006_f022_get_acquisition_listings_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let (listing_id, owner_id) = seed_b_mkt_006_acquisition_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_006_acquisition_catalog_listings(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}
