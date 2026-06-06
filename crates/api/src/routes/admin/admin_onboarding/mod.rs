//! **70 / 96-18 / 96-09**：`GET/PATCH/POST /api/v1/admin/onboarding/*` 与 **`GET …/admin/users/:id/onboarding-entitlements`**。
//! 行为与 **`onboarding_app_stack_db_api_tests`** **`matrix_93_admin_onb_*`** 对拍。

mod compliance;
mod entitlements_read;
mod entitlements_write;
mod helpers;
mod payment_events;
mod types;
mod user_entitlements;
mod webhooks;

use axum::routing::{get, post};
use axum::Router;

use crate::state::ApiMetaState;

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/users/:user_id/onboarding-entitlements",
            get(user_entitlements::get_admin_user_onboarding_entitlements),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements/:entitlement_id/payment-events",
            get(payment_events::get_admin_onboarding_entitlement_payment_events),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements/:entitlement_id/revoke",
            post(entitlements_write::post_admin_onboarding_entitlement_revoke),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements/:entitlement_id/financial-reversal",
            post(entitlements_write::post_admin_onboarding_entitlement_financial_reversal),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements/:entitlement_id",
            get(entitlements_read::get_admin_onboarding_entitlement_by_id)
                .patch(entitlements_read::patch_admin_onboarding_entitlement),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements",
            get(entitlements_read::get_admin_onboarding_entitlements_list),
        )
        .route(
            "/api/v1/admin/onboarding/payment-events",
            get(payment_events::get_admin_onboarding_payment_events_list),
        )
        .route(
            "/api/v1/admin/onboarding/webhook-jobs",
            get(webhooks::get_admin_onboarding_webhook_jobs),
        )
        .route(
            "/api/v1/admin/onboarding/webhook-dlq",
            get(webhooks::get_admin_onboarding_webhook_dlq),
        )
        .route(
            "/api/v1/admin/onboarding/compliance-audit-events",
            get(compliance::get_admin_onboarding_compliance_audit_events),
        )
}
