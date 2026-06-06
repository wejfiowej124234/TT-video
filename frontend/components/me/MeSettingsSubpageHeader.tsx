"use client";

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 设置族子页标题块（eyebrow + h1 + 可选副标题） */
export function MeSettingsSubpageHeader({
  t,
  eyebrowKey,
  titleKey,
  subtitleKey,
  titleId,
}: {
  t: (key: string) => string;
  eyebrowKey: string;
  titleKey: string;
  subtitleKey?: string;
  titleId?: string;
}) {
  return (
    <header className={TT_ME_SETTINGS_L5.headerBlock}>
      <p className={TT_ME_SETTINGS_L5.eyebrow}>{t(eyebrowKey)}</p>
      <h1 id={titleId} className={TT_AUTH_L5_FORM.titleCompact}>
        {t(titleKey)}
      </h1>
      {subtitleKey ? <p className={TT_ME_SETTINGS_L5.subtitle}>{t(subtitleKey)}</p> : null}
    </header>
  );
}
