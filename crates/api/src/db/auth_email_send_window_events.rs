use sqlx::postgres::PgPool;

/// Try consume one per-email send slot in a distributed DB window.
///
/// Returns `Ok(true)` when slot is granted, `Ok(false)` when limited.
pub async fn try_consume_email_send_slot(
    pool: &PgPool,
    bucket: &str,
    email_key: &str,
    max_per_window: u32,
    window_secs: u64,
) -> Result<bool, sqlx::Error> {
    if max_per_window == 0 {
        return Ok(true);
    }
    let mut tx = pool.begin().await?;
    let lock_key = format!("auth_email_send_window:{}:{}", bucket, email_key);
    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(&lock_key)
        .execute(&mut *tx)
        .await?;

    sqlx::query(
        r#"
        DELETE FROM auth_email_send_window_events
        WHERE bucket = $1
          AND email_key = $2
          AND created_at < now() - ($3::bigint * interval '1 second')
        "#,
    )
    .bind(bucket)
    .bind(email_key)
    .bind(window_secs as i64)
    .execute(&mut *tx)
    .await?;

    let count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint
        FROM auth_email_send_window_events
        WHERE bucket = $1
          AND email_key = $2
          AND created_at >= now() - ($3::bigint * interval '1 second')
        "#,
    )
    .bind(bucket)
    .bind(email_key)
    .bind(window_secs as i64)
    .fetch_one(&mut *tx)
    .await?;

    if count >= max_per_window as i64 {
        tx.commit().await?;
        return Ok(false);
    }

    sqlx::query(
        r#"
        INSERT INTO auth_email_send_window_events (bucket, email_key, created_at)
        VALUES ($1, $2, now())
        "#,
    )
    .bind(bucket)
    .bind(email_key)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(true)
}
