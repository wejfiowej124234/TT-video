import { isOrderPublishedToDiscover } from "@/lib/isAssignedGuideId";

export type OrderFlowStateInput = {
  state?: string;
  status?: string;
  sub_status?: string;
  snapshotHash?: string | null;
};

/** 与 backend `confirm_final_plan_impl` 同源：Draft 或 Accepted+双边 confirmed（Created 须先 P03/P04） */
export function orderAllowsConfirmFinalPlan(input: OrderFlowStateInput): boolean {
  const snap = input.snapshotHash?.trim();
  if (snap) return false;
  const state = String(input.state ?? input.status ?? "")
    .trim()
    .toLowerCase();
  const sub = String(input.sub_status ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (state === "draft") return true;
  if (state === "accepted" && sub === "confirmed") return true;
  return false;
}

/** Experience 顶栏副标题（① 草稿链 · P03/P04 感知） */
export function experienceDraftHeaderMetaKey(input: {
  publishedToDiscover: boolean;
  hasGuideAssigned: boolean;
  guideAcceptPending?: boolean;
  bilateralPending?: boolean;
}): string {
  if (input.bilateralPending) return "escrow_draftMeta_bilateral_pending";
  if (input.hasGuideAssigned && input.guideAcceptPending) {
    return "escrow_draftMeta_guide_wait_accept";
  }
  if (input.hasGuideAssigned) return "escrow_draftMeta_published_guide";
  if (input.publishedToDiscover) return "escrow_draftMeta_waitingGuide";
  return "escrow_draftMeta_pickGuide";
}

export { isOrderPublishedToDiscover };
