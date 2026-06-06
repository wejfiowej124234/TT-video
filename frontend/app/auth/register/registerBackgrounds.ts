import { TT_AUTH_L5_PAGE_SHELL, TT_AUTH_L5_PAGE_SHELL_GUIDE } from "@/lib/auth/authL5Shell";

/**
 * 注册页视觉角色（保留类型；L5 暗壳底不再使用 `public/register-bg` 摄影图）。
 */
export type RegisterVisualKind = "default" | "traveler" | "guide" | "provider" | "steward";

/** 与选择项一一对应；由 `RegisterPageBackdrop` 全屏 cover + 暗遮罩 */
export const REGISTER_BG_SRC: Record<Exclude<RegisterVisualKind, "default">, string> = {
  traveler: "/register-bg/traveler.jpg",
  guide: "/register-bg/guide.jpg",
  provider: "/register-bg/provider.jpg",
  steward: "/register-bg/steward.jpg",
};

/** 摄影图缺失或加载失败时的角色区分底（与 `REGISTER_BG_SRC` 一一对应） */
export const REGISTER_BG_FALLBACK_CLASS: Record<Exclude<RegisterVisualKind, "default">, string> = {
  traveler: "bg-gradient-to-br from-emerald-900/95 via-teal-900/90 to-slate-950",
  guide: "bg-gradient-to-br from-amber-900/95 via-orange-950/90 to-slate-950",
  provider: "bg-gradient-to-br from-rose-900/95 via-fuchsia-950/90 to-slate-950",
  steward: "bg-gradient-to-br from-indigo-900/95 via-sky-950/90 to-slate-950",
};

export type RegisterPageLayout = "centered" | "guideForm";

/** 主容器：与 `AuthL5PageBackdrop` 同用（登录 L5 同族暗壳） */
export function registerPageShellClass(layout: RegisterPageLayout = "centered"): string {
  if (layout === "guideForm") {
    return `${TT_AUTH_L5_PAGE_SHELL_GUIDE} items-center`;
  }
  return TT_AUTH_L5_PAGE_SHELL;
}
