/**
 * `/escrow/[id]/rate` · L5 暖金暗壳（① · 与协议壳 `escrowProtocolUi` 同源）。
 * 机读：`escrowProtocolUi.contract.test.ts`
 */
import {
  TT_ESCROW_PROTOCOL_PAGE_SHELL,
  TT_ESCROW_PROTOCOL_ZONE,
  TT_ESCROW_PROTOCOL_PANEL_PADDED_COMPACT,
  escrowProtocolDividerBorderClass,
  escrowProtocolFooterActionClass,
  escrowProtocolFocusRingClass,
  escrowProtocolHeadingClass,
  escrowProtocolInlineLinkClass,
  escrowProtocolMetaClass,
  escrowProtocolSecondaryBtnClass,
  escrowProtocolSolidBtnClass,
  escrowProtocolSubheadingClass,
  escrowProtocolTitleClass,
  escrowProtocolUploadZoneClass,
} from "@/lib/escrowProtocolUi";

export const TT_ESCROW_RATE_PAGE_SHELL = TT_ESCROW_PROTOCOL_PAGE_SHELL;

export const TT_ESCROW_RATE_ZONE = TT_ESCROW_PROTOCOL_ZONE;

export const TT_ESCROW_RATE_PANEL = TT_ESCROW_PROTOCOL_PANEL_PADDED_COMPACT;

export const escrowRateNavFocusClass = escrowProtocolFocusRingClass;

export const escrowRateLinkClass = escrowProtocolInlineLinkClass;

export const escrowRateFooterLinkClass = escrowProtocolFooterActionClass;

export const escrowRateTitleClass = escrowProtocolTitleClass;

export const escrowRateHeadingClass = escrowProtocolSubheadingClass;

export const escrowRateSectionHeadingClass = escrowProtocolHeadingClass;

export const escrowRateMetaClass = escrowProtocolMetaClass;

export const escrowRateSolidBtnClass = escrowProtocolSolidBtnClass;

export const escrowRateOutlineBtnClass = escrowProtocolSecondaryBtnClass;

export const escrowRateUploadZoneClass = escrowProtocolUploadZoneClass;

export const escrowRateFooterDividerClass = escrowProtocolDividerBorderClass;
