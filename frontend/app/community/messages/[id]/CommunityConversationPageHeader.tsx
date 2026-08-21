"use client";

import Image from "next/image";
import Link from "next/link";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import type { CommunityConversationPageViewModel } from "./useCommunityConversationPage";

type Props = Pick<
  CommunityConversationPageViewModel,
  | "t"
  | "messagesListHref"
  | "profileHref"
  | "displayPeer"
  | "peerAvatarUrl"
  | "peerRole"
  | "peerIsEscrowGuide"
  | "peerUserId"
>;

export function CommunityConversationPageHeader({
  t,
  messagesListHref,
  profileHref,
  displayPeer,
  peerAvatarUrl,
  peerRole,
  peerIsEscrowGuide,
  peerUserId,
}: Props) {
  const headerProfile = (
    <>
      <div className="relative h-11 w-11 rounded-full overflow-hidden ring-2 ring-ref-sun/22 bg-ink-700 shrink-0">
        {peerAvatarUrl?.trim() ? (
          <Image
            src={communityMediaAbsoluteUrlForRender(peerAvatarUrl.trim())}
            alt=""
            fill
            className="object-cover"
            sizes="44px"
            unoptimized={communityMediaNextImageUnoptimized(
              communityMediaAbsoluteUrlForRender(peerAvatarUrl.trim()),
            )}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-body font-medium text-ref-sun">
            {displayPeer.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-body font-medium text-slate-200 flex items-center gap-2 flex-wrap">
          <span className="truncate">{displayPeer}</span>
          {peerRole != null ? (
            <span
              className={`rounded-full px-2 py-0.5 text-meta shrink-0 ${
                peerRole === "guide" ? "bg-ref-sun/12 text-ref-sun/90" : "bg-ref-sun/12 text-ref-sun"
              }`}
            >
              {t(communityStoredRoleLabelI18nKey(peerRole))}
            </span>
          ) : null}
          {peerIsEscrowGuide && peerRole !== "guide" ? (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90 shrink-0">
              {t("community_role_guide")}
            </span>
          ) : null}
          {(peerRole === "guide" || peerIsEscrowGuide) && peerUserId ? (
            <Link href={marketHrefForCommunityUser(peerUserId)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
              {t("community_book_guide_cta")}
            </Link>
          ) : null}
        </p>
        <p className="text-meta text-slate-400">{t("community_chat_peer")}</p>
      </div>
    </>
  );

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-ref-sun/22 bg-ink-900/80 px-4 py-3 safe-area-inset-t">
      <Link
        href={messagesListHref}
        className={`flex min-h-[44px] items-center justify-start gap-2 rounded-[var(--radius-md)] border border-slate-500/60 bg-ink-800/80 px-3 py-2 text-meta text-slate-300 hover:border-ref-sun/35 hover:text-ref-coral motion-sub shrink-0 ${communitySlatePillFocus}`}
        aria-label={t("community_back_to_list")}
      >
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>{t("community_back_drawer")}</span>
      </Link>
      {profileHref ? (
        <Link
          href={profileHref}
          className="flex min-h-[44px] min-w-0 flex-1 items-center justify-start gap-3 rounded-[var(--radius-md)] py-0.5 pl-0.5 pr-2 motion-sub hover:bg-ink-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          {headerProfile}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{headerProfile}</div>
      )}
    </header>
  );
}
