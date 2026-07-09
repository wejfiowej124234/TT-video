//! PCP · Governed Public View for `community_posts` (FeedBuilder read path).
//!
//! SQL view: `governed_community_posts_v1` (migration `20260704100000`).
//! Moderation (`visibility_status`, penalties) is applied in feed queries separately.

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

use super::public_operations_display_admin::{
    entity_visible_in_public_schedule, entity_visible_on_public_surface,
};

/// FeedBuilder surface id (PCP SSOT).
pub const FEED_BUILDER_SURFACE: &str = "community_feed";

/// PostgreSQL view name for governed public reads.
pub const GOVERNED_VIEW: &str = "governed_community_posts_v1";

/// Table alias used in feed SQL (`FROM governed_community_posts_v1 p`).
pub const GOVERNED_FROM: &str = "governed_community_posts_v1 p";

/// Public catalog read surfaces that must use [`GOVERNED_VIEW`] (Phase 0.5 compliance).
pub const PUBLIC_CATALOG_SURFACES: &[&str] = &[
    "community_feed",
    "community_post_detail",
    "community_user_profile_timeline",
    "community_explore_destinations",
    "community_posts_by_tag_stats",
];

/// Organic UGC: production origin + public moderation → governance published on create.
pub fn display_status_for_new_post(data_origin: &str) -> &'static str {
    if data_origin == "production" {
        "published"
    } else {
        "draft"
    }
}

/// Public post detail: governed view only (PCP · excludes non-published governance rows).
pub async fn get_governed_public_post_by_id(
    pool: &PgPool,
    post_id: Uuid,
) -> Result<Option<super::community::PostRow>, sqlx::Error> {
    use super::community::{post_row_from_sql, PostSqlRow};
    let row = sqlx::query_as::<_, PostSqlRow>(
        &format!(
            "SELECT id, user_id, body, post_type, destination, COALESCE(tags, '{{}}'), COALESCE(media_urls, '{{}}'), cover_url, primary_media_asset_id, visibility_status, created_at FROM {GOVERNED_VIEW} WHERE id = $1",
        ),
    )
    .bind(post_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.as_ref().map(post_row_from_sql))
}

/// Rust-side governance check (post detail · mirrors view rules).
pub fn row_passes_governance_for_surface(
    display_status: &str,
    display_surfaces: &[String],
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
    surface: &str,
    now: DateTime<Utc>,
) -> bool {
    display_status == "published"
        && entity_visible_on_public_surface(display_surfaces, surface)
        && entity_visible_in_public_schedule(display_start_at, display_end_at, now)
}

pub async fn post_passes_governance_for_community_feed(
    pool: &PgPool,
    post_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let row: Option<(String, Vec<String>, Option<DateTime<Utc>>, Option<DateTime<Utc>>)> =
        sqlx::query_as(
            r#"SELECT display_status, COALESCE(display_surfaces, '{}'), display_start_at, display_end_at
               FROM community_posts WHERE id = $1"#,
        )
        .bind(post_id)
        .fetch_optional(pool)
        .await?;
    Ok(row.is_some_and(|(status, surfaces, start, end)| {
        row_passes_governance_for_surface(
            &status,
            &surfaces,
            start,
            end,
            FEED_BUILDER_SURFACE,
            Utc::now(),
        )
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn production_origin_publishes_on_create() {
        assert_eq!(display_status_for_new_post("production"), "published");
        assert_eq!(display_status_for_new_post("test"), "draft");
    }

    #[test]
    fn governance_surface_and_schedule() {
        assert!(row_passes_governance_for_surface(
            "published",
            &[],
            None,
            None,
            FEED_BUILDER_SURFACE,
            Utc::now(),
        ));
        assert!(!row_passes_governance_for_surface(
            "draft",
            &[],
            None,
            None,
            FEED_BUILDER_SURFACE,
            Utc::now(),
        ));
    }
}
