//! Admin Official Accounts M7 (O-S1 · 101/103 SSOT)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use super::{create_referral_code_admin, CreateReferralCodeInput};

const REVIEW_DRAFT: &str = "draft";
const REVIEW_IN_REVIEW: &str = "in_review";
const REVIEW_PUBLISHED: &str = "published";
const REVIEW_ARCHIVED: &str = "archived";

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminOfficialAccountRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub account_kind: String,
    pub display_label: String,
    pub is_active: bool,
    pub showcase_eligible: bool,
    pub data_origin: String,
    pub linked_guide_id: Option<Uuid>,
    pub linked_provider_app: Option<Uuid>,
    pub metadata: Value,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_email: Option<String>,
    pub user_nickname: Option<String>,
    pub user_role: Option<String>,
    pub kol_referral_code: Option<String>,
}

fn review_status(metadata: &Value) -> &str {
    metadata
        .get("review_status")
        .and_then(|v| v.as_str())
        .unwrap_or(REVIEW_DRAFT)
}

fn user_role_for_kind(kind: &str) -> &'static str {
    match kind {
        "guide" => "guide",
        "merchant" => "tourist",
        _ => "tourist",
    }
}

async fn reload_official_account(
    pool: &PgPool,
    id: Uuid,
) -> Result<Result<AdminOfficialAccountRow, &'static str>, sqlx::Error> {
    match get_official_account_admin(pool, id).await? {
        Some(row) => Ok(Ok(row)),
        None => Ok(Err("not_found")),
    }
}

pub async fn list_official_accounts_admin(
    pool: &PgPool,
    account_kind: Option<&str>,
    is_active: Option<bool>,
    limit: i64,
) -> Result<Vec<AdminOfficialAccountRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT o.id, o.user_id, o.account_kind, o.display_label, o.is_active, o.showcase_eligible,
                  o.data_origin, o.linked_guide_id, o.linked_provider_app, o.metadata, o.created_by,
                  o.created_at, o.updated_at,
                  u.email AS user_email, u.nickname AS user_nickname, u.role AS user_role,
                  rc.code AS kol_referral_code
           FROM ops_official_accounts o
           JOIN users u ON u.id = o.user_id
           LEFT JOIN referral_codes rc ON rc.official_account_id = o.id AND rc.code_type = 'kol'
           WHERE ($1::text IS NULL OR o.account_kind = $1)
             AND ($2::bool IS NULL OR o.is_active = $2)
           ORDER BY o.created_at DESC
           LIMIT $3"#,
    )
    .bind(account_kind)
    .bind(is_active)
    .bind(limit.clamp(1, 200))
    .fetch_all(pool)
    .await
}

pub async fn get_official_account_admin(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminOfficialAccountRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT o.id, o.user_id, o.account_kind, o.display_label, o.is_active, o.showcase_eligible,
                  o.data_origin, o.linked_guide_id, o.linked_provider_app, o.metadata, o.created_by,
                  o.created_at, o.updated_at,
                  u.email AS user_email, u.nickname AS user_nickname, u.role AS user_role,
                  rc.code AS kol_referral_code
           FROM ops_official_accounts o
           JOIN users u ON u.id = o.user_id
           LEFT JOIN referral_codes rc ON rc.official_account_id = o.id AND rc.code_type = 'kol'
           WHERE o.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub struct CreateOfficialAccountInput {
    pub email: String,
    pub password_hash: String,
    pub account_kind: String,
    pub display_label: String,
    pub nickname: Option<String>,
    pub data_origin: Option<String>,
    pub metadata: Option<Value>,
}

pub async fn create_official_account_admin(
    pool: &PgPool,
    actor_id: Uuid,
    input: CreateOfficialAccountInput,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialAccountRow, &'static str>, sqlx::Error> {
    let kind = input.account_kind.trim();
    if !["traveler", "guide", "merchant", "community_author"].contains(&kind) {
        return Ok(Err("invalid_account_kind"));
    }
    let email = input.email.trim().to_lowercase();
    if email.is_empty() {
        return Ok(Err("invalid_email"));
    }
    let exists: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM users WHERE lower(email) = $1")
        .bind(&email)
        .fetch_optional(pool)
        .await?;
    if exists.is_some() {
        return Ok(Err("email_exists"));
    }
    let user_id = Uuid::new_v4();
    let now = Utc::now();
    let role = user_role_for_kind(kind);
    let nickname = input.nickname.as_deref().unwrap_or(input.display_label.trim());
    let data_origin = input
        .data_origin
        .as_deref()
        .unwrap_or("official_seed");
    if !["production", "test", "demo", "official_seed"].contains(&data_origin) {
        return Ok(Err("invalid_data_origin"));
    }
    let metadata = input.metadata.unwrap_or_else(|| {
        json!({ "review_status": REVIEW_DRAFT, "seed_replacement": true })
    });
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"INSERT INTO users (id, email, password_hash, role, kyc_status, nickname, avatar_url, default_wallet_address, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'none', $5, NULL, NULL, $6, $6)"#,
    )
    .bind(user_id)
    .bind(&email)
    .bind(&input.password_hash)
    .bind(role)
    .bind(nickname)
    .bind(now)
    .execute(&mut *tx)
    .await?;
    let account_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO ops_official_accounts
           (user_id, account_kind, display_label, is_active, showcase_eligible, data_origin,
            metadata, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, false, true, $4, $5, $6, $7, $7)
           RETURNING id"#,
    )
    .bind(user_id)
    .bind(kind)
    .bind(input.display_label.trim())
    .bind(data_origin)
    .bind(metadata)
    .bind(actor_id)
    .bind(now)
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('ops.official.account.created', 'ops_official_account', $1, $2, $3, $4, $5)"#,
    )
    .bind(account_id.to_string())
    .bind(actor_id)
    .bind(request_id)
    .bind(json!({ "user_id": user_id, "email": email, "account_kind": kind }))
    .bind(now)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    match get_official_account_admin(pool, account_id).await? {
        Some(row) => Ok(Ok(row)),
        None => Ok(Err("not_found")),
    }
}

pub struct BatchCreateOfficialAccountItem {
    pub email: String,
    pub password_hash: String,
    pub account_kind: String,
    pub display_label: String,
    pub nickname: Option<String>,
}

pub async fn batch_create_official_accounts_admin(
    pool: &PgPool,
    actor_id: Uuid,
    items: Vec<BatchCreateOfficialAccountItem>,
    request_id: Option<&str>,
) -> Result<Vec<Result<AdminOfficialAccountRow, &'static str>>, sqlx::Error> {
    let mut out = Vec::with_capacity(items.len());
    for item in items {
        let res = create_official_account_admin(
            pool,
            actor_id,
            CreateOfficialAccountInput {
                email: item.email,
                password_hash: item.password_hash,
                account_kind: item.account_kind,
                display_label: item.display_label,
                nickname: item.nickname,
                data_origin: Some("official_seed".into()),
                metadata: None,
            },
            request_id,
        )
        .await?;
        out.push(res);
    }
    Ok(out)
}

#[derive(Debug, Default)]
pub struct PatchOfficialAccountInput {
    pub display_label: Option<String>,
    pub showcase_eligible: Option<bool>,
    pub data_origin: Option<String>,
    pub metadata: Option<Value>,
}

pub async fn patch_official_account_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    input: PatchOfficialAccountInput,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialAccountRow, &'static str>, sqlx::Error> {
    let row = get_official_account_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if review_status(&row.metadata) == REVIEW_ARCHIVED {
        return Ok(Err("archived"));
    }
    let label = input
        .display_label
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(row.display_label.as_str());
    let metadata = input.metadata.unwrap_or(row.metadata);
    let showcase = input.showcase_eligible.unwrap_or(row.showcase_eligible);
    let data_origin = input
        .data_origin
        .as_deref()
        .unwrap_or(row.data_origin.as_str());
    if !["production", "test", "demo", "official_seed"].contains(&data_origin) {
        return Ok(Err("invalid_data_origin"));
    }
    sqlx::query(
        r#"UPDATE ops_official_accounts
           SET display_label = $2, showcase_eligible = $3, data_origin = $4, metadata = $5, updated_at = $6
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(label)
    .bind(showcase)
    .bind(data_origin)
    .bind(metadata)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_account_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.account.updated",
        id,
        json!({ "display_label": label }),
    )
    .await?;
    reload_official_account(pool, id).await
}

async fn insert_official_account_audit(
    pool: &PgPool,
    actor_id: Uuid,
    request_id: Option<&str>,
    action: &str,
    account_id: Uuid,
    payload: Value,
) -> Result<(), sqlx::Error> {
    super::insert_admin_audit_log(
        pool,
        actor_id,
        request_id,
        action,
        Some("ops_official_account"),
        Some(account_id.to_string().as_str()),
        &payload,
    )
    .await
}

pub async fn submit_official_account_review(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialAccountRow, &'static str>, sqlx::Error> {
    let row = get_official_account_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if review_status(&row.metadata) != REVIEW_DRAFT {
        return Ok(Err("not_draft"));
    }
    let mut meta = row.metadata.clone();
    if let Some(obj) = meta.as_object_mut() {
        obj.insert("review_status".into(), json!(REVIEW_IN_REVIEW));
    }
    sqlx::query(
        "UPDATE ops_official_accounts SET metadata = $2, updated_at = $3 WHERE id = $1",
    )
    .bind(id)
    .bind(meta)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_account_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.account.submit_review",
        id,
        json!({ "review_status": REVIEW_IN_REVIEW }),
    )
    .await?;
    reload_official_account(pool, id).await
}

pub async fn request_official_account_publish(
    pool: &PgPool,
    id: Uuid,
    requested_by: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Result<Uuid, &'static str>, sqlx::Error> {
    let row = get_official_account_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if review_status(&row.metadata) != REVIEW_IN_REVIEW {
        return Ok(Err("not_in_review"));
    }
    let mut tx = pool.begin().await?;
    let approval_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO admin_approval_requests
           (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
           VALUES ('ops.official.account.publish', 'ops_official_account', $1, $2, 'pending', $3, $4, $5, $6)
           RETURNING id"#,
    )
    .bind(id.to_string())
    .bind(requested_by)
    .bind(reason)
    .bind(json!({ "review_status": REVIEW_IN_REVIEW, "is_active": row.is_active }))
    .bind(json!({ "review_status": REVIEW_PUBLISHED, "is_active": true, "data_origin": "production" }))
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('ops.official.account.publish.requested', 'ops_official_account', $1, $2, $3, $4, $5)"#,
    )
    .bind(id.to_string())
    .bind(requested_by)
    .bind(request_id)
    .bind(json!({ "approval_id": approval_id }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(Ok(approval_id))
}

pub async fn publish_official_account_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialAccountRow, &'static str>, sqlx::Error> {
    let row = get_official_account_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if review_status(&row.metadata) != REVIEW_IN_REVIEW {
        return Ok(Err("not_in_review"));
    }
    let mut meta = row.metadata.clone();
    if let Some(obj) = meta.as_object_mut() {
        obj.insert("review_status".into(), json!(REVIEW_PUBLISHED));
    }
    sqlx::query(
        r#"UPDATE ops_official_accounts
           SET is_active = true, data_origin = 'production', metadata = $2, updated_at = $3
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(meta)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_account_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.account.published",
        id,
        json!({ "data_origin": "production" }),
    )
    .await?;
    reload_official_account(pool, id).await
}

pub async fn approve_official_account_publish_with_audit(
    pool: &PgPool,
    approval_id: Uuid,
    approver_id: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Option<(Uuid, Uuid)>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let existing: Option<(String, String, String, Uuid, String)> = sqlx::query_as(
        r#"SELECT action, resource_type, resource_id, requested_by, status
           FROM admin_approval_requests WHERE id = $1 FOR UPDATE"#,
    )
    .bind(approval_id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some(existing) = existing else {
        return Ok(None);
    };
    if existing.0 != "ops.official.account.publish" || existing.4 != "pending" {
        return Ok(None);
    }
    if existing.3 == approver_id {
        return Ok(None);
    }
    let account_id = Uuid::parse_str(&existing.2).unwrap_or_else(|_| Uuid::nil());
    if account_id.is_nil() {
        return Ok(None);
    }
    sqlx::query(
        r#"UPDATE admin_approval_requests SET status = 'approved', approved_by = $2, approve_reason = $3, approved_at = $4
           WHERE id = $1"#,
    )
    .bind(approval_id)
    .bind(approver_id)
    .bind(reason)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    match publish_official_account_admin(pool, account_id, approver_id, request_id).await? {
        Ok(_) => Ok(Some((approval_id, account_id))),
        Err(_) => Ok(None),
    }
}

pub async fn archive_official_account_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialAccountRow, &'static str>, sqlx::Error> {
    let row = get_official_account_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    let mut meta = row.metadata.clone();
    if let Some(obj) = meta.as_object_mut() {
        obj.insert("review_status".into(), json!(REVIEW_ARCHIVED));
    }
    sqlx::query(
        "UPDATE ops_official_accounts SET is_active = false, metadata = $2, updated_at = $3 WHERE id = $1",
    )
    .bind(id)
    .bind(meta)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_account_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.account.archived",
        id,
        json!({}),
    )
    .await?;
    reload_official_account(pool, id).await
}

pub async fn link_official_account_guide(
    pool: &PgPool,
    id: Uuid,
    guide_id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialAccountRow, &'static str>, sqlx::Error> {
    let updated = sqlx::query(
        "UPDATE ops_official_accounts SET linked_guide_id = $2, updated_at = $3 WHERE id = $1",
    )
    .bind(id)
    .bind(guide_id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    if updated.rows_affected() == 0 {
        return Ok(Err("not_found"));
    }
    insert_official_account_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.account.link_guide",
        id,
        json!({ "guide_id": guide_id }),
    )
    .await?;
    reload_official_account(pool, id).await
}

pub async fn link_official_account_provider(
    pool: &PgPool,
    id: Uuid,
    provider_app_id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialAccountRow, &'static str>, sqlx::Error> {
    let updated = sqlx::query(
        "UPDATE ops_official_accounts SET linked_provider_app = $2, updated_at = $3 WHERE id = $1",
    )
    .bind(id)
    .bind(provider_app_id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    if updated.rows_affected() == 0 {
        return Ok(Err("not_found"));
    }
    insert_official_account_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.account.link_provider",
        id,
        json!({ "provider_app_id": provider_app_id }),
    )
    .await?;
    reload_official_account(pool, id).await
}

pub async fn bind_official_account_kol_referral(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    code: Option<String>,
    label: Option<String>,
    region_iso: Option<String>,
    request_id: Option<&str>,
) -> Result<Result<(AdminOfficialAccountRow, String), &'static str>, sqlx::Error> {
    let row = get_official_account_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    let existing: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM referral_codes WHERE official_account_id = $1 AND code_type = 'kol'")
            .bind(id)
            .fetch_optional(pool)
            .await?;
    if existing.is_some() {
        return Ok(Err("kol_already_bound"));
    }
    let referral = create_referral_code_admin(
        pool,
        CreateReferralCodeInput {
            code,
            code_type: "kol".into(),
            owner_user_id: Some(row.user_id),
            region_iso,
            label,
            max_uses: None,
            created_by: Some(actor_id),
        },
    )
    .await?;
    sqlx::query("UPDATE referral_codes SET official_account_id = $2, updated_at = $3 WHERE id = $1")
        .bind(referral.id)
        .bind(id)
        .bind(Utc::now())
        .execute(pool)
        .await?;
    insert_official_account_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.account.bind_kol_referral",
        id,
        json!({ "referral_code": referral.code }),
    )
    .await?;
    let updated = get_official_account_admin(pool, id).await?;
    match updated {
        Some(row) => Ok(Ok((row, referral.code))),
        None => Ok(Err("not_found")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn review_status_defaults_draft() {
        assert_eq!(review_status(&json!({})), REVIEW_DRAFT);
    }

    #[test]
    fn user_role_for_kind_guide() {
        assert_eq!(user_role_for_kind("guide"), "guide");
    }
}
