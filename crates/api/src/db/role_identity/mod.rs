//! ①.5 Phase A：**guides / onboarding_*** 写入时双写 **`role_applications`** / **`role_documents`** / **`staking_positions`**。
//! **读路径不变**；失败仅审计日志，不推翻主表写入（除非日后 `TRAVELTRUST_STRICT_ROLE_IDENTITY_DUAL_WRITE=1`）。

use chrono::{DateTime, Utc};
use serde_json::json;
use sqlx::types::Json;
use sqlx::PgPool;
use uuid::Uuid;

use super::onboarding::OnboardingEntitlementRow;

fn log_dual_write_err(context: &str, err: &sqlx::Error) {
    eprintln!("[role_identity_dual_write] {context} error={err}");
}

pub fn map_guides_status_to_application(
    guides_status: &str,
    rejection_codes: &[String],
    rejection_message: Option<&str>,
) -> &'static str {
    if !rejection_codes.is_empty() || rejection_message.is_some_and(|m| !m.trim().is_empty()) {
        return "rejected";
    };
    match guides_status {
        "active" => "approved",
        "suspended" => "suspended",
        "pending" => "submitted",
        _ => "submitted",
    }
}

pub fn map_entitlement_status_to_application(entitlement_status: &str) -> &'static str {
    match entitlement_status {
        "paid" => "approved",
        "pending" => "submitted",
        "revoked" | "expired" => "suspended",
        "refunded" => "rejected",
        _ => "submitted",
    }
}

fn onboarding_kind(role_target: &str) -> Option<&'static str> {
    match role_target {
        "provider" => Some("provider_onboarding"),
        "region_steward" => Some("region_steward_onboarding"),
        _ => None,
    }
}

async fn upsert_application(
    pool: &PgPool,
    user_id: Uuid,
    kind: &str,
    status: &str,
    legacy_ref: serde_json::Value,
    rejection_codes: Json<serde_json::Value>,
    rejection_message: Option<&str>,
    metadata: Json<serde_json::Value>,
    submitted_at: Option<DateTime<Utc>>,
    decided_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> Result<Uuid, sqlx::Error> {
    let legacy_key = if legacy_ref.get("guides_id").is_some() {
        "guides_id"
    } else if legacy_ref.get("entitlement_id").is_some() {
        "entitlement_id"
    } else {
        return sqlx::query_scalar::<_, Uuid>(
            r#"
            INSERT INTO role_applications (
                user_id, kind, status, legacy_ref, rejection_codes, rejection_message,
                metadata, submitted_at, decided_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
            "#,
        )
        .bind(user_id)
        .bind(kind)
        .bind(status)
        .bind(Json(legacy_ref))
        .bind(rejection_codes)
        .bind(rejection_message)
        .bind(metadata)
        .bind(submitted_at)
        .bind(decided_at)
        .bind(created_at)
        .bind(updated_at)
        .fetch_one(pool)
        .await;
    }
;
    let legacy_id = legacy_ref
        .get(legacy_key)
        .and_then(|v| v.as_str())
        .unwrap_or_default();

    if let Some(app_id) = sqlx::query_scalar::<_, Uuid>(
        r#"
        SELECT id FROM role_applications
        WHERE user_id = $1 AND kind = $2 AND legacy_ref->>$3 = $4
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .bind(kind)
    .bind(legacy_key)
    .bind(legacy_id)
    .fetch_optional(pool)
    .await?
    {
        sqlx::query(
            r#"
            UPDATE role_applications
            SET status = $2,
                rejection_codes = $3,
                rejection_message = $4,
                metadata = metadata || $5::jsonb,
                submitted_at = COALESCE($6, submitted_at),
                decided_at = COALESCE($7, decided_at),
                updated_at = $8
            WHERE id = $1
            "#,
        )
        .bind(app_id)
        .bind(status)
        .bind(&rejection_codes)
        .bind(rejection_message)
        .bind(&metadata)
        .bind(submitted_at)
        .bind(decided_at)
        .bind(updated_at)
        .execute(pool)
        .await?;
        return Ok(app_id);
    }

    sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO role_applications (
            user_id, kind, status, legacy_ref, rejection_codes, rejection_message,
            metadata, submitted_at, decided_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(kind)
    .bind(status)
    .bind(Json(legacy_ref))
    .bind(rejection_codes)
    .bind(rejection_message)
    .bind(metadata)
    .bind(submitted_at)
    .bind(decided_at)
    .bind(created_at)
    .bind(updated_at)
    .fetch_one(pool)
    .await
}

async fn replace_guide_documents(
    pool: &PgPool,
    application_id: Uuid,
    id_photo_url: Option<&str>,
    language_cert_url: Option<&str>,
    guide_license_url: Option<&str>,
    passport_number_hash: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM role_documents WHERE application_id = $1")
        .bind(application_id)
        .execute(pool)
        .await?;

    let mut docs: Vec<(&str, Option<&str>, Option<&str>)> = vec![
        ("id_photo", id_photo_url, Some("id_photo_url")),
        ("language_cert", language_cert_url, Some("language_cert_url")),
        ("guide_license", guide_license_url, Some("guide_license_url")),
    ];
    if passport_number_hash.is_some() {
        docs.push(("passport_hash", passport_number_hash, Some("passport_number_hash")));
    }

    for (doc_type, value, legacy_col) in docs {
        let Some(v) = value.filter(|s| !s.trim().is_empty()) else {
            continue;
        };
    let content_hash = if doc_type == "passport_hash" {
            Some(v)
        } else {
            None
        };
    let storage_url = if doc_type == "passport_hash" {
            None
        } else {
            Some(v)
        };
    sqlx::query(
            r#"
            INSERT INTO role_documents (application_id, doc_type, storage_url, content_hash, legacy_column)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(application_id)
        .bind(doc_type)
        .bind(storage_url)
        .bind(content_hash)
        .bind(legacy_col)
        .execute(pool)
        .await?;
    }
;
    Ok(())
}

async fn upsert_staking_position(
    pool: &PgPool,
    application_id: Uuid,
    kind: &str,
    amount: &str,
    status: &str,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO staking_positions (application_id, kind, amount, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $5)
        ON CONFLICT (application_id, kind) DO UPDATE
        SET amount = EXCLUDED.amount,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
        "#,
    )
    .bind(application_id)
    .bind(kind)
    .bind(amount)
    .bind(status)
    .bind(updated_at)
    .execute(pool)
    .await?;
    Ok(())
}

/// **`insert_guide` 成功后** 双写申请单与资料行。
pub async fn dual_write_after_guide_insert(
    pool: &PgPool,
    guide_id: Uuid,
    user_id: Uuid,
    id_photo_url: Option<&str>,
    language_cert_url: Option<&str>,
    guide_license_url: Option<&str>,
    passport_number_hash: Option<&str>,
    guides_status: &str,
    stake_amount: &str,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) {
    let app_status = map_guides_status_to_application(guides_status, &[], None);
    let legacy_ref = json!({ "guides_id": guide_id.to_string() });
    let metadata = Json(json!({ "phase": "A", "source": "guides" }));

    let app_id = match upsert_application(
        pool,
        user_id,
        "guide",
        app_status,
        legacy_ref,
        Json(json!([])),
        None,
        metadata,
        Some(created_at),
        None,
        created_at,
        updated_at,
    )
    .await
    {
        Ok(id) => id,
        Err(e) => {
            log_dual_write_err("dual_write_after_guide_insert.application", &e);
            return;
        }
    };
    if let Err(e) = replace_guide_documents(
        pool,
        app_id,
        id_photo_url,
        language_cert_url,
        guide_license_url,
        passport_number_hash,
    )
    .await
    {
        log_dual_write_err("dual_write_after_guide_insert.documents", &e);
    };
    if stake_amount != "0" {
        let stake_status = if guides_status == "active" {
            "locked"
        } else {
            "pending"
        };
    if let Err(e) = upsert_staking_position(
            pool,
            app_id,
            "identity_pool_guide",
            stake_amount,
            stake_status,
            updated_at,
        )
        .await
        {
            log_dual_write_err("dual_write_after_guide_insert.staking", &e);
        }
    }
}

/// **`resubmit_guide_application` 成功后** 同步申请单与资料（`rejected` → `pending`）。
pub async fn dual_write_after_guide_resubmit(
    pool: &PgPool,
    guide_id: Uuid,
    user_id: Uuid,
    id_photo_url: Option<&str>,
    language_cert_url: Option<&str>,
    guide_license_url: Option<&str>,
    passport_number_hash: Option<&str>,
    stake_amount: &str,
    updated_at: DateTime<Utc>,
) {
    let app_status = map_guides_status_to_application("pending", &[], None);
    let legacy_ref = json!({ "guides_id": guide_id.to_string() });
    let metadata = Json(json!({ "phase": "A", "source": "guides", "resubmit": true }));
    let app_id = match upsert_application(
        pool,
        user_id,
        "guide",
        app_status,
        legacy_ref,
        Json(json!([])),
        None,
        metadata,
        None,
        None,
        updated_at,
        updated_at,
    )
    .await
    {
        Ok(id) => id,
        Err(e) => {
            log_dual_write_err("dual_write_after_guide_resubmit.application", &e);
            return;
        }
    };
    if let Err(e) = replace_guide_documents(
        pool,
        app_id,
        id_photo_url,
        language_cert_url,
        guide_license_url,
        passport_number_hash,
    )
    .await
    {
        log_dual_write_err("dual_write_after_guide_resubmit.documents", &e);
    };
    if stake_amount != "0" {
        if let Err(e) = upsert_staking_position(
            pool,
            app_id,
            "identity_pool_guide",
            stake_amount,
            "pending",
            updated_at,
        )
        .await
        {
            log_dual_write_err("dual_write_after_guide_resubmit.staking", &e);
        }
    }
}

/// **`update_guide_registration_review` 成功后** 同步申请状态。
pub async fn dual_write_after_guide_review_update(
    pool: &PgPool,
    guide_id: Uuid,
    user_id: Uuid,
    guides_status: &str,
    rejection_codes: &[String],
    rejection_message: Option<&str>,
    updated_at: DateTime<Utc>,
) {
    let app_status =
        map_guides_status_to_application(guides_status, rejection_codes, rejection_message);
    let codes_json = Json(
        serde_json::to_value(rejection_codes).unwrap_or_else(|_| json!([])),
    );
    let legacy_ref = json!({ "guides_id": guide_id.to_string() });
    let metadata = Json(json!({ "phase": "A", "source": "guides" }));
    let decided_at = if app_status == "approved" || app_status == "rejected" {
        Some(updated_at)
    } else {
        None
    };
    if let Err(e) = upsert_application(
        pool,
        user_id,
        "guide",
        app_status,
        legacy_ref,
        codes_json,
        rejection_message,
        metadata,
        None,
        decided_at,
        updated_at,
        updated_at,
    )
    .await
    {
        log_dual_write_err("dual_write_after_guide_review_update", &e);
    }
}

/// **`update_guide_stake` 成功后** 同步质押仓位（不读新表）。
pub async fn dual_write_after_guide_stake(
    pool: &PgPool,
    guide_id: Uuid,
    user_id: Uuid,
    stake_amount: &str,
    guides_status: &str,
    updated_at: DateTime<Utc>,
) {
    let legacy_ref = json!({ "guides_id": guide_id.to_string() });
    let app_id = match upsert_application(
        pool,
        user_id,
        "guide",
        map_guides_status_to_application(guides_status, &[], None),
        legacy_ref,
        Json(json!([])),
        None,
        Json(json!({ "phase": "A", "source": "guides_stake" })),
        None,
        if guides_status == "active" {
            Some(updated_at)
        } else {
            None
        },
        updated_at,
        updated_at,
    )
    .await
    {
        Ok(id) => id,
        Err(e) => {
            log_dual_write_err("dual_write_after_guide_stake.application", &e);
            return;
        }
    };
    let stake_status = if stake_amount != "0" && guides_status == "active" {
        "locked"
    } else if stake_amount != "0" {
        "pending"
    } else {
        "pending"
    };
    if let Err(e) = upsert_staking_position(
        pool,
        app_id,
        "identity_pool_guide",
        stake_amount,
        stake_status,
        updated_at,
    )
    .await
    {
        log_dual_write_err("dual_write_after_guide_stake.staking", &e);
    }
}

/// 商家申请 **`role_documents`** 双写 bundle（Phase A · KYB 扩展）。
pub struct ProviderApplicationDocuments<'a> {
    pub business_license_url: Option<&'a str>,
    pub insurance_url: Option<&'a str>,
    pub tax_id: Option<&'a str>,
    pub travel_agency_permit_url: Option<&'a str>,
    pub legal_representative_id_url: Option<&'a str>,
    /// `(full_name, id_number, id_doc_url)`
    pub beneficial_owners: &'a [(&'a str, &'a str, &'a str)],
}

async fn insert_provider_document_url(
    pool: &PgPool,
    application_id: Uuid,
    doc_type: &str,
    storage_url: &str,
    legacy_col: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO role_documents (application_id, doc_type, storage_url, content_hash, legacy_column)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(application_id)
    .bind(doc_type)
    .bind(storage_url)
    .bind(None::<String>)
    .bind(legacy_col)
    .execute(pool)
    .await?;
    Ok(())
}

async fn replace_provider_documents(
    pool: &PgPool,
    application_id: Uuid,
    docs: &ProviderApplicationDocuments<'_>,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM role_documents WHERE application_id = $1")
        .bind(application_id)
        .execute(pool)
        .await?;

    if let Some(v) = docs
        .business_license_url
        .filter(|s| !s.trim().is_empty())
    {
        insert_provider_document_url(
            pool,
            application_id,
            "business_license",
            v,
            Some("business_license_url"),
        )
        .await?;
    };
    if let Some(v) = docs.insurance_url.filter(|s| !s.trim().is_empty()) {
        insert_provider_document_url(pool, application_id, "insurance", v, Some("insurance_url"))
            .await?;
    };
    if let Some(v) = docs.tax_id.filter(|s| !s.trim().is_empty()) {
        sqlx::query(
            r#"
            INSERT INTO role_documents (application_id, doc_type, storage_url, content_hash, legacy_column)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(application_id)
        .bind("tax_id")
        .bind(None::<String>)
        .bind(v)
        .bind(Some("tax_id"))
        .execute(pool)
        .await?;
    };
    if let Some(v) = docs
        .travel_agency_permit_url
        .filter(|s| !s.trim().is_empty())
    {
        insert_provider_document_url(
            pool,
            application_id,
            "travel_agency_permit",
            v,
            Some("travel_agency_permit_url"),
        )
        .await?;
    };
    if let Some(v) = docs
        .legal_representative_id_url
        .filter(|s| !s.trim().is_empty())
    {
        insert_provider_document_url(
            pool,
            application_id,
            "legal_representative_id",
            v,
            Some("legal_representative_id_url"),
        )
        .await?;
    }
;
    for (_name, id_number, url) in docs.beneficial_owners {
        if url.trim().is_empty() {
            continue;
        }
        sqlx::query(
            r#"
            INSERT INTO role_documents (application_id, doc_type, storage_url, content_hash, legacy_column)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(application_id)
        .bind("beneficial_owner_id")
        .bind(url.trim())
        .bind(id_number.trim())
        .bind(None::<&str>)
        .execute(pool)
        .await?;
    }
;
    Ok(())
}

/// **`POST /api/v1/provider-applications` 成功后** 双写申请单与资料行。
pub async fn dual_write_after_provider_application_submit(
    pool: &PgPool,
    user_id: Uuid,
    application_id: Uuid,
    metadata_payload: &serde_json::Value,
    docs: &ProviderApplicationDocuments<'_>,
    updated_at: DateTime<Utc>,
) {
    let legacy_ref = json!({ "provider_application_id": application_id.to_string() });
    let metadata = Json(json!({
        "phase": "A",
        "source": "provider_applications",
        "payload": metadata_payload,
    }));

    let app_id = match upsert_application(
        pool,
        user_id,
        "provider_onboarding",
        "submitted",
        legacy_ref,
        Json(json!([])),
        None,
        metadata,
        Some(updated_at),
        None,
        updated_at,
        updated_at,
    )
    .await
    {
        Ok(id) => id,
        Err(e) => {
            log_dual_write_err("dual_write_after_provider_application_submit.application", &e);
            return;
        }
    };
    if let Err(e) = replace_provider_documents(pool, app_id, docs).await {
        log_dual_write_err("dual_write_after_provider_application_submit.documents", &e);
    }
}

/// **`POST /api/v1/steward/applications` 成功后** 双写 `region_steward_onboarding` 申请。
pub async fn dual_write_after_steward_application_submit(
    pool: &PgPool,
    user_id: Uuid,
    application_id: Uuid,
    metadata_payload: &serde_json::Value,
    updated_at: DateTime<Utc>,
) {
    let legacy_ref = json!({ "steward_application_id": application_id.to_string() });
    let metadata = Json(json!({
        "phase": "P2",
        "source": "steward_applications",
        "payload": metadata_payload,
    }));

    if let Err(e) = upsert_application(
        pool,
        user_id,
        "region_steward_onboarding",
        "submitted",
        legacy_ref,
        Json(json!([])),
        None,
        metadata,
        Some(updated_at),
        None,
        updated_at,
        updated_at,
    )
    .await
    {
        log_dual_write_err("dual_write_after_steward_application_submit.application", &e);
    }
}

/// Admin 审核主理人申请后双写 `role_applications`。
pub async fn dual_write_after_steward_application_review(
    pool: &PgPool,
    user_id: Uuid,
    application_id: Uuid,
    status: &str,
    rejection_codes: &[String],
    rejection_message: Option<&str>,
    updated_at: DateTime<Utc>,
) {
    let app_status = match status {
        "approved" => "approved",
        "rejected" => "rejected",
        "under_review" => "reviewing",
        "stake_release_pending" => "submitted",
        _ => "submitted",
    };
    let legacy_ref = json!({ "steward_application_id": application_id.to_string() });
    let codes_json = Json(serde_json::to_value(rejection_codes).unwrap_or_else(|_| json!([])));
    let metadata = Json(json!({
        "phase": "P2",
        "source": "steward_applications",
        "admin_review": true,
        "lifecycle_state": status,
    }));
    let decided_at = if app_status == "approved" || app_status == "rejected" {
        Some(updated_at)
    } else {
        None
    };
    if let Err(e) = upsert_application(
        pool,
        user_id,
        "region_steward_onboarding",
        app_status,
        legacy_ref,
        codes_json,
        rejection_message,
        metadata,
        decided_at,
        None,
        updated_at,
        updated_at,
    )
    .await
    {
        log_dual_write_err("dual_write_after_steward_application_review.application", &e);
    }
}

/// Admin 审核商家申请后双写 `role_applications`。
pub async fn dual_write_after_provider_application_review(
    pool: &PgPool,
    user_id: Uuid,
    application_id: Uuid,
    status: &str,
    rejection_codes: &[String],
    rejection_message: Option<&str>,
    updated_at: DateTime<Utc>,
) {
    let app_status = match status {
        "approved" => "approved",
        "rejected" => "rejected",
        "reviewing" => "reviewing",
        _ => "submitted",
    };
    let legacy_ref = json!({ "provider_application_id": application_id.to_string() });
    let codes_json = Json(
        serde_json::to_value(rejection_codes).unwrap_or_else(|_| json!([])),
    );
    let metadata = Json(json!({
        "phase": "A",
        "source": "provider_applications",
        "admin_review": true,
    }));
    let decided_at = if app_status == "approved" || app_status == "rejected" {
        Some(updated_at)
    } else {
        None
    };
    if let Err(e) = upsert_application(
        pool,
        user_id,
        "provider_onboarding",
        app_status,
        legacy_ref,
        codes_json,
        rejection_message,
        metadata,
        None,
        decided_at,
        updated_at,
        updated_at,
    )
    .await
    {
        log_dual_write_err("dual_write_after_provider_application_review", &e);
    }
}

/// **`onboarding_entitlements` 行变更后** 双写（insert / webhook / admin / stripe）。
pub async fn dual_write_after_onboarding_entitlement(pool: &PgPool, ent: &OnboardingEntitlementRow) {
    let Some(kind) = onboarding_kind(&ent.role_target) else {
        return;
    };
    let app_status = map_entitlement_status_to_application(&ent.status);
    let legacy_ref = json!({ "entitlement_id": ent.id.to_string() });
    let metadata = Json(json!({
        "phase": "A",
        "source": "onboarding_entitlements",
        "sku": ent.sku,
        "fee_schedule_version": ent.fee_schedule_version,
        "idempotency_key": ent.idempotency_key,
    }));
    let decided_at = if app_status == "approved" || app_status == "rejected" {
        ent.paid_at.or(Some(ent.updated_at))
    } else {
        None
    };
    let app_id = match upsert_application(
        pool,
        ent.user_id,
        kind,
        app_status,
        legacy_ref,
        Json(json!([])),
        None,
        metadata,
        Some(ent.created_at),
        decided_at,
        ent.created_at,
        ent.updated_at,
    )
    .await
    {
        Ok(id) => id,
        Err(e) => {
            log_dual_write_err("dual_write_after_onboarding_entitlement.application", &e);
            return;
        }
    };
    let stake_status = match ent.status.as_str() {
        "paid" => "locked",
        "pending" => "pending",
        "refunded" | "revoked" => "released",
        _ => "pending",
    };
    if let Err(e) = upsert_staking_position(
        pool,
        app_id,
        "onboarding_fee",
        "0",
        stake_status,
        ent.updated_at,
    )
    .await
    {
        log_dual_write_err("dual_write_after_onboarding_entitlement.staking", &e);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn map_guides_pending_to_submitted() {
        assert_eq!(
            map_guides_status_to_application("pending", &[], None),
            "submitted"
        );
    }

    #[test]
    fn map_guides_rejection_overrides_status() {
        assert_eq!(
            map_guides_status_to_application("pending", &["KYC".to_string()], None),
            "rejected"
        );
    }

    #[test]
    fn map_entitlement_paid_to_approved() {
        assert_eq!(map_entitlement_status_to_application("paid"), "approved");
    }

    #[test]
    fn map_entitlement_refunded_to_rejected() {
        assert_eq!(
            map_entitlement_status_to_application("refunded"),
            "rejected"
        );
    }
}

/// **`PUT /api/v1/me`** · **`default_wallet_address`** → **`wallets`** 主钱包双写（**PD-004** · Phase A）。
pub async fn sync_primary_wallet_dual_write(
    pool: &PgPool,
    user_id: Uuid,
    address: &str,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    let addr = address.trim();
    if addr.is_empty() {
        return Ok(());
    }
    sqlx::query(
        "UPDATE wallets SET is_primary = false, updated_at = $2 WHERE user_id = $1 AND is_primary = true",
    )
    .bind(user_id)
    .bind(updated_at)
    .execute(pool)
    .await?;
    if let Some(wallet_id) = sqlx::query_scalar::<_, Uuid>(
        r#"
        SELECT id FROM wallets
        WHERE user_id = $1 AND lower(btrim(address)) = lower(btrim($2))
        "#,
    )
    .bind(user_id)
    .bind(addr)
    .fetch_optional(pool)
    .await?
    {
        sqlx::query("UPDATE wallets SET is_primary = true, updated_at = $2 WHERE id = $1")
            .bind(wallet_id)
            .bind(updated_at)
            .execute(pool)
            .await?;
    } else {
        sqlx::query(
            r#"
            INSERT INTO wallets (user_id, address, is_primary, created_at, updated_at)
            VALUES ($1, $2, true, $3, $3)
            "#,
        )
        .bind(user_id)
        .bind(addr)
        .bind(updated_at)
        .execute(pool)
        .await?;
    }
    Ok(())
}

/// **`GET /api/v1/me/wallets`**（**PD-004**）。
pub async fn list_wallets_for_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, bool, Option<DateTime<Utc>>, DateTime<Utc>, DateTime<Utc>)>(
        r#"
        SELECT id, address, label, is_primary, verified_at, created_at, updated_at
        FROM wallets
        WHERE user_id = $1
        ORDER BY is_primary DESC, created_at ASC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(id, address, label, is_primary, verified_at, created_at, updated_at)| {
            json!({
                "id": id.to_string(),
                "address": address,
                "label": label,
                "is_primary": is_primary,
                "verified_at": verified_at.map(|t| t.to_rfc3339()),
                "created_at": created_at.to_rfc3339(),
                "updated_at": updated_at.to_rfc3339()
            })
        })
        .collect())
}

/// **`GET /api/v1/me/role-applications`**（**PD-007** · SSOT 状态）。
pub async fn list_role_applications_for_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            String,
            Json<serde_json::Value>,
            Option<DateTime<Utc>>,
            Option<DateTime<Utc>>,
            Json<serde_json::Value>,
            Option<String>,
            Json<serde_json::Value>,
            DateTime<Utc>,
            DateTime<Utc>,
        ),
    >(
        r#"
        SELECT id, kind, status, legacy_ref, submitted_at, decided_at,
               rejection_codes, rejection_message, metadata, created_at, updated_at
        FROM role_applications
        WHERE user_id = $1
        ORDER BY updated_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                kind,
                status,
                legacy_ref,
                submitted_at,
                decided_at,
                rejection_codes,
                rejection_message,
                metadata,
                created_at,
                updated_at,
            )| {
                json!({
                    "id": id.to_string(),
                    "kind": kind,
                    "status": status,
                    "legacy_ref": legacy_ref.0,
                    "submitted_at": submitted_at.map(|t| t.to_rfc3339()),
                    "decided_at": decided_at.map(|t| t.to_rfc3339()),
                    "rejection_codes": rejection_codes.0,
                    "rejection_message": rejection_message,
                    "metadata": metadata.0,
                    "created_at": created_at.to_rfc3339(),
                    "updated_at": updated_at.to_rfc3339()
                })
            },
        )
        .collect())
}
