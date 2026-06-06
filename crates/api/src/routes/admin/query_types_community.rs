//! Admin 社区/媒体/调度相关 Query 与 PATCH body 类型。
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AdminCommunityCommentVisibilityBody {
    pub visibility_status: String,
}

#[derive(Debug, Deserialize)]
pub struct AdminCommunityPenaltyCreateBody {
    pub subject_user_id: String,
    pub action: String,
    #[serde(default)]
    pub report_id: Option<String>,
    #[serde(default)]
    pub reason: Option<String>,
    #[serde(default)]
    pub expires_at: Option<String>,
    #[serde(default)]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCommunityAppealReviewBody {
    pub expected_version: i32,
    /// `accepted` | `rejected`
    pub decision: String,
    #[serde(default)]
    pub reviewer_note: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityRankingSnapshotsQuery {
    pub limit: Option<i64>,
    /// **`feed_mode` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub feed_mode: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminComplianceDataRequestsQuery {
    pub limit: Option<i64>,
    /// **`request_ref` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub request_ref: Option<String>,
    /// **`subject_id` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub subject_id: Option<String>,
    /// **`export`** / **`erasure`**（trim；空忽略；非法 **`400 invalid_compliance_request_type_filter`**）
    #[serde(default)]
    pub request_type: Option<String>,
    /// **`open`** / **`in_progress`** / **`completed`** / **`rejected`** / **`cancelled`**（trim；空忽略；非法 **`400 invalid_compliance_request_status_filter`**）
    #[serde(default)]
    pub status: Option<String>,
    /// **`jurisdiction` 子串**（trim；空或 **>128** 忽略；**ILIKE**，对 NULL 行按空串参与匹配）
    #[serde(default)]
    pub jurisdiction: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminInternalToolAuditsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub tool_id: Option<String>,
    #[serde(default)]
    pub action_code: Option<String>,
    #[serde(default)]
    pub actor_id: Option<String>,
    #[serde(default)]
    pub approval_request_id: Option<String>,
}

/// GET /api/v1/admin/media/signed-url-tokens（270、70、04 §3.5）
#[derive(Debug, Default, Deserialize)]
pub struct AdminMediaSignedUrlTokensQuery {
    pub limit: Option<i64>,
    /// **`object_id` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub object_id: Option<String>,
    /// **`read` | `download`**；trim；空忽略；非法 **400** **`invalid_media_signed_url_tokens_scope_filter`**（先于 DB）
    #[serde(default)]
    pub url_scope: Option<String>,
    /// 精确 **`issued_to`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_media_signed_url_tokens_issued_to_filter`**）
    #[serde(default)]
    pub issued_to: Option<String>,
    /// 精确 **令牌行 `id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_media_signed_url_tokens_token_id_filter`**）
    #[serde(default)]
    pub token_id: Option<String>,
}

/// GET /api/v1/admin/media/access-logs（270、70、04 §3.5）
#[derive(Debug, Default, Deserialize)]
pub struct AdminMediaAccessLogsQuery {
    pub limit: Option<i64>,
    /// 精确匹配 **`action`**：`[A-Za-z0-9_]{1,64}`；trim；空忽略；非法 **400** **`invalid_media_access_logs_action`**
    #[serde(default)]
    pub action: Option<String>,
    /// **`object_id` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub object_id: Option<String>,
    /// **`actor_or_ip` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub actor_or_ip: Option<String>,
    /// 精确匹配 **`token_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_media_access_logs_token_id_filter`**）
    #[serde(default)]
    pub token_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminSchedulerRerunBody {
    pub reason: Option<String>,
}
