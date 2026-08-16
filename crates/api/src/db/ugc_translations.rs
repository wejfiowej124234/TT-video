//! `ugc_translations` 缓存 + 按 `content_class` 读 UGC 原文（非 Catalog CMS）。

use sqlx::postgres::PgPool;
use uuid::Uuid;

use crate::ugc_translate::{
    CachedRow, CONTENT_CLASS_ACQUISITION_LISTING, CONTENT_CLASS_COMMUNITY_COMMENT,
    CONTENT_CLASS_COMMUNITY_POST, CONTENT_CLASS_GUIDE, CONTENT_CLASS_ITINERARY,
    CONTENT_CLASS_MERCHANT_LISTING,
};

#[derive(Debug)]
pub enum UgcSourceError {
    NotFound,
    FieldNotText,
    Db(sqlx::Error),
}

impl From<sqlx::Error> for UgcSourceError {
    fn from(e: sqlx::Error) -> Self {
        UgcSourceError::Db(e)
    }
}

pub async fn get_ugc_source_text(
    pool: &PgPool,
    content_class: &str,
    content_id: Uuid,
    field: &str,
) -> Result<String, UgcSourceError> {
    match content_class {
        CONTENT_CLASS_COMMUNITY_POST if field == "body" => {
            let row: Option<(String,)> =
                sqlx::query_as("SELECT body FROM community_posts WHERE id = $1")
                    .bind(content_id)
                    .fetch_optional(pool)
                    .await?;
            row.map(|r| r.0).ok_or(UgcSourceError::NotFound)
        }
        CONTENT_CLASS_COMMUNITY_COMMENT if field == "body" => {
            let row: Option<(String,)> =
                sqlx::query_as("SELECT body FROM community_comments WHERE id = $1")
                    .bind(content_id)
                    .fetch_optional(pool)
                    .await?;
            row.map(|r| r.0).ok_or(UgcSourceError::NotFound)
        }
        CONTENT_CLASS_GUIDE if field == "bio" => {
            let row: Option<(Option<String>,)> =
                sqlx::query_as("SELECT bio FROM guides WHERE id = $1")
                    .bind(content_id)
                    .fetch_optional(pool)
                    .await?;
            match row {
                None => Err(UgcSourceError::NotFound),
                Some((Some(s),)) => Ok(s),
                Some((None,)) => Ok(String::new()),
            }
        }
        CONTENT_CLASS_GUIDE if field == "public_title" => {
            let row: Option<(Option<String>,)> =
                sqlx::query_as("SELECT public_title FROM guides WHERE id = $1")
                    .bind(content_id)
                    .fetch_optional(pool)
                    .await?;
            match row {
                None => Err(UgcSourceError::NotFound),
                Some((Some(s),)) => Ok(s),
                Some((None,)) => Ok(String::new()),
            }
        }
        CONTENT_CLASS_MERCHANT_LISTING | CONTENT_CLASS_ACQUISITION_LISTING => {
            let variant = if content_class == CONTENT_CLASS_MERCHANT_LISTING {
                "provider"
            } else {
                "acquisition"
            };
            let row: Option<(serde_json::Value,)> = sqlx::query_as(
                r#"SELECT payload FROM market_listings
                   WHERE id = $1 AND variant = $2 AND status = 'published'"#,
            )
            .bind(content_id)
            .bind(variant)
            .fetch_optional(pool)
            .await?;
            let payload = row.map(|r| r.0).ok_or(UgcSourceError::NotFound)?;
            match payload.get(field) {
                Some(serde_json::Value::String(s)) => Ok(s.clone()),
                Some(_) => Err(UgcSourceError::FieldNotText),
                None => Err(UgcSourceError::NotFound),
            }
        }
        CONTENT_CLASS_ITINERARY if field == "days_json" => {
            let row: Option<(String,)> = sqlx::query_as(
                "SELECT days_json::text FROM itineraries WHERE id = $1 OR order_id = $1 LIMIT 1",
            )
            .bind(content_id)
            .fetch_optional(pool)
            .await?;
            row.map(|r| r.0).ok_or(UgcSourceError::NotFound)
        }
        CONTENT_CLASS_ITINERARY if field == "teaser" => {
            let row: Option<(serde_json::Value,)> = sqlx::query_as(
                "SELECT days_json FROM itineraries WHERE id = $1 OR order_id = $1 LIMIT 1",
            )
            .bind(content_id)
            .fetch_optional(pool)
            .await?;
            let days = row.map(|r| r.0).ok_or(UgcSourceError::NotFound)?;
            Ok(extract_itinerary_teaser(&days))
        }
        _ => Err(UgcSourceError::NotFound),
    }
}

/// 市场行程卡摘要：取首日 `description` 或 `content_text`（与列表 teaser 同源）。
pub(crate) fn extract_itinerary_teaser(days: &serde_json::Value) -> String {
    let arr = match days {
        serde_json::Value::Array(a) => a.clone(),
        serde_json::Value::String(s) => match serde_json::from_str::<serde_json::Value>(s) {
            Ok(serde_json::Value::Array(a)) => a,
            _ => return String::new(),
        },
        _ => return String::new(),
    };
    for day in &arr {
        for key in ["description", "content_text"] {
            if let Some(s) = day.get(key).and_then(|v| v.as_str()) {
                let t = s.trim();
                if !t.is_empty() {
                    return t.to_string();
                }
            }
        }
    }
    String::new()
}

pub async fn get_ugc_translation_cache(
    pool: &PgPool,
    content_class: &str,
    content_id: Uuid,
    field: &str,
    source_hash: &str,
    target_locale: &str,
) -> Result<Option<CachedRow>, sqlx::Error> {
    sqlx::query_as::<_, (String, String, String, String)>(
        r#"SELECT source_hash, source_locale, translated_text, provider
           FROM ugc_translations
           WHERE content_class = $1 AND content_id = $2 AND field = $3
             AND source_hash = $4 AND target_locale = $5"#,
    )
    .bind(content_class)
    .bind(content_id)
    .bind(field)
    .bind(source_hash)
    .bind(target_locale)
    .fetch_optional(pool)
    .await
    .map(|row| {
        row.map(|(source_hash, source_locale, translated_text, provider)| CachedRow {
            source_hash,
            source_locale,
            translated_text,
            provider,
        })
    })
}

#[allow(clippy::too_many_arguments)]
pub async fn insert_ugc_translation_cache(
    pool: &PgPool,
    content_class: &str,
    content_id: Uuid,
    field: &str,
    source_hash: &str,
    source_locale: &str,
    target_locale: &str,
    translated_text: &str,
    provider: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO ugc_translations (
               content_class, content_id, field, source_hash, source_locale,
               target_locale, translated_text, provider
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (content_class, content_id, field, source_hash, target_locale)
           DO NOTHING"#,
    )
    .bind(content_class)
    .bind(content_id)
    .bind(field)
    .bind(source_hash)
    .bind(source_locale)
    .bind(target_locale)
    .bind(translated_text)
    .bind(provider)
    .execute(pool)
    .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::extract_itinerary_teaser;
    use serde_json::json;

    #[test]
    fn extract_itinerary_teaser_prefers_description() {
        let days = json!([
            { "day_index": 1, "description": "  故宫半日  ", "content_text": "ignored" },
            { "day_index": 2, "content_text": "颐和园" }
        ]);
        assert_eq!(extract_itinerary_teaser(&days), "故宫半日");
    }

    #[test]
    fn extract_itinerary_teaser_falls_back_to_content_text() {
        let days = json!([{ "day_index": 1, "content_text": "首日步行" }]);
        assert_eq!(extract_itinerary_teaser(&days), "首日步行");
    }
}
