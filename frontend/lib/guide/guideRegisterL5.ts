/**
 * `/guide/register` · Auth L5 同族（暖金暗玻璃 · ① 本地）。
 */
import { AUTH_L5_VISUAL_DATA_ATTR, TT_AUTH_L5_PAGE_COLUMN, TT_AUTH_L5_PAGE_SHELL_GUIDE } from "@/lib/auth/authL5Shell";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

export const GUIDE_REGISTER_L5_ROUTE = "register" as const;

export const TT_GUIDE_REGISTER_L5 = {
  pageShell: TT_AUTH_L5_PAGE_SHELL_GUIDE,
  pageColumn: `${TT_AUTH_L5_PAGE_COLUMN} max-w-lg`,
  headerBlock: TT_AUTH_L5_FORM.headerBlock,
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.16em] text-ref-sun/70",
  title: TT_AUTH_L5_FORM.titleLogin,
  intro: TT_AUTH_L5_FORM.bodyText,
  didSection: "flex flex-col gap-4 rounded-xl border border-ref-sun/18 bg-ref-sun/[0.04] p-4",
  didSectionTitle: TT_AUTH_L5_FORM.sectionTitle,
  formSection: TT_AUTH_L5_FORM.formSection,
  footerLinks: "mt-6 flex flex-wrap gap-x-4 gap-y-2",
  footerLink: TT_AUTH_L5_FORM.footerLinks,
  statusCardWrap: "w-full max-w-lg",
} as const;

export function guideRegisterL5MainDataAttrs(): Record<string, string> {
  return {
    "data-tt-guide-register-page": "1",
    "data-tt-guide-register-l5": "1",
    "data-tt-guide-register-ui-frozen": "1",
    "data-tt-auth-visual": AUTH_L5_VISUAL_DATA_ATTR,
    "data-tt-auth-route": GUIDE_REGISTER_L5_ROUTE,
  };
}
