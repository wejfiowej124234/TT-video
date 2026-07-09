//! Admin Catalog translation + SEO (C-S7/C-S8)

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use super::{
    archive_catalog_entity, insert_catalog_revision, publish_catalog_entity,
    submit_review_catalog_entity,
};

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogTranslationRow {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub locale: String,
    pub field_key: String,
    pub value: String,
    pub publish_status: String,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogSeoRow {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub locale: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub keywords: Option<String>,
    pub canonical_url: Option<String>,
    pub og_image_url: Option<String>,
    pub publish_status: String,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_admin_catalog_translations(
    pool: &PgPool,
    entity_type: Option<&str>,
    entity_id: Option<Uuid>,
    locale: Option<&str>,
    publish_status: Option<&str>,
) -> Result<Vec<AdminCatalogTranslationRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, locale, field_key, value,
                  publish_status, version, published_at, updated_at
           FROM catalog_translation_entries
           WHERE ($1::text IS NULL OR entity_type = $1)
             AND ($2::uuid IS NULL OR entity_id = $2)
             AND ($3::text IS NULL OR locale = $3)
             AND ($4::text IS NULL OR publish_status = $4)
           ORDER BY updated_at DESC, entity_type, locale, field_key
           LIMIT 500"#,
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(locale)
    .bind(publish_status)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_catalog_translation(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminCatalogTranslationRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, locale, field_key, value,
                  publish_status, version, published_at, updated_at
           FROM catalog_translation_entries WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_admin_catalog_translation(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    locale: &str,
    field_key: &str,
    value: &str,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogTranslationRow, &'static str>, sqlx::Error> {
    let id: Uuid = match sqlx::query_scalar(
        r#"INSERT INTO catalog_translation_entries
             (entity_type, entity_id, locale, field_key, value)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id"#,
    )
    .bind(entity_type.trim())
    .bind(entity_id)
    .bind(locale.trim())
    .bind(field_key.trim())
    .bind(value)
    .fetch_one(pool)
    .await
    {
        Ok(v) => v,
        Err(sqlx::Error::Database(e)) if e.code().as_deref() == Some("23505") => {
            return Ok(Err("duplicate_entry"));
        }
        Err(e) => return Err(e),
    };
    insert_catalog_revision(
        pool,
        "catalog_translation_entries",
        id,
        1,
        None,
        None,
        actor_id,
        "create",
        request_id,
    )
    .await?;
    match get_admin_catalog_translation(pool, id).await? {
        Some(row) => Ok(Ok(row)),
        None => Ok(Err("not_found")),
    }
}

pub async fn patch_admin_catalog_translation(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    value: Option<&str>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogTranslationRow, &'static str>, sqlx::Error> {
    let before = get_admin_catalog_translation(pool, id).await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    sqlx::query(
        r#"UPDATE catalog_translation_entries SET
             value = COALESCE($2, value),
             version = version + 1,
             updated_at = $3
           WHERE id = $1 AND version = $4"#,
    )
    .bind(id)
    .bind(value)
    .bind(Utc::now())
    .bind(expected_version)
    .execute(pool)
    .await?;
    insert_catalog_revision(
        pool,
        "catalog_translation_entries",
        id,
        expected_version + 1,
        Some(serde_json::json!({ "value": before.value })),
        value.map(|v| serde_json::json!({ "value": v })),
        actor_id,
        "update",
        request_id,
    )
    .await?;
    Ok(match get_admin_catalog_translation(pool, id).await? {
        Some(row) => Ok(row),
        None => Err("not_found"),
    })
}

pub async fn list_admin_catalog_seo(
    pool: &PgPool,
    entity_type: Option<&str>,
    entity_id: Option<Uuid>,
    locale: Option<&str>,
    publish_status: Option<&str>,
) -> Result<Vec<AdminCatalogSeoRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, locale, title, description, keywords,
                  canonical_url, og_image_url, publish_status, version, published_at, updated_at
           FROM catalog_seo_metadata
           WHERE ($1::text IS NULL OR entity_type = $1)
             AND ($2::uuid IS NULL OR entity_id = $2)
             AND ($3::text IS NULL OR locale = $3)
             AND ($4::text IS NULL OR publish_status = $4)
           ORDER BY updated_at DESC, entity_type, locale
           LIMIT 500"#,
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(locale)
    .bind(publish_status)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_catalog_seo(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminCatalogSeoRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, locale, title, description, keywords,
                  canonical_url, og_image_url, publish_status, version, published_at, updated_at
           FROM catalog_seo_metadata WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_admin_catalog_seo(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    locale: &str,
    title: Option<&str>,
    description: Option<&str>,
    keywords: Option<&str>,
    canonical_url: Option<&str>,
    og_image_url: Option<&str>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogSeoRow, &'static str>, sqlx::Error> {
    let id: Uuid = match sqlx::query_scalar(
        r#"INSERT INTO catalog_seo_metadata
             (entity_type, entity_id, locale, title, description, keywords, canonical_url, og_image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id"#,
    )
    .bind(entity_type.trim())
    .bind(entity_id)
    .bind(locale.trim())
    .bind(title)
    .bind(description)
    .bind(keywords)
    .bind(canonical_url)
    .bind(og_image_url)
    .fetch_one(pool)
    .await
    {
        Ok(v) => v,
        Err(sqlx::Error::Database(e)) if e.code().as_deref() == Some("23505") => {
            return Ok(Err("duplicate_entry"));
        }
        Err(e) => return Err(e),
    };
    insert_catalog_revision(
        pool,
        "catalog_seo_metadata",
        id,
        1,
        None,
        None,
        actor_id,
        "create",
        request_id,
    )
    .await?;
    match get_admin_catalog_seo(pool, id).await? {
        Some(row) => Ok(Ok(row)),
        None => Ok(Err("not_found")),
    }
}

pub async fn patch_admin_catalog_seo(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    title: Option<&str>,
    description: Option<&str>,
    keywords: Option<&str>,
    canonical_url: Option<&str>,
    og_image_url: Option<&str>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogSeoRow, &'static str>, sqlx::Error> {
    let before = get_admin_catalog_seo(pool, id).await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    sqlx::query(
        r#"UPDATE catalog_seo_metadata SET
             title = COALESCE($2, title),
             description = COALESCE($3, description),
             keywords = COALESCE($4, keywords),
             canonical_url = COALESCE($5, canonical_url),
             og_image_url = COALESCE($6, og_image_url),
             version = version + 1,
             updated_at = $7
           WHERE id = $1 AND version = $8"#,
    )
    .bind(id)
    .bind(title)
    .bind(description)
    .bind(keywords)
    .bind(canonical_url)
    .bind(og_image_url)
    .bind(Utc::now())
    .bind(expected_version)
    .execute(pool)
    .await?;
    insert_catalog_revision(
        pool,
        "catalog_seo_metadata",
        id,
        expected_version + 1,
        Some(serde_json::json!({
            "title": before.title,
            "description": before.description,
            "keywords": before.keywords,
            "canonical_url": before.canonical_url,
            "og_image_url": before.og_image_url,
        })),
        None,
        actor_id,
        "update",
        request_id,
    )
    .await?;
    Ok(match get_admin_catalog_seo(pool, id).await? {
        Some(row) => Ok(row),
        None => Err("not_found"),
    })
}

pub async fn i18n_entity_workflow(
    pool: &PgPool,
    table: &str,
    entity_type: &str,
    id: Uuid,
    version: i32,
    op: &str,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    match op {
        "submit" => {
            submit_review_catalog_entity(pool, table, entity_type, id, version, actor_id, request_id).await
        }
        "publish" => {
            publish_catalog_entity(pool, table, entity_type, id, version, actor_id, request_id).await
        }
        "archive" => {
            archive_catalog_entity(pool, table, entity_type, id, version, actor_id, request_id).await
        }
        _ => Ok(Err("invalid_op")),
    }
}
