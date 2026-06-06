/**

 * `/auth/login` · L5 认证页视觉（暖金深色玻璃 · 与 `authL5Form` 同族）。

 * 机读：`loginPageL5.contract.test.ts` · `authLoginUiFreeze.contract.test.ts`（UI 冻结见 evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md）

 */

import {

  TT_AUTH_L5_CROSS_NAV_LABEL,

  TT_AUTH_L5_CROSS_NAV_SHELL,

  TT_AUTH_L5_PAGE_COLUMN,

  TT_AUTH_L5_PAGE_SHELL,

} from "@/lib/auth/authL5Shell";

import { TT_AUTH_L5_FORM, TT_AUTH_L5_TITLE_GRADIENT } from "@/lib/auth/authL5Form";



export { TT_AUTH_L5_TITLE_GRADIENT as TT_AUTH_LOGIN_TITLE_GRADIENT };



/** @deprecated 新代码优先 `TT_AUTH_L5_FORM`；保留登录页与 contract 兼容 */

export const TT_AUTH_LOGIN_L5 = {

  pageShell: TT_AUTH_L5_PAGE_SHELL,

  pageColumn: TT_AUTH_L5_PAGE_COLUMN,

  cardWrap: TT_AUTH_L5_FORM.cardWrap,

  cardHalo: "auth-login-l5-card-halo pointer-events-none absolute left-1/2 top-[42%] z-0 h-[min(22rem,52vh)] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2",

  card: TT_AUTH_L5_FORM.card,

  cardSheen: TT_AUTH_L5_FORM.cardSheen,

  cardInnerGlow: TT_AUTH_L5_FORM.cardInnerGlow,

  cardBody: TT_AUTH_L5_FORM.cardBodyLogin,

  headerBlock: TT_AUTH_L5_FORM.headerBlock,

  eyebrow: TT_AUTH_L5_FORM.eyebrow,

  title: TT_AUTH_L5_FORM.titleLogin,

  subtitle: TT_AUTH_L5_FORM.subtitle,

  walletHint: `${TT_AUTH_L5_FORM.callout} ${TT_AUTH_L5_FORM.walletHint}`,

  walletHintStrong: TT_AUTH_L5_FORM.calloutStrong,

  formSection: TT_AUTH_L5_FORM.formSection,

  fieldGroup: TT_AUTH_L5_FORM.fieldGroup,

  label: TT_AUTH_L5_FORM.label,

  field: TT_AUTH_L5_FORM.field,

  fieldInvalid: TT_AUTH_L5_FORM.fieldInvalid,

  fieldFocus: TT_AUTH_L5_FORM.fieldFocus,

  rememberRow: TT_AUTH_L5_FORM.rememberRow,

  rememberLabel: TT_AUTH_L5_FORM.rememberLabel,

  primaryCta: TT_AUTH_L5_FORM.primaryCtaLogin,

  primaryCtaSpinner: TT_AUTH_L5_FORM.primaryCtaSpinner,

  footerDivider: TT_AUTH_L5_FORM.footerDivider,

  footerMeta: TT_AUTH_L5_FORM.footerMeta,

  footerLinks: TT_AUTH_L5_FORM.footerLinks,

  passwordToggle: TT_AUTH_L5_FORM.passwordToggle,

  passwordFieldWrap: TT_AUTH_L5_FORM.passwordFieldWrap,

  error: TT_AUTH_L5_FORM.error,

  crossNavShell: TT_AUTH_L5_CROSS_NAV_SHELL,

  crossNavLabel: TT_AUTH_L5_CROSS_NAV_LABEL,

  loadingSkeletonCard: TT_AUTH_L5_FORM.loadingSkeletonCard,

  loadingPulse: TT_AUTH_L5_FORM.loadingPulse,

} as const;



export const AUTH_LOGIN_REMEMBER_EMAIL_KEY = "traveltrust_auth_remember_email_v1";


