use sqlx::PgPool;

pub(super) async fn cleanup_order_participants(
    pool: &PgPool,
    tourist_email: &str,
    guide_email: &str,
) {
    let _ = sqlx::query(
        r#"DELETE FROM orders
           WHERE tourist_id IN (SELECT id FROM users WHERE lower(email) = lower($1))
              OR guide_id IN (
                SELECT g.id FROM guides g
                JOIN users u ON g.user_id = u.id
                WHERE lower(u.email) = lower($2)
              )"#,
    )
    .bind(tourist_email)
    .bind(guide_email)
    .execute(pool)
    .await;

    let _ = sqlx::query(
        r#"DELETE FROM guides
           WHERE user_id IN (
             SELECT id FROM users WHERE lower(email) = lower($1)
           )"#,
    )
    .bind(guide_email)
    .execute(pool)
    .await;

    for email in [tourist_email, guide_email] {
        let _ = sqlx::query(
            r#"DELETE FROM sessions USING users u
               WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
        )
        .bind(email)
        .execute(pool)
        .await;
        let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
            .bind(email)
            .execute(pool)
            .await;
    }
}
