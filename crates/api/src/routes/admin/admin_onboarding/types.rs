//! Admin onboarding HTTP query / body 类型（`router()` 与各 handler 共用）。

use serde::Deserialize;
use serde_json::Value;

pub(crate) const ADMIN_ONBOARDING_METADATA_PATCH_MAX_BYTES: usize = 16384;

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingEntitlementsListQuery {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub role_target: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingWebhookJobsQuery {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingWebhookDlqQuery {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingComplianceAuditQuery {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingPaymentEventsQuery {
    #[serde(default)]
    pub entitlement_id: Option<String>,
    #[serde(default)]
    pub event_type: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingEntitlementPaymentEventsQuery {
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct PatchAdminOnboardingEntitlementBody {
    pub admin: Value,
}

#[derive(Debug, Deserialize)]
pub struct RevokeOnboardingEntitlementBody {
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct FinancialReversalBody {
    pub reason: String,
    pub reversal_kind: String,
}
