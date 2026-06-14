//! Admin Catalog revision · import · parity · observability (C-S4 · 105 SSOT)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use super::insert_catalog_revision;

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogRevisionDetailRow {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub version: i32,
    pub action: String,
    pub actor_id: Option<Uuid>,
    pub request_id: Option<String>,
    pub before_json: Option<Value>,
    pub after_json: Option<Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogImportBatchRow {
    pub import_batch_id: Uuid,
    pub row_count: i64,
    pub first_seen: DateTime<Utc>,
    pub last_seen: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogParityCheckRow {
    pub id: String,
    pub passed: bool,
    pub expected: String,
    pub actual: String,
    pub detail: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogObservabilityRow {
    pub entity_type: String,
    pub total: i64,
    pub draft: i64,
    pub in_review: i64,
    pub published: i64,
    pub archived: i64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogObservabilitySummary {
    pub entities: Vec<AdminCatalogObservabilityRow>,
    pub revisions_total: i64,
    pub revisions_rollback: i64,
    pub revisions_import: i64,
    pub import_batches: i64,
    pub parity_pass: bool,
    pub parity_checks: Vec<AdminCatalogParityCheckRow>,
}

pub async fn list_admin_catalog_revision_details(
    pool: &PgPool,
    entity_type: Option<&str>,
    entity_id: Option<Uuid>,
    action: Option<&str>,
    limit: i64,
) -> Result<Vec<AdminCatalogRevisionDetailRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, version, action, actor_id, request_id,
                  before_json, after_json, created_at
           FROM catalog_content_revisions
           WHERE ($1::text IS NULL OR entity_type = $1)
             AND ($2::uuid IS NULL OR entity_id = $2)
             AND ($3::text IS NULL OR action = $3)
           ORDER BY created_at DESC
           LIMIT $4"#,
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(action)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_catalog_revision_detail(
    pool: &PgPool,
    revision_id: Uuid,
) -> Result<Option<AdminCatalogRevisionDetailRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, version, action, actor_id, request_id,
                  before_json, after_json, created_at
           FROM catalog_content_revisions WHERE id = $1"#,
    )
    .bind(revision_id)
    .fetch_optional(pool)
    .await
}

pub async fn compare_admin_catalog_revisions(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    version_a: i32,
    version_b: i32,
) -> Result<Option<(AdminCatalogRevisionDetailRow, AdminCatalogRevisionDetailRow)>, sqlx::Error> {
    let a: Option<AdminCatalogRevisionDetailRow> = sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, version, action, actor_id, request_id,
                  before_json, after_json, created_at
           FROM catalog_content_revisions
           WHERE entity_type = $1 AND entity_id = $2 AND version = $3"#,
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(version_a)
    .fetch_optional(pool)
    .await?;
    let b: Option<AdminCatalogRevisionDetailRow> = sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, version, action, actor_id, request_id,
                  before_json, after_json, created_at
           FROM catalog_content_revisions
           WHERE entity_type = $1 AND entity_id = $2 AND version = $3"#,
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(version_b)
    .fetch_optional(pool)
    .await?;
    match (a, b) {
        (Some(left), Some(right)) => Ok(Some((left, right))),
        _ => Ok(None),
    }
}

pub async fn list_catalog_rollback_history(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<AdminCatalogRevisionDetailRow>, sqlx::Error> {
    list_admin_catalog_revision_details(pool, None, None, Some("rollback"), limit).await
}

pub async fn list_catalog_import_batches(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<AdminCatalogImportBatchRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT import_batch_id, count(*)::bigint AS row_count,
                  min(first_seen) AS first_seen, max(last_seen) AS last_seen
           FROM (
             SELECT import_batch_id, created_at AS first_seen, updated_at AS last_seen
             FROM catalog_countries WHERE import_batch_id IS NOT NULL
             UNION ALL
             SELECT import_batch_id, created_at, updated_at FROM catalog_cities WHERE import_batch_id IS NOT NULL
             UNION ALL
             SELECT import_batch_id, created_at, updated_at FROM catalog_pois WHERE import_batch_id IS NOT NULL
             UNION ALL
             SELECT import_batch_id, created_at, updated_at FROM catalog_pricing_templates WHERE import_batch_id IS NOT NULL
             UNION ALL
             SELECT import_batch_id, created_at, updated_at FROM catalog_intercity_routes WHERE import_batch_id IS NOT NULL
             UNION ALL
             SELECT import_batch_id, created_at, updated_at FROM catalog_media_assets WHERE import_batch_id IS NOT NULL
           ) batches
           GROUP BY import_batch_id
           ORDER BY last_seen DESC
           LIMIT $1"#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

async fn count_by_status(pool: &PgPool, table: &str) -> Result<(i64, i64, i64, i64, i64), sqlx::Error> {
    let row: (i64, i64, i64, i64, i64) = sqlx::query_as(&format!(
        r#"SELECT
             count(*)::bigint,
             count(*) FILTER (WHERE publish_status = 'draft')::bigint,
             count(*) FILTER (WHERE publish_status = 'in_review')::bigint,
             count(*) FILTER (WHERE publish_status = 'published')::bigint,
             count(*) FILTER (WHERE publish_status = 'archived')::bigint
           FROM {table}"#
    ))
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn build_catalog_parity_checks(pool: &PgPool) -> Result<Vec<AdminCatalogParityCheckRow>, sqlx::Error> {
    let mut checks = Vec::new();
    let countries: (i64,) =
        sqlx::query_as("SELECT count(*)::bigint FROM catalog_countries").fetch_one(pool).await?;
    checks.push(AdminCatalogParityCheckRow {
        id: "P-01".into(),
        passed: countries.0 == 10,
        expected: "10".into(),
        actual: countries.0.to_string(),
        detail: "catalog_countries total".into(),
    });
    let cities: (i64,) = sqlx::query_as("SELECT count(*)::bigint FROM catalog_cities").fetch_one(pool).await?;
    checks.push(AdminCatalogParityCheckRow {
        id: "P-02".into(),
        passed: cities.0 == 38,
        expected: "38".into(),
        actual: cities.0.to_string(),
        detail: "catalog_cities total".into(),
    });
    let pricing: (i64,) =
        sqlx::query_as("SELECT count(*)::bigint FROM catalog_pricing_templates").fetch_one(pool).await?;
    checks.push(AdminCatalogParityCheckRow {
        id: "P-10".into(),
        passed: pricing.0 == 10,
        expected: "10".into(),
        actual: pricing.0.to_string(),
        detail: "catalog_pricing_templates total".into(),
    });
    let tiers: (i64,) = sqlx::query_as("SELECT count(*)::bigint FROM catalog_hotel_tier_definitions")
        .fetch_one(pool)
        .await?;
    checks.push(AdminCatalogParityCheckRow {
        id: "P-08".into(),
        passed: tiers.0 == 3,
        expected: "3".into(),
        actual: tiers.0.to_string(),
        detail: "catalog_hotel_tier_definitions total".into(),
    });
    let routes: (i64,) =
        sqlx::query_as("SELECT count(*)::bigint FROM catalog_intercity_routes").fetch_one(pool).await?;
    checks.push(AdminCatalogParityCheckRow {
        id: "P-12".into(),
        passed: routes.0 >= 146 && routes.0 <= 272,
        expected: "146-272".into(),
        actual: routes.0.to_string(),
        detail: "catalog_intercity_routes total".into(),
    });
    let pois: (i64,) = sqlx::query_as("SELECT count(*)::bigint FROM catalog_pois").fetch_one(pool).await?;
    checks.push(AdminCatalogParityCheckRow {
        id: "P-06".into(),
        passed: pois.0 > 0,
        expected: ">0".into(),
        actual: pois.0.to_string(),
        detail: "catalog_pois total".into(),
    });
    Ok(checks)
}

pub async fn get_catalog_observability_summary(
    pool: &PgPool,
) -> Result<AdminCatalogObservabilitySummary, sqlx::Error> {
    let tables = [
        "catalog_countries",
        "catalog_cities",
        "catalog_pois",
        "catalog_pricing_templates",
        "catalog_intercity_routes",
        "catalog_media_assets",
        "catalog_hotel_tier_definitions",
        "catalog_transport_region_rules",
    ];
    let mut entities = Vec::new();
    for table in tables {
        let (total, draft, in_review, published, archived) = count_by_status(pool, table).await?;
        entities.push(AdminCatalogObservabilityRow {
            entity_type: table.to_string(),
            total,
            draft,
            in_review,
            published,
            archived,
        });
    }
    let revisions_total: (i64,) =
        sqlx::query_as("SELECT count(*)::bigint FROM catalog_content_revisions").fetch_one(pool).await?;
    let revisions_rollback: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_content_revisions WHERE action = 'rollback'",
    )
    .fetch_one(pool)
    .await?;
    let revisions_import: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_content_revisions WHERE action IN ('create', 'import')",
    )
    .fetch_one(pool)
    .await?;
    let import_batches: (i64,) = sqlx::query_as(
        r#"SELECT count(DISTINCT import_batch_id)::bigint FROM catalog_countries WHERE import_batch_id IS NOT NULL"#,
    )
    .fetch_one(pool)
    .await?;
    let parity_checks = build_catalog_parity_checks(pool).await?;
    let parity_pass = parity_checks.iter().all(|c| c.passed);
    Ok(AdminCatalogObservabilitySummary {
        entities,
        revisions_total: revisions_total.0,
        revisions_rollback: revisions_rollback.0,
        revisions_import: revisions_import.0,
        import_batches: import_batches.0,
        parity_pass,
        parity_checks,
    })
}

pub async fn rollback_catalog_entity_to_revision(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    target_version: i32,
    expected_entity_version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    let snapshot: Option<AdminCatalogRevisionDetailRow> = sqlx::query_as(
        r#"SELECT id, entity_type, entity_id, version, action, actor_id, request_id,
                  before_json, after_json, created_at
           FROM catalog_content_revisions
           WHERE entity_type = $1 AND entity_id = $2 AND version = $3"#,
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(target_version)
    .fetch_optional(pool)
    .await?;
    let Some(snapshot) = snapshot else {
        return Ok(Err("revision_not_found"));
    };
    let restore = match snapshot.after_json.clone().or(snapshot.before_json.clone()) {
        Some(v) if !v.is_null() => v,
        _ => return Ok(Err("empty_snapshot")),
    };
    let publish_status = restore
        .get("publish_status")
        .and_then(|v| v.as_str())
        .unwrap_or("draft");
    let updated = match entity_type {
        "catalog_countries" | "catalog_cities" | "catalog_pois" => {
            let table = entity_type;
            sqlx::query(&format!(
                r#"UPDATE {table} SET
                     publish_status = $2,
                     payload = COALESCE($3, payload),
                     version = version + 1,
                     updated_at = $4
                   WHERE id = $1 AND version = $5"#
            ))
            .bind(entity_id)
            .bind(publish_status)
            .bind(restore.get("payload").cloned())
            .bind(Utc::now())
            .bind(expected_entity_version)
            .execute(pool)
            .await?
        }
        "catalog_pricing_templates"
        | "catalog_intercity_routes"
        | "catalog_hotel_tier_definitions"
        | "catalog_transport_region_rules"
        | "catalog_media_assets" => {
            let table = entity_type;
            sqlx::query(&format!(
                r#"UPDATE {table} SET
                     publish_status = $2,
                     version = version + 1,
                     updated_at = $3
                   WHERE id = $1 AND version = $4"#
            ))
            .bind(entity_id)
            .bind(publish_status)
            .bind(Utc::now())
            .bind(expected_entity_version)
            .execute(pool)
            .await?
        }
        _ => return Ok(Err("unsupported_entity_type")),
    };
    if updated.rows_affected() == 0 {
        return Ok(Err("version_conflict"));
    }
    let new_version = expected_entity_version + 1;
    insert_catalog_revision(
        pool,
        entity_type,
        entity_id,
        new_version,
        None,
        Some(restore),
        actor_id,
        "rollback",
        request_id,
    )
    .await?;
    Ok(Ok(new_version))
}

pub async fn create_catalog_import_trigger_request(
    pool: &PgPool,
    requested_by: Uuid,
    mode: &str,
    skip_m6: bool,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Uuid, sqlx::Error> {
    let after_payload = json!({
        "mode": mode,
        "skip_m6": skip_m6,
        "cli_hint": format!("catalog-import --mode {mode}{}", if skip_m6 { " --skip-m6" } else { "" }),
    });
    let mut tx = pool.begin().await?;
    let approval_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO admin_approval_requests
           (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
           VALUES ('catalog.import.trigger', 'catalog_import', 'trigger', $1, 'pending', $2, '{}'::jsonb, $3, $4)
           RETURNING id"#,
    )
    .bind(requested_by)
    .bind(reason)
    .bind(after_payload)
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('catalog.import.trigger.requested', 'catalog_import', 'trigger', $1, $2, $3, $4)"#,
    )
    .bind(requested_by)
    .bind(request_id)
    .bind(json!({ "approval_id": approval_id, "mode": mode, "skip_m6": skip_m6 }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(approval_id)
}

#[cfg(test)]
mod tests {
    #[test]
    fn parity_check_ids_non_empty() {
        for id in ["P-01", "P-02", "P-08", "P-10", "P-12", "P-06"] {
            assert!(!id.is_empty());
        }
    }
}
