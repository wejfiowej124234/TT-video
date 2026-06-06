use sqlx::PgPool;

pub(super) async fn cleanup_order_participants(
    pool: &PgPool,
    tourist_email: &str,
    guide_email: &str,
) {
    let _ = sqlx::query(
        r#"DELETE FROM disputes
           WHERE order_id IN (
             SELECT o.id FROM orders o
             WHERE o.tourist_id IN (SELECT id FROM users WHERE lower(email) = lower($1))
                OR o.guide_id IN (
                  SELECT g.id FROM guides g
                  JOIN users u ON g.user_id = u.id
                  WHERE lower(u.email) = lower($2)
                )
           )"#,
    )
    .bind(tourist_email)
    .bind(guide_email)
    .execute(pool)
    .await;

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

pub(super) fn arb_email_for_mockpay_tourist(tourist_email: &str) -> String {
    let rest = tourist_email
        .strip_prefix("orders-mockpay-it-t-")
        .unwrap_or_else(|| panic!("unexpected tourist_email pattern: {tourist_email}"));
    format!("orders-mockpay-it-arb-{rest}")
}

pub(super) async fn cleanup_arb_user(pool: &PgPool, arb_email: &str) {
    let _ = sqlx::query(
        r#"DELETE FROM sessions USING users u
           WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
    )
    .bind(arb_email)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
        .bind(arb_email)
        .execute(pool)
        .await;
}
