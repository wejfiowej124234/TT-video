//! Admin Official Itinerary Templates M9 (O-S3 · 101/103 SSOT)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

const STATUS_DRAFT: &str = "draft";
const STATUS_IN_REVIEW: &str = "in_review";
const STATUS_PUBLISHED: &str = "published";
const STATUS_ARCHIVED: &str = "archived";

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminOfficialItineraryTemplateRow {
    pub id: Uuid,
    pub title: String,
    pub country_iso: Option<String>,
    pub city_id: Option<Uuid>,
    pub days_json: Value,
    pub budget_json: Value,
    pub cover_image_url: Option<String>,
    pub author_account_id: Option<Uuid>,
    pub publish_status: String,
    pub data_origin: String,
    pub linked_order_id: Option<Uuid>,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub author_display_label: Option<String>,
    pub author_user_email: Option<String>,
    pub city_name_zh: Option<String>,
    pub country_name_zh: Option<String>,
}

const LIST_SELECT: &str = r#"SELECT t.id, t.title, t.country_iso, t.city_id, t.days_json, t.budget_json,
                  t.cover_image_url, t.author_account_id, t.publish_status, t.data_origin,
                  t.linked_order_id, t.version, t.published_at, t.created_at, t.updated_at,
                  a.display_label AS author_display_label, u.email AS author_user_email,
                  c.name_zh AS city_name_zh, co.name_zh AS country_name_zh
           FROM ops_official_itinerary_templates t
           LEFT JOIN ops_official_accounts a ON a.id = t.author_account_id
           LEFT JOIN users u ON u.id = a.user_id
           LEFT JOIN catalog_cities c ON c.id = t.city_id
           LEFT JOIN catalog_countries co ON co.iso3166 = t.country_iso"#;

async fn reload_official_itinerary_template(
    pool: &PgPool,
    id: Uuid,
) -> Result<Result<AdminOfficialItineraryTemplateRow, &'static str>, sqlx::Error> {
    match get_official_itinerary_template_admin(pool, id).await? {
        Some(row) => Ok(Ok(row)),
        None => Ok(Err("not_found")),
    }
}

async fn validate_author_account(
    pool: &PgPool,
    author_account_id: Uuid,
) -> Result<Result<(), &'static str>, sqlx::Error> {
    let exists: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM ops_official_accounts WHERE id = $1")
            .bind(author_account_id)
            .fetch_optional(pool)
            .await?;
    if exists.is_none() {
        return Ok(Err("author_account_not_found"));
    }
    Ok(Ok(()))
}

async fn validate_catalog_refs(
    pool: &PgPool,
    country_iso: Option<&str>,
    city_id: Option<Uuid>,
) -> Result<Result<(), &'static str>, sqlx::Error> {
    let country_iso = country_iso.map(str::trim).filter(|s| !s.is_empty());
    if let Some(iso) = country_iso {
        let exists: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM catalog_countries WHERE iso3166 = $1",
        )
        .bind(iso.to_uppercase())
        .fetch_optional(pool)
        .await?;
        if exists.is_none() {
            return Ok(Err("country_not_found"));
        }
    }
    if let Some(city_id) = city_id {
        let city: Option<(Uuid, String)> = sqlx::query_as(
            r#"SELECT c.id, co.iso3166
               FROM catalog_cities c
               JOIN catalog_countries co ON co.id = c.country_id
               WHERE c.id = $1"#,
        )
        .bind(city_id)
        .fetch_optional(pool)
        .await?;
        let Some((_, city_country_iso)) = city else {
            return Ok(Err("city_not_found"));
        };
        if let Some(iso) = country_iso {
            if city_country_iso.to_uppercase() != iso.to_uppercase() {
                return Ok(Err("city_country_mismatch"));
            }
        }
    }
    Ok(Ok(()))
}

pub async fn list_official_itinerary_templates_admin(
    pool: &PgPool,
    author_account_id: Option<Uuid>,
    country_iso: Option<&str>,
    publish_status: Option<&str>,
    limit: i64,
) -> Result<Vec<AdminOfficialItineraryTemplateRow>, sqlx::Error> {
    let query = format!(
        r#"{LIST_SELECT}
           WHERE ($1::uuid IS NULL OR t.author_account_id = $1)
             AND ($2::text IS NULL OR t.country_iso = $2)
             AND ($3::text IS NULL OR t.publish_status = $3)
           ORDER BY t.updated_at DESC
           LIMIT $4"#
    );
    sqlx::query_as(&query)
        .bind(author_account_id)
        .bind(country_iso.map(|s| s.trim().to_uppercase()).filter(|s| !s.is_empty()))
        .bind(publish_status)
        .bind(limit.clamp(1, 200))
        .fetch_all(pool)
        .await
}

pub async fn get_official_itinerary_template_admin(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminOfficialItineraryTemplateRow>, sqlx::Error> {
    let query = format!("{LIST_SELECT} WHERE t.id = $1");
    sqlx::query_as(&query).bind(id).fetch_optional(pool).await
}

pub struct CreateOfficialItineraryTemplateInput {
    pub title: String,
    pub author_account_id: Uuid,
    pub country_iso: Option<String>,
    pub city_id: Option<Uuid>,
    pub days_json: Value,
    pub budget_json: Value,
    pub cover_image_url: Option<String>,
}

pub async fn create_official_itinerary_template_admin(
    pool: &PgPool,
    actor_id: Uuid,
    input: CreateOfficialItineraryTemplateInput,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialItineraryTemplateRow, &'static str>, sqlx::Error> {
    match validate_author_account(pool, input.author_account_id).await? {
        Ok(()) => {}
        Err(code) => return Ok(Err(code)),
    }
    let country_iso = input
        .country_iso
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_uppercase());
    match validate_catalog_refs(pool, country_iso.as_deref(), input.city_id).await? {
        Ok(()) => {}
        Err(code) => return Ok(Err(code)),
    }
    let title = input.title.trim();
    if title.is_empty() {
        return Ok(Err("invalid_title"));
    }
    let now = Utc::now();
    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO ops_official_itinerary_templates
           (title, country_iso, city_id, days_json, budget_json, cover_image_url,
            author_account_id, publish_status, data_origin, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', 'official_seed', $8, $8)
           RETURNING id"#,
    )
    .bind(title)
    .bind(country_iso.as_deref())
    .bind(input.city_id)
    .bind(input.days_json)
    .bind(input.budget_json)
    .bind(
        input
            .cover_image_url
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty()),
    )
    .bind(input.author_account_id)
    .bind(now)
    .fetch_one(pool)
    .await?;
    insert_official_itinerary_template_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.itinerary_template.created",
        id,
        json!({
            "title": title,
            "author_account_id": input.author_account_id,
            "country_iso": country_iso,
            "city_id": input.city_id
        }),
    )
    .await?;
    reload_official_itinerary_template(pool, id).await
}

#[derive(Debug, Default)]
pub struct PatchOfficialItineraryTemplateInput {
    pub title: Option<String>,
    pub author_account_id: Option<Uuid>,
    pub country_iso: Option<String>,
    pub city_id: Option<Uuid>,
    pub days_json: Option<Value>,
    pub budget_json: Option<Value>,
    pub cover_image_url: Option<String>,
}

pub async fn patch_official_itinerary_template_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    input: PatchOfficialItineraryTemplateInput,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialItineraryTemplateRow, &'static str>, sqlx::Error> {
    let row = get_official_itinerary_template_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status == STATUS_ARCHIVED {
        return Ok(Err("archived"));
    }
    if row.publish_status == STATUS_PUBLISHED
        && (input.author_account_id.is_some()
            || input.country_iso.is_some()
            || input.city_id.is_some())
    {
        return Ok(Err("cannot_rebind_published"));
    }
    if let Some(new_author) = input.author_account_id {
        match validate_author_account(pool, new_author).await? {
            Ok(()) => {}
            Err(code) => return Ok(Err(code)),
        }
    }
    let country_iso = input
        .country_iso
        .as_ref()
        .map(|s| s.trim().to_uppercase())
        .filter(|s| !s.is_empty())
        .or_else(|| row.country_iso.clone());
    let city_id = input.city_id.or(row.city_id);
    match validate_catalog_refs(pool, country_iso.as_deref(), city_id).await? {
        Ok(()) => {}
        Err(code) => return Ok(Err(code)),
    }
    let title = input
        .title
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(row.title.as_str());
    let days_json = input.days_json.unwrap_or(row.days_json);
    let budget_json = input.budget_json.unwrap_or(row.budget_json);
    let cover_image_url = input
        .cover_image_url
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .or(row.cover_image_url);
    let author_account_id = input.author_account_id.or(row.author_account_id);
    sqlx::query(
        r#"UPDATE ops_official_itinerary_templates
           SET title = $2, country_iso = $3, city_id = $4, days_json = $5, budget_json = $6,
               cover_image_url = $7, author_account_id = $8, version = version + 1, updated_at = $9
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(title)
    .bind(country_iso.as_deref())
    .bind(city_id)
    .bind(days_json)
    .bind(budget_json)
    .bind(cover_image_url)
    .bind(author_account_id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_itinerary_template_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.itinerary_template.updated",
        id,
        json!({ "title": title }),
    )
    .await?;
    reload_official_itinerary_template(pool, id).await
}

pub async fn submit_official_itinerary_template_review(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialItineraryTemplateRow, &'static str>, sqlx::Error> {
    let row = get_official_itinerary_template_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != STATUS_DRAFT {
        return Ok(Err("not_draft"));
    }
    sqlx::query(
        "UPDATE ops_official_itinerary_templates SET publish_status = 'in_review', updated_at = $2 WHERE id = $1",
    )
    .bind(id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_itinerary_template_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.itinerary_template.submit_review",
        id,
        json!({}),
    )
    .await?;
    reload_official_itinerary_template(pool, id).await
}

pub async fn request_official_itinerary_template_publish(
    pool: &PgPool,
    id: Uuid,
    requested_by: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Result<Uuid, &'static str>, sqlx::Error> {
    let row = get_official_itinerary_template_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != STATUS_IN_REVIEW {
        return Ok(Err("not_in_review"));
    }
    let mut tx = pool.begin().await?;
    let approval_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO admin_approval_requests
           (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
           VALUES ('ops.itinerary_template.publish', 'ops_official_itinerary_template', $1, $2, 'pending', $3, $4, $5, $6)
           RETURNING id"#,
    )
    .bind(id.to_string())
    .bind(requested_by)
    .bind(reason)
    .bind(json!({ "publish_status": row.publish_status, "title": row.title }))
    .bind(json!({ "publish_status": STATUS_PUBLISHED, "data_origin": "production" }))
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('ops.official.itinerary_template.publish.requested', 'ops_official_itinerary_template', $1, $2, $3, $4, $5)"#,
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

pub async fn publish_official_itinerary_template_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialItineraryTemplateRow, &'static str>, sqlx::Error> {
    let row = get_official_itinerary_template_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != STATUS_IN_REVIEW {
        return Ok(Err("not_in_review"));
    }
    if let Some(author_id) = row.author_account_id {
        let author: Option<(bool,)> = sqlx::query_as(
            "SELECT is_active FROM ops_official_accounts WHERE id = $1",
        )
        .bind(author_id)
        .fetch_optional(pool)
        .await?;
        let Some((is_active,)) = author else {
            return Ok(Err("author_account_not_found"));
        };
        if !is_active {
            return Ok(Err("author_account_inactive"));
        }
    }
    match validate_catalog_refs(
        pool,
        row.country_iso.as_deref(),
        row.city_id,
    )
    .await?
    {
        Ok(()) => {}
        Err(code) => return Ok(Err(code)),
    }
    let now = Utc::now();
    sqlx::query(
        r#"UPDATE ops_official_itinerary_templates
           SET publish_status = 'published', data_origin = 'production', published_at = $2, updated_at = $2
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(now)
    .execute(pool)
    .await?;
    insert_official_itinerary_template_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.itinerary_template.published",
        id,
        json!({
            "country_iso": row.country_iso,
            "city_id": row.city_id,
            "author_account_id": row.author_account_id
        }),
    )
    .await?;
    reload_official_itinerary_template(pool, id).await
}

pub async fn approve_official_itinerary_template_publish_with_audit(
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
    if existing.0 != "ops.itinerary_template.publish" || existing.4 != "pending" {
        return Ok(None);
    }
    if existing.3 == approver_id {
        return Ok(None);
    }
    let template_id = Uuid::parse_str(&existing.2).unwrap_or_else(|_| Uuid::nil());
    if template_id.is_nil() {
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
    match publish_official_itinerary_template_admin(pool, template_id, approver_id, request_id).await?
    {
        Ok(_) => Ok(Some((approval_id, template_id))),
        Err(_) => Ok(None),
    }
}

pub async fn archive_official_itinerary_template_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialItineraryTemplateRow, &'static str>, sqlx::Error> {
    let row = get_official_itinerary_template_admin(pool, id).await?;
    let Some(_row) = row else {
        return Ok(Err("not_found"));
    };
    sqlx::query(
        "UPDATE ops_official_itinerary_templates SET publish_status = 'archived', updated_at = $2 WHERE id = $1",
    )
    .bind(id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_itinerary_template_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.itinerary_template.archived",
        id,
        json!({}),
    )
    .await?;
    reload_official_itinerary_template(pool, id).await
}

async fn insert_official_itinerary_template_audit(
    pool: &PgPool,
    actor_id: Uuid,
    request_id: Option<&str>,
    action: &str,
    template_id: Uuid,
    payload: Value,
) -> Result<(), sqlx::Error> {
    super::insert_admin_audit_log(
        pool,
        actor_id,
        request_id,
        action,
        Some("ops_official_itinerary_template"),
        Some(template_id.to_string().as_str()),
        &payload,
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn publish_status_constants() {
        assert_eq!(STATUS_DRAFT, "draft");
        assert_eq!(STATUS_PUBLISHED, "published");
    }
}
