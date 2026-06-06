"use client";

import { useRef, useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { HeaderUtilityMenuL5Chrome } from "@/components/header/HeaderUtilityMenuL5Chrome";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import {
  headerUtilityMenuL5ShellClass,
  TT_HEADER_UTILITY_MENU_L5,
} from "@/lib/header/headerUtilityMenuL5";
import {
  TT_MARKETING_HEADER_FOCUS_RING_DARK,
  TT_MARKETING_HEADER_FOCUS_RING_LIGHT,
  TT_MARKETING_HEADER_LANG_BTN_AUTH_L5,
  TT_MARKETING_HEADER_LANG_BTN_COMMUNITY,
  TT_MARKETING_HEADER_LANG_BTN_DARK,
  TT_MARKETING_HEADER_LANG_BTN_LIGHT,
  TT_MARKETING_HEADER_LANG_MENU_DARK,
  TT_MARKETING_HEADER_LANG_MENU_ITEM_DARK,
  TT_MARKETING_HEADER_LANG_MENU_ITEM_LIGHT,
  TT_MARKETING_HEADER_LANG_MENU_LIGHT,
} from "@/lib/marketingUi";
import type { HeaderUtilityVariant } from "@/lib/uiSystem";

type HeaderLanguageSwitcherProps = {
  /** `authL5` = `/auth/*` 暖金 utility；`dark` = 深顶栏；`light` = Console */
  variant?: HeaderUtilityVariant;
};

export function HeaderLanguageSwitcher({ variant = "light" }: HeaderLanguageSwitcherProps) {
  const { t, locale, setLocale } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const isAuthL5 = variant === "authL5";
  const isCommunity = variant === "community";
  const isDark = variant === "dark" || isCommunity || isAuthL5;

  useEffect(() => {
    if (!langOpen) return;
    const close = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [langOpen]);

  useEffect(() => {
    if (!langOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [langOpen]);

  const btnClass = isAuthL5
    ? `${TT_MARKETING_HEADER_LANG_BTN_AUTH_L5} ${TT_MARKETING_HEADER_FOCUS_RING_DARK} ${langOpen ? TT_HEADER_UTILITY_MENU_L5.buttonOpen : ""}`
    : isCommunity
      ? `${TT_MARKETING_HEADER_LANG_BTN_COMMUNITY} ${TT_MARKETING_HEADER_FOCUS_RING_DARK}`
      : isDark
        ? `${TT_MARKETING_HEADER_LANG_BTN_DARK} ${TT_MARKETING_HEADER_FOCUS_RING_DARK}`
        : `${TT_MARKETING_HEADER_LANG_BTN_LIGHT} ${TT_MARKETING_HEADER_FOCUS_RING_LIGHT}`;

  const menuClass = isAuthL5
    ? headerUtilityMenuL5ShellClass("narrow")
    : isDark
      ? TT_MARKETING_HEADER_LANG_MENU_DARK
      : TT_MARKETING_HEADER_LANG_MENU_LIGHT;

  const itemClass = (active: boolean) => {
    if (isAuthL5) {
      return [TT_HEADER_UTILITY_MENU_L5.item, active ? TT_HEADER_UTILITY_MENU_L5.itemActive : ""].filter(Boolean).join(" ");
    }
    return isDark
      ? `${TT_MARKETING_HEADER_LANG_MENU_ITEM_DARK} ${active ? "font-medium text-white" : ""}`
      : `${TT_MARKETING_HEADER_LANG_MENU_ITEM_LIGHT} ${active ? "font-medium text-[#9a5f18]" : ""}`;
  };

  return (
    <div className="relative shrink-0" ref={langRef}>
      <button
        type="button"
        data-tt-header-lang-switcher="1"
        data-tt-header-utility-l5={isAuthL5 ? "1" : undefined}
        onClick={() => setLangOpen((o) => !o)}
        className={btnClass}
        aria-expanded={langOpen}
        aria-haspopup="listbox"
        aria-label={t("header_lang")}
      >
        <span>{LOCALE_LABELS[locale]}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${langOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      {langOpen && (
        <div
          role="listbox"
          data-tt-header-lang-menu-l5={isAuthL5 ? "1" : undefined}
          className={isAuthL5 ? menuClass : menuClass}
        >
          {isAuthL5 ? <HeaderUtilityMenuL5Chrome /> : null}
          <div className={isAuthL5 ? `${TT_HEADER_UTILITY_MENU_L5.dropdownBody} gap-0.5 px-1.5 py-0.5` : undefined}>
            {LOCALES.map((loc: Locale) => (
              <div key={loc} role="option" aria-selected={locale === loc}>
                <form
                  className="contents"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setLocale(loc);
                    setLangOpen(false);
                  }}
                >
                  <button type="submit" className={itemClass(locale === loc)}>
                    {LOCALE_LABELS[loc]}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
