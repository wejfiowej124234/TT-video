/**
 * i18n: 国际语言与语言切换
 * 使用 LocaleProvider + useTranslation，文案存于 locales/*.ts
 */

export type Locale = "zh" | "en";

/** v3: drop inherited Official zh from v2 so first paint follows DEFAULT_LOCALE=en until the user picks a language. */
export const LOCALE_STORAGE_KEY = "traveltrust_locale_v3";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

/** 所有可选语言，下拉菜单顺序（英文默认 · 中文可选） */
export const LOCALES: Locale[] = ["en", "zh"];

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
