import Image from "next/image";
import Link from "next/link";
import {
  communityStoredRolePillClassName,
  mapApiUserRoleToCommunity,
} from "@/components/community/communityFeedMappers";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityAvatarLinkFocus,
  communityCardLinkFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import type { CommunityFriendsRequestSent } from "./communityFriendsPageTypes";

export function FriendsSentRequestRow({
  req,
  t,
}: {
  req: CommunityFriendsRequestSent;
  t: (k: string) => string;
}) {
  const toWallet = formatWalletOrDidShort(req.to_default_wallet ?? undefined);
  return (
    <li className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-[var(--radius-md)] border border-slate-600/50 bg-ink-800/50 px-3 py-2">
      <Link
        href={`/community/user/${req.to_user_id}`}
        className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ink-700 ring-2 ring-ref-sun/22 motion-sub hover:ring-ref-sun/40 ${communityAvatarLinkFocus}`}
        aria-label={req.to_nickname ?? req.to_user_id.slice(0, 8)}
      >
        {req.to_avatar_url?.trim() ? (
          <Image
            src={communityMediaAbsoluteUrlForRender(req.to_avatar_url.trim())}
            alt=""
            fill
            className="object-cover"
            sizes="44px"
            unoptimized={communityMediaNextImageUnoptimized(
              communityMediaAbsoluteUrlForRender(req.to_avatar_url.trim())
            )}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-meta font-medium text-ref-sun">
            {(req.to_nickname ?? req.to_user_id).slice(0, 1)}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-body text-slate-200">
          <span className="text-slate-400" aria-hidden>
            →
          </span>
          <Link
            href={`/community/user/${req.to_user_id}`}
            className={`inline-flex min-h-[44px] max-w-full min-w-0 items-center justify-start truncate font-medium hover:text-ref-coral motion-sub rounded-sm ${communityCardLinkFocus}`}
          >
            {req.to_nickname ?? req.to_user_id.slice(0, 8)}
          </Link>
          <span
            className={`rounded-full px-2 py-0.5 text-meta ${communityStoredRolePillClassName(
              mapApiUserRoleToCommunity(req.to_role)
            )}`}
          >
            {t(communityStoredRoleLabelI18nKey(mapApiUserRoleToCommunity(req.to_role)))}
          </span>
          {req.to_is_escrow_guide === true ? (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">
              {t("community_badge_escrow_guide")}
            </span>
          ) : null}
        </div>
        {toWallet ? (
          <p className="mt-0.5 truncate text-meta font-mono text-slate-400" title={toWallet}>
            {toWallet}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {(mapApiUserRoleToCommunity(req.to_role) === "guide" || req.to_is_escrow_guide === true) && (
          <Link href={marketHrefForCommunityUser(req.to_user_id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
            {t("community_book_guide_cta")}
          </Link>
        )}
        <span className="rounded-full px-2 py-0.5 text-meta bg-warning/20 text-warning/90">
          {t("community_request_status_pending")}
        </span>
      </div>
    </li>
  );
}
