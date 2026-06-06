"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useId } from "react";
import { DidRankModalMotion } from "@/components/did-rank/DidRankModalMotion";
import { trackDidRankEvent } from "@/lib/analytics";
import type { GuideRankItem } from "@/lib/didRankTypes";
import {
  buildDidRankGuideHighlightSearch,
  isDidRankCommunityProfileId,
  type GuideLeaderboardSort,
  type Period,
} from "@/lib/didRankUtils";
import { formatDidRankGuideReviewLine } from "@/lib/didRankGuideReviewDisplay";
import { TT_MARKETING_DID_RANK_PATH, TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

type TFunc = (key: string) => string;

/** 向导详情弹窗：暖金壳（与 `DidRankRecordModal` 同族）；45 useFocusTrap */
export default function DidRankGuideModal({
  item,
  period,
  guideSort = "weighted",
  onClose,
  t,
}: {
  item: GuideRankItem;
  period: Period;
  guideSort?: GuideLeaderboardSort;
  onClose: () => void;
  t: TFunc;
}) {
  const showAvatar = item.avatar_url;
  const initial = (item.nickname && item.nickname.charAt(0)) || "?";
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
    <DidRankModalMotion
      onClose={onClose}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descId}
      shellClassName={TT_MARKETING_DID_RANK_PATH.modalShell}
    >
        <div className={`flex items-center justify-between px-4 py-3 ${TT_MARKETING_DID_RANK_PATH.modalHeaderBorder}`}>
          <h2 id={titleId} className={TT_MARKETING_DID_RANK_PATH.modalTitle}>
            {t("didRank_guideModalTitle")}
          </h2>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button type="submit" className={TT_MARKETING_DID_RANK_PATH.modalCloseBtn} aria-label={t("didRank_close")}>
              ×
            </button>
          </form>
        </div>
        <div id={descId} className="px-4 py-4 flex flex-col items-center text-center">
          {showAvatar ? (
            <Image
              src={item.avatar_url!}
              alt={item.nickname}
              width={64}
              height={64}
              className={`w-16 h-16 rounded-full object-cover mb-3 ${TT_MARKETING_DID_RANK_PATH.modalAvatarRing}`}
              unoptimized
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-h4 font-semibold mb-3 ${TT_MARKETING_DID_RANK_PATH.modalAvatarRing} ${TT_MARKETING_DID_RANK_PATH.modalAvatarFallback}`}
            >
              {initial}
            </div>
          )}
          <p className="text-body font-medium text-slate-200">{item.nickname}</p>
          <p className={TT_MARKETING_DID_RANK_PATH.modalStatValue}>
            {item.totalAmountUsdt.toLocaleString()}
            {t("ui_currency_suffix_usdt")}
          </p>
          <p className="text-meta text-slate-300 mt-0.5">
            {item.receptionCount} {t("didRank_receptions")}
          </p>
          {guideReviewLine && <p className="text-meta text-slate-400">{guideReviewLine}</p>}
          {item.city && <p className="text-meta text-slate-400">{item.city}</p>}
          {isDidRankCommunityProfileId(item.id) ? (
            <Link
              href={`/community/user/${item.id}`}
              onClick={() => {
                trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "guide" });
                onClose();
              }}
              className={TT_MARKETING_DID_RANK_PATH.modalPrimaryLink}
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
              className={TT_MARKETING_DID_RANK_PATH.modalHighlightLink}
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
              <button type="submit" disabled={copyBusy} aria-busy={copyBusy ? true : undefined} className={TT_MARKETING_DID_RANK_PATH.modalGhostBtn}>
                {copied ? t("didRank_copyHighlightDone") : t("didRank_copyHighlightLink")}
              </button>
            </form>
          </div>
        </div>
    </DidRankModalMotion>
  );
}
