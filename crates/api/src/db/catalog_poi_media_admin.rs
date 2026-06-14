//! Admin POI image batch review + publish (C-S2 · M6 · 105 SSOT)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use super::insert_catalog_revision;

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminPoiImageBatchRow {
    pub id: Uuid,
    pub city_id: Option<Uuid>,
    pub city_name_zh: Option<String>,
    pub country_id: Option<Uuid>,
    pub batch_name: String,
    pub poi_kind: String,
    pub status: String,
    pub notes: Option<String>,
    pub version: i32,
    pub candidate_count: i64,
    pub poi_count: i64,
    pub approved_count: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminPoiImageCandidateRow {
    pub id: Uuid,
    pub batch_id: Uuid,
    pub poi_id: Uuid,
    pub poi_name_zh: String,
    pub poi_type: String,
    pub candidate_url: String,
    pub source_page_url: Option<String>,
    pub scene_description: Option<String>,
    pub license: Option<String>,
    pub review_status: String,
    pub notes: Option<String>,
    pub rank: i32,
    pub created_at: DateTime<Utc>,
}

pub async fn list_admin_poi_image_batches(
    pool: &PgPool,
    status: Option<&str>,
    city_id: Option<Uuid>,
    poi_kind: Option<&str>,
) -> Result<Vec<AdminPoiImageBatchRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminPoiImageBatchRow>(
        r#"SELECT b.id, b.city_id, c.name_zh AS city_name_zh, b.country_id, b.batch_name, b.poi_kind,
                  b.status, b.notes, b.version,
                  (SELECT COUNT(*) FROM catalog_poi_image_candidates cand WHERE cand.batch_id = b.id) AS candidate_count,
                  (SELECT COUNT(DISTINCT cand.poi_id) FROM catalog_poi_image_candidates cand WHERE cand.batch_id = b.id) AS poi_count,
                  (SELECT COUNT(*) FROM catalog_poi_image_candidates cand
                   WHERE cand.batch_id = b.id AND cand.review_status = 'approved') AS approved_count,
                  b.created_at, b.updated_at
           FROM catalog_poi_image_batches b
           LEFT JOIN catalog_cities c ON c.id = b.city_id
           WHERE ($1::text IS NULL OR b.status = $1)
             AND ($2::uuid IS NULL OR b.city_id = $2)
             AND ($3::text IS NULL OR b.poi_kind = $3)
           ORDER BY b.updated_at DESC
           LIMIT 200"#,
    )
    .bind(status)
    .bind(city_id)
    .bind(poi_kind)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_poi_image_batch(
    pool: &PgPool,
    batch_id: Uuid,
) -> Result<Option<AdminPoiImageBatchRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminPoiImageBatchRow>(
        r#"SELECT b.id, b.city_id, c.name_zh AS city_name_zh, b.country_id, b.batch_name, b.poi_kind,
                  b.status, b.notes, b.version,
                  (SELECT COUNT(*) FROM catalog_poi_image_candidates cand WHERE cand.batch_id = b.id) AS candidate_count,
                  (SELECT COUNT(DISTINCT cand.poi_id) FROM catalog_poi_image_candidates cand WHERE cand.batch_id = b.id) AS poi_count,
                  (SELECT COUNT(*) FROM catalog_poi_image_candidates cand
                   WHERE cand.batch_id = b.id AND cand.review_status = 'approved') AS approved_count,
                  b.created_at, b.updated_at
           FROM catalog_poi_image_batches b
           LEFT JOIN catalog_cities c ON c.id = b.city_id
           WHERE b.id = $1"#,
    )
    .bind(batch_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_admin_poi_image_candidates(
    pool: &PgPool,
    batch_id: Uuid,
    poi_id: Option<Uuid>,
) -> Result<Vec<AdminPoiImageCandidateRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminPoiImageCandidateRow>(
        r#"SELECT cand.id, cand.batch_id, cand.poi_id, p.name_zh AS poi_name_zh, p.poi_type,
                  cand.candidate_url, cand.source_page_url, cand.scene_description, cand.license,
                  cand.review_status, cand.notes, cand.rank, cand.created_at
           FROM catalog_poi_image_candidates cand
           JOIN catalog_pois p ON p.id = cand.poi_id
           WHERE cand.batch_id = $1
             AND ($2::uuid IS NULL OR cand.poi_id = $2)
           ORDER BY p.name_zh, cand.rank"#,
    )
    .bind(batch_id)
    .bind(poi_id)
    .fetch_all(pool)
    .await
}

pub async fn patch_admin_poi_image_candidate(
    pool: &PgPool,
    batch_id: Uuid,
    candidate_id: Uuid,
    review_status: Option<&str>,
    notes: Option<&str>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminPoiImageCandidateRow, &'static str>, sqlx::Error> {
    let batch = get_admin_poi_image_batch(pool, batch_id).await?;
    let Some(batch) = batch else {
        return Ok(Err("not_found"));
    };
    if batch.status == "published" || batch.status == "archived" {
        return Ok(Err("batch_readonly"));
    }
    if let Some(s) = review_status {
        if !["pending", "approved", "rejected"].contains(&s) {
            return Ok(Err("invalid_review_status"));
        }
    }
    let before: Option<AdminPoiImageCandidateRow> = sqlx::query_as(
        r#"SELECT cand.id, cand.batch_id, cand.poi_id, p.name_zh AS poi_name_zh, p.poi_type,
                  cand.candidate_url, cand.source_page_url, cand.scene_description, cand.license,
                  cand.review_status, cand.notes, cand.rank, cand.created_at
           FROM catalog_poi_image_candidates cand
           JOIN catalog_pois p ON p.id = cand.poi_id
           WHERE cand.id = $1 AND cand.batch_id = $2"#,
    )
    .bind(candidate_id)
    .bind(batch_id)
    .fetch_optional(pool)
    .await?;
    let Some(before) = before else {
        return Ok(Err("candidate_not_found"));
    };
    let row = sqlx::query_as::<_, AdminPoiImageCandidateRow>(
        r#"UPDATE catalog_poi_image_candidates cand SET
             review_status = COALESCE($3, cand.review_status),
             notes = COALESCE($4, cand.notes)
           FROM catalog_pois p
           WHERE cand.id = $1 AND cand.batch_id = $2 AND cand.poi_id = p.id
           RETURNING cand.id, cand.batch_id, cand.poi_id, p.name_zh AS poi_name_zh, p.poi_type,
                     cand.candidate_url, cand.source_page_url, cand.scene_description, cand.license,
                     cand.review_status, cand.notes, cand.rank, cand.created_at"#,
    )
    .bind(candidate_id)
    .bind(batch_id)
    .bind(review_status)
    .bind(notes)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(Err("candidate_not_found"));
    };
    let action = match review_status {
        Some("approved") => "approve_candidate",
        Some("rejected") => "reject_candidate",
        _ => "update_candidate",
    };
    insert_catalog_revision(
        pool,
        "catalog_poi_image_batches",
        batch_id,
        batch.version,
        Some(json!(before)),
        Some(json!(row)),
        actor_id,
        action,
        request_id,
    )
    .await?;
    sqlx::query(
        "UPDATE catalog_poi_image_batches SET updated_at = $2 WHERE id = $1",
    )
    .bind(batch_id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    Ok(Ok(row))
}

pub async fn select_admin_poi_image_candidate(
    pool: &PgPool,
    batch_id: Uuid,
    expected_version: i32,
    poi_id: Uuid,
    candidate_id: Uuid,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminPoiImageCandidateRow, &'static str>, sqlx::Error> {
    let batch = get_admin_poi_image_batch(pool, batch_id).await?;
    let Some(batch) = batch else {
        return Ok(Err("not_found"));
    };
    if batch.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if batch.status == "published" || batch.status == "archived" {
        return Ok(Err("batch_readonly"));
    }
    let candidate: Option<(Uuid,)> = sqlx::query_as(
        "SELECT poi_id FROM catalog_poi_image_candidates WHERE id = $1 AND batch_id = $2",
    )
    .bind(candidate_id)
    .bind(batch_id)
    .fetch_optional(pool)
    .await?;
    let Some((cand_poi_id,)) = candidate else {
        return Ok(Err("candidate_not_found"));
    };
    if cand_poi_id != poi_id {
        return Ok(Err("poi_mismatch"));
    }
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"UPDATE catalog_poi_image_candidates SET review_status = 'rejected'
           WHERE batch_id = $1 AND poi_id = $2 AND id <> $3"#,
    )
    .bind(batch_id)
    .bind(poi_id)
    .bind(candidate_id)
    .execute(&mut *tx)
    .await?;
    let row = sqlx::query_as::<_, AdminPoiImageCandidateRow>(
        r#"UPDATE catalog_poi_image_candidates cand SET review_status = 'approved'
           FROM catalog_pois p
           WHERE cand.id = $1 AND cand.batch_id = $2 AND cand.poi_id = p.id
           RETURNING cand.id, cand.batch_id, cand.poi_id, p.name_zh AS poi_name_zh, p.poi_type,
                     cand.candidate_url, cand.source_page_url, cand.scene_description, cand.license,
                     cand.review_status, cand.notes, cand.rank, cand.created_at"#,
    )
    .bind(candidate_id)
    .bind(batch_id)
    .fetch_one(&mut *tx)
    .await?;
    let new_version = expected_version + 1;
    sqlx::query(
        r#"UPDATE catalog_poi_image_batches SET
             selected_candidate_id = $2, version = $3, updated_at = $4
           WHERE id = $1 AND version = $5"#,
    )
    .bind(batch_id)
    .bind(candidate_id)
    .bind(new_version)
    .bind(Utc::now())
    .bind(expected_version)
    .execute(&mut *tx)
    .await?;
    insert_catalog_revision(
        &mut *tx,
        "catalog_poi_image_batches",
        batch_id,
        new_version,
        Some(json!({ "poi_id": poi_id, "selected_candidate_id": candidate_id })),
        Some(json!(row)),
        actor_id,
        "select_candidate",
        request_id,
    )
    .await?;
    tx.commit().await?;
    Ok(Ok(row))
}

async fn batch_pois_missing_approval(
    pool: &PgPool,
    batch_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM (
             SELECT DISTINCT poi_id FROM catalog_poi_image_candidates WHERE batch_id = $1
           ) pois
           WHERE NOT EXISTS (
             SELECT 1 FROM catalog_poi_image_candidates c
             WHERE c.batch_id = $1 AND c.poi_id = pois.poi_id AND c.review_status = 'approved'
           )"#,
    )
    .bind(batch_id)
    .fetch_one(pool)
    .await?;
    Ok(count.0)
}

pub async fn submit_review_poi_image_batch(
    pool: &PgPool,
    batch_id: Uuid,
    expected_version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    let batch = get_admin_poi_image_batch(pool, batch_id).await?;
    let Some(batch) = batch else {
        return Ok(Err("not_found"));
    };
    if batch.version != expected_version {
        return Ok(Err("version_conflict"));
    };
    if !matches!(batch.status.as_str(), "draft" | "generating") {
        return Ok(Err("invalid_status"));
    }
    let missing = batch_pois_missing_approval(pool, batch_id).await?;
    if missing > 0 {
        return Ok(Err("missing_selections"));
    }
    let new_version = expected_version + 1;
    let updated = sqlx::query(
        r#"UPDATE catalog_poi_image_batches SET status = 'review', version = $2, updated_at = $3
           WHERE id = $1 AND version = $4"#,
    )
    .bind(batch_id)
    .bind(new_version)
    .bind(Utc::now())
    .bind(expected_version)
    .execute(pool)
    .await?;
    if updated.rows_affected() == 0 {
        return Ok(Err("version_conflict"));
    }
    insert_catalog_revision(
        pool,
        "catalog_poi_image_batches",
        batch_id,
        new_version,
        Some(json!({ "status": batch.status, "version": batch.version })),
        Some(json!({ "status": "review", "version": new_version })),
        actor_id,
        "submit_review",
        request_id,
    )
    .await?;
    Ok(Ok(new_version))
}

pub async fn publish_poi_image_batch(
    pool: &PgPool,
    batch_id: Uuid,
    expected_version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    let batch = get_admin_poi_image_batch(pool, batch_id).await?;
    let Some(batch) = batch else {
        return Ok(Err("not_found"));
    };
    if batch.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if batch.status != "review" {
        return Ok(Err("not_in_review"));
    }
    let missing = batch_pois_missing_approval(pool, batch_id).await?;
    if missing > 0 {
        return Ok(Err("missing_selections"));
    }
    let approved: Vec<(Uuid, String, Option<String>, Option<String>, Option<String>, Uuid)> =
        sqlx::query_as(
            r#"SELECT cand.poi_id, cand.candidate_url, cand.scene_description, cand.source_page_url,
                      cand.license, cand.id
               FROM catalog_poi_image_candidates cand
               WHERE cand.batch_id = $1 AND cand.review_status = 'approved'"#,
        )
        .bind(batch_id)
        .fetch_all(pool)
        .await?;
    let mut tx = pool.begin().await?;
    for (poi_id, url, scene, source, license, cand_id) in &approved {
        sqlx::query(
            r#"INSERT INTO catalog_poi_images_published
               (poi_id, image_url, batch_id, published_by, scene_description, source_page_url,
                license, approved_candidate_id, published_at, updated_at, version)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, 1)
               ON CONFLICT (poi_id) DO UPDATE SET
                 image_url = EXCLUDED.image_url,
                 batch_id = EXCLUDED.batch_id,
                 published_by = EXCLUDED.published_by,
                 scene_description = EXCLUDED.scene_description,
                 source_page_url = EXCLUDED.source_page_url,
                 license = EXCLUDED.license,
                 approved_candidate_id = EXCLUDED.approved_candidate_id,
                 published_at = EXCLUDED.published_at,
                 updated_at = EXCLUDED.updated_at,
                 version = catalog_poi_images_published.version + 1"#,
        )
        .bind(poi_id)
        .bind(url)
        .bind(batch_id)
        .bind(actor_id)
        .bind(scene)
        .bind(source)
        .bind(license)
        .bind(cand_id)
        .bind(Utc::now())
        .execute(&mut *tx)
        .await?;
    }
    let new_version = expected_version + 1;
    sqlx::query(
        r#"UPDATE catalog_poi_image_batches SET status = 'published', version = $2, updated_at = $3
           WHERE id = $1 AND version = $4"#,
    )
    .bind(batch_id)
    .bind(new_version)
    .bind(Utc::now())
    .bind(expected_version)
    .execute(&mut *tx)
    .await?;
    insert_catalog_revision(
        &mut *tx,
        "catalog_poi_image_batches",
        batch_id,
        new_version,
        Some(json!({ "status": "review", "version": expected_version, "published_count": approved.len() })),
        Some(json!({ "status": "published", "version": new_version, "published_count": approved.len() })),
        actor_id,
        "publish",
        request_id,
    )
    .await?;
    tx.commit().await?;
    Ok(Ok(new_version))
}

pub async fn create_poi_image_publish_approval_request(
    pool: &PgPool,
    requested_by: Uuid,
    batch_id: Uuid,
    version: i32,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Result<Uuid, &'static str>, sqlx::Error> {
    let batch = get_admin_poi_image_batch(pool, batch_id).await?;
    let Some(batch) = batch else {
        return Ok(Err("not_found"));
    };
    if batch.version != version {
        return Ok(Err("version_conflict"));
    }
    if batch.status != "review" {
        return Ok(Err("not_in_review"));
    }
    let missing = batch_pois_missing_approval(pool, batch_id).await?;
    if missing > 0 {
        return Ok(Err("missing_selections"));
    }
    let before_payload = json!({ "status": batch.status, "version": version });
    let after_payload = json!({
        "batch_id": batch_id,
        "version": version,
        "target_status": "published",
    });
    let mut tx = pool.begin().await?;
    let approval_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO admin_approval_requests
           (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
           VALUES ('catalog.poi_image.publish', 'catalog_poi_image_batches', $1, $2, 'pending', $3, $4, $5, $6)
           RETURNING id"#,
    )
    .bind(batch_id.to_string())
    .bind(requested_by)
    .bind(reason)
    .bind(before_payload)
    .bind(after_payload)
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('catalog.poi_image.publish.requested', 'catalog_poi_image_batches', $1, $2, $3, $4, $5)"#,
    )
    .bind(batch_id.to_string())
    .bind(requested_by)
    .bind(request_id)
    .bind(json!({ "approval_id": approval_id, "version": version }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(Ok(approval_id))
}

pub async fn approve_poi_image_publish_request_with_audit(
    pool: &PgPool,
    approval_id: Uuid,
    approver_id: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Option<(Uuid, Uuid, i32)>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let existing: Option<(String, String, String, Uuid, String, Value, Value)> = sqlx::query_as(
        r#"SELECT action, resource_type, resource_id, requested_by, status, before_payload, after_payload
           FROM admin_approval_requests WHERE id = $1 FOR UPDATE"#,
    )
    .bind(approval_id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some(existing) = existing else {
        return Ok(None);
    };
    if existing.0 != "catalog.poi_image.publish" || existing.4 != "pending" {
        return Ok(None);
    }
    if existing.3 == approver_id {
        return Ok(None);
    }
    let batch_id = Uuid::parse_str(&existing.2).unwrap_or_else(|_| Uuid::nil());
    if batch_id.is_nil() {
        return Ok(None);
    }
    let version = existing
        .6
        .get("version")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    tx.commit().await?;
    let publish_result = publish_poi_image_batch(pool, batch_id, version, Some(approver_id), request_id).await?;
    let Ok(new_version) = publish_result else {
        return Ok(None);
    };
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"UPDATE admin_approval_requests SET status = 'approved', approved_by = $2, approve_reason = $3, approved_at = $4
           WHERE id = $1 AND status = 'pending'"#,
    )
    .bind(approval_id)
    .bind(approver_id)
    .bind(reason)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('catalog.poi_image.publish.approved', 'catalog_poi_image_batches', $1, $2, $3, $4, $5)"#,
    )
    .bind(batch_id.to_string())
    .bind(approver_id)
    .bind(request_id)
    .bind(json!({ "approval_id": approval_id, "version": new_version, "reason": reason }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(Some((approval_id, batch_id, new_version)))
}

pub async fn list_poi_image_review_queue(
    pool: &PgPool,
) -> Result<Vec<super::AdminCatalogPublishQueueRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT 'catalog_poi_image_batches'::text AS entity_type, id AS entity_id,
                  batch_name AS label, status AS publish_status, version, updated_at
           FROM catalog_poi_image_batches
           WHERE status = 'review'
           ORDER BY updated_at DESC"#,
    )
    .fetch_all(pool)
    .await
}

#[cfg(test)]
mod tests {
    #[test]
    fn batch_status_values_match_ddl() {
        for s in ["draft", "generating", "review", "published", "archived"] {
            assert!(!s.is_empty());
        }
    }

    #[test]
    fn candidate_review_status_values_match_ddl() {
        for s in ["pending", "approved", "rejected"] {
            assert!(!s.is_empty());
        }
    }
}
