export function isEscrowEthAddress(s: string | null | undefined): s is `0x${string}` {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

export interface OrderActionsBlockProps {
  orderId: string;
  state: string;
  hasEscrow: boolean;
  onSuccess: () => void;
  guideWalletAddress?: string | null;
  connectedAddress?: string | null;
  /** 有托管合约时用于 EIP-712 domain.verifyingContract */
  escrowAddress?: string | null;
  /** 与 Wagmi / 后端 CHAIN_ID 一致 */
  expectedChainId: number;
  /** 争议窗口已过期时隐藏「登记争议意向」 */
  disputeWindowExpired?: boolean;
  variantDid?: boolean;
  /** B-067：`GET /meta` `pause.enabled` */
  protocolPaused?: boolean;
  /**
   * P07 / P3：`GET /meta` `orders.order_mock_pay_enabled`（与 `P3_CHAIN_OFF` 同源）为真时，
   * 对有托管地址的订单仍走 REST `confirm-completion`，便于测试网链下闭环；为假时保持「有 escrow 则 EIP-712 intent」。
   */
  chainOffRestConfirmCompletionEnabled?: boolean;
}

/** 与 `useEscrowDetail` 的 `order.state ?? order.status` 对齐；兼容大小写漂移 */
export function normalizeOrderState(state: string | undefined): string {
  return (state ?? "").trim().toLowerCase();
}

export type OrderActionDerived = {
  canAccept: boolean;
  canCancel: boolean;
  /** accepted | escrowed | funded */
  canConfirmCompletion: boolean;
  canChainOffDispute: boolean;
  validEscrow: boolean;
  canEscrowDisputeIntent: boolean;
  showOffchainConfirm: boolean;
  showIntentConfirm: boolean;
};

export function deriveOrderActionFlags(input: {
  stateNorm: string;
  hasEscrow: boolean;
  escrowAddress?: string | null;
  disputeWindowExpired: boolean;
  chainOffRestConfirmCompletionEnabled: boolean;
}): OrderActionDerived {
  const canAccept = input.stateNorm === "created";
  const canCancel = input.stateNorm === "created" || input.stateNorm === "accepted";
  const canConfirmCompletion = input.stateNorm === "escrowed" || input.stateNorm === "funded";
  const canChainOffDispute =
    !input.hasEscrow &&
    (input.stateNorm === "accepted" || input.stateNorm === "escrowed" || input.stateNorm === "funded");
  const validEscrow = input.hasEscrow && isEscrowEthAddress(input.escrowAddress);
  const canEscrowDisputeIntent =
    validEscrow &&
    (input.stateNorm === "accepted" || input.stateNorm === "escrowed" || input.stateNorm === "funded") &&
    !input.disputeWindowExpired;

  const showOffchainConfirm =
    canConfirmCompletion &&
    (!input.hasEscrow || !validEscrow || input.chainOffRestConfirmCompletionEnabled);
  const showIntentConfirm =
    canConfirmCompletion && validEscrow && !input.chainOffRestConfirmCompletionEnabled;

  return {
    canAccept,
    canCancel,
    canConfirmCompletion,
    canChainOffDispute,
    validEscrow,
    canEscrowDisputeIntent,
    showOffchainConfirm,
    showIntentConfirm,
  };
}

export function shouldShowOrderActionsBlock(d: OrderActionDerived): boolean {
  return (
    d.canAccept ||
    d.canCancel ||
    d.showOffchainConfirm ||
    d.showIntentConfirm ||
    d.canChainOffDispute ||
    d.canEscrowDisputeIntent
  );
}
