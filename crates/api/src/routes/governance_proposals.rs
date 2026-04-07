//! B-072：`GET /governance/proposals/:id` + `POST …/vote` 链下 MVP（内存票仓；与 04 §三 登记一致）。
//! **B-092**：计票为 **权重 Σ**（`delegation_units_v1`：投票当刻 `1+直接委托者数`，冻结存票）；已委托他人者 **不可** 直投。
//! 重复提交：同 **`vote`** → **200** **`idempotent: true`**；不同 **`vote`** → **409** **`already_voted`**。
//! **B-089 Completion**：**`GOVERNOR_ADDRESS` + `DATABASE_URL`** 时列表/详情走 **`governance_proposals_projection`** + **`eth_call`** **`state` / `getPastVotes`**；**`POST …/vote`** 返回 **`vote_on_chain_required`**（**禁止**链下假票）。

use axum::extract::{Path, State};
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use std::collections::HashMap;
use std::sync::{Arc, OnceLock};
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::chain;
use crate::db::{self, get_user_default_wallet_by_id};
use crate::routes::governance_delegation_store::{delegate_store, is_delegating_away, voter_weight_units_now};
use crate::state::{extract_user_with_session_check, ApiMetaState};

const IMPL_HEADER: &str = "x-implementation-status";
const IMPL_VALUE: &str = "chain_off_mvp";
const IMPL_GOVERNOR: &str = "chain_governor_indexed";

fn mvp_headered(mut res: axum::response::Response) -> axum::response::Response {
    res.headers_mut().insert(
        HeaderName::from_static(IMPL_HEADER),
        HeaderValue::from_static(IMPL_VALUE),
    );
    res
}

fn governor_headered(mut res: axum::response::Response) -> axum::response::Response {
    res.headers_mut().insert(
        HeaderName::from_static(IMPL_HEADER),
        HeaderValue::from_static(IMPL_GOVERNOR),
    );
    res
}

/// **`GOVERNOR_ADDRESS` 非空 + DB pool** 时启用链上提案索引模式。
fn governor_indexed_mode(state: &ApiMetaState) -> Option<(&chain::ChainConfig, &sqlx::postgres::PgPool)> {
    let cfg = state.chain_config.as_ref()?;
    let g = cfg.governor_address.as_ref()?.trim();
    if g.is_empty() {
        return None;
    }
    let pool = state.chain_off.as_ref()?.db_pool.as_ref()?;
    Some((cfg, pool))
}

fn is_decimal_proposal_id(s: &str) -> bool {
    let t = s.trim();
    !t.is_empty() && t.chars().all(|c| c.is_ascii_digit())
}

#[derive(Clone)]
struct ProposalRecord {
    title: String,
    body: String,
    status: String,
}

#[derive(Clone)]
struct VoteRecord {
    choice: String,
    /// B-092：按 **投票请求当刻** 委托图冻结，后续改委托 **不** 回溯改票。
    weight: u64,
}

struct ProposalsMvpStore {
    proposals: HashMap<Uuid, ProposalRecord>,
    /// (proposal_id, voter_user_id)
    votes: HashMap<(Uuid, Uuid), VoteRecord>,
}

impl ProposalsMvpStore {
    fn seeded() -> Self {
        let mut proposals = HashMap::new();
        let id1 = Uuid::parse_str("00000000-0000-4000-8000-000000000001").expect("demo id1");
        let id2 = Uuid::parse_str("00000000-0000-4000-8000-000000000002").expect("demo id2");
        proposals.insert(
            id1,
            ProposalRecord {
                title: "TT MVP: FeeRouter parameter calibration".to_string(),
                body: "Chain-off governance demo proposal. Vote to signal support for aligning protocol-reference snapshots with runtime GET /meta (B-072 MVP)."
                    .to_string(),
                status: "active".to_string(),
            },
        );
        proposals.insert(
            id2,
            ProposalRecord {
                title: "Treasury rotation (placeholder)".to_string(),
                body: "Second demo entry for list/detail navigation and vote isolation tests."
                    .to_string(),
                status: "active".to_string(),
            },
        );
        Self {
            proposals,
            votes: HashMap::new(),
        }
    }

    fn tally(&self, pid: Uuid) -> (u64, u64, u64) {
        let mut yes = 0u64;
        let mut no = 0u64;
        let mut abstain = 0u64;
        for ((p, _), v) in &self.votes {
            if *p != pid {
                continue;
            }
            let w = v.weight;
            match v.choice.as_str() {
                "yes" => yes = yes.saturating_add(w),
                "no" => no = no.saturating_add(w),
                "abstain" => abstain = abstain.saturating_add(w),
                _ => {}
            }
        }
        (yes, no, abstain)
    }
}

static MVP_STORE: OnceLock<Arc<RwLock<ProposalsMvpStore>>> = OnceLock::new();

fn store() -> Arc<RwLock<ProposalsMvpStore>> {
    MVP_STORE
        .get_or_init(|| Arc::new(RwLock::new(ProposalsMvpStore::seeded())))
        .clone()
}

/// GET /api/v1/governance/proposals
pub async fn get_governance_proposals_list(State(state): State<ApiMetaState>) -> impl IntoResponse {
    if let Some((cfg, pool)) = governor_indexed_mode(&state) {
        let chain_id_i64 = (cfg.chain_id.min(i64::MAX as u64)) as i64;
        let rows = match db::list_governance_proposals_for_chain(pool, chain_id_i64, 200).await {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "governance_list_failed", "message": e.to_string()})),
                )
                    .into_response();
            }
        };
        let items: Vec<_> = rows
            .into_iter()
            .map(|r| {
                let st = r
                    .chain_state
                    .unwrap_or_else(|| "pending".to_string());
                json!({
                    "id": r.proposal_id,
                    "title": r.title.unwrap_or_default(),
                    "status": st,
                })
            })
            .collect();
        return governor_headered(
            Json(json!({
                "status": "ok",
                "items": items,
                "data_source": "governance_proposals_projection",
                "chain_id": cfg.chain_id,
                "note": "B-089 Governor events via indexer-tick → DB; status from projection (see GET detail for eth_call state)"
            }))
            .into_response(),
        );
    }

    let arc = store();
    let g = arc.read().await;
    let mut items: Vec<_> = g
        .proposals
        .iter()
        .map(|(id, p)| {
            json!({
                "id": id.to_string(),
                "title": p.title,
                "status": p.status,
            })
        })
        .collect();
    items.sort_by(|a, b| {
        let sa = a["id"].as_str().unwrap_or("");
        let sb = b["id"].as_str().unwrap_or("");
        sa.cmp(sb)
    });
    mvp_headered(
        Json(json!({
            "status": "ok",
            "items": items,
            "data_source": "chain_off_mvp",
            "note": "B-072 in-memory proposals; B-092 weighted tallies (delegation_units_v1); per-process until DB governance_proposals lands"
        }))
        .into_response(),
    )
}

/// GET /api/v1/governance/proposals/:proposal_id
pub async fn get_governance_proposal(
    State(state): State<ApiMetaState>,
    Path(proposal_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let proposal_id = proposal_id.trim().to_string();

    if let Some((cfg, pool)) = governor_indexed_mode(&state) {
        if !is_decimal_proposal_id(&proposal_id) {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_proposal_id", "message": "governor_mode expects decimal proposal id"})),
            )
                .into_response();
        }
        let chain_id_i64 = (cfg.chain_id.min(i64::MAX as u64)) as i64;
        let row = match db::get_governance_proposal_projection(pool, chain_id_i64, &proposal_id).await
        {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "governance_detail_failed", "message": e.to_string()})),
                )
                    .into_response();
            }
        };
        let Some(row) = row else {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "proposal_not_found", "message": "proposal_not_found"})),
            )
                .into_response();
        };

        let gov = cfg.governor_address.as_deref().unwrap_or("").trim();
        let mut chain_state_live: Option<String> = None;
        let mut chain_state_rpc_error: Option<String> = None;
        if !cfg.rpc_url.is_empty() && !gov.is_empty() {
            match chain::governor::eth_call_governor_state(&cfg.rpc_url, gov, &proposal_id).await {
                Ok(u) => chain_state_live = Some(chain::governor::governor_state_label(u).to_string()),
                Err(e) => chain_state_rpc_error = Some(e),
            }
        }

        let viewer = extract_user_with_session_check(&state, &headers).await;
        let mut voting_power_at_snapshot: Option<serde_json::Value> = None;
        if let Some(uid) = viewer {
            if let (Some(tok), Ok(Some(wallet))) = (
                cfg.governance_votes_token_address.as_deref(),
                get_user_default_wallet_by_id(pool, uid).await,
            ) {
                let w = wallet.trim();
                if !w.is_empty() && !cfg.rpc_url.is_empty() {
                    let snap = row.snapshot_block.to_string();
                    match chain::governor::eth_call_get_past_votes(
                        &cfg.rpc_url,
                        tok.trim(),
                        w,
                        &snap,
                    )
                    .await
                    {
                        Ok(v) => {
                            voting_power_at_snapshot = Some(json!({
                                "wallet": w,
                                "snapshot_block": snap,
                                "votes": v,
                                "ssot": "GovernanceVotesToken.getPastVotes"
                            }));
                        }
                        Err(e) => {
                            voting_power_at_snapshot = Some(json!({
                                "wallet": w,
                                "snapshot_block": snap,
                                "read_error": e,
                            }));
                        }
                    }
                }
            }
        }

        let status_display = chain_state_live.clone().or(row.chain_state.clone()).unwrap_or_else(|| "pending".to_string());
        let cast_yes = chain::governor::encode_cast_vote_calldata(&proposal_id, 1).ok();
        let cast_no = chain::governor::encode_cast_vote_calldata(&proposal_id, 0).ok();
        let cast_abstain = chain::governor::encode_cast_vote_calldata(&proposal_id, 2).ok();

        return governor_headered(
            Json(json!({
                "status": "ok",
                "proposal": {
                    "id": row.proposal_id,
                    "title": row.title.clone().unwrap_or_default(),
                    "body": row.title.clone().unwrap_or_default(),
                    "status": status_display,
                    "proposer": row.proposer_hex,
                    "snapshot_block": row.snapshot_block,
                    "vote_start_block": row.vote_start_block,
                    "vote_end_block": row.vote_end_block,
                    "operation_id": row.operation_id_hex,
                },
                "governance_vote": {
                    "kind": "on_chain_governor",
                    "triggers_on_chain_execution": true,
                    "weight_ssot": "GovernanceVotesToken.getPastVotes@snapshot",
                    "anchor": "TT-COMP-B089-GOVERNOR-CHAIN-VOTING-001"
                },
                "vote_counts": { "yes": row.for_votes, "no": row.against_votes, "abstain": row.abstain_votes },
                "chain": {
                    "governor_address": gov,
                    "votes_token_address": cfg.governance_votes_token_address,
                    "state_live": chain_state_live,
                    "state_rpc_error": chain_state_rpc_error,
                    "projection_state": row.chain_state,
                },
                "voting_power_at_snapshot": voting_power_at_snapshot,
                "cast_vote_calldata": {
                    "yes": cast_yes,
                    "no": cast_no,
                    "abstain": cast_abstain,
                    "selector_note": "TravelTrustGovernor.castVote(uint256,uint8)"
                },
                "my_vote": serde_json::Value::Null,
                "my_vote_weight": serde_json::Value::Null,
            }))
            .into_response(),
        );
    }

    let Ok(pid) = Uuid::parse_str(proposal_id.trim()) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_proposal_id", "message": "invalid_proposal_id"})),
        )
            .into_response();
    };
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let arc = store();
    let g = arc.read().await;
    let Some(rec) = g.proposals.get(&pid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "proposal_not_found", "message": "proposal_not_found"})),
        )
            .into_response();
    };
    let (my_vote_json, my_vote_weight_json) =
        match viewer.and_then(|uid| g.votes.get(&(pid, uid)).cloned()) {
            Some(v) => (json!(v.choice), json!(v.weight)),
            None => (serde_json::Value::Null, serde_json::Value::Null),
        };
    let (yes_c, no_c, abstain_c) = g.tally(pid);
    mvp_headered(
        Json(json!({
            "status": "ok",
            "proposal": {
                "id": pid.to_string(),
                "title": rec.title,
                "body": rec.body,
                "status": rec.status,
            },
            "governance_vote": {
                "kind": "signal_off_chain",
                "triggers_on_chain_execution": false,
                "weight_ssot": "delegation_units_v1",
                "anchor": "B-092-GOV-VOTE-WEIGHT-DELEGATION-MVP"
            },
            "vote_counts": { "yes": yes_c, "no": no_c, "abstain": abstain_c },
            "my_vote": my_vote_json,
            "my_vote_weight": my_vote_weight_json,
        }))
        .into_response(),
    )
}

#[derive(Debug, Deserialize)]
pub struct ProposalVoteBody {
    pub vote: String,
}

/// POST /api/v1/governance/proposals/:proposal_id/vote — body `{ "vote": "yes" | "no" | "abstain" }`
pub async fn post_governance_proposal_vote(
    State(state): State<ApiMetaState>,
    Path(proposal_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<ProposalVoteBody>,
) -> impl IntoResponse {
    if governor_indexed_mode(&state).is_some() {
        let proposal_id = proposal_id.trim();
        let choice = body.vote.trim().to_ascii_lowercase();
        if !matches!(choice.as_str(), "yes" | "no" | "abstain") {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "invalid_vote",
                    "message": "invalid_vote",
                    "hint": "vote must be yes, no, or abstain"
                })),
            )
                .into_response();
        }
        let cast = if choice == "yes" {
            chain::governor::encode_cast_vote_calldata(proposal_id, 1).ok()
        } else if choice == "no" {
            chain::governor::encode_cast_vote_calldata(proposal_id, 0).ok()
        } else {
            chain::governor::encode_cast_vote_calldata(proposal_id, 2).ok()
        };
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "vote_on_chain_required",
                "message": "vote_on_chain_required",
                "hint": "Governor mode: submit castVote(uint256,uint8) on-chain; API does not record signal votes (B-089 Completion)",
                "cast_vote_calldata": cast,
            })),
        )
            .into_response();
    }

    let Some(uid) = extract_user_with_session_check(&state, &headers).await else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "login_required", "message": "login_required"})),
        )
            .into_response();
    };
    let Ok(pid) = Uuid::parse_str(proposal_id.trim()) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_proposal_id", "message": "invalid_proposal_id"})),
        )
            .into_response();
    };
    let choice = body.vote.trim().to_ascii_lowercase();
    if !matches!(choice.as_str(), "yes" | "no" | "abstain") {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_vote",
                "message": "invalid_vote",
                "hint": "vote must be yes, no, or abstain"
            })),
        )
            .into_response();
    }
    let d_arc = delegate_store();
    let dm = d_arc.read().await;
    if is_delegating_away(&dm, uid) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "error": "delegation_active_cannot_vote",
                "message": "delegation_active_cannot_vote",
                "delegate_to": dm.get(&uid).map(|x| x.to_string()),
                "hint": "revoke delegation with DELETE /api/v1/governance/delegate before casting your own vote (B-092)"
            })),
        )
            .into_response();
    }
    let weight = voter_weight_units_now(&dm, uid);
    drop(dm);

    let arc = store();
    let mut g = arc.write().await;
    if !g.proposals.contains_key(&pid) {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "proposal_not_found", "message": "proposal_not_found"})),
        )
            .into_response();
    }
    let key = (pid, uid);
    if let Some(prev) = g.votes.get(&key) {
        if prev.choice == choice {
            return mvp_headered(
                Json(json!({
                    "status": "ok",
                    "proposal_id": pid.to_string(),
                    "my_vote": choice,
                    "weight_applied": prev.weight,
                    "idempotent": true,
                    "duplicate": true
                }))
                .into_response(),
            );
        }
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "already_voted",
                "message": "already_voted",
                "existing_vote": prev.choice,
                "existing_weight_applied": prev.weight,
                "hint": "use the same vote again for idempotent success, or contact admin to change vote in a future release"
            })),
        )
            .into_response();
    }
    g.votes.insert(
        key,
        VoteRecord {
            choice: choice.clone(),
            weight,
        },
    );
    mvp_headered(
        Json(json!({
            "status": "ok",
            "proposal_id": pid.to_string(),
            "my_vote": choice,
            "weight_applied": weight,
            "idempotent": false
        }))
        .into_response(),
    )
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/governance/proposals/:proposal_id/vote",
            post(post_governance_proposal_vote),
        )
        .route(
            "/api/v1/governance/proposals/:proposal_id",
            get(get_governance_proposal),
        )
        .route(
            "/api/v1/governance/proposals",
            get(get_governance_proposals_list),
        )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::test_support::api_meta_state;
    use axum::extract::State;
    use http_body_util::BodyExt;

    #[tokio::test]
    async fn proposals_list_returns_seeded_items_and_mvp_header() {
        let res = get_governance_proposals_list(State(api_meta_state(None)))
            .await
            .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get(IMPL_HEADER)
                .and_then(|h| h.to_str().ok()),
            Some(IMPL_VALUE)
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v["status"], "ok");
        assert_eq!(v["items"].as_array().map(|a| a.len()), Some(2));
    }

    #[tokio::test]
    async fn proposal_detail_not_found() {
        let res = get_governance_proposal(
            State(api_meta_state(None)),
            Path("ffffffff-ffff-4fff-bfff-ffffffffffff".to_string()),
            HeaderMap::new(),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn vote_requires_login() {
        let res = post_governance_proposal_vote(
            State(api_meta_state(None)),
            Path("00000000-0000-4000-8000-000000000001".to_string()),
            HeaderMap::new(),
            Json(ProposalVoteBody {
                vote: "yes".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    fn headers_with_user(uid: &Uuid) -> HeaderMap {
        let mut h = HeaderMap::new();
        h.insert(
            axum::http::header::HeaderName::from_static("x-user-id"),
            axum::http::HeaderValue::from_str(&uid.to_string()).expect("uuid header"),
        );
        h
    }

    #[tokio::test]
    async fn vote_same_choice_idempotent_different_choice_409() {
        let uid = Uuid::parse_str("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee").expect("uid");
        let pid = "00000000-0000-4000-8000-000000000001".to_string();
        let h = headers_with_user(&uid);

        let r1 = post_governance_proposal_vote(
            State(api_meta_state(None)),
            Path(pid.clone()),
            h.clone(),
            Json(ProposalVoteBody {
                vote: "yes".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(r1.status(), StatusCode::OK);

        let r2 = post_governance_proposal_vote(
            State(api_meta_state(None)),
            Path(pid.clone()),
            h.clone(),
            Json(ProposalVoteBody {
                vote: "yes".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(r2.status(), StatusCode::OK);
        let b2 = r2.into_body().collect().await.unwrap().to_bytes();
        let j2: serde_json::Value = serde_json::from_slice(&b2).expect("json");
        assert_eq!(j2.get("idempotent").and_then(|x| x.as_bool()), Some(true));

        let r3 = post_governance_proposal_vote(
            State(api_meta_state(None)),
            Path(pid),
            h,
            Json(ProposalVoteBody {
                vote: "no".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(r3.status(), StatusCode::CONFLICT);
        let b3 = r3.into_body().collect().await.unwrap().to_bytes();
        let j3: serde_json::Value = serde_json::from_slice(&b3).expect("json");
        assert_eq!(j3.get("error").and_then(|x| x.as_str()), Some("already_voted"));
    }

    #[tokio::test]
    async fn vote_forbidden_when_user_has_active_delegation() {
        let delegator = Uuid::new_v4();
        let delegatee = Uuid::new_v4();
        assert_ne!(delegator, delegatee);
        let h_del = headers_with_user(&delegator);
        crate::routes::governance_delegate::post_governance_delegate(
            State(api_meta_state(None)),
            h_del,
            Json(crate::routes::governance_delegate::DelegateBody {
                delegate_to: delegatee.to_string(),
            }),
        )
        .await;

        let res = post_governance_proposal_vote(
            State(api_meta_state(None)),
            Path("00000000-0000-4000-8000-000000000001".to_string()),
            headers_with_user(&delegator),
            Json(ProposalVoteBody {
                vote: "yes".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn delegatee_vote_counts_frozen_weight_in_tally() {
        let delegator = Uuid::new_v4();
        let delegatee = Uuid::new_v4();
        assert_ne!(delegator, delegatee);
        let pid = "00000000-0000-4000-8000-000000000001".to_string();
        crate::routes::governance_delegate::post_governance_delegate(
            State(api_meta_state(None)),
            headers_with_user(&delegator),
            Json(crate::routes::governance_delegate::DelegateBody {
                delegate_to: delegatee.to_string(),
            }),
        )
        .await;

        let r_vote = post_governance_proposal_vote(
            State(api_meta_state(None)),
            Path(pid.clone()),
            headers_with_user(&delegatee),
            Json(ProposalVoteBody {
                vote: "yes".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(r_vote.status(), StatusCode::OK);
        let b = r_vote.into_body().collect().await.unwrap().to_bytes();
        let j: serde_json::Value = serde_json::from_slice(&b).expect("json");
        assert_eq!(j.get("weight_applied").and_then(|x| x.as_u64()), Some(2));

        let _ = crate::routes::governance_delegate::delete_governance_delegate(
            State(api_meta_state(None)),
            headers_with_user(&delegator),
        )
        .await;

        let detail = get_governance_proposal(
            State(api_meta_state(None)),
            Path(pid),
            HeaderMap::new(),
        )
        .await
        .into_response();
        assert_eq!(detail.status(), StatusCode::OK);
        let db = detail.into_body().collect().await.unwrap().to_bytes();
        let jd: serde_json::Value = serde_json::from_slice(&db).expect("json");
        assert_eq!(jd["vote_counts"]["yes"].as_u64(), Some(2));
        assert_eq!(
            jd["governance_vote"]["weight_ssot"].as_str(),
            Some("delegation_units_v1")
        );
    }
}
