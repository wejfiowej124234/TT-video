"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";

const TRIGGER =
  "flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-ref-sun/50 bg-ref-sun/[0.12] px-4 py-3 text-left text-slate-100 transition-colors motion-reduce:transition-none hover:border-ref-sun/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

const MENU =
  "absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-ref-sun/38 bg-[#0c0a09]/95 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl";

const ITEM_BASE =
  "flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors motion-reduce:transition-none focus:outline-none focus-visible:bg-ref-sun/[0.08]";

export function MeSettingsLanguagePicker() {
  const { t, locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (loc: Locale) => {
    setLocale(loc);
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef} data-tt-me-settings-language-picker="1">
      <button
        type="button"
        className={TRIGGER}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("me_settings_language_aria")}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span className="block text-small font-semibold">{LOCALE_LABELS[locale]}</span>
          <span className="mt-0.5 block text-meta text-slate-400/95">
            {locale === "zh" ? t("me_settings_language_desc_zh") : t("me_settings_language_desc_en")}
          </span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-ref-sun/80 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      {open ? (
        <div role="listbox" className={MENU} aria-label={t("me_settings_language_aria")}>
          {LOCALES.map((loc: Locale) => {
            const active = locale === loc;
            return (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(loc)}
                className={`${ITEM_BASE} ${active ? "bg-ref-sun/[0.12] text-slate-100" : "text-slate-300 hover:bg-ref-sun/[0.06]"}`}
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
      ) : null}
    </div>
  );
}
