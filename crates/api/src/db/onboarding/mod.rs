//! 96-18 准入费：`onboarding_entitlements` / `onboarding_payment_events`（04-附录-DDL §10.7）。
//! **默认** 会话写 **`pending`**、内网 Webhook 幂等推进 **`paid`**。
//! **可选**：**`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`** 时由 **`stripe_onboarding`** 创建 **Stripe PaymentIntent** 并写入 **`metadata.stripe`**。

#![allow(unused_imports)] // barrel re-exports; bin 未接线 onboarding / webhook worker 子命令前保留

mod async_jobs_mirror;
mod compliance_audit;
mod entitlements;
mod entitlements_admin;
mod entitlements_merge;
mod metrics;
mod payment_events;
mod stripe_webhooks;
mod types;
mod webhook_admin;
mod webhook_apply;
mod webhook_dlq;
mod webhook_jobs_claim;
mod webhook_worker;

pub use compliance_audit::*;
pub use entitlements::*;
pub use entitlements_admin::*;
pub use entitlements_merge::*;
pub use metrics::*;
pub use payment_events::*;
pub use stripe_webhooks::*;
pub use types::*;
pub use webhook_admin::*;
pub use webhook_apply::*;
pub use webhook_dlq::*;
pub use webhook_jobs_claim::*;
pub use webhook_worker::*;
