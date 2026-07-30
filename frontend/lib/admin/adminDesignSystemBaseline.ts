/**
 * Admin Design System · Product / Release Baseline — sole UI/UX SSOT (①).
 *
 * Product truth: Staging-validated **Inbox Focus Workbench** (dark shell · gold
 * accent · Header · Sidebar · 今日待办优先 · 统一收件箱优先 · 运营动作优先；
 * 概况/域健康/运营指标为辅助). **Forbidden:** redesign for score cosmetics;
 * env-gated alternate layouts (Local / Staging / Production).
 *
 * Layout mode (`adminHomeInboxFocusLayoutActive`) is the **Product Baseline
 * default** (always focus) — not pending-gated, not deploy-env-gated.
 * Three envs share one Release Grade Admin Shell / IA.
 *
 * Living Admin score NEED_FIX / PRR_READY=false / Reality NOT_ARMED until Runtime
 * ≡ this Baseline — freeze ≠ RELEASE_GRADE GO ≠ Production GO.
 */

/** Machine mark — Design System frozen as Product Release Baseline sole UI/UX SSOT. */
export const TT_ADMIN_DESIGN_SYSTEM_PRODUCT_RELEASE_BASELINE_MARK =
  "tt_admin_design_system_product_release_baseline_v1" as const;

/** Human-facing freeze stamp (UTC day of Owner freeze declaration). */
export const TT_ADMIN_DESIGN_SYSTEM_FREEZE_DECLARED_UTC = "2026-07-30" as const;

/**
 * Immutable visual / shell contract — do not invent parallel tokens for “prod polish”.
 * Concrete classes live in `adminUi.ts`; this enum names the locked surfaces.
 */
export const ADMIN_DESIGN_SYSTEM_LOCKED_SURFACES = [
  "admin_shell_header",
  "admin_shell_sidebar",
  "admin_shell_main_column",
  "admin_workbench_today_queue_cards",
  "admin_workbench_unified_inbox_banner",
  "admin_typography_l5_dark_gold",
  "admin_detail_list_chrome",
  "admin_finance_suite_via_shell",
  "admin_ops_workflow_via_shell",
] as const;

export type AdminDesignSystemLockedSurface =
  (typeof ADMIN_DESIGN_SYSTEM_LOCKED_SURFACES)[number];

/** Single shell entry — every `/admin/*` child inherits via `app/admin/layout.tsx`. */
export const ADMIN_SHELL_ROOT_COMPONENT = "AdminCapabilitiesShell" as const;

/**
 * Workbench IA = Inbox Focus Product Baseline (always-on), never
 * `NEXT_PUBLIC_ADMIN_DEPLOY_ENV` / staging|production layout forks.
 * Pending totals still drive badges / filter cards — not shell warm↔focus.
 */
export const ADMIN_WORKBENCH_LAYOUT_DRIVER = "inbox_focus_product_baseline_default" as const;

/** Env badge / chain label may differ; Design System layout must not. */
export const ADMIN_DEPLOY_ENV_MAY_LABEL_ONLY = true as const;

export function adminDesignSystemIsProductReleaseBaselineSoleUiUxSsot(): boolean {
  return true;
}

export function adminWorkbenchLayoutIsEnvGated(): boolean {
  return false;
}

export function adminStagingAndProductionShareReleaseGradeShell(): boolean {
  return true;
}

/** Fail-closed gates until Runtime ≡ Baseline (Owner-facing honesty). */
export function adminUiUxBaselineFailClosedGates(): {
  PRR_READY: false;
  TT_REALITY_CLOSURE: "NOT_ARMED";
  TT_PRODUCTION_GO: "NO_GO";
  RELEASE_GRADE: "NO";
} {
  return {
    PRR_READY: false,
    TT_REALITY_CLOSURE: "NOT_ARMED",
    TT_PRODUCTION_GO: "NO_GO",
    RELEASE_GRADE: "NO",
  };
}
