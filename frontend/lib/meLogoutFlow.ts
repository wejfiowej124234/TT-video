import { postLogout, applyLocalLogoutAfterServerOk } from "@/lib/apiClient";

/** 与 `useMePage` 登出一致：确认 → POST /logout → 清本地态 → 跳转登录页 */
export function runMeLogoutFlow(t: (k: string) => string): void {
  if (typeof window === "undefined") return;
  if (!window.confirm(t("me_logout_confirm"))) return;
  postLogout()
    .then(() => {
      applyLocalLogoutAfterServerOk();
      window.location.href = "/auth/login";
    })
    .catch((err) => {
      if (typeof window !== "undefined") {
        console.error("runMeLogoutFlow postLogout:", err);
      }
    });
}
