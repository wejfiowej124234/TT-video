"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import type { TravelerRankItem } from "@/lib/didRankTypes";
import { isDidRankCommunityProfileId } from "@/lib/didRankUtils";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import type { TravelerRankTFunc } from "@/components/did-rank/travelerRankBlockTypes";
import { formatTravelerCompletedOrdersDisplay } from "@/components/did-rank/travelerRankBlockCompletedOrdersDisplay";
import { DidRankRankDeltaBadge } from "@/components/did-rank/DidRankRankDeltaBadge";
import { DID_RANK_AVATAR_LIST_ROW_BOX } from "@/lib/didRankAvatarClasses";
import { didRankRankRowSurfaceClass } from "@/lib/didRankListRow";

export const TravelerRankBlockRow = React.memo(function TravelerRankBlockRow({
  item,
  listSize,
  isHighlight,
  onOpenRecord,
  avatarFailed,
  onAvatarError,
  onAvatarErrorId,
  rowIndex,
  t,
}: {
  item: TravelerRankItem;
  listSize: number;
  rowIndex: number;
  isHighlight: boolean;
  onOpenRecord: (item: TravelerRankItem) => void;
  avatarFailed: boolean;
  onAvatarError: (id: string) => void;
  onAvatarErrorId: string;
  t: TravelerRankTFunc;
}) {
  const hasRecord = (item.countries?.length ?? 0) > 0 || (item.cities?.length ?? 0) > 0;
  const ordersDisplay = formatTravelerCompletedOrdersDisplay(item, t);
  const avatarSrc = item.avatar_url?.trim() ? communityMediaAbsoluteUrlForRender(item.avatar_url.trim()) : "";
  const showAvatar = Boolean(avatarSrc) && !avatarFailed;
  return (
    <div
      id={`traveler-row-${item.id}`}
      role="listitem"
      aria-posinset={item.rank}
      aria-setsize={listSize}
      className={`grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.75rem_1fr_auto_auto] items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 ${didRankRankRowSurfaceClass(rowIndex, isHighlight, "traveler")}`}
    >
      <span className="flex items-center justify-end gap-1 text-meta font-mono font-medium text-slate-300 tabular-nums">
        <span>{item.rank}</span>
        <DidRankRankDeltaBadge delta={item.rank_delta} />
      </span>
      <div className="flex min-w-0 items-center gap-2">
        {showAvatar ? (
          <Image
            src={avatarSrc}
            alt=""
            width={44}
            height={44}
            loading="lazy"
            onError={() => onAvatarError(onAvatarErrorId)}
            className={`${DID_RANK_AVATAR_LIST_ROW_BOX} rounded-full object-cover ring-1 ring-ref-sun/20`}
            unoptimized={communityMediaNextImageUnoptimized(avatarSrc)}
          />
        ) : (
          <div
            role="img"
            aria-label={item.nickname}
            className={`flex ${DID_RANK_AVATAR_LIST_ROW_BOX} items-center justify-center rounded-full bg-ref-sun/15 text-meta font-semibold text-ref-sun`}
          >
            {(item.nickname && item.nickname.charAt(0)) || "?"}
          </div>
        )}
        {isDidRankCommunityProfileId(item.id) ? (
          <Link
            href={`/community/user/${item.id}`}
            onClick={() =>
              trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "traveler" })
            }
            className={`${touchTargetLink44Classes} !justify-start min-w-0 truncate text-small font-medium text-slate-200 hover:text-ref-coral motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
          >
            {item.nickname}
          </Link>
        ) : (
          <span className="min-w-0 truncate text-small font-medium text-slate-200">{item.nickname}</span>
        )}
      </div>
      <span className="flex items-center justify-end gap-1 text-small font-bold font-mono text-ref-sun tabular-nums">
        {ordersDisplay}
        {hasRecord && (
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onOpenRecord(item);
            }}
          >
            <button
              type="submit"
              aria-label={t("didRank_record")}
              className={`shrink-0 ${touchTargetLink44Classes} rounded-sm text-meta text-ref-sun hover:text-ref-coral ${deepShellInlineLinkFocusClasses}`}
            >
              ▶
            </button>
          </form>
        )}
      </span>
      <span className="text-meta text-slate-400 hidden sm:block text-right tabular-nums">
        {item.countriesCount}
        {t("didRank_countriesShort")} / {item.citiesCount}
        {t("didRank_citiesShort")}
      </span>
    </div>
  );
});
