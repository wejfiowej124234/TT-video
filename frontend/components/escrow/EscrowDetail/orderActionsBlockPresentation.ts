import { TT_MARKETING_FOCUS_RING_CONSOLE } from "@/lib/marketingUi";
import { marketCyanPillControlFocusClasses } from "@/lib/travelLinkFocus";

export function deriveOrderActionsBlockPresentation(args: {
  variantDid: boolean | undefined;
  canAccept: boolean;
  busy: boolean;
  loading: string | null;
  guideWalletMismatch: boolean;
  t: (key: string) => string;
  guideWalletAlertId: string;
  acceptOtherPendingId: string;
}) {
  const {
    variantDid,
    canAccept,
    busy,
    loading,
    guideWalletMismatch,
    t,
    guideWalletAlertId,
    acceptOtherPendingId,
  } = args;
  const isDid = !!variantDid;
  const pillFocusClass = isDid
    ? marketCyanPillControlFocusClasses
    : `${TT_MARKETING_FOCUS_RING_CONSOLE}`;
  const rootClass = isDid
    ? "rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-900/70 backdrop-blur-md p-6 shadow-scifi-panel space-y-3"
    : "rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-soft space-y-3";
  const hClass = isDid ? "text-body font-semibold text-cyan-200" : "text-body font-semibold text-ink-800";
  const metaClass = isDid ? "text-meta text-slate-300" : "text-meta text-ink-500";
  const labelClass = isDid ? "block text-meta text-slate-300" : "block text-meta text-ink-600";

  const acceptBlockedByOtherPending = canAccept && busy && loading !== "accept";
  const acceptButtonTitle =
    canAccept && guideWalletMismatch
      ? t("escrow_guideWalletRequired")
      : acceptBlockedByOtherPending
        ? t("escrow_acceptBlocked_otherActionPending")
        : undefined;
  const acceptButtonDescribedBy =
    canAccept && guideWalletMismatch
      ? guideWalletAlertId
      : acceptBlockedByOtherPending
        ? acceptOtherPendingId
        : undefined;

  return {
    isDid,
    pillFocusClass,
    rootClass,
    hClass,
    metaClass,
    labelClass,
    acceptBlockedByOtherPending,
    acceptButtonTitle,
    acceptButtonDescribedBy,
  };
}
