//! SSOT: docs/handbook/engineering/181-Complexity-Audit-Final-Candidate-Before-Soak.md
//! Booking Core 活跃；B 轨 / Growth / 通用 CMS Admin HTTP 在 freeze 下不挂载。
//! **例外（ADM-U01 · PD-009 · CMS public surface）**：`provider-applications` · `onboarding/entitlements` ·
//! `trust-growth/control` · **`acquisition-publish-suspend`** · **`admin/content/announcements`** ·
//! **`admin/content/roadmap`** freeze 下仍挂载（与 public `/api/v1/public/announcements|roadmap` 同源）。

/// `TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE=1|true|TRUE` → 扩展 Admin 路由不注册。
pub fn freeze_active() -> bool {
    matches!(
        std::env::var("TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE").as_deref(),
        Ok("1") | Ok("true") | Ok("TRUE")
    )
}
