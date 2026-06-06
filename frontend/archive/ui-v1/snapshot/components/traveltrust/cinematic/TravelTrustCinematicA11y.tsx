"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TRAVELTRUST_CINEMATIC_A11Y_CHAPTERS } from "@/lib/traveltrustCinematicA11yChapters";

/** 3D 电影层文字替代（TT-PH1-081 / 161 · ①） */
export function TravelTrustCinematicA11y() {
  const { t } = useTranslation();
  return (
    <div className="sr-only" data-tt-traveltrust-cinematic-a11y="1">
      <p>{t("traveltrust_cinematic_sr_desc")}</p>
      <p>{t("traveltrust_cinematic_sr_desc_long")}</p>
      <p>{t("traveltrust_cinematic_sr_power_note")}</p>
      <p>{t("traveltrust_cinematic_sr_reduced_motion_note")}</p>
      <h2>{t("traveltrust_cinematic_sr_chapters_heading")}</h2>
      <ol>
        {TRAVELTRUST_CINEMATIC_A11Y_CHAPTERS.map((chapter) => (
          <li key={chapter.id} data-tt-traveltrust-cinematic-a11y-chapter={chapter.id}>
            {t(chapter.key)}
          </li>
        ))}
      </ol>
    </div>
  );
}
