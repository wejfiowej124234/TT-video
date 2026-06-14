import { ME_IDENTITIES_STEWARD_WORKSPACE_HREF } from "@/lib/me/meIdentitiesCoreCardModel";
import { STEWARD_B_TRACK_ADMISSION_ANCHOR } from "@/lib/steward/stewardBTrackModel";

/** 主理人 USDC 准入 + 身份确认 · 工作台 A 轨 SSOT（① · 替代 `/me/onboarding?role=region_steward`）。客户 UI「A 轨」= USDC；spec `onboarding-fee-schedule` 内部仍称 B 轨 SKU — 见该文「客户可见 UI 命名」。 */
export const STEWARD_ADMISSION_WORKBENCH_HREF = `${ME_IDENTITIES_STEWARD_WORKSPACE_HREF}#${STEWARD_B_TRACK_ADMISSION_ANCHOR}` as const;

export function stewardAdmissionWorkbenchHref(from?: string | null): string {
  const trimmed = from?.trim();
  if (!trimmed) return STEWARD_ADMISSION_WORKBENCH_HREF;
  const joiner = ME_IDENTITIES_STEWARD_WORKSPACE_HREF.includes("?") ? "&" : "?";
  return `${ME_IDENTITIES_STEWARD_WORKSPACE_HREF}${joiner}from=${encodeURIComponent(trimmed)}#${STEWARD_B_TRACK_ADMISSION_ANCHOR}`;
}

export function scrollToStewardAdmissionSection(behavior: ScrollBehavior = "smooth"): void {
  if (typeof document === "undefined") return;
  document.getElementById(STEWARD_B_TRACK_ADMISSION_ANCHOR)?.scrollIntoView({ behavior, block: "start" });
}
