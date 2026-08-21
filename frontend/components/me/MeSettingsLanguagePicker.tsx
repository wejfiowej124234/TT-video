"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";

const LANG_OPTION_BASE =
  "flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

const LANG_OPTION_ACTIVE =
  "border-ref-sun/50 bg-ref-sun/[0.12] text-slate-100 hover:border-ref-sun/60";

const LANG_OPTION_IDLE =
  "border-ref-sun/22 bg-[#0c0a09]/62 text-slate-300 hover:border-ref-sun/38 hover:bg-ref-sun/[0.06] backdrop-blur-2xl";

export function MeSettingsLanguagePicker() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div
      className="flex flex-col gap-2"
      role="listbox"
      aria-label={t("me_settings_language_aria")}
      data-tt-me-settings-language-picker="1"
    >
      {LOCALES.map((loc: Locale) => {
        const active = locale === loc;
        return (
          <button
            key={loc}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => setLocale(loc)}
            className={`${LANG_OPTION_BASE} ${active ? LANG_OPTION_ACTIVE : LANG_OPTION_IDLE}`}
          >
            <span>
              <span className="block text-small font-semibold">{LOCALE_LABELS[loc]}</span>
              <span className="mt-0.5 block text-meta text-slate-400/95">
                {loc === "zh" ? t("me_settings_language_desc_zh") : t("me_settings_language_desc_en")}
              </span>
            </span>
            {active ? (
              <span className="shrink-0 rounded-md border border-ref-sun/28 bg-ref-sun/12 px-2 py-0.5 text-[10px] font-semibold text-ref-sun/90">
                {t("me_settings_language_active")}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
