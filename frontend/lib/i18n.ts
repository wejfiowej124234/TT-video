/**
 * i18n: 国际语言与语言切换
 * 使用 LocaleProvider + useTranslation，文案存于 locales/*.ts
 */

export type Locale = "zh" | "en";

export const LOCALE_STORAGE_KEY = "traveltrust_locale";

export const DEFAULT_LOCALE: Locale = "zh";

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "English",
};

/** 所有可选语言，下拉菜单顺序 */
export const LOCALES: Locale[] = ["zh", "en"];

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (v === "zh" || v === "en") return v;
  return null;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export type LocaleInterpolationVars = Record<string, string | number | boolean | undefined | null>;

/** 替换 `locales` 中 `{{key}}` 占位（双花括号 · 非 `{key}`） */
export function applyLocalePlaceholders(
  template: string,
  vars?: LocaleInterpolationVars,
): string {
  if (!vars || Object.keys(vars).length === 0) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key];
    if (v === undefined || v === null) return "";
    return String(v);
  });
}

export type LocaleTranslateFn = (key: string, vars?: LocaleInterpolationVars) => string;
