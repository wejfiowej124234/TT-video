/**
 * `/escrow/[id]` · 已上链 / 协议控制台壳 · L5 暖金暗色（① · 与 `/orders` 列表同源）。
 * 草稿 Experience 仍用 `escrowExperienceUi.ts`（已冻结）。
 * 机读：`escrowProtocolUi.contract.test.ts`
 */
import { TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT, TT_MARKETING_FOCUS_RING_CONSOLE } from "@/lib/marketingUi";

export const TT_ESCROW_PROTOCOL_PAGE_SHELL =
  "min-h-screen bg-gradient-to-b from-[#12100e] via-[#14100c] to-[#0a0908] text-slate-200";

export const TT_ESCROW_PROTOCOL_ZONE =
  "order-protocol-zone rounded-[var(--radius-xl)] border border-ref-sun/12 bg-gradient-to-b from-[#1a1410] via-[#14100c] to-[#0f0c0a] text-slate-100 space-y-6 p-4 md:p-6 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)]";

export const TT_ESCROW_PROTOCOL_PANEL =
  "rounded-[var(--radius-md)] border border-ref-sun/15 bg-white/[0.04] backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

export const TT_ESCROW_PROTOCOL_PANEL_INNER =
  "rounded-[var(--radius-sm)] border border-ref-sun/8 bg-black/20 p-4 space-y-3";

export const TT_ESCROW_PROTOCOL_PANEL_PADDED = `${TT_ESCROW_PROTOCOL_PANEL} p-6`;

export const TT_ESCROW_PROTOCOL_PANEL_PADDED_COMPACT = `${TT_ESCROW_PROTOCOL_PANEL} p-4`;

export const escrowProtocolHeadingClass = "text-body-l font-semibold text-ref-sun/95";

export const escrowProtocolTitleClass = "text-h4 font-semibold text-ref-sun/95";

export const escrowProtocolSubheadingClass = "text-body font-semibold text-ref-sun/90";

export const escrowProtocolMetaClass = "text-meta text-white/75 leading-relaxed";

export const escrowProtocolLinkClass =
  "text-ref-sun font-medium hover:text-[#ffe9a8] hover:underline underline-offset-2 decoration-ref-sun/50 transition-colors rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c0a]";

export const escrowProtocolInlineLinkClass = `text-small font-medium ${escrowProtocolLinkClass}`;

export const escrowProtocolFooterActionClass = `text-small ${escrowProtocolLinkClass} motion-sub motion-reduce:transition-none print:hidden`;

export const escrowProtocolSecondaryBtnClass =
  "px-4 py-2 text-small font-medium rounded-[var(--radius-md)] border border-white/25 bg-transparent text-white/90 hover:bg-white/10 hover:border-white/35 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const escrowProtocolPrimaryBtnClass =
  "px-4 py-2 text-small font-medium rounded-[var(--radius-md)] bg-ref-sun/20 text-ref-sun border border-ref-sun/35 hover:bg-ref-sun/28 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const escrowProtocolInputClass =
  "w-full rounded-[var(--radius-md)] border border-ref-sun/22 bg-[#0f0c0a]/80 text-small text-slate-100 px-3 py-2 resize-y min-h-[5rem] placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c0a]";

export const escrowProtocolSelectClass =
  `inline-flex w-full min-h-[44px] sm:max-w-xs items-center justify-start rounded-[var(--radius-md)] border border-ref-sun/22 bg-[#0f0c0a]/80 text-small text-slate-100 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c0a] ${TT_MARKETING_FOCUS_RING_CONSOLE}`;

export const escrowProtocolBreadcrumbNavClass = "mb-1 print:hidden";

export const escrowProtocolBreadcrumbListClass = "flex flex-wrap items-center gap-x-2 gap-y-1 text-meta";

export const escrowProtocolBreadcrumbLinkClass = escrowProtocolLinkClass;

export const escrowProtocolBreadcrumbCurrentClass = "text-slate-400";

export const escrowProtocolDidTitleClass = "text-h3 font-semibold tracking-tight font-mono text-ref-sun/90";

export const TT_ESCROW_PROTOCOL_SECTION = `${TT_ESCROW_PROTOCOL_PANEL_PADDED} space-y-3`;

export const escrowProtocolFocusRingClass =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c0a] rounded-[var(--radius-sm)]";

export const escrowProtocolPillFocusClass = escrowProtocolFocusRingClass;

export const TT_ESCROW_PROTOCOL_MODAL_PANEL =
  "w-full max-w-md rounded-[var(--radius-xl)] border border-ref-sun/15 bg-[#14100c]/98 backdrop-blur-md p-6 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)] space-y-4";

export const escrowProtocolModalTitleClass = escrowProtocolHeadingClass;

export const escrowProtocolModalDescClass = "text-small text-slate-300 leading-relaxed";

export const escrowProtocolSolidBtnClass = `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} disabled:opacity-50 disabled:cursor-not-allowed`;

export const escrowProtocolUploadZoneClass =
  "border-2 border-dashed border-ref-sun/28 rounded-[var(--radius-md)] p-8 text-center text-slate-300 focus-within:border-ref-sun/45 focus-within:ring-2 focus-within:ring-ref-sun/30";

export const escrowProtocolDividerBorderClass = "border-t border-ref-sun/14";

export const escrowProtocolCompactInputClass =
  "font-mono border border-ref-sun/22 rounded-[var(--radius-sm)] px-3 py-2 text-small w-full max-w-full bg-[#0f0c0a]/90 text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c0a]";

export const escrowProtocolCompactSelectClass =
  "inline-flex min-h-[44px] items-center justify-start border border-ref-sun/22 rounded-[var(--radius-sm)] px-2 py-1 text-small bg-[#0f0c0a]/90 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c0a]";

export const escrowProtocolRetryBtnClass =
  "border border-white/20 bg-white/5 text-slate-200 hover:bg-white/10";

/** ChatBlock · 协议壳消息区（`variant=did`） */
export const escrowProtocolChatShellDividerClass = "mt-3 pt-3 border-t border-ref-sun/14";

export const escrowProtocolChatMicroRibbonClass =
  "rounded-[var(--radius-md)] border border-ref-sun/15 bg-black/20 px-2 py-1.5 mb-2 flex gap-2 items-center";

export const escrowProtocolChatEmptyStateClass =
  "flex flex-col items-center justify-center flex-1 min-h-[12rem] rounded-[var(--radius-sm)] border border-ref-sun/15 bg-black/20 py-6 px-4 text-center";

export const escrowProtocolChatInputClass =
  "flex-1 min-w-0 border border-ref-sun/22 rounded-[var(--radius-sm)] px-2 py-1 text-small bg-[#0f0c0a]/90 text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c0a] disabled:opacity-60 disabled:cursor-wait";

export const escrowProtocolChatSendBtnClass = `shrink-0 ${escrowProtocolPrimaryBtnClass}`;

export const escrowProtocolChatTitleClass = "text-small font-medium text-ref-sun/90 mb-2";

export const escrowProtocolChatBodyClass = "text-small text-slate-200";

export const escrowProtocolChatMetaClass = "text-meta text-white/70";
