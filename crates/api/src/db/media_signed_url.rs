//! signed_url_tokens、media_access_logs（270、04 §3.4 media/signed-urls、media/access）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct MediaAccessLogRow {
    pub id: Uuid,
    pub token_id: Option<Uuid>,
    pub object_id: String,
    pub actor_or_ip: String,
    pub action: String,
    pub occurred_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct SignedUrlTokenRow {
    pub id: Uuid,
    pub object_id: String,
    pub url_scope: String,
    pub expires_at: DateTime<Utc>,
    pub issued_to: Uuid,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct SignedUrlTokenListRow {
    pub id: Uuid,
    pub object_id: String,
    pub url_scope: String,
    pub expires_at: DateTime<Utc>,
    pub issued_to: Uuid,
    pub created_at: DateTime<Utc>,
}

/// `object_id_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
pub async fn list_signed_url_tokens(
    pool: &PgPool,
    object_id_pattern: Option<&str>,
    url_scope_eq: Option<&str>,
    issued_to_eq: Option<Uuid>,
    id_eq: Option<Uuid>,
    limit: i64,
) -> Result<Vec<SignedUrlTokenListRow>, sqlx::Error> {
    sqlx::query_as::<_, SignedUrlTokenListRow>(
        r#"
        SELECT id, object_id, url_scope, expires_at, issued_to, created_at
        FROM signed_url_tokens
        WHERE ($1::text IS NULL OR object_id ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR url_scope = $2)
          AND ($3::uuid IS NULL OR issued_to = $3)
          AND ($4::uuid IS NULL OR id = $4)
        ORDER BY created_at DESC
        LIMIT $5
        "#,
    )
    .bind(object_id_pattern)
    .bind(url_scope_eq)
    .bind(issued_to_eq)
    .bind(id_eq)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// 校验：用户为该订单的 tourist 或 guide，且该订单存在匹配 content_hash 的证据回执。
pub async fn user_can_access_evidence_object(
    pool: &PgPool,
    order_id: Uuid,
    content_hash: &str,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let row = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)::bigint
        FROM orders o
        INNER JOIN evidence_receipts er
          ON er.order_id = o.id AND LOWER(er.content_hash) = LOWER($2)
        WHERE o.id = $1
          AND (o.tourist_id = $3 OR (o.guide_id IS NOT NULL AND o.guide_id = $3))
        "#,
    )
    .bind(order_id)
    .bind(content_hash)
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row > 0)
}

pub async fn insert_signed_url_token(
    pool: &PgPool,
    object_id: &str,
    url_scope: &str,
    expires_at: DateTime<Utc>,
    issued_to: Uuid,
) -> Result<Uuid, sqlx::Error> {
    let id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO signed_url_tokens (id, object_id, url_scope, expires_at, issued_to)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(id)
    .bind(object_id)
    .bind(url_scope)
    .bind(expires_at)
    .bind(issued_to)
    .execute(pool)
    .await?;
    Ok(id)
}

/// 记录 `GET /api/v1/media/access/:token_id` 审计（270）；失败仅打日志，不影响 HTTP 响应。
/// Admin 只读：`action_eq` 精确匹配；`object_id_pattern` / `actor_pattern` 为已包 `%` 且已转义的 **ILIKE** 模式或 **`None`**；`token_id_eq` 精确匹配 **非空** `token_id`。
pub async fn list_media_access_logs(
    pool: &PgPool,
    action_eq: Option<&str>,
    object_id_pattern: Option<&str>,
    actor_pattern: Option<&str>,
    token_id_eq: Option<Uuid>,
    limit: i64,
) -> Result<Vec<MediaAccessLogRow>, sqlx::Error> {
    sqlx::query_as::<_, MediaAccessLogRow>(
        r#"
        SELECT id, token_id, object_id, actor_or_ip, action, occurred_at
        FROM media_access_logs
        WHERE ($1::text IS NULL OR action = $1)
          AND ($2::text IS NULL OR object_id ILIKE $2 ESCAPE '\')
          AND ($3::text IS NULL OR actor_or_ip ILIKE $3 ESCAPE '\')
          AND ($4::uuid IS NULL OR token_id = $4)
        ORDER BY occurred_at DESC
        LIMIT $5
        "#,
    )
    .bind(action_eq)
    .bind(object_id_pattern)
    .bind(actor_pattern)
    .bind(token_id_eq)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn insert_media_access_log(
    pool: &PgPool,
    token_id: Option<Uuid>,
    object_id: &str,
    actor_or_ip: &str,
    action: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO media_access_logs (token_id, object_id, actor_or_ip, action)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(token_id)
    .bind(object_id)
    .bind(actor_or_ip)
    .bind(action)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_signed_url_token(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<SignedUrlTokenRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (Uuid, String, String, DateTime<Utc>, Uuid)>(
        r#"
        SELECT id, object_id, url_scope, expires_at, issued_to
        FROM signed_url_tokens
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(
        |(id, object_id, url_scope, expires_at, issued_to)| SignedUrlTokenRow {
            id,
            object_id,
            url_scope,
            expires_at,
            issued_to,
        },
    ))
}
