//! 行类型：`community_reports` / `community_report_appeals` / `community_ranking_snapshots`

use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CommunityReportRow {
    pub id: Uuid,
    pub reporter_id: Uuid,
    pub target_type: String,
    pub target_id: Uuid,
    pub reason_code: String,
    pub details: Option<String>,
    pub evidence_ref: Option<String>,
    pub status: String,
    pub version: i32,
    pub admin_notes: Option<String>,
    pub disposition: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CommunityReportAppealRow {
    pub id: Uuid,
    pub report_id: Uuid,
    pub appellant_id: Uuid,
    pub body: String,
    pub status: String,
    pub reviewer_note: Option<String>,
    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CommunityRankingSnapshotRow {
    pub id: Uuid,
    pub feed_mode: String,
    pub item_count: i32,
    pub top_post_ids: Vec<Uuid>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}
