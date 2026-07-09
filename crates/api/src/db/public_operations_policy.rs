//! Public Operations · singleton policy (SSOT-PUB-OPS O9).

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

pub const PUBLIC_OPS_POLICY_HISTORY_ENTITY_ID: Uuid = Uuid::from_bytes([
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
]);

pub const PUBLIC_OPS_POLICY_ORIGINS: &[&str] =
    &["REAL", "OFFICIAL", "SHOWCASE", "TEST", "SMOKE", "SYSTEM"];

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PublicOpsPolicyRow {
    pub show_test_data: bool,
    pub blocked_origins: Vec<String>,
    pub updated_at: DateTime<Utc>,
    pub updated_by: Option<Uuid>,
}

impl Default for PublicOpsPolicyRow {
    fn default() -> Self {
        Self {
            show_test_data: false,
            blocked_origins: vec!["SMOKE".into()],
            updated_at: Utc::now(),
            updated_by: None,
        }
    }
}

#[derive(Debug, Clone, Default, serde::Deserialize)]
pub struct PublicOpsPolicyPatch {
    pub show_test_data: Option<bool>,
    pub blocked_origins: Option<Vec<String>>,
}

pub fn normalize_public_ops_blocked_origins(origins: &[String]) -> Vec<String> {
    let mut out: Vec<String> = origins
        .iter()
        .map(|s| s.trim().to_uppercase())
        .filter(|s| {
            !s.is_empty()
                && PUBLIC_OPS_POLICY_ORIGINS
                    .iter()
                    .any(|allowed| allowed.eq_ignore_ascii_case(s))
        })
        .collect();
    out.sort();
    out.dedup();
    out
}

pub fn entity_visible_by_display_origin_policy(
    display_origin: &str,
    policy: &PublicOpsPolicyRow,
) -> bool {
    let origin = display_origin.trim().to_uppercase();
    if origin.is_empty() {
        return true;
    }
    if policy
        .blocked_origins
        .iter()
        .any(|b| b.eq_ignore_ascii_case(&origin))
    {
        return false;
    }
    if origin == "TEST" && !policy.show_test_data {
        return false;
    }
    true
}

pub async fn get_public_ops_policy(pool: &PgPool) -> PublicOpsPolicyRow {
    let row = sqlx::query_as::<_, (bool, Vec<String>, DateTime<Utc>, Option<Uuid>)>(
        r#"SELECT show_test_data, blocked_origins, updated_at, updated_by
           FROM ops_public_operations_policy WHERE id = 1"#,
    )
    .fetch_optional(pool)
    .await;

    match row {
        Ok(Some((show_test_data, blocked_origins, updated_at, updated_by))) => PublicOpsPolicyRow {
            show_test_data,
            blocked_origins: normalize_public_ops_blocked_origins(&blocked_origins),
            updated_at,
            updated_by,
        },
        _ => PublicOpsPolicyRow::default(),
    }
}

pub fn apply_public_ops_policy_patch(
    before: PublicOpsPolicyRow,
    patch: &PublicOpsPolicyPatch,
) -> PublicOpsPolicyRow {
    PublicOpsPolicyRow {
        show_test_data: patch.show_test_data.unwrap_or(before.show_test_data),
        blocked_origins: patch
            .blocked_origins
            .as_ref()
            .map(|v| normalize_public_ops_blocked_origins(v))
            .unwrap_or(before.blocked_origins),
        updated_at: before.updated_at,
        updated_by: before.updated_by,
    }
}

pub fn validate_public_ops_policy_row(row: &PublicOpsPolicyRow) -> Result<(), &'static str> {
    for origin in &row.blocked_origins {
        if !PUBLIC_OPS_POLICY_ORIGINS
            .iter()
            .any(|allowed| allowed.eq_ignore_ascii_case(origin))
        {
            return Err("invalid_blocked_origin");
        }
    }
    Ok(())
}

pub async fn save_public_ops_policy(
    pool: &PgPool,
    actor_id: Uuid,
    row: &PublicOpsPolicyRow,
) -> Result<PublicOpsPolicyRow, sqlx::Error> {
    sqlx::query_as::<_, (bool, Vec<String>, DateTime<Utc>, Option<Uuid>)>(
        r#"UPDATE ops_public_operations_policy
           SET show_test_data = $1,
               blocked_origins = $2,
               updated_at = now(),
               updated_by = $3
           WHERE id = 1
           RETURNING show_test_data, blocked_origins, updated_at, updated_by"#,
    )
    .bind(row.show_test_data)
    .bind(&row.blocked_origins)
    .bind(actor_id)
    .fetch_one(pool)
    .await
    .map(|(show_test_data, blocked_origins, updated_at, updated_by)| PublicOpsPolicyRow {
        show_test_data,
        blocked_origins: normalize_public_ops_blocked_origins(&blocked_origins),
        updated_at,
        updated_by,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_policy_blocks_smoke_not_test_without_flag() {
        let p = PublicOpsPolicyRow::default();
        assert!(!entity_visible_by_display_origin_policy("SMOKE", &p));
        assert!(!entity_visible_by_display_origin_policy("TEST", &p));
        assert!(entity_visible_by_display_origin_policy("REAL", &p));
    }

    #[test]
    fn show_test_data_allows_test_origin() {
        let p = PublicOpsPolicyRow {
            show_test_data: true,
            ..PublicOpsPolicyRow::default()
        };
        assert!(entity_visible_by_display_origin_policy("TEST", &p));
    }
}
