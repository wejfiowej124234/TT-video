"use client";

import type { Dispatch, SetStateAction } from "react";
import { getDayDescription, type UnifiedDayRow } from "@/lib/itineraryUnified";
import { patchDraftDayCity } from "@/lib/itineraryDayContentSync";

export function EscrowDetailItineraryBudgetZoneDraftEditors({
  escrowId,
  showCityEditor,
  showDraftDayEditor,
  cityOptions,
  draftRowsAligned,
  draftDailyItinerary,
  rowsFromApi,
  setDraftDailyItinerary,
  destination,
  t,
}: {
  escrowId: string;
  showCityEditor: boolean;
  showDraftDayEditor: boolean;
  cityOptions: { value: string; label: string }[];
  draftRowsAligned: boolean;
  draftDailyItinerary: UnifiedDayRow[];
  rowsFromApi: UnifiedDayRow[];
  setDraftDailyItinerary: Dispatch<SetStateAction<UnifiedDayRow[]>>;
  destination: string;
  t: (key: string) => string;
}) {
  const rows = draftRowsAligned ? draftDailyItinerary : rowsFromApi;

  return (
    <>
      {showCityEditor && (
        <div className="rounded-[var(--radius-sm)] border border-cyan-500/25 bg-ink-950/40 p-4 space-y-3">
          <p className="text-meta text-slate-300">{t("escrow_draftDayCityHint")}</p>
          <ul className="space-y-2 list-none p-0 m-0">
            {rows.map((row, idx) => {
              const rawCity = String(row.city ?? "").trim();
              const validCityValues = new Set(cityOptions.map((c) => c.value));
              const unknownPresetCity = rawCity !== "" && !validCityValues.has(rawCity);
              return (
                <li key={`city-${row.day_index}-${idx}`} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label htmlFor={`escrow-day-city-${escrowId}-${idx}`} className="text-small font-medium text-slate-200 shrink-0 min-w-[6rem]">
                    {t("order_dayN").replace("{{n}}", String(row.day_index ?? idx + 1))}
                  </label>
                  <select
                    id={`escrow-day-city-${escrowId}-${idx}`}
                    value={rawCity}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraftDailyItinerary((prev) => {
                        const base =
                          prev.length === rowsFromApi.length ? prev.map((x) => ({ ...x })) : rowsFromApi.map((r) => ({ ...r }));
                        return patchDraftDayCity(base, idx, v.trim() ? v.trim() : undefined, destination);
                      });
                    }}
                    className="inline-flex w-full min-h-[44px] sm:max-w-xs items-center justify-start rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-950/80 text-small text-slate-100 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                    aria-invalid={unknownPresetCity ? true : undefined}
                  >
                    <option value="">{t("escrow_draftDayCityPlaceholder")}</option>
                    {unknownPresetCity ? (
                      <option value={rawCity}>{t("escrow_draftDayCityUnknownOption").replace("{{city}}", rawCity)}</option>
                    ) : null}
                    {cityOptions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {showDraftDayEditor && (
        <div className="rounded-[var(--radius-sm)] border border-cyan-500/25 bg-ink-950/40 p-4 space-y-3">
          <p className="text-meta text-slate-300">{t("escrow_draftDayNarrativeHint")}</p>
          <ul className="space-y-3 list-none p-0 m-0">
            {rows.map((row, idx) => (
              <li key={`narr-${row.day_index}-${idx}`} className="flex flex-col gap-1.5">
                <label htmlFor={`escrow-day-narrative-${escrowId}-${idx}`} className="text-small font-medium text-slate-200">
                  {t("order_dayN").replace("{{n}}", String(row.day_index ?? idx + 1))}
                </label>
                <textarea
                  id={`escrow-day-narrative-${escrowId}-${idx}`}
                  value={getDayDescription(row)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftDailyItinerary((prev) => {
                      const base =
                        prev.length === rowsFromApi.length ? prev.map((x) => ({ ...x })) : rowsFromApi.map((r) => ({ ...r }));
                      return base.map((r, i) =>
                        i === idx
                          ? {
                              ...r,
                              description: v,
                              content_text: "",
                            }
                          : r,
                      );
                    });
                  }}
                  rows={4}
                  maxLength={16000}
                  placeholder={t("escrow_draftDayNarrativePlaceholder")}
                  className="w-full rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-950/80 text-small text-slate-100 px-3 py-2 resize-y min-h-[5rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
