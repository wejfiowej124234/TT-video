import { useTranslation } from "@/components/LocaleProvider";

export type ContentTranslationLocale = "zh" | "en";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUgcContentId(id: string): boolean {
  return UUID_RE.test(id.trim());
}

/** v1：内容翻译目标 = 界面语言（顶栏 / 设置同一 `LocaleProvider`）。其它 locale 落到 zh。 */
export function resolveContentTranslationLocale(uiLocale: string): ContentTranslationLocale {
  return uiLocale === "en" ? "en" : "zh";
}

/** 市场 cache_first 与社区 on_demand 共用同一目标语言；不单独钉死。 */
export function useContentTranslationLocale(): ContentTranslationLocale {
  const { locale } = useTranslation();
  return resolveContentTranslationLocale(locale);
}
