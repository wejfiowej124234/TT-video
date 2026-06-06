"use client";

import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import type { ItineraryRankItem } from "@/lib/didRankTypes";
import { isDidRankCommunityProfileId } from "@/lib/didRankUtils";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { ItineraryRankTFunc } from "@/components/did-rank/itineraryRankBlockTypes";

/** 创作者行：有合法社区 UUID 时昵称链与 GuideTopCard 同口径（无整卡 `role=button` 嵌套）。 */
export function ItineraryRankBlockCreatorLine({
  item,
  creatorLabel,
  t,
  mutedClass,
  linkClass,
}: {
  item: ItineraryRankItem;
  creatorLabel: string;
  t: ItineraryRankTFunc;
  mutedClass: string;
  linkClass: string;
}) {
  const cid = item.creatorCommunityUserId;
  const showProfile = typeof cid === "string" && isDidRankCommunityProfileId(cid);
  return (
    <p className={`text-meta mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 ${mutedClass}`}>
      <span className="shrink-0">
        {t("didRank_creator")}: {creatorLabel} ·
      </span>
      {showProfile ? (
        <Link
          href={`/community/user/${cid}`}
          onClick={() =>
            trackDidRankEvent("did_rank_community_profile_open", {
              userId: cid,
              role: item.creatorType,
            })
          }
          className={`${touchTargetLink44Classes} !justify-start min-w-0 max-w-full shrink truncate font-medium hover:text-ref-coral motion-sub rounded-sm ${linkClass} ${deepShellInlineLinkFocusClasses}`}
        >
          {item.creatorName}
        </Link>
      ) : (
        <span className="min-w-0 truncate">{item.creatorName}</span>
      )}
    </p>
  );
}
