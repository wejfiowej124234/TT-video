//! users / sessions 表：插入、列表、按 token 查 user_id（48 §6.2）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use sqlx::FromRow;
use uuid::Uuid;

/// 插入用户（注册时双写）
pub async fn insert_user(
    pool: &PgPool,
    id: Uuid,
    email: &str,
    password_hash: Option<&str>,
    role: &str,
    kyc_status: &str,
    nickname: Option<&str>,
    avatar_url: Option<&str>,
    default_wallet_address: Option<&str>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO users (id, email, password_hash, role, kyc_status, nickname, avatar_url, default_wallet_address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
        "#,
    )
    .bind(id)
    .bind(email)
    .bind(password_hash)
    .bind(role)
    .bind(kyc_status)
    .bind(nickname)
    .bind(avatar_url)
    .bind(default_wallet_address)
    .bind(created_at)
    .bind(updated_at)
    .execute(pool)
    .await?;
    Ok(())
}

/// 插入会话（注册/登录时双写）
pub async fn insert_session(pool: &PgPool, token: &str, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO sessions (token, user_id, created_at) VALUES ($1, $2, now()) ON CONFLICT (token) DO UPDATE SET user_id = $2",
    )
    .bind(token)
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(())
}

/// 用户行（与 chain_off::UserRow 字段对齐，用于 hydrate）
#[derive(Debug, Clone)]
pub struct UserRow {
    pub id: Uuid,
    pub email: String,
    pub password_hash: Option<String>,
    pub role: String,
    pub kyc_status: String,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub default_wallet_address: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 会话行（token -> user_id，用于 hydrate）
#[derive(Debug)]
pub struct SessionRow {
    pub token: String,
    pub user_id: Uuid,
}

/// 加载所有用户（启动 hydrate）
pub async fn list_users(pool: &PgPool) -> Result<Vec<UserRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, String, String, Option<String>, Option<String>, Option<String>, DateTime<Utc>, DateTime<Utc>)>(
        "SELECT id, email, password_hash, role, kyc_status, nickname, avatar_url, default_wallet_address, created_at, updated_at FROM users",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                email,
                password_hash,
                role,
                kyc_status,
                nickname,
                avatar_url,
                default_wallet_address,
                created_at,
                updated_at,
            )| UserRow {
                id,
                email,
                password_hash,
                role,
                kyc_status,
                nickname,
                avatar_url,
                default_wallet_address,
                created_at,
                updated_at,
            },
        )
        .collect())
}

/// 加载所有会话（启动 hydrate）
pub async fn list_sessions(pool: &PgPool) -> Result<Vec<SessionRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (String, Uuid)>("SELECT token, user_id FROM sessions")
        .fetch_all(pool)
        .await?;
    Ok(rows
        .into_iter()
        .map(|(token, user_id)| SessionRow { token, user_id })
        .collect())
}

/// DID 排行榜：按窗口内 **已完成订单数** 降序，其次 `users.created_at`（游客；P2 活动量口径）。
/// 返回 `(用户行, 窗口内完成单数)`，供 `GET …/did-rank/travelers` 展示「综合活跃」。
pub async fn list_tourists_did_rank_by_completed_orders(
    pool: &PgPool,
    limit: i64,
    completed_since: Option<DateTime<Utc>>,
) -> Result<Vec<(UserRow, i64)>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, String, String, Option<String>, Option<String>, Option<String>, DateTime<Utc>, DateTime<Utc>, i64)>(
        r#"
        SELECT u.id, u.email, u.password_hash, u.role, u.kyc_status, u.nickname, u.avatar_url, u.default_wallet_address, u.created_at, u.updated_at,
               COALESCE(act.cnt, 0)::bigint AS completed_orders
        FROM users u
        LEFT JOIN (
            SELECT tourist_id AS uid, COUNT(*)::bigint AS cnt
            FROM orders
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
              AND ($1::timestamptz IS NULL OR completed_at >= $1)
            GROUP BY tourist_id
        ) act ON act.uid = u.id
        WHERE u.role IN ('tourist', 'traveler')
        ORDER BY COALESCE(act.cnt, 0) DESC, u.created_at DESC NULLS LAST
        LIMIT $2
        "#,
    )
    .bind(completed_since)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                email,
                password_hash,
                role,
                kyc_status,
                nickname,
                avatar_url,
                default_wallet_address,
                created_at,
                updated_at,
                completed_orders,
            )| {
                (
                    UserRow {
                        id,
                        email,
                        password_hash,
                        role,
                        kyc_status,
                        nickname,
                        avatar_url,
                        default_wallet_address,
                        created_at,
                        updated_at,
                    },
                    completed_orders,
                )
            },
        )
        .collect())
}

/// DID 排行榜向导行：用户资料 + 窗口内接待金额合计（`orders.amount` 之和）与完成单数（与 spec 30 §3 向导榜一致）。
#[derive(Debug, Clone)]
pub struct GuideDidRankEntry {
    pub user: UserRow,
    /// `SUM(orders.amount::numeric)` 的文本形式（与 DB `amount` 精度一致）
    pub reception_gross_total: String,
    pub reception_count: i64,
    /// 窗口内已完成订单上、且 `reviews.reviewee_id = guides.user_id` 的评价条数（04 附录 did-rank §3.1 数据面 Partial）
    pub received_review_count: i64,
    /// 上列评价的算术均分；无评价时为 `None`
    pub avg_received_review_score: Option<f64>,
}

#[derive(Debug, FromRow)]
struct GuideDidRankSql {
    id: Uuid,
    email: String,
    password_hash: Option<String>,
    role: String,
    kyc_status: String,
    nickname: Option<String>,
    avatar_url: Option<String>,
    default_wallet_address: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    reception_gross_total: String,
    reception_count: i64,
    received_review_count: i64,
    avg_received_review_score: Option<f64>,
}

/// 向导榜排序：`reception` = 30 §3 主序（无完成单下限）；`reviews`/`weighted` = 窗口内 `reception_count` ≥ [`GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS`] 后分别按评价均分或加权分（见 04 附录）。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GuideDidRankSort {
    ReceptionGrossThenCount,
    AvgReceivedReviewThenReception,
    /// `?sort=weighted`：窗口内接待金额合计归一化 × **W_ACTIVITY** + 评价均分（1～5→0～1）× **W_REPUTATION**，再接待金额、单数、`created_at`（与 `did_rank` chain_off 同语义）。
    WeightedActivityAndReputation,
}

/// 与 **`routes/did_rank`** **`GET …/guides?sort=weighted`** 的 ORDER BY 绑定（MVP；**08-3** 运行时调参仍属 Target）。
pub const GUIDE_DID_RANK_WEIGHTED_W_ACTIVITY: f64 = 0.6;
pub const GUIDE_DID_RANK_WEIGHTED_W_REPUTATION: f64 = 0.4;

/// **`sort=reviews` / `sort=weighted`** 入榜最低窗口内完成单数（反作弊下限；与 **`rank_basis`** **`_min_completed_ge_3`** 对齐；**08-3** 可调仍 **Target**）。
pub const GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS: i64 = 3;

async fn list_guides_did_rank_inner(
    pool: &PgPool,
    limit: i64,
    completed_since: Option<DateTime<Utc>>,
    min_completed_eligibility: Option<i64>,
    order_by_sql: &str,
) -> Result<Vec<GuideDidRankEntry>, sqlx::Error> {
    let sql = format!(
        r#"
        SELECT u.id, u.email, u.password_hash, u.role, u.kyc_status, u.nickname, u.avatar_url, u.default_wallet_address, u.created_at, u.updated_at,
               COALESCE(act.vol_sum, 0)::text AS reception_gross_total,
               COALESCE(act.cnt, 0)::bigint AS reception_count,
               COALESCE(rev.recv_cnt, 0)::bigint AS received_review_count,
               rev.recv_avg AS avg_received_review_score
        FROM users u
        LEFT JOIN (
            SELECT g.user_id AS uid,
                   SUM(o.amount::numeric) AS vol_sum,
                   COUNT(*)::bigint AS cnt
            FROM orders o
            INNER JOIN guides g ON g.id = o.guide_id
            WHERE o.status = 'completed'
              AND o.completed_at IS NOT NULL
              AND ($1::timestamptz IS NULL OR o.completed_at >= $1)
            GROUP BY g.user_id
        ) act ON act.uid = u.id
        LEFT JOIN (
            SELECT g.user_id AS uid,
                   COUNT(r.id)::bigint AS recv_cnt,
                   AVG(r.score::double precision) AS recv_avg
            FROM reviews r
            INNER JOIN orders o ON o.id = r.order_id
            INNER JOIN guides g ON g.id = o.guide_id
            WHERE o.status = 'completed'
              AND o.completed_at IS NOT NULL
              AND r.reviewee_id = g.user_id
              AND ($1::timestamptz IS NULL OR o.completed_at >= $1)
            GROUP BY g.user_id
        ) rev ON rev.uid = u.id
        WHERE u.role = 'guide'
          AND ($2::bigint IS NULL OR COALESCE(act.cnt, 0) >= $2)
        {}
        {}
        LIMIT $3
        "#,
        super::community_penalties::AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES,
        order_by_sql
    );
    let rows = sqlx::query_as::<_, GuideDidRankSql>(&sql)
        .bind(completed_since)
        .bind(min_completed_eligibility)
        .bind(limit)
        .fetch_all(pool)
        .await?;
    Ok(rows
        .into_iter()
        .map(|r| GuideDidRankEntry {
            user: UserRow {
                id: r.id,
                email: r.email,
                password_hash: r.password_hash,
                role: r.role,
                kyc_status: r.kyc_status,
                nickname: r.nickname,
                avatar_url: r.avatar_url,
                default_wallet_address: r.default_wallet_address,
                created_at: r.created_at,
                updated_at: r.updated_at,
            },
            reception_gross_total: r.reception_gross_total,
            reception_count: r.reception_count,
            received_review_count: r.received_review_count,
            avg_received_review_score: r.avg_received_review_score,
        })
        .collect())
}

/// DID 排行榜：向导按窗口内 **已完成订单金额合计** 降序，其次 **完成单数**，再 `users.created_at`（spec 30 §3）。
pub async fn list_guides_did_rank_by_reception_totals(
    pool: &PgPool,
    limit: i64,
    completed_since: Option<DateTime<Utc>>,
) -> Result<Vec<GuideDidRankEntry>, sqlx::Error> {
    list_guides_did_rank_inner(
        pool,
        limit,
        completed_since,
        None,
        "ORDER BY COALESCE(act.vol_sum, 0) DESC, COALESCE(act.cnt, 0) DESC, u.created_at DESC NULLS LAST",
    )
    .await
}

/// 向导榜：窗口内 **评价算术均分** 降序（无评价置末），其次 **接待金额合计**、**完成单数**、`users.created_at`；**新** `rank_basis`（与 §3 主序并存，由 `?sort=reviews` 选用）。**`min_completed`** 由路由层从 env 解析（默认 [`GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS`]）。
pub async fn list_guides_did_rank_by_avg_review_then_reception(
    pool: &PgPool,
    limit: i64,
    completed_since: Option<DateTime<Utc>>,
    min_completed: i64,
) -> Result<Vec<GuideDidRankEntry>, sqlx::Error> {
    list_guides_did_rank_inner(
        pool,
        limit,
        completed_since,
        Some(min_completed),
        "ORDER BY rev.recv_avg DESC NULLS LAST, COALESCE(act.vol_sum, 0) DESC, COALESCE(act.cnt, 0) DESC, u.created_at DESC NULLS LAST",
    )
    .await
}

/// 窗口内 **接待金额合计** 按全局 max 归一化 × **W_ACTIVITY** + **评价均分**（1～5 线性映到 0～1，无评价为 0）× **W_REPUTATION**，降序；其次金额、单数、`created_at`。
pub async fn list_guides_did_rank_by_weighted_composite(
    pool: &PgPool,
    limit: i64,
    completed_since: Option<DateTime<Utc>>,
    min_completed: i64,
    w_activity: f64,
    w_reputation: f64,
) -> Result<Vec<GuideDidRankEntry>, sqlx::Error> {
    let sql = format!(
        r#"
        SELECT sub.id, sub.email, sub.password_hash, sub.role, sub.kyc_status, sub.nickname, sub.avatar_url, sub.default_wallet_address, sub.created_at, sub.updated_at,
               sub.reception_gross_total,
               sub.reception_count,
               sub.received_review_count,
               sub.avg_received_review_score
        FROM (
            SELECT u.id, u.email, u.password_hash, u.role, u.kyc_status, u.nickname, u.avatar_url, u.default_wallet_address, u.created_at, u.updated_at,
                   COALESCE(act.vol_sum, 0)::text AS reception_gross_total,
                   COALESCE(act.cnt, 0)::bigint AS reception_count,
                   COALESCE(rev.recv_cnt, 0)::bigint AS received_review_count,
                   rev.recv_avg AS avg_received_review_score,
                   COALESCE(act.vol_sum, 0)::double precision AS vol,
                   COALESCE(act.cnt, 0)::bigint AS cnt,
                   (MAX(COALESCE(act.vol_sum, 0)) OVER ())::double precision AS max_vol
            FROM users u
            LEFT JOIN (
                SELECT g.user_id AS uid,
                       SUM(o.amount::numeric) AS vol_sum,
                       COUNT(*)::bigint AS cnt
                FROM orders o
                INNER JOIN guides g ON g.id = o.guide_id
                WHERE o.status = 'completed'
                  AND o.completed_at IS NOT NULL
                  AND ($1::timestamptz IS NULL OR o.completed_at >= $1)
                GROUP BY g.user_id
            ) act ON act.uid = u.id
            LEFT JOIN (
                SELECT g.user_id AS uid,
                       COUNT(r.id)::bigint AS recv_cnt,
                       AVG(r.score::double precision) AS recv_avg
                FROM reviews r
                INNER JOIN orders o ON o.id = r.order_id
                INNER JOIN guides g ON g.id = o.guide_id
                WHERE o.status = 'completed'
                  AND o.completed_at IS NOT NULL
                  AND r.reviewee_id = g.user_id
                  AND ($1::timestamptz IS NULL OR o.completed_at >= $1)
                GROUP BY g.user_id
            ) rev ON rev.uid = u.id
            WHERE u.role = 'guide'
              AND COALESCE(act.cnt, 0) >= $2::bigint
              {}
        ) sub
        ORDER BY (
            $4::double precision * (
                CASE WHEN sub.max_vol > 0::double precision
                     THEN sub.vol / NULLIF(sub.max_vol, 0::double precision)
                     ELSE 0::double precision END
            )
            + $5::double precision * (
                CASE WHEN sub.avg_received_review_score IS NOT NULL THEN
                    GREATEST(0::double precision,
                      LEAST(1::double precision,
                        (sub.avg_received_review_score - 1.0) / 4.0))
                ELSE 0::double precision END
            )
        ) DESC NULLS LAST,
        sub.vol DESC,
        sub.cnt DESC,
        sub.created_at DESC NULLS LAST
        LIMIT $3
        "#,
        super::community_penalties::AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES
    );
    let rows = sqlx::query_as::<_, GuideDidRankSql>(&sql)
        .bind(completed_since)
        .bind(min_completed)
        .bind(limit)
        .bind(w_activity)
        .bind(w_reputation)
        .fetch_all(pool)
        .await?;
    Ok(rows
        .into_iter()
        .map(|r| GuideDidRankEntry {
            user: UserRow {
                id: r.id,
                email: r.email,
                password_hash: r.password_hash,
                role: r.role,
                kyc_status: r.kyc_status,
                nickname: r.nickname,
                avatar_url: r.avatar_url,
                default_wallet_address: r.default_wallet_address,
                created_at: r.created_at,
                updated_at: r.updated_at,
            },
            reception_gross_total: r.reception_gross_total,
            reception_count: r.reception_count,
            received_review_count: r.received_review_count,
            avg_received_review_score: r.avg_received_review_score,
        })
        .collect())
}

/// 按 [`GuideDidRankSort`] 查询向导榜（DB 路径）。**`min_completed` / `w_*`** 由 `routes/did_rank` 从 env 解析后传入（与 chain_off 一致）。
pub async fn list_guides_did_rank(
    pool: &PgPool,
    limit: i64,
    completed_since: Option<DateTime<Utc>>,
    sort: GuideDidRankSort,
    min_completed_for_reputation_sorts: i64,
    weighted_w_activity: f64,
    weighted_w_reputation: f64,
) -> Result<Vec<GuideDidRankEntry>, sqlx::Error> {
    match sort {
        GuideDidRankSort::ReceptionGrossThenCount => {
            list_guides_did_rank_by_reception_totals(pool, limit, completed_since).await
        }
        GuideDidRankSort::AvgReceivedReviewThenReception => {
            list_guides_did_rank_by_avg_review_then_reception(
                pool,
                limit,
                completed_since,
                min_completed_for_reputation_sorts,
            )
            .await
        }
        GuideDidRankSort::WeightedActivityAndReputation => {
            list_guides_did_rank_by_weighted_composite(
                pool,
                limit,
                completed_since,
                min_completed_for_reputation_sorts,
                weighted_w_activity,
                weighted_w_reputation,
            )
            .await
        }
    }
}

/// 按 role 取用户列表（50-B3 did-rank；`created_at_min` 为 None 表示全量，否则仅 `created_at >= min`）
pub async fn list_users_by_role(
    pool: &PgPool,
    role: &str,
    limit: i64,
    created_at_min: Option<DateTime<Utc>>,
) -> Result<Vec<UserRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, String, String, Option<String>, Option<String>, Option<String>, DateTime<Utc>, DateTime<Utc>)>(
        "SELECT id, email, password_hash, role, kyc_status, nickname, avatar_url, default_wallet_address, created_at, updated_at FROM users WHERE role = $1 AND ($3::timestamptz IS NULL OR created_at >= $3) ORDER BY created_at DESC NULLS LAST LIMIT $2",
    )
    .bind(role)
    .bind(limit)
    .bind(created_at_min)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                email,
                password_hash,
                role,
                kyc_status,
                nickname,
                avatar_url,
                default_wallet_address,
                created_at,
                updated_at,
            )| UserRow {
                id,
                email,
                password_hash,
                role,
                kyc_status,
                nickname,
                avatar_url,
                default_wallet_address,
                created_at,
                updated_at,
            },
        )
        .collect())
}

/// 按 token 查 user_id（P1 鉴权增强）
/// 社区评论列表等场景：判断 viewer 是否 admin/super_admin（160、04 §3.4）
pub async fn get_user_role_by_id(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar::<_, String>("SELECT role FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(pool)
        .await
}

pub async fn get_user_id_by_token(pool: &PgPool, token: &str) -> Result<Option<Uuid>, sqlx::Error> {
    let row = sqlx::query_as::<_, (Uuid,)>("SELECT user_id FROM sessions WHERE token = $1")
        .bind(token)
        .fetch_optional(pool)
        .await?;
    Ok(row.map(|r| r.0))
}

/// 更新用户密码（50-B2 put_me_password 真实实现）
pub async fn update_user_password(
    pool: &PgPool,
    user_id: Uuid,
    password_hash: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2")
        .bind(password_hash)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}
