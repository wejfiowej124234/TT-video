//! 公众 catalog 数据分离观测（企业级 · **`data_origin`** 分桶计数）。

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

pub async fn data_origin_counts_for_table(
    pool: &PgPool,
    table: &str,
) -> Result<Value, sqlx::Error> {
    let sql = format!(
        r#"
        SELECT data_origin, COUNT(*)::bigint AS cnt
        FROM {table}
        GROUP BY data_origin
        ORDER BY data_origin
        "#
    );
    let rows: Vec<(String, i64)> = sqlx::query_as(&sql).fetch_all(pool).await?;
    let mut out = serde_json::Map::new();
    let mut total = 0i64;
    for (origin, cnt) in rows {
        total += cnt;
        out.insert(origin, json!(cnt));
    }
    out.insert("total".into(), json!(total));
    Ok(Value::Object(out))
}

pub async fn public_catalog_surface_stats(pool: &PgPool) -> Result<Value, sqlx::Error> {
    let market_listings = data_origin_counts_for_table(pool, "market_listings").await?;
    let orders = data_origin_counts_for_table(pool, "orders").await?;
    let guides = data_origin_counts_for_table(pool, "guides").await?;
    Ok(json!({
        "market_listings": market_listings,
        "orders": orders,
        "guides": guides,
    }))
}
