/**
 * ESCROW-L5-CONSUMER-EXPERIENCE-SPRINT · 非草稿订单详情消费者架构 SSOT（①）
 * 主链：状态驱动 + 单主 CTA + 3 秒理解；工程/链上内容迁至 /proof · /chain
 */
import { orderStateToStep, type OrderStateInput } from "@/components/escrow/OrderFlowSteps";

export const ESCROW_CONSUMER_L5_SPRINT_ID = "escrow-l5-consumer-experience-sprint-20260609" as const;

export function escrowConsumerProofHref(orderId: string): string {
  return `/escrow/${encodeURIComponent(orderId)}/proof`;
}

export function escrowConsumerChainHref(orderId: string): string {
  return `/escrow/${encodeURIComponent(orderId)}/chain`;
}

/** 主详情页消费者可见区禁止裸露的工程/链上术语（子页 /proof · /chain 豁免） */
export const ESCROW_CONSUMER_MAIN_BANNED_COPY =
  /\bFingerprint\b|指纹编解码|p004-verify|EscrowFactory|FeeRouter|GET\s*\/meta|NEXT_PUBLIC_|Finality|finalityN|event_log|Indexer Checkpoint|索引与链上同步|PlatformFeeRouted|content_hash|snapshot_hash|链上部署托管|链上存款|createEscrow|disputeWindow|reorg/i;

export type EscrowConsumerNextStepInput = {
  order: OrderStateInput;
  hasEscrow: boolean;
  bilateralPending?: boolean;
  guideAcceptPending?: boolean;
};

export function resolveEscrowConsumerNextStepKey(input: EscrowConsumerNextStepInput): string {
  const state = (input.order.state ?? input.order.status ?? "").toLowerCase();
  if (state === "cancelled" || state === "canceled") return "escrow_consumer_next_cancelled";
  if (state === "disputed") return "escrow_consumer_next_disputed";
  if (state === "refunded") return "escrow_consumer_next_refunded";
  if (state === "partiallyrefunded" || state === "partially_refunded") {
    return "escrow_consumer_next_partial_refund";
  }
  if (state === "slashed") return "escrow_consumer_next_slashed";
  if (state === "closed") return "escrow_consumer_next_closed";

  if (input.guideAcceptPending) return "escrow_consumer_next_waitGuide";
  if (input.bilateralPending) return "escrow_consumer_next_bilateral";

  const step = orderStateToStep(input.order);
  if (!input.hasEscrow && step >= 4) return "escrow_consumer_next_setupFunds";

  switch (step) {
    case 2:
      return "escrow_consumer_next_guideConfirm";
    case 3:
      return "escrow_consumer_next_bilateral";
    case 4:
      return "escrow_consumer_next_confirmPlan";
    case 5:
      return "escrow_consumer_next_pay";
    case 6:
      return "escrow_consumer_next_trip";
    case 7:
      return "escrow_consumer_next_rate";
    case 8:
      return "escrow_consumer_next_release";
    default:
      return "escrow_consumer_next_default";
  }
}
