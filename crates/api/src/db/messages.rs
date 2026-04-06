//! order_messages 表：OrderMessageRow、insert_order_message、list_order_messages_all（48 §6.6）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// 订单聊天消息行（与 chain_off::MessageRow 对齐，用于 hydrate）
#[derive(Debug)]
pub struct OrderMessageRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

/// 插入一条聊天消息（POST /api/v1/orders/:id/messages 双写）
pub async fn insert_order_message(
    pool: &PgPool,
    id: Uuid,
    order_id: Uuid,
    sender_id: Uuid,
    content: &str,
    created_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO order_messages (id, order_id, sender_id, content, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
    )
    .bind(id)
    .bind(order_id)
    .bind(sender_id)
    .bind(content)
    .bind(created_at)
    .execute(pool)
    .await?;
    Ok(())
}

/// 加载所有订单消息（启动 hydrate；按 order_id 分组在 startup 中完成）
pub async fn list_order_messages_all(pool: &PgPool) -> Result<Vec<OrderMessageRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, Uuid, String, DateTime<Utc>)>(
        "SELECT id, order_id, sender_id, content, created_at FROM order_messages ORDER BY order_id, created_at",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(id, order_id, sender_id, content, created_at)| OrderMessageRow {
                id,
                order_id,
                sender_id,
                content,
                created_at,
            },
        )
        .collect())
}
