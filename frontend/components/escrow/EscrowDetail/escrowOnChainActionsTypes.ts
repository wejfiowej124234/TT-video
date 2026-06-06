export type EscrowOnChainActionsProps = {
  isConnected: boolean;
  /** 35 §3.1：错链时禁用链上按钮并提示 */
  chainMismatch?: boolean;
  expectedChainId?: number;
  chainId?: number;
  confirmAction: string | null;
  pending: boolean;
  success: boolean;
  failed: boolean;
  depositAmount: bigint | undefined;
  depositPending: boolean;
  releasePending: boolean;
  refundPending: boolean;
  disputePending: boolean;
  /** 争议窗口过期（链下 deadline）时禁用链上 openDispute 入口 */
  disputeDisabled?: boolean;
  /** B-037：与 OrderActionsBlock / API 可争议态一致 */
  canOpenDisputeOnChain?: boolean;
  /** B-037：`!canOpenDisputeOnChain` 时的 i18n 键（可发起时为 null） */
  disputeOnChainUnavailableReasonKey?: string | null;
  /** 53-S10：与 API 订单态、评分双确对齐，避免误点 revert */
  canDepositOnChain?: boolean;
  canReleaseOnChain?: boolean;
  canRefundOnChain?: boolean;
  /** ERC-20 allowance below deposit amount: approve before deposit */
  needsDepositApproval?: boolean;
  onApproveForDeposit?: () => void;
  approveDepositPending?: boolean;
  onSetConfirmAction: (action: "deposit" | "release" | "refund" | "dispute") => void;
  onDeposit: () => void;
  onRelease: () => void;
  onRefund: () => void;
  txErrorMessage: string;
  /** 清除链上写错误态以便重试（B-030） */
  onDismissTxError?: () => void;
  variantDid?: boolean;
  /** B-067：`GET /meta` `pause.enabled` 为真时统一门闸 */
  protocolPaused?: boolean;
};
