"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import type { GuideRankItem } from "@/lib/didRankTypes";
import { isDidRankCommunityProfileId } from "@/lib/didRankUtils";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import type { GuideRankTFunc } from "@/components/did-rank/guideRankBlockTypes";
import { DidRankRankDeltaBadge } from "@/components/did-rank/DidRankRankDeltaBadge";
import { DID_RANK_AVATAR_LIST_ROW_BOX } from "@/lib/didRankAvatarClasses";
import { didRankRankRowSurfaceClass } from "@/lib/didRankListRow";

export const GuideRankBlockRow = React.memo(function GuideRankBlockRow({
  item,
  listSize,
  isHighlight,
  onOpenGuide,
  avatarFailed,
  onAvatarError,
  onAvatarErrorId,
  rowIndex,
  t,
}: {
  item: GuideRankItem;
  listSize: number;
  rowIndex: number;
  isHighlight: boolean;
  onOpenGuide: (item: GuideRankItem) => void;
  avatarFailed: boolean;
  onAvatarError: (id: string) => void;
  onAvatarErrorId: string;
  t: GuideRankTFunc;
}) {
  const avatarSrc = item.avatar_url?.trim() ? communityMediaAbsoluteUrlForRender(item.avatar_url.trim()) : "";
  const showAvatar = Boolean(avatarSrc) && !avatarFailed;
  const avg = item.avgReceivedReviewScore;
  const hasFiniteAvg = typeof avg === "number" && Number.isFinite(avg);
  const scoreShort = hasFiniteAvg ? avg.toFixed(1) : t("ui_em_dash");
  return (
    <div
      id={`guide-row-${item.id}`}
      role="listitem"
      aria-posinset={item.rank}
      aria-setsize={listSize}
      tabIndex={0}
      aria-label={`${item.nickname} — ${t("didRank_viewGuide")}`}
      onClick={() => onOpenGuide(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenGuide(item);
        }
      }}
      className={`w-full flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 text-left cursor-pointer ${didRankRankRowSurfaceClass(rowIndex, isHighlight, "guide")}`}
    >
      <span className="flex w-5 sm:w-8 items-center justify-end gap-0.5 text-meta font-mono font-medium text-slate-300 shrink-0 tabular-nums">
        <span>{item.rank}</span>
        <DidRankRankDeltaBadge delta={item.rank_delta} column="guide" />
      </span>
      {showAvatar ? (
        <Image
          src={avatarSrc}
          alt={item.nickname}
          width={44}
          height={44}
          loading="lazy"
          onError={() => onAvatarError(onAvatarErrorId)}
          className={`${DID_RANK_AVATAR_LIST_ROW_BOX} rounded-full object-cover ring-1 ring-ref-sun/22`}
          sizes="44px"
          unoptimized={communityMediaNextImageUnoptimized(avatarSrc)}
        />
      ) : (
        <div
          role="img"
          aria-label={item.nickname}
          className={`inline-flex ${DID_RANK_AVATAR_LIST_ROW_BOX} items-center justify-center rounded-full bg-ref-sun/15 text-meta font-semibold text-ref-sun`}
        >
          {(item.nickname && item.nickname.charAt(0)) || "?"}
        </div>
      )}
      <div className="min-w-0 flex-1 flex flex-col gap-0.5 justify-center">
        {isDidRankCommunityProfileId(item.id) ? (
          <Link
            href={`/community/user/${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: "guide" });
            }}
            className={`${touchTargetLink44Classes} !justify-start text-small font-medium text-slate-200 truncate min-w-0 hover:text-ref-coral text-left motion-sub rounded-sm ${deepShellInlineLinkFocusClasses}`}
          >
            {item.nickname}
          </Link>
        ) : (
          <span className="text-small font-medium text-slate-200 truncate min-w-0">{item.nickname}</span>
        )}
        <span className="text-meta text-slate-500 truncate">
          {item.receptionCount}{" "}
          {t("didRank_receptions")}
          {item.city ? ` · ${item.city}` : ""}
        </span>
      </div>
      <span
        className="flex shrink-0 items-center justify-end gap-0.5 text-small font-bold font-mono text-ref-sun tabular-nums"
        title={t("didRank_guideCompositeLabel")}
      >
        <span className="text-ref-sun/85 text-meta" aria-hidden>
          ★
        </span>
        {hasFiniteAvg ? `${scoreShort}/5` : scoreShort}
      </span>
    </div>
  );
});
