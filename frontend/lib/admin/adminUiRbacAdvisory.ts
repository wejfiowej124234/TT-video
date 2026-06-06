/**
 * ① · ADM-P0-03：UI RBAC 为 advisory；真实拦截在 API `require_admin_actor` / `require_admin_permission`。
 * Shell 过滤与 `AdminRoutePermissionBanner` 仅辅助操作员，**非**安全边界。
 */

export const ADMIN_UI_RBAC_ADVISORY_MARKER = "data-tt-admin-ui-rbac-advisory";

/** capabilities 403 / admin_required → 硬闸（与 UI banner 不同级）。 */
export const ADMIN_CONSOLE_ACTOR_GATE_MARKER = "data-tt-admin-console-actor-gate";
