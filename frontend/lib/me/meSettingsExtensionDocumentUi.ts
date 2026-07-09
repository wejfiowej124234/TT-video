import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** 设置族扩展文档页 · L5 暖金排版（公开页与 settings 扩展同源） */
export function meSettingsExtensionDocTitleClass(_fromSettings?: boolean): string {
  return `${TT_ME_SETTINGS_L5.title} text-left`;
}

export function meSettingsExtensionDocIntroClass(_fromSettings?: boolean): string {
  return TT_ME_SETTINGS_L5.subtitle;
}

export function meSettingsExtensionDocSectionTitleClass(_fromSettings?: boolean): string {
  return `${TT_ME_SETTINGS_L5.sectionTitle} mt-6 text-left`;
}

export function meSettingsExtensionDocBodyClass(_fromSettings?: boolean): string {
  return "text-small leading-relaxed text-slate-300/95";
}

export function meSettingsExtensionDocListClass(_fromSettings?: boolean): string {
  return "list-disc space-y-1 pl-5 text-small text-slate-300/95";
}

export function meSettingsExtensionDocLinkClass(_fromSettings?: boolean): string {
  return `${touchTargetLink44Classes} text-small text-ref-sun/90 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`;
}

export function meSettingsExtensionDocFooterLinkClass(_fromSettings?: boolean): string {
  return `${touchTargetLink44Classes} text-ref-sun/80 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`;
}

export function meSettingsExtensionDocDetailsClass(_fromSettings?: boolean): string {
  return `${TT_ME_SETTINGS_L5.sectionCard} px-4 py-3 [&_summary]:cursor-pointer [&_summary]:text-small [&_summary]:font-medium [&_summary]:text-slate-100`;
}
