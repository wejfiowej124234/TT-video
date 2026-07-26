//! ①.5 Phase A：**guides / onboarding_*** 写入时双写 **`role_applications`** / **`role_documents`** / **`staking_positions`**。
//! 写路径失败仅审计日志（除非 `TRAVELTRUST_STRICT_ROLE_IDENTITY_DUAL_WRITE=1`）。
//! **Admin 入驻列表（HU-098）：** 有 PG 池时读 `role_applications` 为 SSOT；无池仍读 chain_off 内存。

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
    // HU-098：须按 legacy 业务键 upsert；缺键则每次 INSERT → Admin 列表重复行（审批后仍 stake_pending）
    let legacy_key = if legacy_ref.get("guides_id").is_some() {
        "guides_id"
    } else if legacy_ref.get("entitlement_id").is_some() {
        "entitlement_id"
    } else if legacy_ref.get("steward_application_id").is_some() {
        "steward_application_id"
    } else if legacy_ref.get("provider_application_id").is_some() {
        "provider_application_id"
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
    };
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
                legacy_ref = $3,
                rejection_codes = $4,
                rejection_message = $5,
                metadata = metadata || $6::jsonb,
                submitted_at = COALESCE($7, submitted_at),
                decided_at = COALESCE($8, decided_at),
                updated_at = $9
            WHERE id = $1
            "#,
        )
        .bind(app_id)
        .bind(status)
        .bind(Json(legacy_ref.clone()))
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

    // Steward/provider：同一用户同一 kind 仅保留一条（重启后新 application_id 仍须命中旧行）
    if matches!(
        kind,
        "region_steward_onboarding" | "provider_onboarding"
    ) {
        if let Some(app_id) = sqlx::query_scalar::<_, Uuid>(
            r#"
            SELECT id FROM role_applications
            WHERE user_id = $1 AND kind = $2
            ORDER BY updated_at DESC
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .bind(kind)
        .fetch_optional(pool)
        .await?
        {
            sqlx::query(
                r#"
                UPDATE role_applications
                SET status = $2,
                    legacy_ref = $3,
                    rejection_codes = $4,
                    rejection_message = $5,
                    metadata = metadata || $6::jsonb,
                    submitted_at = COALESCE($7, submitted_at),
                    decided_at = COALESCE($8, decided_at),
                    updated_at = $9
                WHERE id = $1
                "#,
            )
            .bind(app_id)
            .bind(status)
            .bind(Json(legacy_ref.clone()))
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
        "lifecycle_state": "stake_pending",
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

/// Admin 入驻队列读路径（HU-098）：有 PG 时以 `role_applications` 为 SSOT。
#[derive(Debug, Clone)]
pub struct AdminRoleApplicationListItem {
    pub user_id: Uuid,
    pub email: Option<String>,
    pub user_role: String,
    pub application: serde_json::Value,
}

fn admin_filter_matches_pg_row(
    kind: &str,
    filter: &str,
    pg_status: &str,
    lifecycle_state: Option<&str>,
) -> bool {
    let f = filter.trim().to_ascii_lowercase();
    if f.is_empty() {
        return true;
    }
    let pg = pg_status.trim().to_ascii_lowercase();
    let life = lifecycle_state.map(|s| s.trim().to_ascii_lowercase());
    match kind {
        "guide" => match f.as_str() {
            "pending" | "pending_review" => {
                matches!(pg.as_str(), "submitted" | "reviewing" | "draft")
            }
            "active" => pg == "approved",
            "rejected" => pg == "rejected",
            "suspended" => pg == "suspended",
            "submitted" => pg == "submitted",
            "reviewing" => pg == "reviewing",
            "approved" => pg == "approved",
            _ => pg == f || life.as_deref() == Some(f.as_str()),
        },
        "provider_onboarding" => pg == f || life.as_deref() == Some(f.as_str()),
        "region_steward_onboarding" => {
            if life.as_deref() == Some(f.as_str()) {
                return true;
            }
            match f.as_str() {
                "stake_pending" => {
                    pg == "submitted"
                        && life
                            .as_deref()
                            .map(|l| l == "stake_pending" || l.is_empty())
                            .unwrap_or(true)
                }
                "under_review" => pg == "reviewing" || life.as_deref() == Some("under_review"),
                "stake_release_pending" => {
                    life.as_deref() == Some("stake_release_pending") || pg == "submitted"
                }
                "approved" | "rejected" => pg == f,
                _ => pg == f,
            }
        }
        _ => pg == f || life.as_deref() == Some(f.as_str()),
    }
}

fn display_status_for_admin(kind: &str, pg_status: &str, lifecycle_state: Option<&str>) -> String {
    if let Some(life) = lifecycle_state.filter(|s| !s.trim().is_empty()) {
        if kind == "region_steward_onboarding" || kind == "provider_onboarding" {
            return life.to_string();
        }
    }
    match kind {
        "guide" => match pg_status {
            "approved" => "active".into(),
            "submitted" | "reviewing" | "draft" => "pending".into(),
            other => other.to_string(),
        },
        _ => pg_status.to_string(),
    }
}

fn application_id_from_legacy(kind: &str, legacy_ref: &serde_json::Value, fallback: Uuid) -> String {
    let key = match kind {
        "guide" => "guides_id",
        "provider_onboarding" => "provider_application_id",
        "region_steward_onboarding" => "steward_application_id",
        _ => "",
    };
    legacy_ref
        .get(key)
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| fallback.to_string())
}

fn is_pending_like(kind: &str, pg_status: &str, lifecycle_state: Option<&str>) -> bool {
    let pg = pg_status.trim().to_ascii_lowercase();
    match kind {
        "guide" | "provider_onboarding" => matches!(pg.as_str(), "submitted" | "reviewing" | "draft"),
        "region_steward_onboarding" => {
            let life = lifecycle_state.map(|s| s.trim().to_ascii_lowercase());
            if matches!(
                life.as_deref(),
                Some("approved") | Some("rejected")
            ) {
                return false;
            }
            matches!(pg.as_str(), "submitted" | "reviewing" | "draft")
                || matches!(
                    life.as_deref(),
                    Some("stake_pending") | Some("under_review") | Some("stake_release_pending")
                )
        }
        _ => matches!(pg.as_str(), "submitted" | "reviewing" | "draft"),
    }
}

/// Admin list SSOT when `DATABASE_URL` / pool is present（HU-098）.
#[derive(Debug, sqlx::FromRow)]
struct AdminRoleApplicationPgRow {
    user_id: Uuid,
    email: Option<String>,
    user_role: String,
    id: Uuid,
    status: String,
    legacy_ref: Json<serde_json::Value>,
    submitted_at: Option<DateTime<Utc>>,
    rejection_codes: Json<serde_json::Value>,
    rejection_message: Option<String>,
    metadata: Json<serde_json::Value>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    city: Option<String>,
    country_code: Option<String>,
    languages: Option<Json<serde_json::Value>>,
    service_types: Option<Json<serde_json::Value>>,
    guide_status: Option<String>,
    guide_created_at: Option<DateTime<Utc>>,
    guide_updated_at: Option<DateTime<Utc>>,
}

fn admin_row_status_rank(kind: &str, pg_status: &str, lifecycle_state: Option<&str>) -> i32 {
    let display = display_status_for_admin(kind, pg_status, lifecycle_state).to_ascii_lowercase();
    match display.as_str() {
        "approved" | "active" => 50,
        "rejected" => 40,
        "under_review" | "reviewing" => 30,
        "stake_release_pending" => 25,
        "stake_pending" | "pending" | "submitted" | "draft" => 20,
        _ => 10,
    }
}

pub async fn list_role_applications_admin(
    pool: &PgPool,
    kind: &str,
    status_filter: Option<&str>,
) -> Result<(Vec<AdminRoleApplicationListItem>, i64, i64), sqlx::Error> {
    let rows = sqlx::query_as::<_, AdminRoleApplicationPgRow>(
        r#"
        SELECT ra.user_id,
               u.email,
               COALESCE(NULLIF(TRIM(u.role), ''), 'traveler') AS user_role,
               ra.id,
               ra.status,
               ra.legacy_ref,
               ra.submitted_at,
               ra.rejection_codes,
               ra.rejection_message,
               ra.metadata,
               ra.created_at,
               ra.updated_at,
               g.city,
               g.country_code,
               g.languages,
               g.service_types,
               g.status AS guide_status,
               g.created_at AS guide_created_at,
               g.updated_at AS guide_updated_at
        FROM role_applications ra
        JOIN users u ON u.id = ra.user_id
        LEFT JOIN guides g
          ON ra.kind = 'guide'
         AND g.id::text = ra.legacy_ref->>'guides_id'
        WHERE ra.kind = $1
        ORDER BY COALESCE(ra.submitted_at, ra.created_at) DESC
        "#,
    )
    .bind(kind)
    .fetch_all(pool)
    .await?;

    let filter = status_filter
        .map(|s| s.trim().to_ascii_lowercase())
        .filter(|s: &String| !s.is_empty());

    // HU-098：按 legacy 业务 id 去重；主理人/商家再按 user_id 收敛为一人一行
    let mut best_by_key: std::collections::HashMap<String, AdminRoleApplicationPgRow> =
        std::collections::HashMap::new();
    for row in rows {
        let legacy = row.legacy_ref.0.clone();
        let app_id = application_id_from_legacy(kind, &legacy, row.id);
        let key = if matches!(kind, "region_steward_onboarding" | "provider_onboarding") {
            format!("user:{}", row.user_id)
        } else {
            format!("{}:{}", row.user_id, app_id)
        };
        let life = row
            .metadata
            .0
            .get("lifecycle_state")
            .and_then(|v| v.as_str())
            .map(str::to_string);
        let rank = admin_row_status_rank(kind, &row.status, life.as_deref());
        match best_by_key.get(&key) {
            Some(prev) => {
                let prev_life = prev
                    .metadata
                    .0
                    .get("lifecycle_state")
                    .and_then(|v| v.as_str());
                let prev_rank = admin_row_status_rank(kind, &prev.status, prev_life);
                if rank > prev_rank || (rank == prev_rank && row.updated_at > prev.updated_at) {
                    best_by_key.insert(key, row);
                }
            }
            None => {
                best_by_key.insert(key, row);
            }
        }
    }

    let mut pending_count: i64 = 0;
    let mut items: Vec<AdminRoleApplicationListItem> = Vec::with_capacity(best_by_key.len());

    let mut ranked_rows: Vec<AdminRoleApplicationPgRow> = best_by_key.into_values().collect();
    ranked_rows.sort_by(|a, b| {
        b.updated_at
            .cmp(&a.updated_at)
            .then_with(|| b.created_at.cmp(&a.created_at))
    });

    for row in ranked_rows {
        let legacy = row.legacy_ref.0;
        let meta = row.metadata.0;
        let lifecycle = meta
            .get("lifecycle_state")
            .and_then(|v| v.as_str())
            .map(str::to_string);
        if is_pending_like(kind, &row.status, lifecycle.as_deref()) {
            pending_count += 1;
        }
        if let Some(ref f) = filter {
            if !admin_filter_matches_pg_row(kind, f, &row.status, lifecycle.as_deref()) {
                continue;
            }
        }

        let app_id = application_id_from_legacy(kind, &legacy, row.id);
        let display_status = if kind == "guide" {
            row.guide_status
                .as_deref()
                .filter(|s: &&str| !s.is_empty())
                .map(|s| s.to_string())
                .unwrap_or_else(|| {
                    display_status_for_admin(kind, &row.status, lifecycle.as_deref())
                })
        } else {
            display_status_for_admin(kind, &row.status, lifecycle.as_deref())
        };

        let submitted_at_s = row
            .submitted_at
            .or(row.guide_created_at)
            .unwrap_or(row.created_at)
            .to_rfc3339();

        let mut application = json!({
            "id": app_id,
            "status": display_status,
            "submitted_at": submitted_at_s,
            "rejection_codes": row.rejection_codes.0,
            "role_application_id": row.id.to_string(),
            "pg_status": row.status,
        });

        match kind {
            "guide" => {
                if let Some(obj) = application.as_object_mut() {
                    obj.insert("city".into(), json!(row.city));
                    obj.insert("country_code".into(), json!(row.country_code));
                    obj.insert(
                        "languages".into(),
                        row.languages.map(|j| j.0).unwrap_or_else(|| json!([])),
                    );
                    obj.insert(
                        "service_types".into(),
                        row.service_types
                            .map(|j| j.0)
                            .unwrap_or_else(|| json!([])),
                    );
                    obj.insert(
                        "updated_at".into(),
                        json!(row.guide_updated_at.unwrap_or(row.updated_at).to_rfc3339()),
                    );
                }
            }
            "provider_onboarding" => {
                let payload = meta.get("payload").cloned().unwrap_or_else(|| json!({}));
                if let Some(obj) = application.as_object_mut() {
                    obj.insert(
                        "shop_name".into(),
                        payload.get("shop_name").cloned().unwrap_or(json!(null)),
                    );
                    obj.insert(
                        "legal_name".into(),
                        payload.get("legal_name").cloned().unwrap_or(json!(null)),
                    );
                    obj.insert(
                        "country_code".into(),
                        payload
                            .get("country_code")
                            .cloned()
                            .unwrap_or(json!(null)),
                    );
                    obj.insert(
                        "entity_type".into(),
                        payload.get("entity_type").cloned().unwrap_or(json!(null)),
                    );
                }
            }
            "region_steward_onboarding" => {
                let payload = meta.get("payload").cloned().unwrap_or_else(|| json!({}));
                if let Some(obj) = application.as_object_mut() {
                    obj.insert("lifecycle_state".into(), json!(display_status));
                    obj.insert(
                        "jurisdictions".into(),
                        payload
                            .get("jurisdictions")
                            .cloned()
                            .unwrap_or_else(|| json!([])),
                    );
                    obj.insert(
                        "legal_name".into(),
                        payload.get("legal_name").cloned().unwrap_or(json!(null)),
                    );
                    obj.insert(
                        "wallet_address".into(),
                        payload
                            .get("wallet_address")
                            .cloned()
                            .or_else(|| meta.get("wallet_address").cloned())
                            .unwrap_or(json!(null)),
                    );
                }
            }
            _ => {}
        }

        items.push(AdminRoleApplicationListItem {
            user_id: row.user_id,
            email: row.email,
            user_role: row.user_role,
            application,
        });
    }

    let total = items.len() as i64;
    Ok((items, total, pending_count))
}

/// Batch-14 · Admin 商家申请详情：有 PG 时读 `role_applications` + `role_documents`（禁 silent memory 冒充列表）。
pub async fn get_provider_application_admin_detail(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<serde_json::Value>, sqlx::Error> {
    let row = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Json<serde_json::Value>,
            Option<DateTime<Utc>>,
            Json<serde_json::Value>,
            Option<String>,
            Json<serde_json::Value>,
            DateTime<Utc>,
            DateTime<Utc>,
        ),
    >(
        r#"
        SELECT id, status, legacy_ref, submitted_at, rejection_codes, rejection_message,
               metadata, created_at, updated_at
        FROM role_applications
        WHERE user_id = $1 AND kind = 'provider_onboarding'
        ORDER BY updated_at DESC
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    let Some((
        ra_id,
        status,
        legacy_ref,
        submitted_at,
        rejection_codes,
        rejection_message,
        metadata,
        created_at,
        updated_at,
    )) = row
    else {
        return Ok(None);
    };

    let meta = metadata.0;
    let lifecycle = meta
        .get("lifecycle_state")
        .and_then(|v| v.as_str())
        .map(str::to_string);
    let display_status = display_status_for_admin(
        "provider_onboarding",
        &status,
        lifecycle.as_deref(),
    );
    let app_id = application_id_from_legacy("provider_onboarding", &legacy_ref.0, ra_id);

    let mut payload = meta
        .get("payload")
        .cloned()
        .unwrap_or_else(|| json!({}));
    if !payload.is_object() {
        payload = json!({});
    }

    // Merge role_documents into payload URL fields expected by Admin FE.
    let docs = sqlx::query_as::<_, (String, String, Option<String>)>(
        r#"
        SELECT doc_type, storage_url, content_hash
        FROM role_documents
        WHERE application_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(ra_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    if let Some(obj) = payload.as_object_mut() {
        let mut beneficial_urls: Vec<(String, Option<String>)> = Vec::new();
        for (doc_type, url, content_hash) in docs {
            let u = url.trim();
            if u.is_empty() {
                continue;
            }
            match doc_type.as_str() {
                "business_license" => {
                    obj.entry("business_license_url".to_string())
                        .or_insert_with(|| json!(u));
                }
                "travel_agency_permit" => {
                    obj.entry("travel_agency_permit_url".to_string())
                        .or_insert_with(|| json!(u));
                }
                "insurance" => {
                    obj.entry("insurance_url".to_string())
                        .or_insert_with(|| json!(u));
                }
                "legal_representative_id" => {
                    obj.entry("legal_representative_id_url".to_string())
                        .or_insert_with(|| json!(u));
                }
                "beneficial_owner_id" => {
                    beneficial_urls.push((u.to_string(), content_hash));
                }
                _ => {}
            }
        }
        if !beneficial_urls.is_empty() {
            let owners = obj
                .entry("beneficial_owners".to_string())
                .or_insert_with(|| json!([]));
            if let Some(arr) = owners.as_array_mut() {
                for (i, (url, hash)) in beneficial_urls.into_iter().enumerate() {
                    if let Some(existing) = arr.get_mut(i) {
                        if let Some(eo) = existing.as_object_mut() {
                            eo.entry("id_doc_url".to_string())
                                .or_insert_with(|| json!(url));
                            if let Some(h) = hash.filter(|s| !s.trim().is_empty()) {
                                eo.entry("id_number".to_string())
                                    .or_insert_with(|| json!(h));
                            }
                        }
                    } else {
                        arr.push(json!({
                            "full_name": format!("beneficial_owner_{}", i + 1),
                            "id_doc_url": url,
                            "id_number": hash,
                        }));
                    }
                }
            }
        }
    }

    Ok(Some(json!({
        "id": app_id,
        "role_application_id": ra_id.to_string(),
        "status": display_status,
        "pg_status": status,
        "payload": payload,
        "submitted_at": submitted_at.unwrap_or(created_at).to_rfc3339(),
        "updated_at": updated_at.to_rfc3339(),
        "rejection_codes": rejection_codes.0,
        "rejection_message": rejection_message,
    })))
}

/// Batch-14 · Admin 审核商家申请写 PG SSOT（保留 metadata.payload · 禁 silent 丢字段）。
pub async fn update_provider_application_review_pg(
    pool: &PgPool,
    user_id: Uuid,
    status: &str,
    rejection_codes: &[String],
    rejection_message: Option<&str>,
    updated_at: DateTime<Utc>,
) -> Result<Option<(Uuid, String)>, sqlx::Error> {
    // role_applications.status CHECK 无 needs_more_info · 用 reviewing + lifecycle_state 承载。
    let app_status = match status {
        "approved" => "approved",
        "rejected" => "rejected",
        "reviewing" | "needs_more_info" => "reviewing",
        _ => "submitted",
    };
    let lifecycle = match status {
        "needs_more_info" => Some("needs_more_info"),
        "approved" => Some("approved"),
        "rejected" => Some("rejected"),
        "reviewing" => Some("reviewing"),
        _ => Some("submitted"),
    };
    let row = sqlx::query_as::<_, (Uuid, Json<serde_json::Value>)>(
        r#"
        SELECT id, legacy_ref
        FROM role_applications
        WHERE user_id = $1 AND kind = 'provider_onboarding'
        ORDER BY updated_at DESC
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    let Some((ra_id, legacy_ref)) = row else {
        return Ok(None);
    };
    let legacy_app_id = legacy_ref
        .0
        .get("provider_application_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let codes_json = Json(serde_json::to_value(rejection_codes).unwrap_or_else(|_| json!([])));
    let decided_at = if matches!(app_status, "approved" | "rejected") {
        Some(updated_at)
    } else {
        None
    };
    let meta_patch = Json(json!({
        "admin_review": true,
        "last_review_status": status,
        "lifecycle_state": lifecycle,
    }));

    let n = sqlx::query(
        r#"
        UPDATE role_applications
        SET status = $2,
            rejection_codes = $3,
            rejection_message = $4,
            metadata = COALESCE(metadata, '{}'::jsonb) || $5::jsonb,
            decided_at = COALESCE($6, decided_at),
            updated_at = $7
        WHERE id = $1
        "#,
    )
    .bind(ra_id)
    .bind(app_status)
    .bind(codes_json)
    .bind(rejection_message)
    .bind(meta_patch)
    .bind(decided_at)
    .bind(updated_at)
    .execute(pool)
    .await?
    .rows_affected();

    if n == 0 {
        return Ok(None);
    }
    Ok(Some((ra_id, legacy_app_id)))
}
