"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useId } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { trackDidRankEvent } from "@/lib/analytics";
import type { TravelerRankItem } from "@/lib/didRankMockData";
import {
  buildDidRankTravelerHighlightSearch,
  isDidRankCommunityProfileId,
  type Period,
} from "@/lib/didRankUtils";

type TFunc = (key: string) => string;

/** 战绩弹窗：赛博风，cyan 边框与光晕；45 useFocusTrap；63 清单·旅行者榜高亮链接 */
export default function DidRankRecordModal({
  item,
  period,
  onClose,
  t,
}: {
  item: TravelerRankItem;
  period: Period;
  onClose: () => void;
  t: TFunc;
}) {
  const hasRecord = (item.countries?.length ?? 0) > 0 || (item.cities?.length ?? 0) > 0;
  const focusTrapRef = useFocusTrap(true, onClose);
  const titleId = useId();
  const descId = useId();
  const [copied, setCopied] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const highlightHref = `/did-rank${buildDidRankTravelerHighlightSearch(period, item.id)}`;

  const copyHighlightUrl = useCallback(async () => {
    if (typeof window === "undefined") return;
    setCopyBusy(true);
    const full = `${window.location.origin}${highlightHref}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      trackDidRankEvent("did_rank_traveler_highlight_copy", { travelerId: item.id, period });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    } finally {
      setCopyBusy(false);
    }
  }, [highlightHref, item.id, period]);

  useEffect(() => {
    trackDidRankEvent("did_rank_record_modal_open", { travelerId: item.id });
  }, [item.id]);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" aria-hidden onClick={onClose} />
      <div ref={focusTrapRef} className="relative w-full max-w-md rounded-[var(--radius-md)] border border-cyan-500/40 bg-slate-900/95 backdrop-blur-md shadow-scifi-modal-tint motion-sub">
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 py-3">
          <h2 id={titleId} className="text-body font-semibold text-cyan-200">
            {item.nickname} · {t("didRank_recordModalTitle")}
          </h2>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              type="submit"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-100 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label={t("didRank_close")}
            >
              ×
            </button>
          </form>
        </div>
        <div id={descId} className="px-4 py-4 space-y-3">
          <p className="text-meta text-slate-300">
            {item.countriesCount} {t("didRank_countriesShort")} · {item.citiesCount} {t("didRank_citiesShort")} · {item.totalSpentUsdt.toLocaleString()}
            {t("ui_currency_suffix_usdt")}
          </p>
          {hasRecord ? (
            <>
              {item.countries?.length ? (
                <p className="text-small text-slate-300"><span className="text-cyan-300">{t("didRank_countries")}:</span> {item.countries.join("、")}</p>
              ) : null}
              {item.cities?.length ? (
                <p className="text-small text-slate-300"><span className="text-cyan-300">{t("didRank_cities")}:</span> {item.cities.join("、")}</p>
              ) : null}
            </>
          ) : null}
          <div className="flex flex-col gap-2 pt-2 border-t border-cyan-500/15">
            {isDidRankCommunityProfileId(item.id) ? (
              <Link
                href={`/community/user/${item.id}`}
                onClick={() => {
                  trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "traveler" });
                  onClose();
                }}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-slate-500/40 bg-slate-800/50 px-3 py-2 text-small font-medium text-slate-200 hover:bg-slate-700/50 motion-sub text-center"
              >
                {t("didRank_viewCommunityProfile")}
              </Link>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href={highlightHref}
                onClick={() => {
                  trackDidRankEvent("did_rank_traveler_highlight_open", { travelerId: item.id, period });
                  onClose();
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-cyan-400/50 bg-cyan-500/20 px-3 py-2 text-small font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub text-center sm:flex-1"
              >
                {t("didRank_openTravelerHighlight")}
              </Link>
              <form
                className="sm:flex-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  void copyHighlightUrl();
                }}
              >
                <button
                  type="submit"
                  disabled={copyBusy}
                  aria-busy={copyBusy ? true : undefined}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-cyan-500/30 px-3 py-2 text-small text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/15 motion-sub disabled:opacity-60 disabled:cursor-wait"
                >
                  {copied ? t("didRank_copyHighlightDone") : t("didRank_copyHighlightLink")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
