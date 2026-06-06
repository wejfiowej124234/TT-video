/** 入驻/准入进度 · 步骤徽章（L5 真源） */

const ONBOARDING_CIRCLED_STEPS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"] as const;

/** 无障碍 / 文案用圈号 */
export function onboardingCircledStep(step: number): string {
  if (step >= 1 && step <= ONBOARDING_CIRCLED_STEPS.length) {
    return ONBOARDING_CIRCLED_STEPS[step - 1]!;
  }
  return String(step);
}

/** 圆形容器内：已完成 ✓ · 当前/待办阿拉伯数字 */
export function onboardingStepBadgeLabel(step: number, state: OnboardingStepBadgeState = "pending"): string {
  if (state === "done") return "✓";
  return String(step);
}

export type OnboardingStepBadgeState = "done" | "active" | "pending";

const AUTH_BADGE: Record<OnboardingStepBadgeState, string> = {
  done: "border-0 bg-ref-sun/90 text-[#1a120c] ring-1 ring-ref-sun/45",
  active:
    "border-0 bg-ref-sun text-[#1a120c] shadow-[0_0_18px_rgba(252,164,124,0.55)] ring-2 ring-ref-sun/90",
  pending: "border-2 border-slate-500/60 bg-[#14100d]/60 text-slate-400",
};

const CONSOLE_BADGE: Record<OnboardingStepBadgeState, string> = {
  done: "border-0 bg-ref-sun text-[#1a120c] ring-1 ring-ref-sun/45",
  active:
    "border-0 bg-ref-sun text-[#1a120c] shadow-[0_0_12px_rgba(252,164,124,0.35)] ring-2 ring-ref-sun/60",
  pending: "border-2 border-ink-200 bg-white text-ink-400",
};

export function onboardingStepBadgeClass(
  state: OnboardingStepBadgeState,
  variant: "auth" | "console" = "auth",
  size: "sm" | "md" = "sm",
): string {
  const palette = variant === "console" ? CONSOLE_BADGE : AUTH_BADGE;
  const sizeClass =
    size === "md" ? "h-9 w-9 text-sm tabular-nums" : "h-7 w-7 text-xs tabular-nums";
  return `flex shrink-0 items-center justify-center rounded-full font-bold leading-none ${sizeClass} ${palette[state]}`;
}

/** 步骤间竖向连接线（fromStep 已完成 → 暖金，否则 muted） */
export function onboardingProgressConnectorClass(
  fromStepDone: boolean,
  variant: "auth" | "console" = "auth",
): string {
  const base = "w-0.5 min-h-[0.7rem] flex-1 rounded-full my-0.5";
  if (fromStepDone) {
    return `${base} ${variant === "auth" ? "bg-ref-sun/75" : "bg-ref-sun/65"}`;
  }
  return `${base} ${variant === "auth" ? "bg-slate-600/35" : "bg-ink-200/90"}`;
}

/** 步骤间横向连接线（wizard 横排） */
export function onboardingProgressConnectorHorizontalClass(
  fromStepDone: boolean,
  variant: "auth" | "console" = "auth",
): string {
  const base = "h-0.5 w-3 shrink-0 rounded-full sm:w-4";
  if (fromStepDone) {
    return `${base} ${variant === "auth" ? "bg-ref-sun/75" : "bg-ref-sun/65"}`;
  }
  return `${base} ${variant === "auth" ? "bg-slate-600/35" : "bg-ink-200/90"}`;
}
