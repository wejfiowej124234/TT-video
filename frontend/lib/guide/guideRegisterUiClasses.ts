import { authL5FieldClass, TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

export { authL5FieldClass as guideRegFieldClass };

export const guideRegLabel = TT_AUTH_L5_FORM.label;
export const guideRegTextarea = TT_AUTH_L5_FORM.textarea;
export const guideRegPrimaryCta = TT_AUTH_L5_FORM.primaryCta;
export const guideRegSecondaryBtn = TT_AUTH_L5_FORM.secondaryButton;
export const guideRegLink = TT_AUTH_L5_FORM.footerLinks;
export const guideRegCallout = TT_AUTH_L5_FORM.callout;
export const guideRegCalloutStrong = TT_AUTH_L5_FORM.calloutStrong;
export const guideRegBanner = TT_AUTH_L5_FORM.banner;
export const guideRegFileInput = TT_AUTH_L5_FORM.fileInput;
export const guideRegFileMeta = TT_AUTH_L5_FORM.fileMeta;
export const guideRegFileSelected = TT_AUTH_L5_FORM.fileSelected;
export const guideRegAgreeText = TT_AUTH_L5_FORM.agreeText;
export const guideRegError = TT_AUTH_L5_FORM.error;
export const guideRegFocusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-lg";

/** @deprecated 使用 `guideRegFieldClass` */
export const guideRegConsoleFocus = guideRegFocusRing;
