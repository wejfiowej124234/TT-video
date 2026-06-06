import { AUTH_L5_VISUAL_DATA_ATTR, TT_AUTH_L5_PAGE_COLUMN, TT_AUTH_L5_PAGE_SHELL_GUIDE } from "@/lib/auth/authL5Shell";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

export const TT_PROVIDER_REGISTER_L5 = {
  pageShell: TT_AUTH_L5_PAGE_SHELL_GUIDE,
  pageColumn: `${TT_AUTH_L5_PAGE_COLUMN} max-w-lg`,
  headerBlock: TT_AUTH_L5_FORM.headerBlock,
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.16em] text-ref-sun/70",
  title: TT_AUTH_L5_FORM.titleLogin,
  intro: TT_AUTH_L5_FORM.bodyText,
  formSection: TT_AUTH_L5_FORM.formSection,
  footerLinks: "mt-6 flex flex-wrap gap-x-4 gap-y-2",
  footerLink: TT_AUTH_L5_FORM.footerLinks,
  statusCardWrap: "w-full max-w-lg",
  pendingStatusBadge:
    "inline-flex min-h-[28px] items-center rounded-full border border-ref-sun/40 bg-ref-sun/12 px-3 text-[11px] font-semibold tracking-wide text-ref-sun shadow-[0_0_12px_rgba(252,164,124,0.14)]",
  pendingActions: "mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap",
} as const;

export function providerRegisterL5MainDataAttrs(): Record<string, string> {
  return {
    "data-tt-provider-register-page": "1",
    "data-tt-provider-register-l5": "1",
    "data-tt-auth-visual": AUTH_L5_VISUAL_DATA_ATTR,
    "data-tt-auth-route": "register",
  };
}
