import type { OrderFlowStateInput } from "@/lib/escrowDraftFlow";

/** 已绑向导、订单仍为 Created/Open，待向导接单（P03） */
export function isGuideAcceptPending(
  order: OrderFlowStateInput & { guide_id?: string | null },
  hasGuideAssigned: boolean,
): boolean {
  if (!hasGuideAssigned) return false;
  const state = String(order.state ?? order.status ?? "")
    .trim()
    .toLowerCase();
  return state === "created" || state === "open";
}

/** 向导已接单，待双方双边确认（P04） */
export function isBilateralPending(order: OrderFlowStateInput): boolean {
  const state = String(order.state ?? order.status ?? "")
    .trim()
    .toLowerCase();
  const sub = String(order.sub_status ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (state !== "accepted") return false;
  return sub === "pending_bilateral" || sub === "guide_claimed" || sub === "";
}

/** 双方已完成双边确认，可进入确认终版（与 backend confirm_final_plan 同源） */
export function isBilateralConfirmed(order: OrderFlowStateInput): boolean {
  const state = String(order.state ?? order.status ?? "")
    .trim()
    .toLowerCase();
  const sub = String(order.sub_status ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  return state === "accepted" && sub === "confirmed";
}

export function experienceConfirmBlockedReasonKey(input: {
  itineraryDraftDirty: boolean;
  hasGuideAssigned: boolean;
  guideAcceptPending: boolean;
  bilateralPending: boolean;
  amountOutOfSync: boolean;
  quoteAmountPersisted: boolean;
  quoteQuietSyncing: boolean;
}): string | null {
  if (input.itineraryDraftDirty) return "escrow_confirmBlocked_saveFirst";
  if (!input.hasGuideAssigned) return "escrow_confirmBlocked_pickGuide";
  if (input.guideAcceptPending) return "escrow_confirmBlocked_waitGuideAccept";
  if (input.bilateralPending) return "escrow_confirmBlocked_waitBilateral";
  if (input.amountOutOfSync && !input.quoteAmountPersisted && !input.quoteQuietSyncing) {
    return "escrow_confirmBlocked_amountSync";
  }
  return null;
}
