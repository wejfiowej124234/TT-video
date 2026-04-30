//! 链下治理 MVP（B-072/B-073/B-092）可选 **PostgreSQL** 持久化；与 `governance_mvp_gate::mvp_persist_pool` 对读。

use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct GovernanceMvpProposalRow {
    pub id: Uuid,
    pub title: String,
    pub body: String,
    pub status: String,
}

pub async fn governance_mvp_list_proposals(
    pool: &PgPool,
) -> Result<Vec<GovernanceMvpProposalRow>, sqlx::Error> {
    sqlx::query_as::<_, GovernanceMvpProposalRow>(
        "SELECT id, title, body, status FROM governance_mvp_proposals ORDER BY id ASC",
    )
    .fetch_all(pool)
    .await
}

pub async fn governance_mvp_get_proposal(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<GovernanceMvpProposalRow>, sqlx::Error> {
    sqlx::query_as::<_, GovernanceMvpProposalRow>(
        "SELECT id, title, body, status FROM governance_mvp_proposals WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn governance_mvp_tally(
    pool: &PgPool,
    proposal_id: Uuid,
) -> Result<(i64, i64, i64), sqlx::Error> {
    let row: (Option<i64>, Option<i64>, Option<i64>) = sqlx::query_as(
        r#"SELECT
            COALESCE(SUM(weight) FILTER (WHERE choice = 'yes'), 0)::bigint,
            COALESCE(SUM(weight) FILTER (WHERE choice = 'no'), 0)::bigint,
            COALESCE(SUM(weight) FILTER (WHERE choice = 'abstain'), 0)::bigint
           FROM governance_mvp_votes WHERE proposal_id = $1"#,
    )
    .bind(proposal_id)
    .fetch_one(pool)
    .await?;
    Ok((row.0.unwrap_or(0), row.1.unwrap_or(0), row.2.unwrap_or(0)))
}

pub async fn governance_mvp_get_vote(
    pool: &PgPool,
    proposal_id: Uuid,
    voter_user_id: Uuid,
) -> Result<Option<(String, i64)>, sqlx::Error> {
    let row = sqlx::query_as::<_, (String, i64)>(
        "SELECT choice, weight FROM governance_mvp_votes WHERE proposal_id = $1 AND voter_user_id = $2",
    )
    .bind(proposal_id)
    .bind(voter_user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row)
}

pub async fn governance_mvp_insert_vote(
    pool: &PgPool,
    proposal_id: Uuid,
    voter_user_id: Uuid,
    choice: &str,
    weight: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO governance_mvp_votes (proposal_id, voter_user_id, choice, weight, voted_at)
           VALUES ($1, $2, $3, $4, now())"#,
    )
    .bind(proposal_id)
    .bind(voter_user_id)
    .bind(choice)
    .bind(weight)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn governance_mvp_reset_demo_state(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM governance_mvp_votes")
        .execute(pool)
        .await?;
    sqlx::query("DELETE FROM governance_mvp_delegations")
        .execute(pool)
        .await?;
    sqlx::query(
        r#"INSERT INTO governance_mvp_proposals (id, title, body, status) VALUES
            ('00000000-0000-4000-8000-000000000001'::uuid,
             'TT MVP: FeeRouter parameter calibration',
             'Chain-off governance demo proposal. Vote to signal support for aligning protocol-reference snapshots with runtime GET /meta (B-072 MVP).',
             'active'),
            ('00000000-0000-4000-8000-000000000002'::uuid,
             'Treasury rotation (MVP demo)',
             'Second demo entry for list/detail navigation and vote isolation tests.',
             'active')
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             body = EXCLUDED.body,
             status = EXCLUDED.status,
             updated_at = now()"#,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn governance_mvp_delegation_get(
    pool: &PgPool,
    voter_user_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT delegate_to FROM governance_mvp_delegations WHERE voter_user_id = $1",
    )
    .bind(voter_user_id)
    .fetch_optional(pool)
    .await
}

pub async fn governance_mvp_direct_delegator_count(
    pool: &PgPool,
    delegate_target: Uuid,
) -> Result<i64, sqlx::Error> {
    let n: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM governance_mvp_delegations WHERE delegate_to = $1",
    )
    .bind(delegate_target)
    .fetch_one(pool)
    .await?;
    Ok(n.unwrap_or(0))
}

pub async fn governance_mvp_delegation_upsert(
    pool: &PgPool,
    voter_user_id: Uuid,
    delegate_to: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO governance_mvp_delegations (voter_user_id, delegate_to, updated_at)
           VALUES ($1, $2, now())
           ON CONFLICT (voter_user_id) DO UPDATE SET
             delegate_to = EXCLUDED.delegate_to,
             updated_at = now()"#,
    )
    .bind(voter_user_id)
    .bind(delegate_to)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn governance_mvp_delegation_delete(
    pool: &PgPool,
    voter_user_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query("DELETE FROM governance_mvp_delegations WHERE voter_user_id = $1")
        .bind(voter_user_id)
        .execute(pool)
        .await?;
    Ok(r.rows_affected())
}
