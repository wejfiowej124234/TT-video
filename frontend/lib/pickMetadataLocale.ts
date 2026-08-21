import zh from "@/locales/zh";
import en from "@/locales/en";

/** zh/en 文案包并集；`Accept-Language` 选 en 时不可收窄为 `typeof zh`（字面量文案不同）。 */
export type LocaleMessages = typeof zh | typeof en;

/**
 * Pick zh/en message bundle for static route metadata (OG/Twitter/title).
 * Honors `Accept-Language` order and q-values; defaults to en (root `html lang="en"`).
 */
/** zh/en tag for OG `locale` / `alternateLocale` (pairs with [`localeMessagesFromAcceptLanguage`]). */
export function localeFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): "zh" | "en" {
  if (acceptLanguage == null) return "en";
  const raw = acceptLanguage.trim();
  if (raw === "") return "en";

  for (const part of raw.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase() ?? "";
    if (tag === "") continue;
    if (tag.startsWith("en")) return "en";
    if (tag.startsWith("zh")) return "zh";
  }
  return "en";
}

export function localeMessagesFromAcceptLanguage(acceptLanguage: string | null | undefined): LocaleMessages {
  if (acceptLanguage == null) return en;
  const raw = acceptLanguage.trim();
  if (raw === "") return en;

  for (const part of raw.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase() ?? "";
    if (tag === "") continue;
    if (tag.startsWith("en")) return en;
    if (tag.startsWith("zh")) return zh;
  }
  return en;
}
