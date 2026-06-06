/** ① 本地开发向 UI（技术 JSON、本地闭环说明）— 默认对用户隐藏。 */
export function meOnboardingDevUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS === "1";
}
