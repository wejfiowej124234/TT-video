"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useId } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { trackDidRankEvent } from "@/lib/analytics";
import type { GuideRankItem } from "@/lib/didRankMockData";
import {
  buildDidRankGuideHighlightSearch,
  isDidRankCommunityProfileId,
  type GuideLeaderboardSort,
  type Period,
} from "@/lib/didRankUtils";
import { formatDidRankGuideReviewLine } from "@/lib/didRankGuideReviewDisplay";

type TFunc = (key: string) => string;

/** 向导详情弹窗：赛博风，fuchsia 边框与光晕；45 useFocusTrap；本榜高亮链接与 63 清单一致 */
export default function DidRankGuideModal({
  item,
  period,
  guideSort = "weighted",
  onClose,
  t,
}: {
  item: GuideRankItem;
  period: Period;
  /** 与页级 `guide_sort` / API `sort` 一致，分享高亮链接时保留 */
  guideSort?: GuideLeaderboardSort;
  onClose: () => void;
  t: TFunc;
}) {
  const showAvatar = item.avatar_url;
  const initial = (item.nickname && item.nickname.charAt(0)) || "?";
  const focusTrapRef = useFocusTrap(true, onClose);
  const titleId = useId();
  const descId = useId();
  const [copied, setCopied] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const highlightHref = `/did-rank${buildDidRankGuideHighlightSearch(period, item.id, { guideSort })}`;
  const guideReviewLine = formatDidRankGuideReviewLine(item, t);

  const copyHighlightUrl = useCallback(async () => {
    if (typeof window === "undefined") return;
    setCopyBusy(true);
    const full = `${window.location.origin}${highlightHref}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      trackDidRankEvent("did_rank_guide_highlight_copy", { guideId: item.id, period });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    } finally {
      setCopyBusy(false);
    }
  }, [highlightHref, item.id, period]);

  useEffect(() => {
    trackDidRankEvent("did_rank_guide_modal_open", { guideId: item.id });
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
      <div ref={focusTrapRef} className="relative w-full max-w-md rounded-[var(--radius-md)] border border-fuchsia-500/40 bg-slate-900/95 backdrop-blur-md shadow-scifi-fuchsia-modal motion-sub">
        <div className="flex items-center justify-between border-b border-fuchsia-500/20 px-4 py-3">
          <h2 id={titleId} className="text-body font-semibold text-fuchsia-200">{t("didRank_guideModalTitle")}</h2>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              type="submit"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-slate-300 hover:bg-fuchsia-500/20 hover:text-fuchsia-300 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label={t("didRank_close")}
            >
              ×
            </button>
          </form>
        </div>
        <div id={descId} className="px-4 py-4 flex flex-col items-center text-center">
          {showAvatar ? (
            <Image src={item.avatar_url!} alt={item.nickname} width={64} height={64} className="w-16 h-16 rounded-full object-cover ring-2 ring-fuchsia-400/30 mb-3" unoptimized />
          ) : (
            <div className="w-16 h-16 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-h4 font-semibold text-fuchsia-300 ring-2 ring-fuchsia-400/30 mb-3">{initial}</div>
          )}
          <p className="text-body font-medium text-slate-200">{item.nickname}</p>
          <p className="text-h4 font-bold font-mono text-fuchsia-300 mt-1 drop-shadow-scifi-fuchsia">
            {item.totalAmountUsdt.toLocaleString()}
            {t("ui_currency_suffix_usdt")}
          </p>
          <p className="text-meta text-slate-300 mt-0.5">{item.receptionCount} {t("didRank_receptions")}</p>
          {guideReviewLine && <p className="text-meta text-slate-400">{guideReviewLine}</p>}
          {item.city && <p className="text-meta text-slate-400">{item.city}</p>}
          <Link
            href={`/guides/${item.id}`}
            onClick={() => { trackDidRankEvent("did_rank_guide_click", { guideId: item.id }); onClose(); }}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-fuchsia-400/50 bg-fuchsia-500/20 px-4 py-2 text-small font-medium text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/30 motion-sub"
          >
            {t("didRank_goToDetail")}
          </Link>
          {isDidRankCommunityProfileId(item.id) ? (
            <Link
              href={`/community/user/${item.id}`}
              onClick={() => {
                trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "guide" });
                onClose();
              }}
              className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-slate-500/40 bg-slate-800/50 px-4 py-2 text-small font-medium text-slate-200 hover:bg-slate-700/50 motion-sub"
            >
              {t("didRank_viewCommunityProfile")}
            </Link>
          ) : null}
          <div className="mt-3 w-full flex flex-col gap-2">
            <Link
              href={highlightHref}
              onClick={() => {
                trackDidRankEvent("did_rank_guide_highlight_open", { guideId: item.id, period });
                onClose();
              }}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded border border-fuchsia-500/35 bg-fuchsia-500/10 px-4 py-2 text-small font-medium text-fuchsia-200 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub text-center"
            >
              {t("didRank_openGuideHighlight")}
            </Link>
            <form
              className="w-full"
              onSubmit={(e) => {
                e.preventDefault();
                void copyHighlightUrl();
              }}
            >
              <button
                type="submit"
                disabled={copyBusy}
                aria-busy={copyBusy ? true : undefined}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded border border-fuchsia-500/25 px-4 py-2 text-small text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/10 motion-sub disabled:opacity-60 disabled:cursor-wait"
              >
                {copied ? t("didRank_copyHighlightDone") : t("didRank_copyHighlightLink")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
