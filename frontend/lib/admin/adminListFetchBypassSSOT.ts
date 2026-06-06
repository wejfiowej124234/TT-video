/** ① · ADM-P1-07：非 `useAdminStandardListFetch` 列表 · 须有并行 SSOT（bundle / 权限页等）。 */

export const ADMIN_LIST_FETCH_BYPASS_SSOT = [
  {
    id: "finance-reconciliation",
    hook: "loadAdminFinanceReconciliationBundle",
    file: "lib/admin/adminFinanceReconciliationBundleFetch.ts",
    reason: "三 API Promise.all 并行 bootstrap",
  },
  {
    id: "permissions",
    hook: "useAdminPermissionsPage",
    file: "app/admin/permissions/useAdminPermissionsPage.ts",
    reason: "RBAC 矩阵 + TOTP · 非标准 items 列表",
  },
  {
    id: "community-abuse-policy",
    hook: "useAdminCommunityAbusePolicyPage",
    file: "app/admin/community/abuse-policy/useAdminCommunityAbusePolicyPage.ts",
    reason: "策略文档单资源 · 非 items 列表",
  },
] as const;

export type AdminListFetchBypassId = (typeof ADMIN_LIST_FETCH_BYPASS_SSOT)[number]["id"];
