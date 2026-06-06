"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/components/LocaleProvider";
import { getDayDescription, getDayImages, type UnifiedDayRow } from "@/lib/itineraryUnified";
import {
  escrowExperienceControlClass,
  escrowExperienceInputClass,
  escrowExperienceMetaClass,
  escrowExperienceMutedLinkClass,
} from "@/lib/escrowExperienceUi";

export interface EscrowDraftDayNarrativePanelProps {
  escrowId: string;
  rowsFromApi: UnifiedDayRow[];
  draftRowsAligned: boolean;
  draftDailyItinerary: UnifiedDayRow[];
  setDraftDailyItinerary: React.Dispatch<React.SetStateAction<UnifiedDayRow[]>>;
  onDirty: () => void;
  panelInnerClass: string;
  zoneMetaClass: string;
  zoneDayLabelClass: string;
  /** 保存成功后回到预览 */
  resetViewAfterSave?: boolean;
  /** API 行程修订键；变化时强制回到预览（避免默认停在编辑框） */
  contentRevisionKey?: string;
  /** 区标题下已有引导文案时，预览模式不再重复长说明 */
  hideViewModeLeadHint?: boolean;
}

export default function EscrowDraftDayNarrativePanel({
  escrowId,
  rowsFromApi,
  draftRowsAligned,
  draftDailyItinerary,
  setDraftDailyItinerary,
  onDirty,
  panelInnerClass,
  zoneMetaClass,
  zoneDayLabelClass,
  resetViewAfterSave = false,
  contentRevisionKey = "",
  hideViewModeLeadHint = false,
}: EscrowDraftDayNarrativePanelProps) {
  const { t } = useTranslation();
  const rowsToShow = draftRowsAligned ? draftDailyItinerary : rowsFromApi;
  const hasNarrative = rowsToShow.some((r) => getDayDescription(r).trim().length > 0);
  const [mode, setMode] = useState<"view" | "edit">(() => (hasNarrative ? "view" : "edit"));

  useEffect(() => {
    setMode(hasNarrative ? "view" : "edit");
  }, [hasNarrative, escrowId, contentRevisionKey]);

  useEffect(() => {
    if (resetViewAfterSave) setMode("view");
  }, [resetViewAfterSave]);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "view" ? "edit" : "view"));
  }, []);

  return (
    <div className={panelInnerClass}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        {!(mode === "view" && hasNarrative && hideViewModeLeadHint) ? (
          <p className={`${zoneMetaClass} m-0 flex-1 min-w-[12rem]`}>
            {mode === "view" && hasNarrative
              ? t("escrow_draftDayNarrativeHint_view")
              : t("escrow_draftDayNarrativeHint")}
          </p>
        ) : (
          <span className="sr-only">{t("escrow_draftDayNarrativeHint_view")}</span>
        )}
        {hasNarrative ? (
          <button type="button" onClick={toggleMode} className={escrowExperienceMutedLinkClass}>
            {mode === "view" ? t("escrow_draftSwitchToEdit") : t("escrow_draftSwitchToPreview")}
          </button>
        ) : null}
      </div>

      {mode === "view" && hasNarrative ? (
        <ul className="space-y-4 list-none p-0 m-0" role="list">
          {rowsToShow.map((row, idx) => {
            const desc = getDayDescription(row);
            const images = getDayImages(row);
            const city = String(row.city ?? "").trim();
            const dayLabel = t("order_dayN").replace("{{n}}", String(row.day_index ?? idx + 1));
            return (
              <li
                key={`view-${row.day_index}-${idx}`}
                className="rounded-[var(--radius-md)] border border-ref-sun/12 bg-black/25 p-4 space-y-2"
              >
                <h4 className="text-small font-semibold text-ref-sun/95">
                  {city ? `${city} · ${dayLabel}` : dayLabel}
                </h4>
                {desc ? (
                  <p className="text-small text-white/85 leading-relaxed whitespace-pre-wrap">{desc}</p>
                ) : (
                  <p className={`${escrowExperienceMetaClass} italic`}>{t("escrow_draftDayEmpty")}</p>
                )}
                {images.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1" role="list" aria-label={t("escrow_draftPreviewImages_aria")}>
                    {images.slice(0, 4).map((src, i) => (
                      <span
                        key={i}
                        className="relative w-16 h-16 rounded-[var(--radius-sm)] overflow-hidden border border-ref-sun/18"
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized />
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {rowsToShow.map((row, idx) => (
            <li key={`narr-${row.day_index}-${idx}`} className="flex flex-col gap-1.5">
              <label htmlFor={`escrow-day-narrative-${escrowId}-${idx}`} className={zoneDayLabelClass}>
                {t("order_dayN").replace("{{n}}", String(row.day_index ?? idx + 1))}
              </label>
              <textarea
                id={`escrow-day-narrative-${escrowId}-${idx}`}
                value={getDayDescription(row)}
                onChange={(e) => {
                  const v = e.target.value;
                  onDirty();
                  setDraftDailyItinerary((prev) => {
                    const base =
                      prev.length === rowsFromApi.length
                        ? prev.map((x) => ({ ...x }))
                        : rowsFromApi.map((r) => ({ ...r }));
                    return base.map((r, i) =>
                      i === idx ? { ...r, description: v, content_text: "" } : r,
                    );
                  });
                }}
                rows={4}
                maxLength={16000}
                placeholder={t("escrow_draftDayNarrativePlaceholder")}
                className={escrowExperienceInputClass}
              />
            </li>
          ))}
        </ul>
      )}

      {mode === "edit" && hasNarrative ? (
        <button type="button" className={`${escrowExperienceControlClass} mt-3`} onClick={toggleMode}>
          {t("escrow_draftSwitchToPreview")}
        </button>
      ) : null}
    </div>
  );
}
