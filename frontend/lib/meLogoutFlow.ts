import { postLogout, applyLocalLogoutAfterServerOk } from "@/lib/apiClient";

export function postLogoutReturnPathForLoginFromParts(pathname: string, search: string): string {
  if (pathname.startsWith("/auth/")) return "/";
  if (pathname === "/") return "/";
  return `${pathname}${search}`;
}

/**
 * 无 UI 的登出执行（POST /logout → 清本地态 → 跳转登录）。
 * 须由 `MeLogoutL5Button` 先走 L5 确认；勿再使用 `window.confirm`。
 */
export async function executeMeLogoutRedirect(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await postLogout();
    applyLocalLogoutAfterServerOk();
    window.location.href = "/auth/login";
  } catch (err) {
    if (typeof window !== "undefined") {
      console.error("executeMeLogoutRedirect:", err);
    }
    applyLocalLogoutAfterServerOk();
    window.location.href = "/auth/login";
  }
}

/** @deprecated 使用 `MeLogoutL5Button`（L5 alertdialog 确认） */
export function runMeLogoutFlow(_t: (k: string) => string): void {
  if (typeof window !== "undefined") {
    console.warn("runMeLogoutFlow is deprecated; use MeLogoutL5Button instead.");
  }
  void executeMeLogoutRedirect();
}
