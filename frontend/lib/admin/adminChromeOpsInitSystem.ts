import type { AdminL5ConfirmRequest } from "@/lib/admin/adminL5ConfirmTypes";

/**
 * Batch-12 HU-448 · 「初始化系统」误触治理 SSOT。
 * 仅允许：平台设置维护折叠 · ⌘K；工作台主条 / Shell 顶栏 **禁止**。
 * 确认后进入只读 Schema/迁移页（非资金写 · 非 Escrow 写）。
 */

/** Staging / contract needle · keep literal (names minify). */
export const TT_ADMIN_CHROME_OPS_INIT_SYSTEM_MARK = "tt_admin_chrome_ops_init_system_hu448";

export const ADMIN_INIT_SYSTEM_HREF = "/admin/schema";

export const ADMIN_INIT_SYSTEM_TITLE_KEY = "admin_chrome_ops_init_system_label";
export const ADMIN_INIT_SYSTEM_SECTION_KEY = "admin_config_hub_maintainer_fold";
export const ADMIN_INIT_SYSTEM_CONFIRM_TITLE_KEY = "admin_l5_confirm_title_danger";
export const ADMIN_INIT_SYSTEM_CONFIRM_DESC_KEY = "admin_chrome_ops_init_system_confirm_desc";
export const ADMIN_INIT_SYSTEM_CONFIRM_LABEL_KEY = "admin_chrome_ops_init_system_confirm_label";

export type AdminChromeOpsInitSurface =
  | "workspace"
  | "shell_bar"
  | "config_maintainer"
  | "command_palette";

/** HU-448 · 危险 CTA 表面白名单（工作台/顶栏永远 false）。 */
export function adminShellInitSystemCtaAllowed(surface: AdminChromeOpsInitSurface): boolean {
  return surface === "config_maintainer" || surface === "command_palette";
}

export function adminChromeOpsInitSystemConfirmRequest(
  onConfirm: () => void | Promise<void>,
): AdminL5ConfirmRequest {
  return {
    titleKey: ADMIN_INIT_SYSTEM_CONFIRM_TITLE_KEY,
    descKey: ADMIN_INIT_SYSTEM_CONFIRM_DESC_KEY,
    danger: true,
    confirmLabelKey: ADMIN_INIT_SYSTEM_CONFIRM_LABEL_KEY,
    onConfirm,
  };
}
