/**
 * 注册页底图：`public/register-bg/*.jpg`（Unsplash 下载，见同目录说明）+ 默认浅色渐变。
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

const BG_TRANSITION = "motion-safe:transition-opacity duration-500";

/** 主容器：须与 `RegisterPageBackdrop` 同用；`relative isolate` + 底 `z-0`、正文 `z-10`（勿用负 z-index，易被 isolate 吃掉） */
export function registerPageShellClass(layout: RegisterPageLayout = "centered"): string {
  const base = `relative isolate min-h-screen flex flex-col ${BG_TRANSITION}`;
  if (layout === "guideForm") {
    return `${base} items-center gap-6 py-8 px-4 pb-12`;
  }
  return `${base} items-center justify-center gap-4 p-6 py-10`;
}
