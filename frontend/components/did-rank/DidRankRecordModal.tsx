"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useId } from "react";
import { DidRankModalMotion } from "@/components/did-rank/DidRankModalMotion";
import { trackDidRankEvent } from "@/lib/analytics";
import type { TravelerRankItem } from "@/lib/didRankTypes";
import {
  buildDidRankTravelerHighlightSearch,
  isDidRankCommunityProfileId,
  type Period,
} from "@/lib/didRankUtils";
import {
  TT_MARKETING_BTN_MARKET_GHOST,
  TT_MARKETING_BTN_MARKET_PRIMARY,
  TT_MARKETING_DID_RANK_SURFACE,
} from "@/lib/marketingUi";

type TFunc = (key: string) => string;

/** 战绩弹窗：暖色边框与 CTA；45 useFocusTrap；63 清单·旅行者榜高亮链接 */
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
    <DidRankModalMotion
      onClose={onClose}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descId}
      shellClassName={TT_MARKETING_DID_RANK_SURFACE.recordModalShell}
    >
        <div className="flex items-center justify-between border-b border-ref-sun/20 px-4 py-3">
          <h2 id={titleId} className="text-body font-semibold text-ref-sun">
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
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-slate-300 hover:bg-ref-sun/15 hover:text-ref-sun motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label={t("didRank_close")}
            >
              ×
            </button>
          </form>
        </div>
        <div id={descId} className="px-4 py-4 space-y-3">
          <p className="text-meta text-slate-300">
            {item.countriesCount} {t("didRank_countriesShort")} · {item.citiesCount} {t("didRank_citiesShort")} ·{" "}
            {item.totalSpentUsdt.toLocaleString()}
            {t("ui_currency_suffix_usdt")}
          </p>
          {hasRecord ? (
            <>
              {item.countries?.length ? (
                <p className="text-small text-slate-300">
                  <span className="text-ref-sun">{t("didRank_countries")}:</span> {item.countries.join("、")}
                </p>
              ) : null}
              {item.cities?.length ? (
                <p className="text-small text-slate-300">
                  <span className="text-ref-sun">{t("didRank_cities")}:</span> {item.cities.join("、")}
                </p>
              ) : null}
            </>
          ) : null}
          <div className="flex flex-col gap-2 pt-2 border-t border-ref-sun/15">
            {isDidRankCommunityProfileId(item.id) ? (
              <Link
                href={`/community/user/${item.id}`}
                onClick={() => {
                  trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "traveler" });
                  onClose();
                }}
                className={`${TT_MARKETING_DID_RANK_SURFACE.modalGhostBtn} text-center`}
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
                className={`${TT_MARKETING_BTN_MARKET_PRIMARY} text-center sm:flex-1`}
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
                  className={`${TT_MARKETING_BTN_MARKET_GHOST} w-full disabled:opacity-60 disabled:cursor-wait`}
                >
                  {copied ? t("didRank_copyHighlightDone") : t("didRank_copyHighlightLink")}
                </button>
              </form>
            </div>
          </div>
        </div>
    </DidRankModalMotion>
  );
}
