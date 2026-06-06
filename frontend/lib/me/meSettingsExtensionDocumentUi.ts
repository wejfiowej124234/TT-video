import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** 设置族扩展文档页（帮助 / 隐私 / 条款）· console 与 L5 排版切换 */
export function meSettingsExtensionDocTitleClass(fromSettings: boolean): string {
  return fromSettings
    ? `${TT_ME_SETTINGS_L5.title} text-left`
    : "text-h3 font-semibold text-ink-900";
}

export function meSettingsExtensionDocIntroClass(fromSettings: boolean): string {
  return fromSettings ? TT_ME_SETTINGS_L5.subtitle : "text-meta text-ink-600 mt-2";
}

export function meSettingsExtensionDocSectionTitleClass(fromSettings: boolean): string {
  return fromSettings
    ? `${TT_ME_SETTINGS_L5.sectionTitle} mt-6 text-left`
    : "text-h4 font-medium text-ink-800 mt-6";
}

export function meSettingsExtensionDocBodyClass(fromSettings: boolean): string {
  return fromSettings ? "text-small leading-relaxed text-slate-300/95" : "text-small text-ink-700";
}

export function meSettingsExtensionDocListClass(fromSettings: boolean): string {
  return fromSettings
    ? "list-disc space-y-1 pl-5 text-small text-slate-300/95"
    : "list-disc pl-5 space-y-1 text-small text-ink-700";
}

export function meSettingsExtensionDocLinkClass(fromSettings: boolean): string {
  return fromSettings
    ? `${touchTargetLink44Classes} text-small text-ref-sun/90 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`
    : `${touchTargetLink44Classes} text-small text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none`;
}

export function meSettingsExtensionDocFooterLinkClass(fromSettings: boolean): string {
  return fromSettings
    ? `${touchTargetLink44Classes} text-ref-sun/80 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`
    : `${touchTargetLink44Classes} text-travel-500 underline-offset-2 transition-colors hover:underline motion-reduce:transition-none`;
}

export function meSettingsExtensionDocDetailsClass(fromSettings: boolean): string {
  return fromSettings
    ? `${TT_ME_SETTINGS_L5.sectionCard} px-4 py-3 [&_summary]:cursor-pointer [&_summary]:text-small [&_summary]:font-medium [&_summary]:text-slate-100`
    : "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main px-4 py-3 open:shadow-soft";
}
