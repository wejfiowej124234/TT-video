import { ADMIN_PERM, type AdminPermissionId } from "@/lib/admin/adminPermissionIds";

/**
 * Batch-12 HU-465 · 顶栏资金闸按**叶**而非整组 `more`。
 * 仅当分组内**每一叶**都要求 `FINANCE_READ` 时才整组隐藏（旧 `finance` 纯资金组）。
 * `more`（财务+设置）→ false · 由 AdminShellNavGroup 按叶 permission 过滤。
 */
export function adminShellTopNavGroupNeedsWholeFinanceGate(input: {
  groupId: string;
  links: readonly { permission?: AdminPermissionId }[];
}): boolean {
  if (input.groupId === "more") return false;
  if (input.groupId === "finance") return true;
  if (input.links.length === 0) return false;
  return input.links.every((link) => link.permission === ADMIN_PERM.FINANCE_READ);
}
