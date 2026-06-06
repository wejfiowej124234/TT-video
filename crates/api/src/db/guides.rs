//! guides 表：插入、列表（48 §6.3）

use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// 插入向导（向导注册时双写）
pub async fn insert_guide(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    city: &str,
    country_code: &str,
    languages: &[String],
    service_types: &[String],
    bio: Option<&str>,
    wallet_address: Option<&str>,
    real_name: Option<&str>,
    passport_number_hash: Option<&str>,
    id_photo_url: Option<&str>,
    language_cert_url: Option<&str>,
    guide_license_url: Option<&str>,
    stake_amount: &str,
    status: &str,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    insert_guide_with_data_origin(
        pool,
        id,
        user_id,
        city,
        country_code,
        languages,
        service_types,
        bio,
        wallet_address,
        real_name,
        passport_number_hash,
        id_photo_url,
        language_cert_url,
        guide_license_url,
        stake_amount,
        status,
        created_at,
        updated_at,
        "production",
    )
    .await
}

pub async fn insert_guide_with_data_origin(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    city: &str,
    country_code: &str,
    languages: &[String],
    service_types: &[String],
    bio: Option<&str>,
    wallet_address: Option<&str>,
    real_name: Option<&str>,
    passport_number_hash: Option<&str>,
    id_photo_url: Option<&str>,
    language_cert_url: Option<&str>,
    guide_license_url: Option<&str>,
    stake_amount: &str,
    status: &str,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    data_origin: &str,
) -> Result<(), sqlx::Error> {
    let languages_norm =
        crate::chain_off::market_guide_filter::normalize_languages_for_storage(languages);
    let service_types_norm =
        crate::chain_off::market_guide_filter::normalize_service_types_for_storage(service_types);
    let lang_json =
        serde_json::to_value(&languages_norm).unwrap_or_else(|_| JsonValue::Array(vec![]));
    let svc_json =
        serde_json::to_value(&service_types_norm).unwrap_or_else(|_| JsonValue::Array(vec![]));
    sqlx::query(
        r#"
        INSERT INTO guides (id, user_id, city, country_code, languages, service_types, bio, wallet_address, real_name, passport_number_hash, id_photo_url, language_cert_url, guide_license_url, stake_amount, status, created_at, updated_at, data_origin)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(city)
    .bind(country_code)
    .bind(&lang_json)
    .bind(&svc_json)
    .bind(bio)
    .bind(wallet_address)
    .bind(real_name)
    .bind(passport_number_hash)
    .bind(id_photo_url)
    .bind(language_cert_url)
    .bind(guide_license_url)
    .bind(stake_amount)
    .bind(status)
    .bind(created_at)
    .bind(updated_at)
    .bind(data_origin)
    .execute(pool)
    .await?;
    Ok(())
}

/// 更新向导资质审核状态与拒绝信息（Admin PATCH；有 DB 时双写）
pub async fn update_guide_registration_review(
    pool: &PgPool,
    id: Uuid,
    status: &str,
    rejection_codes: &[String],
    rejection_message: Option<&str>,
    updated_at: DateTime<Utc>,
) -> Result<u64, sqlx::Error> {
    let codes_json = serde_json::to_value(rejection_codes).unwrap_or_else(|_| JsonValue::Array(vec![]));
    let r = sqlx::query(
        r#"
        UPDATE guides
        SET status = $1, rejection_codes = $2, rejection_message = $3, updated_at = $4
        WHERE id = $5
        "#,
    )
    .bind(status)
    .bind(&codes_json)
    .bind(rejection_message)
    .bind(updated_at)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}

/// 向导行（与 chain_off::GuideRow 对齐，用于 hydrate）
#[derive(Debug)]
pub struct GuideRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub city: String,
    pub country_code: String,
    pub languages: Vec<String>,
    pub service_types: Vec<String>,
    pub bio: Option<String>,
    pub wallet_address: Option<String>,
    pub real_name: Option<String>,
    pub passport_number_hash: Option<String>,
    pub id_photo_url: Option<String>,
    pub language_cert_url: Option<String>,
    pub guide_license_url: Option<String>,
    pub stake_amount: String,
    pub status: String,
    pub rejection_codes: Vec<String>,
    pub rejection_message: Option<String>,
    pub data_origin: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 加载所有向导（启动 hydrate）
pub async fn list_guides(pool: &PgPool) -> Result<Vec<GuideRow>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        user_id: Uuid,
        city: String,
        country_code: String,
        languages: JsonValue,
        service_types: JsonValue,
        bio: Option<String>,
        wallet_address: Option<String>,
        real_name: Option<String>,
        passport_number_hash: Option<String>,
        id_photo_url: Option<String>,
        language_cert_url: Option<String>,
        guide_license_url: Option<String>,
        stake_amount: String,
        status: String,
        rejection_codes: JsonValue,
        rejection_message: Option<String>,
        data_origin: String,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
    }
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, user_id, city, country_code, languages, service_types, bio, wallet_address, real_name, passport_number_hash, id_photo_url, language_cert_url, guide_license_url, stake_amount, status, rejection_codes, rejection_message, data_origin, created_at, updated_at FROM guides",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|r| {
            let languages = serde_json::from_value(r.languages).unwrap_or_default();
            let service_types = serde_json::from_value(r.service_types).unwrap_or_default();
            let rejection_codes = serde_json::from_value(r.rejection_codes).unwrap_or_default();
            GuideRow {
                id: r.id,
                user_id: r.user_id,
                city: r.city,
                country_code: r.country_code,
                languages,
                service_types,
                bio: r.bio,
                wallet_address: r.wallet_address,
                real_name: r.real_name,
                passport_number_hash: r.passport_number_hash,
                id_photo_url: r.id_photo_url,
                language_cert_url: r.language_cert_url,
                guide_license_url: r.guide_license_url,
                stake_amount: r.stake_amount,
                status: r.status,
                rejection_codes,
                rejection_message: r.rejection_message,
                data_origin: r.data_origin,
                created_at: r.created_at,
                updated_at: r.updated_at,
            }
        })
        .collect())
}

pub async fn select_guide_by_id(pool: &PgPool, id: Uuid) -> Result<Option<GuideRow>, sqlx::Error> {
    let rows = list_guides(pool).await?;
    Ok(rows.into_iter().find(|g| g.id == id))
}

pub async fn select_active_guide_id_for_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    let id: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM guides WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(id)
}
