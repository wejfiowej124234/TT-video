import { CONSOLE_ROLES_70, type ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";



export const ADMIN_SHELL_PREVIEW_STORAGE_KEY = "tt_admin_shell_preview_role_v1";

export const ADMIN_SHELL_PREVIEW_CHANGE_EVENT = "tt-admin-shell-preview-change";



function isConsoleRole70(value: string): value is ConsoleRole70 {

  return (CONSOLE_ROLES_70 as readonly string[]).includes(value);

}



/** ① 本地 Shell 分组预览角色（不修改 capabilities / API）。 */

export function readAdminShellPreviewRole(): ConsoleRole70 | null {

  if (typeof window === "undefined") return null;

  try {

    const raw = window.sessionStorage.getItem(ADMIN_SHELL_PREVIEW_STORAGE_KEY);

    if (!raw || !isConsoleRole70(raw)) return null;

    return raw;

  } catch {

    return null;

  }

}



export function writeAdminShellPreviewRole(role: ConsoleRole70 | null): void {

  if (typeof window === "undefined") return;

  try {

    if (role === null) {

      window.sessionStorage.removeItem(ADMIN_SHELL_PREVIEW_STORAGE_KEY);

    } else {

      window.sessionStorage.setItem(ADMIN_SHELL_PREVIEW_STORAGE_KEY, role);

    }

    window.dispatchEvent(new Event(ADMIN_SHELL_PREVIEW_CHANGE_EVENT));

  } catch {

    /* ignore quota / private mode */

  }

}


