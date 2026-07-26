//! Admin HTTP Query / JSON body 类型（与 `routes/admin/mod.rs` handler 对齐）。
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AdminAuditQuery {
    pub limit: Option<i64>,
    pub actor_id: Option<String>,
    pub action: Option<String>,
    pub resource_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminAuthAuditEventsQuery {
    pub limit: Option<i64>,
    pub event_type: Option<String>,
    pub reason: Option<String>,
    pub user_id: Option<String>,
    pub client_ip: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminApprovalQuery {
    pub status: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminSchemaMigrationsQuery {
    pub limit: Option<i64>,
}

/// FeeRouter `PlatformFeeRouted` 投影：汇总 + 分页（110、70、04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminFeeRouterRoutedQuery {
    pub limit: Option<u32>,
    pub cursor: Option<String>,
    pub chain_id: Option<i64>,
}

/// RegionVault `RegionVaultForwarded` 投影：query 形与 FeeRouter 管理端一致（110、70、04 §3.5）
pub type AdminRegionVaultForwardedQuery = AdminFeeRouterRoutedQuery;

/// **`GET …/region-vault/forwarded-events/export`**：只读快照导出（**`region_vault_forwarded_events`**；P5-2-B）。
#[derive(Debug, Deserialize)]
pub struct AdminRegionVaultForwardedExportQuery {
    #[serde(default = "default_region_vault_forwarded_export_format")]
    pub format: String,
    pub chain_id: Option<i64>,
    pub limit: Option<u32>,
}

fn default_region_vault_forwarded_export_format() -> String {
    "csv".to_string()
}

/// **`GET …/finance/summary/export`**：`format` 缺省 **`csv`**（200 §3.6 审计导出最小能力）。
#[derive(Debug, Deserialize)]
pub struct AdminFinanceSummaryExportQuery {
    #[serde(default = "default_finance_summary_export_format")]
    pub format: String,
}

fn default_finance_summary_export_format() -> String {
    "csv".to_string()
}

/// Phase 5 / 07：运营低分评价抽样；max_score=2 即 1～2 星。
#[derive(Debug, Deserialize)]
pub struct AdminReviewsQuery {
    pub limit: Option<i64>,
    pub min_score: Option<i16>,
    pub max_score: Option<i16>,
}

/// Admin 订单列表：可选 **`limit`**（1～500，缺省 100）、**`state`**、**`id`**、**`q`**。
#[derive(Debug, Deserialize)]
pub struct AdminOrdersListQuery {
    pub limit: Option<i64>,
    pub state: Option<String>,
    pub id: Option<String>,
    pub q: Option<String>,
}

/// Admin 争议列表：可选 **`limit`** / **`status`** / **`id`** / **`order_id`** / **`q`**。
#[derive(Debug, Deserialize)]
pub struct AdminDisputesListQuery {
    pub limit: Option<i64>,
    pub status: Option<String>,
    pub id: Option<String>,
    pub order_id: Option<String>,
    pub q: Option<String>,
}

/// Admin 用户列表：可选 **`limit`**（1～500，缺省 100）、**`offset`**、**`email`**（子串）、**`role`** / **`kyc_status`**（精确匹配）。
#[derive(Debug, Deserialize)]
pub struct AdminUsersListQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub role: Option<String>,
    pub kyc_status: Option<String>,
    pub email: Option<String>,
}

/// Admin 向导台账：可选 **`limit`**（1～500，缺省 100）、**`status`**（与向导 **`status`** 精确匹配）。
#[derive(Debug, Deserialize)]
pub struct AdminGuidesListQuery {
    pub limit: Option<i64>,
    pub status: Option<String>,
}

/// **`PATCH /api/v1/admin/guides/:id`**：向导资质审核状态与拒绝信息（B-080）
#[derive(Debug, Deserialize)]
pub struct AdminPatchGuideRegistrationBody {
    pub status: String,
    #[serde(default)]
    pub rejection_codes: Vec<String>,
    #[serde(default)]
    pub rejection_message: Option<String>,
}

/// **`GET …/admin/audit/operations`**：可选 **`limit`**（1～200，缺省 50）；**`operations`** 为与本文件 **`write_admin_audit_log_best_effort`** 已用 **`action`** 对齐的静态目录（**`applied_filters.source`**=`action_catalog_v1`）；**`limit`** 截断返回条数；全量审计事件导出仍以 120/200 流水线为准。
#[derive(Debug, Default, Deserialize)]
pub struct AdminAuditOperationsQuery {
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminRoleChangeRequestBody {
    pub target_role: String,
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminApprovalActionBody {
    pub reason: Option<String>,
}

/// POST /api/v1/admin/flags/:id/publish（240、04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminFlagPublishBody {
    pub enabled: bool,
    #[serde(default)]
    pub rollout_percent: Option<i32>,
    /// `null` in JSON clears region; omitted keeps previous value.
    #[serde(default)]
    pub region: Option<Option<String>>,
    pub expected_version: i64,
}

/// POST /api/v1/admin/policies/:id/publish（04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminPolicyPublishBody {
    /// `draft` | `active` | `deprecated`
    pub status: String,
    pub expected_version: i32,
}

/// POST /api/v1/admin/tenants/scopes/:id/publish（04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminTenantScopePublishBody {
    /// `draft` | `active` | `sunset`
    pub status: String,
    pub expected_version: i32,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminComplianceDataRequestEventsQuery {
    pub limit: Option<i64>,
    /// **`event_type` 子串**（trim；空或 **>128** 忽略；**ILIKE**，`%`/`_` 已服务端转义）
    #[serde(default)]
    pub event_type: Option<String>,
}

/// POST /api/v1/admin/compliance/data-requests/:request_id/update（500、04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminComplianceDataRequestUpdateBody {
    pub expected_version: i32,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub export_signature: Option<String>,
    #[serde(default)]
    pub record_hash_fingerprint: Option<String>,
    pub event_type: String,
    #[serde(default)]
    pub event_detail: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminJobsQuery {
    pub limit: Option<i64>,
    pub status: Option<String>,
    /// 精确匹配 **`async_jobs.queue_name`**（trim；空忽略；非法 **`400 invalid_queue_name_filter`**）
    #[serde(default)]
    pub queue_name: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminSchedulerJobsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub job_code: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminFlagsQuery {
    pub limit: Option<i64>,
    /// **`flag_code` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub flag_code: Option<String>,
    /// **`true`/`false`/`1`/`0`/`yes`/`no`**（trim；空忽略；非法 **400**）
    #[serde(default)]
    pub enabled: Option<String>,
    /// 精确匹配 **`scope`**（trim；**1～64** **`[a-zA-Z0-9._-]`**；空忽略；非法 **400**）
    #[serde(default)]
    pub scope: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminConfigReleasesQuery {
    pub limit: Option<i64>,
    /// 精确匹配 **`config_releases.release_key`**（trim；空或 **>256** 字符忽略）
    #[serde(default)]
    pub release_key: Option<String>,
    /// **`draft`** / **`published`** / **`rolled_back`**（trim；空忽略；非法值 **400**）
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminSecretsMetadataQuery {
    pub limit: Option<i64>,
    /// **`key_alias` 子串**（trim；空或 **>256** 字符忽略；**ILIKE**，`%`/`_` 已服务端转义）
    #[serde(default)]
    pub key_alias: Option<String>,
    /// **`active`** / **`deprecated`** / **`revoked`** / **`pending`** / **`suspended`**（trim；空忽略；非法 **400**）
    #[serde(default)]
    pub status: Option<String>,
    /// 精确匹配 **`env_scope`**（trim；**1～64** 字符 **`[a-zA-Z0-9._-]`**；空忽略；非法 **400**）
    #[serde(default)]
    pub env_scope: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminApiVersionsQuery {
    pub limit: Option<i64>,
    /// **`api_version` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub api_version: Option<String>,
    /// **`planned`** / **`active`** / **`deprecated`** / **`sunset`**（trim；空忽略；非法 **400**）
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminLifecycleStateMachinesQuery {
    pub limit: Option<i64>,
    /// **`machine_code` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub machine_code: Option<String>,
    /// **`domain` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub domain: Option<String>,
    /// **`entity_type` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub entity_type: Option<String>,
    /// **`version` 子串**（trim；空或 **>32** 忽略；**ILIKE**）
    #[serde(default)]
    pub version: Option<String>,
    /// **`source_of_truth` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub source_of_truth: Option<String>,
    /// **`true`/`false`/`1`/`0`/`yes`/`no`**（trim；空忽略；非法 **400**）
    #[serde(default)]
    pub anomaly_flag: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminPoliciesQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub policy_code: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub scope_type: Option<String>,
    #[serde(default)]
    pub binding_role: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminTenantScopesQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub tenant_key: Option<String>,
    #[serde(default)]
    pub region_code: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub scope_class: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityReportsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub status: Option<String>,
    /// 精确 **`reporter_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_community_reports_reporter_id_filter`**）
    #[serde(default)]
    pub reporter_id: Option<String>,
    /// **`target_type` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub target_type: Option<String>,
    /// **`reason_code` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub reason_code: Option<String>,
    /// 精确 **`target_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_community_reports_target_id_filter`**）
    #[serde(default)]
    pub target_id: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityAppealsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub report_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCommunityModerationPenaltyInline {
    pub action: String,
    #[serde(default)]
    pub subject_user_id: Option<String>,
    #[serde(default)]
    pub reason: Option<String>,
    #[serde(default)]
    pub expires_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCommunityModerationBody {
    pub expected_version: i32,
    pub status: String,
    #[serde(default)]
    pub admin_notes: Option<String>,
    #[serde(default)]
    pub disposition: Option<String>,
    /// 与 `status: resolved` 同事务写入 `community_penalties`（可选）。
    #[serde(default)]
    pub record_penalty: Option<AdminCommunityModerationPenaltyInline>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityPenaltiesQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub subject_user_id: Option<String>,
    #[serde(default)]
    pub report_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityModerationCasesQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub report_id: Option<String>,
    /// 精确 **`actor_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_moderation_cases_query_actor_id_filter`**）
    #[serde(default)]
    pub actor_id: Option<String>,
    /// **`status_before` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub status_before: Option<String>,
    /// **`status_after` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub status_after: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityRiskSignalsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub subject_user_id: Option<String>,
    /// **`signal_type` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub signal_type: Option<String>,
    /// **`rule_id` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub rule_id: Option<String>,
    /// **`severity` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub severity: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityPolicyChangeLogsQuery {
    pub limit: Option<i64>,
    /// **`scope` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub scope: Option<String>,
    /// **`summary` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub summary: Option<String>,
    /// **`source` 子串**（trim；空或 **>128** 忽略；**ILIKE**，**NULL** 行按空串参与匹配）
    #[serde(default)]
    pub source: Option<String>,
    /// 精确 **`actor_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_community_policy_change_logs_actor_id_filter`**）
    #[serde(default)]
    pub actor_id: Option<String>,
}
