//! Community ranking snapshot, scheduler, feedback (internal).
use axum::extract::{Path as AxumPath, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::common;

#[derive(Debug, Deserialize)]
pub struct InternalCommunityRankingSnapshotBody {
    #[serde(default = "default_internal_ranking_feed_mode")]
    pub feed_mode: String,
    pub limit: Option<i64>,
    #[serde(default)]
    pub notes: Option<String>,
}

fn default_internal_ranking_feed_mode() -> String {
    "latest".to_string()
}

const DEFAULT_COMMUNITY_RANKING_SNAPSHOT_LIMIT: i64 = 30;

async fn execute_community_ranking_snapshot_core(
    pool: &sqlx::PgPool,
    mode: &str,
    limit: i64,
    notes: Option<&str>,
) -> Result<(Uuid, &'static str, i32, Vec<Uuid>), String> {
    let lim = limit.clamp(1, 100);
    let mode_lc = mode.trim().to_lowercase();
    let (posts, feed_mode_stored) = match mode_lc.as_str() {
        "hot" => {
            let (p, _) = db::list_feed_hot(pool, None, lim, None, false)
                .await
                .map_err(|_| "list_feed_hot failed".to_string())?;
            (p, "hot")
        }
        "recommend" => {
            let (p, _) = db::list_feed(pool, None, lim, None, false, None)
                .await
                .map_err(|_| "list_feed failed".to_string())?;
            (p, "recommend")
        }
        "latest" => {
            let (p, _) = db::list_feed(pool, None, lim, None, false, None)
                .await
                .map_err(|_| "list_feed failed".to_string())?;
            (p, "latest")
        }
        _ => return Err("invalid_feed_mode".to_string()),
    };
    let ids: Vec<Uuid> = posts.iter().map(|p| p.id).collect();
    let item_count = ids.len() as i32;
    let snap_id =
        db::insert_community_ranking_snapshot(pool, feed_mode_stored, item_count, &ids, notes)
            .await
            .map_err(|_| "snapshot insert failed".to_string())?;
    Ok((snap_id, feed_mode_stored, item_count, ids))
}

fn community_ranking_scheduler_limit_from_env() -> i64 {
    std::env::var("COMMUNITY_RANKING_SNAPSHOT_LIMIT")
        .ok()
        .and_then(|s| s.trim().parse::<i64>().ok())
        .unwrap_or(DEFAULT_COMMUNITY_RANKING_SNAPSHOT_LIMIT)
        .clamp(1, 100)
}

fn is_allowed_internal_scheduler_trigger(s: &str) -> bool {
    matches!(s, "cron" | "system")
}

fn normalize_community_ranking_scheduler_job_code(s: &str) -> Option<&'static str> {
    match s.trim() {
        "community.ranking.snapshot.latest" => Some("community.ranking.snapshot.latest"),
        "community.ranking.snapshot.hot" => Some("community.ranking.snapshot.hot"),
        "community.ranking.snapshot.recommend" => Some("community.ranking.snapshot.recommend"),
        "community.ranking.snapshot.all" => Some("community.ranking.snapshot.all"),
        _ => None,
    }
}

/// POST /api/v1/internal/community/ranking/snapshot（160：抓取当前 Feed 顶条写入 `community_ranking_snapshots`）
pub async fn post_internal_community_ranking_snapshot(
    State(state): State<ApiMetaState>,
    Json(body): Json<InternalCommunityRankingSnapshotBody>,
) -> impl IntoResponse {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                common::json_internal_db_unavailable_error(),
            )
                .into_response();
        }
    };
    let mode = body.feed_mode.trim().to_lowercase();
    let limit = body.limit.unwrap_or(30).clamp(1, 100);
    let notes = body
        .notes
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let mode_key = match mode.as_str() {
        "hot" => "hot",
        "recommend" => "recommend",
        "latest" => "latest",
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_feed_mode", "message": "invalid_feed_mode"})),
            )
                .into_response();
        }
    };
    let (snap_id, feed_mode_stored, item_count, ids) =
        match execute_community_ranking_snapshot_core(pool, mode_key, limit, notes).await {
            Ok(v) => v,
            Err(msg) => {
                let status = if msg == "invalid_feed_mode" {
                    StatusCode::BAD_REQUEST
                } else {
                    StatusCode::INTERNAL_SERVER_ERROR
                };
                return (
                    status,
                    Json(json!({"status": "error", "error": msg.clone(), "message": msg})),
                )
                    .into_response();
            }
        };
    let top_ids: Vec<String> = ids.iter().map(|u| u.to_string()).collect();
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "id": snap_id.to_string(),
            "feed_mode": feed_mode_stored,
            "item_count": item_count,
            "top_post_ids": top_ids,
        })),
    )
        .into_response()
}

#[derive(Debug, Deserialize)]
pub struct InternalSchedulerEnqueueBody {
    pub job_code: String,
    #[serde(default = "default_internal_scheduler_enqueue_trigger")]
    pub trigger_source: String,
}

fn default_internal_scheduler_enqueue_trigger() -> String {
    "cron".to_string()
}

/// POST /api/v1/internal/scheduler/enqueue（260/421：入队社区排序快照等任务；须内网）
pub async fn post_internal_scheduler_enqueue(
    State(state): State<ApiMetaState>,
    Json(body): Json<InternalSchedulerEnqueueBody>,
) -> impl IntoResponse {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                common::json_internal_db_unavailable_error(),
            )
                .into_response();
        }
    };
    let trig = body.trigger_source.trim();
    if !is_allowed_internal_scheduler_trigger(trig) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_trigger_source", "message": "invalid_trigger_source"})),
        )
            .into_response();
    }
    let code = match normalize_community_ranking_scheduler_job_code(body.job_code.trim()) {
        Some(c) => c,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_job_code",
                    "message": "invalid_job_code",
                    "hint": "community.ranking.snapshot.latest|hot|recommend|all"
                })),
            )
                .into_response();
        }
    };
    let row = match db::insert_scheduler_job_queued(pool, code, trig).await {
        Ok(r) => r,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"status": "error", "error": "scheduler_enqueue_failed", "message": "scheduler_enqueue_failed"})),
            )
                .into_response();
        }
    };
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "job_run_id": row.id.to_string(),
            "job_code": row.job_code,
            "trigger_source": row.trigger_source,
        })),
    )
        .into_response()
}

fn snapshot_json_one(
    id: Uuid,
    feed_mode: &str,
    item_count: i32,
    ids: &[Uuid],
) -> serde_json::Value {
    json!({
        "snapshot_id": id.to_string(),
        "feed_mode": feed_mode,
        "item_count": item_count,
        "top_post_ids": ids.iter().map(|u| u.to_string()).collect::<Vec<_>>(),
    })
}

/// POST /api/v1/internal/scheduler/run-next（260/421：消费一条 `queued` 调度；当前实现 **160** 社区排序快照类 `job_code`）
pub async fn post_internal_scheduler_run_next(
    State(state): State<ApiMetaState>,
) -> impl IntoResponse {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                common::json_internal_db_unavailable_error(),
            )
                .into_response();
        }
    };
    let run = match db::claim_next_queued_scheduler_job_run(pool).await {
        Ok(Some(r)) => r,
        Ok(None) => {
            return (
                StatusCode::OK,
                Json(json!({"status": "ok", "processed": 0, "message": "queue_empty"})),
            )
                .into_response();
        }
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"status": "error", "error": "scheduler_claim_failed", "message": "scheduler_claim_failed"})),
            )
                .into_response();
        }
    };
    let run_id = run.id;
    let job_code = run.job_code.clone();
    let limit = community_ranking_scheduler_limit_from_env();

    let outcome: Result<serde_json::Value, String> = async {
        match job_code.trim() {
            "community.ranking.snapshot.latest" => {
                let (id, fm, n, ids) = execute_community_ranking_snapshot_core(
                    pool,
                    "latest",
                    limit,
                    Some("scheduler community.ranking.snapshot.latest"),
                )
                .await?;
                Ok(snapshot_json_one(id, fm, n, &ids))
            }
            "community.ranking.snapshot.hot" => {
                let (id, fm, n, ids) = execute_community_ranking_snapshot_core(
                    pool,
                    "hot",
                    limit,
                    Some("scheduler community.ranking.snapshot.hot"),
                )
                .await?;
                Ok(snapshot_json_one(id, fm, n, &ids))
            }
            "community.ranking.snapshot.recommend" => {
                let (id, fm, n, ids) = execute_community_ranking_snapshot_core(
                    pool,
                    "recommend",
                    limit,
                    Some("scheduler community.ranking.snapshot.recommend"),
                )
                .await?;
                Ok(snapshot_json_one(id, fm, n, &ids))
            }
            "community.ranking.snapshot.all" => {
                let mut arr = Vec::new();
                for m in ["latest", "hot", "recommend"] {
                    let (id, fm, n, ids) = execute_community_ranking_snapshot_core(
                        pool,
                        m,
                        limit,
                        Some("scheduler community.ranking.snapshot.all"),
                    )
                    .await?;
                    arr.push(snapshot_json_one(id, fm, n, &ids));
                }
                Ok(json!({ "snapshots": arr }))
            }
            _ => Err("unknown_job_code".to_string()),
        }
    }
    .await;

    match outcome {
        Ok(result) => {
            let _ = db::complete_scheduler_job_run(pool, run_id, true, None).await;
            (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "processed": 1,
                    "job_run_id": run_id.to_string(),
                    "job_code": job_code,
                    "result": result,
                })),
            )
                .into_response()
        }
        Err(e) => {
            let _ = db::complete_scheduler_job_run(pool, run_id, false, Some(&e)).await;
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": e.clone(),
                    "processed": 1,
                    "job_run_id": run_id.to_string(),
                    "job_code": job_code,
                    "message": e,
                })),
            )
                .into_response()
        }
    }
}

/// PATCH /api/v1/internal/community/feedback/:id — G4 官方回复/状态（仅内网；产品定稿后可扩展公网权限）
pub async fn patch_feedback_official_reply(
    State(state): State<ApiMetaState>,
    AxumPath(id): AxumPath<String>,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let feedback_id = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_id", "message": "invalid_id"})),
            )
                .into_response();
        }
    };
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})),
            )
                .into_response();
        }
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let official_reply = j.get("official_reply").and_then(|v| v.as_str());
    let status = j.get("status").and_then(|v| v.as_str());
    if official_reply.is_none() && status.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "official_reply_or_status_required", "message": "official_reply_or_status_required"})),
        )
            .into_response();
    }
    match db::update_feedback_official_reply_and_status(
        pool,
        feedback_id,
        official_reply,
        status,
    )
    .await
    {
        Ok(true) => (
            StatusCode::OK,
            Json(json!({"status": "ok", "id": id})),
        )
            .into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "not_found_or_no_change", "message": "not_found_or_no_change"})),
        )
            .into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"status": "error", "error": "update_failed", "message": "update_failed"})),
        )
            .into_response(),
    }
}
