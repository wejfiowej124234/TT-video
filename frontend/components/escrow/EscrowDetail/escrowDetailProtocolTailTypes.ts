import type { ItineraryBlock, OrderRow } from "./types";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";

export type EscrowDetailProtocolTailProps = {
  order: OrderRow;
  itinerary: ItineraryBlock | null;
  data: UseEscrowDetailResult;
  panelClass: string;
  protocolPaused: boolean;
  chainOffRestConfirmCompletionEnabled: boolean;
  cancelPolicyHeadingId: string;
  copySummaryBusy: boolean;
  copySummaryDone: boolean;
  onCopySummary: () => void | Promise<void>;
  stashEscrowDetailPayOrRatePrefetch: () => void;
  onTxConfirm: () => void;
  onConfirmDispute: (reasonHash: `0x${string}`) => void;
  onReorgRefresh: () => void;
  t: (key: string) => string;
};
