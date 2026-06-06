/**
 * `/pay` 支付 Hub · L5 暖金暗壳（① · 与 `/orders` 列表、`escrowProtocolUi` 同源）。
 * 机读：`payHubL5.contract.test.ts`
 */
import { TT_MARKETING_ACTION_TITLE_GRADIENT } from "@/lib/marketingUi";
import {
  TT_ESCROW_PROTOCOL_PAGE_SHELL,
  TT_ESCROW_PROTOCOL_PANEL,
  TT_ESCROW_PROTOCOL_PANEL_INNER,
  TT_ESCROW_PROTOCOL_ZONE,
  escrowProtocolBreadcrumbCurrentClass,
  escrowProtocolBreadcrumbLinkClass,
  escrowProtocolBreadcrumbListClass,
  escrowProtocolBreadcrumbNavClass,
  escrowProtocolCompactInputClass,
  escrowProtocolDividerBorderClass,
  escrowProtocolFooterActionClass,
  escrowProtocolInlineLinkClass,
  escrowProtocolMetaClass,
  escrowProtocolSecondaryBtnClass,
  escrowProtocolSolidBtnClass,
  escrowProtocolSubheadingClass,
} from "@/lib/escrowProtocolUi";

export const TT_PAY_HUB_PAGE_SHELL = TT_ESCROW_PROTOCOL_PAGE_SHELL;

export const TT_PAY_HUB_INNER = "container py-8 md:py-12 max-w-3xl mx-auto";

export const TT_PAY_HUB_ZONE = TT_ESCROW_PROTOCOL_ZONE;

export const TT_PAY_HUB_CARD = `${TT_ESCROW_PROTOCOL_PANEL} p-6`;

export const TT_PAY_HUB_SUMMARY_PANEL = TT_ESCROW_PROTOCOL_PANEL_INNER;

export const payHubTitleClass = `text-h3 font-semibold tracking-tight ${TT_MARKETING_ACTION_TITLE_GRADIENT}`;

export const payHubMetaClass = escrowProtocolMetaClass;

export const payHubBodyClass = "text-body text-slate-200 leading-relaxed";

export const payHubStepsClass = "list-decimal space-y-3 pl-5 text-body text-slate-300";

export const payHubDividerClass = escrowProtocolDividerBorderClass;

export const payHubInputClass = escrowProtocolCompactInputClass;

export const payHubPrimaryCtaClass = escrowProtocolSolidBtnClass;

export const payHubSecondaryCtaClass = escrowProtocolSecondaryBtnClass;

export const payHubLinkClass = escrowProtocolInlineLinkClass;

export const payHubFooterLinkClass = escrowProtocolFooterActionClass;

export const payHubCalloutClass =
  "rounded-[var(--radius-md)] border border-ref-sun/22 bg-ref-sun/8 p-4 sm:p-5";

export const payHubCalloutTitleClass = escrowProtocolSubheadingClass;

export const payHubCalloutBodyClass = escrowProtocolMetaClass;

export const payHubDeadlinePanelClass =
  "rounded-[var(--radius-md)] border border-ref-sun/18 bg-black/25 p-4 space-y-2";

export const payHubDeadlineTextClass = "text-small text-slate-300";

export const payHubMockPanelClass =
  "rounded-[var(--radius-md)] border border-dashed border-ref-sun/22 bg-black/20 p-4 sm:p-5";

export const payHubForbiddenPanelClass =
  "rounded-[var(--radius-md)] border border-ref-sun/18 bg-black/25 p-4";

export const payHubBreadcrumbNavClass = escrowProtocolBreadcrumbNavClass;

export const payHubBreadcrumbListClass = escrowProtocolBreadcrumbListClass;

export const payHubBreadcrumbLinkClass = escrowProtocolBreadcrumbLinkClass;

export const payHubBreadcrumbCurrentClass = escrowProtocolBreadcrumbCurrentClass;

export const payHubErrorPanelClass =
  "max-w-md w-full space-y-4 rounded-[var(--radius-xl)] border border-white/12 bg-slate-950/70 p-6 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl";

export function payHubL5MainDataAttrs(): Record<string, string> {
  return {
    "data-tt-pay-hub-l5": "1",
  };
}
